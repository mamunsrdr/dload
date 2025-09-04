import React from 'react';
import DownloadItem from './DownloadItem';

const DownloadList = ({ downloads, onCancelDownload, onPauseDownload, onResumeDownload, onAddDownload }) => {
  return (
    <div className="space-y-6">
      {/* Header with Add Button - Always Visible */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-100">
          Downloads ({downloads.length})
        </h2>
        
        <div className="flex items-center space-x-4">
          {downloads.length > 0 && (
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-500">
                {downloads.filter(d => d.status === 'DOWNLOADING' || d.status === 'QUEUED').length} active
              </span>
              <span className="text-gray-500">
                {downloads.filter(d => d.status === 'COMPLETED').length} completed
              </span>
            </div>
          )}
          
          <button
            onClick={onAddDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md transition-colors"
            title="Add Download"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {downloads.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-md p-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v12"/>
                <path d="M6 10l6 6 6-6"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No tasks in hand</h3>
            <p className="text-gray-500">Start your first download to get started</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {downloads.map((download) => (
            <DownloadItem
              key={download.id}
              download={download}
              onCancel={onCancelDownload}
              onPause={onPauseDownload}
              onResume={onResumeDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DownloadList;
