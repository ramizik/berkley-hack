import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface SessionState {
  phase: "welcome" | "recording" | "analyzing" | "feedback" | "complete";
  customLine?: string;
  feedback?: string;
  exercise?: {
    title: string;
    description: string;
    duration_seconds: number;
    target_focus: string;
    difficulty: string;
  };
  analysisResult?: any;
  vapiSessionId?: string;
}

// Vapi SDK types
declare global {
  interface Window {
    vapiSDK?: {
      run: (config: { apiKey: string; assistant: string; config?: any }) => {
        stop: () => void;
        start: () => void;
        addEventListener: (
          event: string,
          callback: (data: any) => void
        ) => void;
        removeEventListener: (
          event: string,
          callback: (data: any) => void
        ) => void;
        [key: string]: any;
      };
    };
  }
}

const LiveCoach: React.FC = () => {
  const { profile } = useVocalProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Session management
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>({
    phase: "welcome",
  });
  const [sessionTime, setSessionTime] = useState(0);

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // VAPI state
  const [vapiConnected, setVapiConnected] = useState<boolean | null>(null);
  const [vapiAgentDetails, setVapiAgentDetails] = useState<any>(null);
  const [vapiError, setVapiError] = useState<string | null>(null);

  // Vapi SDK integration state
  const [showVapiControls, setShowVapiControls] = useState(false);
  const [vapiLoading, setVapiLoading] = useState(false);
  const [isVapiCallActive, setIsVapiCallActive] = useState(false);
  const vapiInstanceRef = useRef<any>(null);
  const vapiScriptRef = useRef<HTMLScriptElement | null>(null);

  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Vapi configuration
  const VAPI_CONFIG = {
    apiKey: "7af82e9d-df22-44e3-8461-669668e88783",
    assistant: "4564c208-503c-4bf3-b057-0bedb25536b4",
  };

   // Custom styles for Vapi components
  const customButtonStyle = {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    borderRadius: '25px',
    padding: '12px 30px',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const customEndCallButtonStyle = {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    borderRadius: '25px',
    padding: '12px 30px',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  // Custom panel styles  
  const customPanelStyle = {
    background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
    borderRadius: '16px',
    border: '2px solid #10b981',
    backdropFilter: 'blur(10px)',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)',
  };
};

export default LiveCoach;
