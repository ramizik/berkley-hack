import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Lock, Volume2, Moon, Sun, Sliders, LogOut } from 'lucide-react';
import ProfileSection from '../components/settings/ProfileSection';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('profile');
  
  const tabs = [
    { id: 'profile', name: 'Profile', icon: <User size={18} /> },
    { id: 'preferences', name: 'Preferences', icon: <Sliders size={18} /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell size={18} /> },
    { id: 'account', name: 'Account', icon: <Lock size={18} /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-transition"
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold gradient-text mb-6">Settings</h2>
        
        <div className="card">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-64 mb-6 md:mb-0">
              <div className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto md:overflow-visible">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-purple-accent text-white'
                        : 'text-gray-400 hover:bg-dark-lighter hover:text-white'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 md:ml-8">
              {activeTab === 'profile' && <ProfileSection />}
              {/* Other sections will be implemented similarly */}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Settings;