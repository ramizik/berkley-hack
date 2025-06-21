import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { checkSupabaseConnection } from '../../lib/supabase';

const SupabaseConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<{
    connected: boolean;
    error?: string;
    checking: boolean;
  }>({ connected: false, checking: true });

  const checkConnection = async () => {
    setStatus(prev => ({ ...prev, checking: true }));
    
    try {
      const result = await checkSupabaseConnection();
      setStatus({
        connected: result.connected,
        error: result.error,
        checking: false
      });
    } catch (error) {
      setStatus({
        connected: false,
        error: 'Failed to check connection',
        checking: false
      });
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50"
    >
      <div className={`p-3 rounded-lg border backdrop-blur-sm ${
        status.checking
          ? 'bg-yellow-500/10 border-yellow-500/30'
          : status.connected
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center space-x-2">
          {status.checking ? (
            <RefreshCw size={16} className="text-yellow-400 animate-spin" />
          ) : status.connected ? (
            <CheckCircle size={16} className="text-green-400" />
          ) : (
            <XCircle size={16} className="text-red-400" />
          )}
          
          <span className={`text-sm font-medium ${
            status.checking
              ? 'text-yellow-400'
              : status.connected
                ? 'text-green-400'
                : 'text-red-400'
          }`}>
            {status.checking
              ? 'Checking Supabase...'
              : status.connected
                ? 'Supabase Connected'
                : 'Supabase Error'
            }
          </span>
          
          {!status.checking && (
            <button
              onClick={checkConnection}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
        
        {status.error && (
          <div className="mt-2 text-xs text-red-300">
            {status.error}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SupabaseConnectionStatus;