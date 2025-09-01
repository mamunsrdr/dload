import React from 'react';

const DownloadItem = ({ download, onCancel, onPause, onResume }) => {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond) => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  const formatTimeRemaining = (seconds) => {
    if (!seconds || seconds <= 0) return 'N/A';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'QUEUED':
        return (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'DOWNLOADING':
        return (
          <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'PAUSED':
        return (
          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'COMPLETED':
        return (
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'FAILED':
        return (
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'QUEUED':
        return 'bg-gray-900/50 text-gray-300 border-gray-600';
      case 'DOWNLOADING':
        return 'bg-blue-900/50 text-blue-300 border-blue-700';
      case 'PAUSED':
        return 'bg-gray-600 text-yellow-500 border-yellow-700';
      case 'COMPLETED':
        return 'bg-green-900/50 text-green-300 border-green-700';
      case 'FAILED':
        return 'bg-red-900/50 text-red-300 border-red-700';
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-700';
    }
  };

  const canPause = download.status === 'DOWNLOADING';
  const canResume = download.status === 'PAUSED';
  const isActive = download.status === 'DOWNLOADING' || download.status === 'QUEUED';
  const isCompleted = download.status === 'COMPLETED' || download.status === 'FAILED';
  const progress = download.progress || 0;

  return (
    <div className="bg-gray-900 rounded-md p-5 mb-2">
      {/* Header with filename and actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {getStatusIcon(download.status)}
          <h3 className="text-sm text-gray-300 truncate">
            {download.filename}
          </h3>
        </div>

        <div className="flex items-center ml-4">
          {canResume && (
            <button
              onClick={() => onResume(download.id)}
              className="p-1 hover:bg-gray-600 rounded text-sm transition-colors duration-200"
              title="Resume"
            >
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM10 16.5v-9l6 4.5-6 4.5z"/>
              </svg>
            </button>
          )}

          {canPause && (
            <button
              onClick={() => onPause(download.id)}
              className="p-1 hover:bg-gray-600 text-sm rounded transition-colors duration-200"
              title="Pause"
            >
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 15 15">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 5v5m5-5v5" />
              </svg>
            </button>
          )}

          {/* Always show cancel/remove button */}
          <button
            onClick={() => onCancel(download.id)}
            className="p-1 hover:bg-gray-600 rounded text-sm transition-colors duration-200"
            title={isCompleted ? "Remove from list" : "Cancel download"}
          >
            {isCompleted ? (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Status and size info */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(download.status)}`}>
            {download.status}
          </span>
          {download.totalSize > 0 && download.status === 'PAUSED' && (
            <span className="text-sm text-gray-400">
              {formatBytes(download.totalSize)}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-4 text-xs text-gray-400">
          {download.totalSize > 0 && download.status === 'COMPLETED' && (
              <span className="text-sm text-gray-400">
              {formatBytes(download.totalSize)}
            </span>
          )}
          {download.speed > 0 && download.status === 'DOWNLOADING' && (
            <span>↓ {formatSpeed(download.speed)}</span>
          )}
          {download.timeRemaining > 0 && isActive && (
            <span>{formatTimeRemaining(download.timeRemaining)} Remaining</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isActive && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">
              {download.downloadedSize > 0 ? formatBytes(download.downloadedSize) : '0 B'} / {download.totalSize > 0 ? formatBytes(download.totalSize) : 'Unknown'}
            </span>
            <span className="text-xs font-medium text-gray-300">{progress.toFixed(1)}%</span>
          </div>
          <div className="bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {download.error && (
        <div className="mt-3 bg-red-900/30 border border-red-700 rounded p-2">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-xs font-medium text-red-300">Error</p>
              <p className="text-xs text-red-400 mt-1">{download.error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadItem;
