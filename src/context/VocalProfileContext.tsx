import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface VocalProfile {
  id?: string;
  username: string;
  lowestNote: string;
  highestNote: string;
  mean_pitch?: number | null;
  vibrato_rate?: number | null;
  jitter?: number | null;
  shimmer?: number | null;
  dynamics?: string | null;
  voice_type?: string | null;
  voice_recorded: boolean;
}

interface VocalProfileContextType {
  profile: VocalProfile | null;
  updateVocalProfile: (profileData: Partial<VocalProfile>) => Promise<void>;
  isProfileComplete: boolean;
  loading: boolean;
  error: string | null;
}

const defaultProfile: Omit<VocalProfile, 'id'> = {
  username: 'User',
  lowestNote: 'C3',
  highestNote: 'C5',
  mean_pitch: null,
  vibrato_rate: null,
  jitter: null,
  shimmer: null,
  dynamics: null,
  voice_type: null,
  voice_recorded: false,
};

const VocalProfileContext = createContext<VocalProfileContextType>({
  profile: null,
  updateVocalProfile: async () => {},
  isProfileComplete: false,
  loading: true,
  error: null,
});

export const useVocalProfile = () => useContext(VocalProfileContext);

export const VocalProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<VocalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile when user changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || authLoading) {
        setLoading(authLoading);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching profile for user:', user.id);

        // Wait a bit for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Try to fetch existing profile with retries
        let attempts = 0;
        let existingProfile = null;
        
        while (attempts < 5 && !existingProfile) {
          const { data, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          if (fetchError) {
            console.error('Error fetching profile:', fetchError);
            throw fetchError;
          }

          if (data) {
            existingProfile = data;
            break;
          }

          attempts++;
          if (attempts < 5) {
            console.log(`Profile not found, retrying... (attempt ${attempts}/5)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (existingProfile) {
          console.log('Found existing profile:', existingProfile);
          setProfile({
            id: existingProfile.id,
            username: existingProfile.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            lowestNote: existingProfile.lowest_note || 'C3',
            highestNote: existingProfile.highest_note || 'C5',
            mean_pitch: existingProfile.mean_pitch,
            vibrato_rate: existingProfile.vibrato_rate,
            jitter: existingProfile.jitter,
            shimmer: existingProfile.shimmer,
            dynamics: existingProfile.dynamics,
            voice_type: existingProfile.voice_type,
            voice_recorded: existingProfile.voice_recorded || false,
          });
        } else {
          console.log('No profile found after retries, using fallback');
          // Fallback to default profile for UI functionality
          setProfile({
            ...defaultProfile,
            id: user.id,
            username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          });
        }
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
        
        // Fallback to default profile for UI functionality
        setProfile({
          ...defaultProfile,
          id: user.id,
          username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading]);

  const updateVocalProfile = async (profileData: Partial<VocalProfile>) => {
    if (!user || !profile) {
      throw new Error('No user or profile available');
    }

    try {
      setError(null);

      console.log('Updating profile with data:', profileData);

      // Update local state immediately for better UX
      const updatedProfile = { ...profile, ...profileData };
      setProfile(updatedProfile);

      // Prepare data for Supabase (convert field names)
      const supabaseData: any = {
        updated_at: new Date().toISOString(),
      };

      if (profileData.username !== undefined) supabaseData.username = profileData.username;
      if (profileData.lowestNote !== undefined) supabaseData.lowest_note = profileData.lowestNote;
      if (profileData.highestNote !== undefined) supabaseData.highest_note = profileData.highestNote;
      if (profileData.mean_pitch !== undefined) supabaseData.mean_pitch = profileData.mean_pitch;
      if (profileData.vibrato_rate !== undefined) supabaseData.vibrato_rate = profileData.vibrato_rate;
      if (profileData.jitter !== undefined) supabaseData.jitter = profileData.jitter;
      if (profileData.shimmer !== undefined) supabaseData.shimmer = profileData.shimmer;
      if (profileData.dynamics !== undefined) supabaseData.dynamics = profileData.dynamics;
      if (profileData.voice_type !== undefined) supabaseData.voice_type = profileData.voice_type;
      if (profileData.voice_recorded !== undefined) supabaseData.voice_recorded = profileData.voice_recorded;

      console.log('Sending update to Supabase:', supabaseData);

      // Update in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update(supabaseData)
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        // Revert local state on error
        setProfile(profile);
        throw updateError;
      }

      console.log('Profile updated successfully');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  };

  const isProfileComplete = !!profile && 
    profile.mean_pitch !== null && 
    profile.vibrato_rate !== null && 
    profile.jitter !== null && 
    profile.shimmer !== null && 
    profile.dynamics !== null && 
    profile.voice_type !== null;

  return (
    <VocalProfileContext.Provider value={{ 
      profile, 
      updateVocalProfile, 
      isProfileComplete, 
      loading,
      error 
    }}>
      {children}
    </VocalProfileContext.Provider>
  );
};