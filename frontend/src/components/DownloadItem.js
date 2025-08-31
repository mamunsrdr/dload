import React from 'react';

const DownloadItem = ({ download, onCancel }) => {
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

  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
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
      case 'STARTING':
        return (
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      case 'CANCELLED':
        return (
          <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-900/50 text-gray-300 border-gray-600';
      case 'DOWNLOADING':
        return 'bg-blue-900/50 text-blue-300 border-blue-700';
      case 'STARTING':
        return 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
      case 'COMPLETED':
        return 'bg-green-900/50 text-green-300 border-green-700';
      case 'FAILED':
        return 'bg-red-900/50 text-red-300 border-red-700';
      case 'CANCELLED':
        return 'bg-orange-900/50 text-orange-300 border-orange-700';
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-700';
    }
  };

  const canCancel = download.status === 'DOWNLOADING' || download.status === 'STARTING' || download.status === 'PENDING';
  const isActive = canCancel;
  const progress = download.progress || 0;

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-lg p-6 ${isActive ? 'ring-2 ring-blue-500/20' : ''} animate-fade-in`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            {getStatusIcon(download.status)}
            <h3 className="text-sm font-medium text-gray-100 truncate">
              {download.filename}
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(download.status)}`}>
              {download.status}
            </span>
            {download.totalSize > 0 && (
              <span className="text-xs text-gray-500">
                {formatBytes(download.totalSize)}
              </span>
            )}
          </div>
        </div>

        {canCancel && (
          <button
            onClick={() => onCancel(download.id)}
            className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded-lg transition-colors duration-200 ml-4"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Bar */}
      {isActive && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Progress</span>
            <span className="text-sm font-medium text-gray-300">{progress.toFixed(1)}%</span>
          </div>
          <div className="bg-gray-800 rounded-full h-2">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        {download.speed > 0 && (
          <div>
            <span className="text-gray-500 block">Speed</span>
            <span className="text-gray-300 font-medium">{formatSpeed(download.speed)}</span>
          </div>
        )}
        
        {download.downloadedSize > 0 && (
          <div>
            <span className="text-gray-500 block">Downloaded</span>
            <span className="text-gray-300 font-medium">{formatBytes(download.downloadedSize)}</span>
          </div>
        )}
        
        <div>
          <span className="text-gray-500 block">Started</span>
          <span className="text-gray-300 font-medium">{formatTime(download.startTime)}</span>
        </div>
        
        {download.endTime && (
          <div>
            <span className="text-gray-500 block">Finished</span>
            <span className="text-gray-300 font-medium">{formatTime(download.endTime)}</span>
          </div>
        )}
      </div>

      {/* URL */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <span className="text-gray-500 text-xs block mb-1">URL</span>
        <p className="text-gray-400 text-xs break-all">{download.url}</p>
      </div>

      {/* Error Message */}
      {download.error && (
        <div className="mt-4 bg-red-900/30 border border-red-700 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-300">Error</p>
              <p className="text-sm text-red-400 mt-1">{download.error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadItem;
