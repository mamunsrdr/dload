import React, {useState, useEffect} from 'react';
import DownloadForm from './components/DownloadForm';
import DownloadList from './components/DownloadList';
import Header from './components/Header';

export const getApiUrl = () => {
    const { protocol, hostname, port } = window.location;
    const isDev = process.env.NODE_ENV === 'development' || port === '3000';
    if (isDev) {
        return `${protocol}//${hostname}:8080`;
    } else {
        return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
    }
};

function App() {
    const [downloads, setDownloads] = useState([]);
    const [globalEventSource, setGlobalEventSource] = useState(null);
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
                return [...prev, downloadStatus];
            }
        });
    };

    const fetchDownloadsList = async () => {
        try {
            const response = await fetch(`${getApiUrl()}/api/downloads`);
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

    const setupGlobalSSEConnection = () => {
        if (globalEventSource) {
            return;
        }
        const sseUrl = `${getApiUrl()}/api/downloads/stream`;

        const eventSource = new EventSource(sseUrl);

        // Listen for 'progress' events for all downloads
        eventSource.addEventListener('progress', (event) => {
            try {
                const data = JSON.parse(event.data);
                updateDownload(data);
            } catch (error) {
                console.error('Error parsing progress event data:', error);
            }
        });

        eventSource.onerror = (error) => {
            console.error('Global SSE Error:', error);

            if (eventSource.readyState === EventSource.CLOSED) {
                setGlobalEventSource(null);
            }
        };

        setGlobalEventSource(eventSource);
    };

    const closeGlobalSSEConnection = () => {
        if (globalEventSource) {
            globalEventSource.close();
            setGlobalEventSource(null);
        }
    };
    useEffect(() => {
        // Fetch existing downloads and setup global SSE on component mount
        const initializeDownloads = async () => {
            await fetchDownloadsList();

            // Setup single global SSE connection for all downloads
            setupGlobalSSEConnection();
        };

        initializeDownloads();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only run once on mount

    useEffect(() => {
        // Cleanup global SSE connection on unmount
        return () => {
            closeGlobalSSEConnection();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update stats whenever downloads change
    useEffect(() => {
        const total = downloads.length;
        const active = downloads.filter(d => d.status === 'DOWNLOADING' || d.status === 'QUEUED').length;
        const completed = downloads.filter(d => d.status === 'COMPLETED').length;
        const failed = downloads.filter(d => d.status === 'FAILED').length;

        setStats({total, active, completed, failed});
    }, [downloads]);

    const handleDownloadStart = async (downloadInfo) => {
        try {
            // Add the download to the list immediately
            updateDownload(downloadInfo);

            // No need to setup individual SSE - global stream handles all updates
        } catch (error) {
            console.error('Error handling download start:', error);
        }
    };

    const handleCancelDownload = async (downloadId) => {
        // Find the download to check its status
        const download = downloads.find(d => d.id === downloadId);

        if (!download) {
            console.warn(`Download not found: ${downloadId}`);
            return;
        }

        // Always request backend to cancel/remove the download first
        try {
            const response = await fetch(`${getApiUrl()}/api/downloads/${downloadId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Remove from frontend list after successful backend operation
                setDownloads(prev => prev.filter(d => d.id !== downloadId));
            } else {
                console.error(`Failed to cancel download ${downloadId}, status: ${response.status}`);
            }
        } catch (error) {
            console.error('Error cancelling download:', error);
        }
    };

    const handlePauseDownload = async (downloadId) => {
        try {
            await fetch(`${getApiUrl()}/api/downloads/${downloadId}/pause`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error pausing download:', error);
        }
    };

    const handleResumeDownload = async (downloadId) => {
        try {
            await fetch(`${getApiUrl()}/api/downloads/${downloadId}/resume`, {
                method: 'POST'
            });

            // No need to setup individual SSE - global stream handles all updates
        } catch (error) {
            console.error('Error resuming download:', error);
        }
    };

    return (
        <div className="min-h-screen bg-black">
            <Header stats={stats}/>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Download Form */}
                    <div className="lg:col-span-1">
                        <DownloadForm onDownloadStart={handleDownloadStart}/>
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
