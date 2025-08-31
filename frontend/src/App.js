import React, { useState, useEffect } from 'react';
import DownloadForm from './components/DownloadForm';
import DownloadList from './components/DownloadList';
import Header from './components/Header';

function App() {
  const [downloads, setDownloads] = useState([]);
  const [eventSources, setEventSources] = useState({});
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    failed: 0
  });

  const updateDownload = (downloadStatus) => {
    setDownloads(prev => {
      const existingIndex = prev.findIndex(d => d.id === downloadStatus.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = downloadStatus;
        return updated;
      } else {
        return [downloadStatus, ...prev];
      }
    });

    // Close SSE connection if download is complete
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(downloadStatus.status)) {
      const eventSource = eventSources[downloadStatus.id];
      if (eventSource) {
        console.log('Closing SSE connection for completed download:', downloadStatus.id);
        eventSource.close();
        setEventSources(prev => {
          const newEventSources = { ...prev };
          delete newEventSources[downloadStatus.id];
          return newEventSources;
        });
      }
    }
  };

  const fetchDownloadsList = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/downloads/list`);
      if (response.ok) {
        const downloadsList = await response.json();
        setDownloads(downloadsList);
        return downloadsList;
      }
    } catch (error) {
      console.error('Error fetching downloads list:', error);
    }
    return [];
  };

  const setupSSEConnection = (downloadId) => {
    // Don't create duplicate connections
    if (eventSources[downloadId]) {
      return;
    }

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
    const eventSource = new EventSource(`${apiUrl}/api/downloads/stream/${downloadId}`);
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('SSE message received for', downloadId, ':', data.status);
        updateDownload(data);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error for', downloadId, ':', error);
      eventSource.close();
      setEventSources(prev => {
        const newEventSources = { ...prev };
        delete newEventSources[downloadId];
        return newEventSources;
      });
      
      // Don't automatically fetch list on SSE error - let it rely on manual triggers or completion
      console.log('SSE connection lost for', downloadId, '- will reconnect if download is still active');
    };

    eventSource.onopen = () => {
      console.log('SSE connection opened for download:', downloadId);
    };

    setEventSources(prev => ({
      ...prev,
      [downloadId]: eventSource
    }));
  };

  useEffect(() => {
    // Fetch existing downloads on component mount
    const initializeDownloads = async () => {
      const existingDownloads = await fetchDownloadsList();
      
      // Set up SSE connections for active downloads
      existingDownloads.forEach(download => {
        if (download.status === 'DOWNLOADING' || download.status === 'STARTING' || download.status === 'PENDING') {
          setupSSEConnection(download.id);
        }
      });
    };

    initializeDownloads();
  }, []); // Only run once on mount

  useEffect(() => {
    // Cleanup event sources on unmount
    return () => {
      Object.values(eventSources).forEach(eventSource => {
        eventSource.close();
      });
    };
  }, [eventSources]);

  // Update stats whenever downloads change
  useEffect(() => {
    const total = downloads.length;
    const active = downloads.filter(d => d.status === 'DOWNLOADING' || d.status === 'STARTING' || d.status === 'PENDING').length;
    const completed = downloads.filter(d => d.status === 'COMPLETED').length;
    const failed = downloads.filter(d => d.status === 'FAILED' || d.status === 'CANCELLED').length;
    
    setStats({ total, active, completed, failed });
  }, [downloads]);

  const handleDownloadStart = async (downloadId) => {
    try {
      // First, fetch the initial download status and add it to the list immediately
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const statusResponse = await fetch(`${apiUrl}/api/downloads/status/${downloadId}`);
      
      if (statusResponse.ok) {
        const downloadStatus = await statusResponse.json();
        updateDownload(downloadStatus);
        console.log('Download started:', downloadId, 'Status:', downloadStatus.status);
      }
    } catch (error) {
      console.error('Error fetching initial download status:', error);
    }

    // Set up SSE connection for this download
    setupSSEConnection(downloadId);
  };

  const handleCancelDownload = async (downloadId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      await fetch(`${apiUrl}/api/downloads/cancel/${downloadId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error cancelling download:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header stats={stats} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Download Form */}
          <div className="lg:col-span-1">
            <DownloadForm onDownloadStart={handleDownloadStart} />
          </div>
          
          {/* Downloads List */}
          <div className="lg:col-span-2">
            <DownloadList 
              downloads={downloads} 
              onCancelDownload={handleCancelDownload}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
