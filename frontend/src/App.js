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
    if (['COMPLETED', 'FAILED'].includes(downloadStatus.status)) {
      const eventSource = eventSources[downloadStatus.id];
      if (eventSource) {
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
      const response = await fetch(`${apiUrl}/api/downloads`);
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
    const sseUrl = `${apiUrl}/api/downloads/${downloadId}/stream`;
    const eventSource = new EventSource(sseUrl);

    // Add specific handler for 'progress' events
    eventSource.addEventListener('progress', (event) => {
      try {
        const data = JSON.parse(event.data);
        updateDownload(data);
      } catch (error) {
        console.error('Error parsing progress event data:', error);
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE Error for', downloadId, ':', error);

      // Don't close immediately, let browser handle reconnection
      if (eventSource.readyState === EventSource.CLOSED) {
        setEventSources(prev => {
          const newEventSources = { ...prev };
          delete newEventSources[downloadId];
          return newEventSources;
        });
      }
    };

    setEventSources(prev => ({
      ...prev,
      [downloadId]: eventSource
    }));
  };  useEffect(() => {
    // Fetch existing downloads on component mount
    const initializeDownloads = async () => {
      const existingDownloads = await fetchDownloadsList();

      // Set up SSE connections for active downloads
      existingDownloads.forEach(download => {
        if (download.status === 'DOWNLOADING' || download.status === 'QUEUED') {
          setupSSEConnection(download.id);
        }
      });
    };

    initializeDownloads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const active = downloads.filter(d => d.status === 'DOWNLOADING' || d.status === 'QUEUED').length;
    const completed = downloads.filter(d => d.status === 'COMPLETED').length;
    const failed = downloads.filter(d => d.status === 'FAILED').length;

    setStats({ total, active, completed, failed });
  }, [downloads]);

  const handleDownloadStart = async (downloadInfo) => {
    try {
      // Add the download to the list immediately
      updateDownload(downloadInfo);

      // Set up SSE connection for this download
      setupSSEConnection(downloadInfo.id);
    } catch (error) {
      console.error('Error handling download start:', error);
    }
  };  const handleCancelDownload = async (downloadId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/downloads/${downloadId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from downloads list
        setDownloads(prev => prev.filter(d => d.id !== downloadId));

        // Close and remove SSE connection
        const eventSource = eventSources[downloadId];
        if (eventSource) {
          eventSource.close();
          setEventSources(prev => {
            const newEventSources = { ...prev };
            delete newEventSources[downloadId];
            return newEventSources;
          });
        }
      }
    } catch (error) {
      console.error('Error cancelling download:', error);
    }
  };

  const handlePauseDownload = async (downloadId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      await fetch(`${apiUrl}/api/downloads/${downloadId}/pause`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error pausing download:', error);
    }
  };

  const handleResumeDownload = async (downloadId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';
      await fetch(`${apiUrl}/api/downloads/${downloadId}/resume`, {
        method: 'POST'
      });

      // Set up SSE connection if not already active
      if (!eventSources[downloadId]) {
        setupSSEConnection(downloadId);
      }
    } catch (error) {
      console.error('Error resuming download:', error);
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
              onPauseDownload={handlePauseDownload}
              onResumeDownload={handleResumeDownload}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
