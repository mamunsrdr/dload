import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../App';

const Footer = () => {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/downloads/network`);
        if (response.ok) {
          const data = await response.json();
          setNetworkInfo(data);
        } else {
          setError('Failed to fetch network info');
        }
      } catch (err) {
        setError('Network request failed');
        console.error('Error fetching network info:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkInfo();
  }, []);

  return (
    <footer className="bg-gray-950 border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Network Info */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Network Info</h2>
              {loading ? (
                <p className="text-xs text-gray-500">Loading...</p>
              ) : error ? (
                <p className="text-xs text-red-500">{error}</p>
              ) : networkInfo ? (
                <p className="text-xs text-gray-500">
                  {networkInfo.city && networkInfo.country ? `${networkInfo.city}, ${networkInfo.country}` : 'Location unavailable'}
                </p>
              ) : null}
            </div>
          </div>

          {/* Network Details */}
          {!loading && !error && networkInfo && (
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-400">IP: {networkInfo.ip || 'N/A'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-400">
                  Location: {networkInfo.city && networkInfo.country ? `${networkInfo.city}, ${networkInfo.country}` : 'N/A'}
                </span>
              </div>
              {networkInfo.org && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-400">ISP: {networkInfo.org}</span>
                </div>
              )}
            </div>
          )}

          {/* Mobile view - IP and Org */}
          {!loading && !error && networkInfo && (
            <div className="md:hidden text-right">
              <div className="text-sm text-gray-500">{networkInfo.ip || 'N/A'}</div>
              {networkInfo.org && (
                <div className="text-xs text-gray-600">{networkInfo.org}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
