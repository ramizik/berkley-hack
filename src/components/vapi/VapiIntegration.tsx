import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';

interface VapiIntegrationProps {
  assistantId: string;
  onCallStart?: () => void;
  onCallEnd?: () => void;
  onTranscript?: (transcript: string) => void;
  onMessage?: (message: any) => void;
  className?: string;
}

const VapiIntegration: React.FC<VapiIntegrationProps> = ({
  assistantId,
  onCallStart,
  onCallEnd,
  onTranscript,
  onMessage,
  className = ""
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [vapiReady, setVapiReady] = useState(false);
  const vapiRef = useRef<any>(null);

  // Get public key from environment variables
  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;

  // Initialize Vapi when component mounts
  useEffect(() => {
    if (!publicKey || !assistantId) {
      setError('Missing Vapi credentials');
      return;
    }

    try {
      console.log('Initializing Vapi with:', { publicKey, assistantId });
      
      // For now, we'll simulate VAPI functionality
      // In a real implementation, you would initialize the VAPI SDK here
      setVapiReady(true);
      console.log('Vapi initialized successfully');
    } catch (err) {
      console.error('Error initializing Vapi:', err);
      setError('Failed to initialize Vapi');
    }

    // Cleanup on unmount
    return () => {
      if (vapiRef.current) {
        // Cleanup VAPI instance if needed
      }
    };
  }, [publicKey, assistantId]);

  const startCall = async () => {
    if (!publicKey || !assistantId) {
      setError('Missing Vapi credentials');
      console.error('Missing credentials:', { publicKey: !!publicKey, assistantId: !!assistantId });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Starting Vapi call with assistant:', assistantId);
      
      // Simulate VAPI call start
      setTimeout(() => {
        setIsConnected(true);
        setIsLoading(false);
        onCallStart?.();
        
        // Simulate transcript updates
        setTimeout(() => {
          const mockTranscript = "Hello! I'm your AI voice coach. I'm here to help you improve your singing.";
          setTranscript(mockTranscript);
          onTranscript?.(mockTranscript);
        }, 2000);
      }, 1500);
      
    } catch (err: any) {
      console.error('Error starting call:', err);
      setError(err.message || 'Failed to start call');
      setIsLoading(false);
    }
  };

  const endCall = () => {
    console.log('Ending Vapi call');
    setIsConnected(false);
    setIsLoading(false);
    setTranscript('');
    onCallEnd?.();
  };

  // Debug info
  console.log('VapiIntegration render:', {
    vapiReady,
    isConnected,
    isLoading,
    hasPublicKey: !!publicKey,
    hasAssistantId: !!assistantId,
    error
  });

  return (
    <div className={`vapi-integration ${className}`}>
      <div className="flex flex-col space-y-3">
        {/* Call Control Button */}
        <div className="flex items-center justify-center">
          {!isConnected ? (
            <button
              onClick={startCall}
              disabled={isLoading || !vapiReady}
              className={`flex items-center justify-center w-16 h-16 text-white rounded-full transition-all shadow-lg hover:shadow-xl ${
                isLoading || !vapiReady 
                  ? 'bg-gray-500 cursor-not-allowed opacity-50' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 cursor-pointer'
              }`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mic size={24} />
              )}
            </button>
          ) : (
            <button
              onClick={endCall}
              className="flex items-center justify-center w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors animate-pulse shadow-lg"
            >
              <MicOff size={24} />
            </button>
          )}
        </div>

        {/* Status */}
        <div className="text-center">
          {!vapiReady && (
            <p className="text-sm text-yellow-400">Initializing Vapi...</p>
          )}
          {vapiReady && isLoading && (
            <p className="text-sm text-blue-400">Connecting to voice coach...</p>
          )}
          {vapiReady && isConnected && (
            <p className="text-sm text-green-400 flex items-center justify-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Voice coach active
            </p>
          )}
          {vapiReady && !isConnected && !isLoading && (
            <p className="text-sm text-gray-400">Tap to start voice coaching</p>
          )}
          {!publicKey || !assistantId ? (
            <p className="text-sm text-red-400">Missing Vapi credentials</p>
          ) : null}
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="text-sm text-blue-400 mb-1">AI Coach:</div>
            <div className="text-white text-sm">{transcript}</div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VapiIntegration; 