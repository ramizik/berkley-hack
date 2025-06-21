import React from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, HelpCircle } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  
  // Determine page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    return path.charAt(1).toUpperCase() + path.slice(2);
  };

  return (
    <header className="bg-white shadow-sm py-4 px-6 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-gray-800">{getPageTitle()}</h1>
      
      <div className="flex items-center space-x-6">
        <div className="relative hidden md:block">
          <input 
            type="text" 
            placeholder="Search lessons..." 
            className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-gray-600 hover:text-gray-900 relative">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>
          
          <button className="text-gray-600 hover:text-gray-900">
            <HelpCircle size={20} />
          </button>
          
          <button className="md:hidden text-gray-600 hover:text-gray-900">
            <Search size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;