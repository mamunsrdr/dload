import React, { useState, useEffect } from 'react';
import {getApiUrl} from "../App";

const DownloadForm = ({ onDownloadStart }) => {
  const [url, setUrl] = useState('');
  const [filename, setFilename] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load last output path from localStorage on component mount
  useEffect(() => {
    try {
      const savedOutputPath = localStorage.getItem('dload-last-output-path');
      if (savedOutputPath) {
        setOutputPath(savedOutputPath);
      }
    } catch (storageError) {
      console.warn('Failed to load output path from localStorage:', storageError);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url.trim() || !outputPath.trim()) {
      setError('Please provide URL and output path');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save output path to localStorage
      try {
        localStorage.setItem('dload-last-output-path', outputPath.trim());
      } catch (storageError) {
        console.warn('Failed to save output path to localStorage:', storageError);
      }

      const response = await fetch(`${getApiUrl()}/api/downloads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          filename: filename.trim() || undefined,
          outputPath: outputPath.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const downloadInfo = await response.json();
      onDownloadStart(downloadInfo);

      // Reset form
      setUrl('');
      setFilename('');
    } catch (error) {
      console.error('Error starting download:', error);
      setError('Failed to start download. Please check the URL and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    // Removed auto-filename suggestion
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-400 mb-2">
            Download URL
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={handleUrlChange}
            required
            disabled={loading}
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="filename" className="block text-sm font-medium text-gray-400 mb-2">
            Filename <span className="text-gray-500 text-xs">(optional)</span>
          </label>
          <input
            type="text"
            id="filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            If not provided, filename will be automatically detected from the URL or server response
          </p>
        </div>

        <div>
          <label htmlFor="outputPath" className="block text-sm font-medium text-gray-400 mb-2">
            Download Directory
          </label>
          <div className="space-y-2">
            <input
              type="text"
              id="outputPath"
              value={outputPath}
              onChange={(e) => setOutputPath(e.target.value)}
              required
              disabled={loading}
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
            <div className="flex flex-wrap gap-2">
              {['/downloads/movies', '/downloads/tvshows'].map((path) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => setOutputPath(path)}
                  disabled={loading}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  {path}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-md p-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2 disabled:bg-gray-700 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Starting Download...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v12"/>
                <path d="M6 10l6 6 6-6"/>
              </svg>
              <span>Start Download</span>
            </div>
          )}
        </button>
      </form>
    </div>
  );
};

export default DownloadForm;
