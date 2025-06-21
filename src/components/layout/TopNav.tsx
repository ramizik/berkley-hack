import React from 'react';
import { NavLink } from 'react-router-dom';
import { Mic, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TopNav: React.FC = () => {
  const { user, signOut } = useAuth();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Lessons', path: '/lessons' },
    { name: 'Practice', path: '/practice' },
    { name: 'Live Coach', path: '/live-coach' },
    { name: 'Progress', path: '/progress' },
    { name: 'Settings', path: '/settings' },
  ];

  return (
    <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-600/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <NavLink to="/" className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                  <Mic className="text-white" size={20} />
                </div>
                <h1 className="ml-2 text-xl font-bold gradient-text">
                  VocalAI
                </h1>
              </NavLink>
            </div>

            <nav className="ml-10 flex items-center space-x-2">
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
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-gray-300 hover:text-white relative transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              
              <div className="hidden md:block">
                <div className="text-sm text-gray-200">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-gray-400">
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
        </div>
      </div>
    </header>
  );
}

export default TopNav;