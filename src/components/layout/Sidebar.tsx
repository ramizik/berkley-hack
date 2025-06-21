import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Mic, LineChart, Settings, LogOut, User } from 'lucide-react';
import { useVocalProfile } from '../../context/VocalProfileContext';

const Sidebar: React.FC = () => {
  const { profile } = useVocalProfile();
  
  const navLinks = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/dashboard' },
    { name: 'Lessons', icon: <BookOpen size={20} />, path: '/lessons' },
    { name: 'Practice', icon: <Mic size={20} />, path: '/practice' },
    { name: 'Progress', icon: <LineChart size={20} />, path: '/progress' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' },
  ];

  return (
    <div className="w-64 bg-white shadow-md flex flex-col h-screen">
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
            <Mic className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500">
            VocalAI
          </h1>
        </div>
      </div>
      
      {profile && (
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <User size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-medium">{profile.username}</p>
              <p className="text-xs text-gray-500">{profile.voice_type || 'Unknown Voice Type'}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-1">Voice Range</div>
            <div className="text-sm font-medium text-gray-700">
              {profile.lowestNote} - {profile.highestNote}
            </div>
          </div>
        </div>
      )}
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navLinks.map((link) => (
            <li key={link.name}>
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center space-x-3 p-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`
                }
              >
                {link.icon}
                <span>{link.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <button className="flex items-center justify-center w-full p-3 space-x-3 text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;