import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error(
    '❌ Missing VITE_SUPABASE_URL environment variable.\n\n' +
    'Please check your .env.local file and ensure it contains:\n' +
    'VITE_SUPABASE_URL=https://your-project-id.supabase.co\n\n' +
    'You can find this URL in your Supabase project dashboard under Settings > API.'
  );
}

if (!supabaseAnonKey) {
  throw new Error(
    '❌ Missing VITE_SUPABASE_ANON_KEY environment variable.\n\n' +
    'Please check your .env.local file and ensure it contains:\n' +
    'VITE_SUPABASE_ANON_KEY=your_anon_key_here\n\n' +
    'You can find this key in your Supabase project dashboard under Settings > API.'
  );
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch {
  throw new Error(
    '❌ Invalid VITE_SUPABASE_URL format.\n\n' +
    'Please ensure your Supabase URL follows this format:\n' +
    'https://your-project-id.supabase.co\n\n' +
    'Current value: ' + supabaseUrl
  );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Helper function to check connection
export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Supabase connection error:', error);
      return { connected: false, error: error.message };
    }
    return { connected: true, session: data.session };
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return { connected: false, error: 'Failed to connect to Supabase' };
  }
};

export default supabase;