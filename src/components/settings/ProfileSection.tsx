import React from 'react';
import { User, Save } from 'lucide-react';
import { useVocalProfile } from '../../context/VocalProfileContext';

const ProfileSection: React.FC = () => {
  const { profile, updateVocalProfile } = useVocalProfile();

  const handleUsernameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateVocalProfile({
      username: event.target.value
    });
  };
  
  const handleSaveChanges = async () => {
    try {
      // The profile is already updated in real-time through the change handlers
      // This button could trigger additional validation or show a success message
      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold gradient-text">Profile Information</h3>
      
      <div className="flex items-center space-x-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-dark-lighter border-2 border-purple-accent overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <User size={40} className="text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Username
          </label>
          <input
            type="text"
            value={profile?.username || ''}
            onChange={handleUsernameChange}
            className="w-full px-4 py-2 rounded-lg bg-dark border border-dark-accent text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-accent"
            placeholder="Enter your username"
          />
        </div>
      </div>

      <button 
        onClick={handleSaveChanges}
        className="px-4 py-2 bg-purple-accent text-white rounded-lg hover:bg-purple-light transition-colors flex items-center"
      >
        <Save size={18} className="mr-2" />
        Save Changes
      </button>
    </div>
  );
};

export default ProfileSection;