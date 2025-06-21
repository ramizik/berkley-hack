import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SessionState {
  phase: 'welcome' | 'recording' | 'analyzing' | 'feedback' | 'complete';
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
      run: (config: {
        apiKey: string;
        assistant: string;
        config?: any;
      }) => {
        stop: () => void;
        start: () => void;
        addEventListener: (event: string, callback: (data: any) => void) => void;
        removeEventListener: (event: string, callback: (data: any) => void) => void;
        [key: string]: any;
      };
    };
  }
}