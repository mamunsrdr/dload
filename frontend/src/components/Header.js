import React from 'react';

const Header = ({ stats }) => {
  return (
    <header className="bg-gray-950 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 6v12"/>
                  <path d="M7 13l5 5 5-5"/>
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Dload</h1>
              <p className="text-sm text-gray-500">Download Manager</p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Total: {stats.total}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Active: {stats.active}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Completed: {stats.completed}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-400">Failed: {stats.failed}</span>
            </div>
          </div>

          {/* Mobile stats */}
          <div className="md:hidden">
            <span className="text-sm text-gray-500">{stats.active} active</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
