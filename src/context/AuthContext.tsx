import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError as SupabaseAuthError } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (err) {
        console.error('Failed to get initial session:', err);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Only log significant auth events, not session refreshes
        if (event !== 'TOKEN_REFRESHED') {
          console.log('Auth state changed:', event, session?.user?.email);
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Clear URL parameters after OAuth callback
        if (event === 'SIGNED_IN' && session) {
          const url = new URL(window.location.href);
          if (url.searchParams.has('code') || url.searchParams.has('access_token')) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          
          // Show success message
          const isNewUser = event === 'SIGNED_UP' || session.user.created_at === session.user.last_sign_in_at;
          setAuthSuccess(isNewUser ? 'Account created successfully! Welcome to VocalAI.' : 'Welcome back! Redirecting to your dashboard...');
        }

        // Clear any previous errors on successful auth
        if (event === 'SIGNED_IN') {
          setError(null);
        }
        
        // Clear success message on sign out
        if (event === 'SIGNED_OUT') {
          setAuthSuccess(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthError = (error: SupabaseAuthError | Error) => {
    console.error('Authentication error:', error);
    
    // Map common Supabase errors to user-friendly messages
    const errorMessage = error.message;
    
    if (errorMessage.includes('Invalid login credentials')) {
      setError('Invalid email or password. Please check your credentials and try again.');
    } else if (errorMessage.includes('Email not confirmed')) {
      setError('Please check your email and click the confirmation link before signing in.');
    } else if (errorMessage.includes('User already registered')) {
      setError('An account with this email already exists. Please sign in instead.');
    } else if (errorMessage.includes('Password should be at least')) {
      setError('Password must be at least 6 characters long.');
    } else if (errorMessage.includes('Unable to validate email address')) {
      setError('Please enter a valid email address.');
    } else if (errorMessage.includes('Signup is disabled')) {
      setError('New user registration is currently disabled.');
    } else {
      setError(errorMessage || 'An unexpected error occurred. Please try again.');
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);
      setAuthSuccess(null);
      
      // Use different redirect URLs for development vs production
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const redirectTo = isLocalhost 
        ? `${window.location.origin}/auth`
        : `${window.location.origin}/auth`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          // Skip domain validation for localhost
          skipBrowserRedirect: false,
        }
      });

      if (error) {
        handleAuthError(error);
      }
    } catch (err) {
      handleAuthError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      setAuthSuccess(null);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        handleAuthError(error);
      }
    } catch (err) {
      handleAuthError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      setAuthSuccess(null);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + '/auth',
        }
      });

      if (error) {
        handleAuthError(error);
      } else {
        setError(null);
        // Note: User will need to confirm email before they can sign in
      }
    } catch (err) {
      handleAuthError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      setAuthSuccess(null);
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        handleAuthError(error);
      } else {
        setUser(null);
        setSession(null);
      }
    } catch (err) {
      handleAuthError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };
  
  const clearAuthSuccess = () => {
    setAuthSuccess(null);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    error,
    clearError,
    authSuccess,
    clearAuthSuccess,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};