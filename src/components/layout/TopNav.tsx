import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Mic, Bell, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TopNav: React.FC = () => {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Lessons', path: '/lessons' },
    { name: 'Practice', path: '/practice' },
    { name: 'Live Coach', path: '/live-coach' },
    { name: 'Progress', path: '/progress' },
    { name: 'Settings', path: '/settings' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-600/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center flex-shrink-0">
            <NavLink to="/" className="flex items-center" onClick={closeMobileMenu}>
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <Mic className="text-white" size={20} />
              </div>
              <h1 className="ml-2 text-xl font-bold gradient-text">
                VocalAI
              </h1>
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-gray-300 hover:text-white relative transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              
              <div className="hidden lg:block">
                <div className="text-sm text-gray-200 truncate max-w-32">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-gray-400 truncate max-w-32">
                  {user?.email}
                </div>
              </div>
              
              <button
                onClick={signOut}
                className="text-gray-300 hover:text-white transition-colors"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={toggleMobileMenu}
              className="text-gray-300 hover:text-white transition-colors p-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-slate-800/90 backdrop-blur-md rounded-lg mt-2 border border-slate-600/30">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-gradient-primary text-white'
                        : 'text-gray-300 hover:text-white hover:bg-slate-700/50'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
              
              {/* Mobile User Info */}
              <div className="border-t border-slate-600/30 pt-3 mt-3">
                <div className="flex items-center px-3 py-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center mr-3">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 truncate">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {user?.email}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between px-3 py-2">
                  <button className="text-gray-300 hover:text-white relative transition-colors">
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red text-white text-xs rounded-full flex items-center justify-center">
                      3
                    </span>
                  </button>
                  
                  <button
                    onClick={() => {
                      signOut();
                      closeMobileMenu();
                    }}
                    className="flex items-center text-gray-300 hover:text-white transition-colors"
                  >
                    <LogOut size={18} className="mr-2" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopNav;