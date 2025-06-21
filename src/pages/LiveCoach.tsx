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
    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    borderRadius: "25px",
    padding: "12px 30px",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.4)",
    border: "none",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  const customEndCallButtonStyle = {
    background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    borderRadius: "25px",
    padding: "12px 30px",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0 4px 15px rgba(239, 68, 68, 0.4)",
    border: "none",
    color: "white",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  // Custom panel styles
  const customPanelStyle = {
    background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
    borderRadius: "16px",
    border: "2px solid #10b981",
    backdropFilter: "blur(10px)",
    padding: "32px",
    boxShadow: "0 8px 32px rgba(16, 185, 129, 0.2)",
  };

  // Check VAPI connection on mount
  useEffect(() => {
    const checkVAPIConnection = async () => {
      try {
        addDebugInfo("Checking VAPI connection...");
        const isConnected = await testVAPIConnection();
        setVapiConnected(isConnected);

        if (isConnected) {
          const agentDetails = await getVoiceAgentDetails();
          setVapiAgentDetails(agentDetails);
          addDebugInfo(
            `VAPI connected: ${agentDetails?.name || "Unknown agent"}`
          );
        } else {
          addDebugInfo("VAPI not available, using fallback mode");
        }
      } catch (error) {
        console.error("VAPI connection check failed:", error);
        setVapiConnected(false);
        setVapiError(
          error instanceof Error ? error.message : "Connection failed"
        );
        addDebugInfo(
          `VAPI connection failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    };

    checkVAPIConnection();
  }, []);

  // Add debug logging
  const addDebugInfo = useCallback((message: string) => {
    setDebugInfo((prev) => [
      ...prev.slice(-4),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
    console.log(`[LiveCoach] ${message}`);
  }, []);

  // Load Vapi SDK dynamically
  const loadVapiSDK = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      // Check if SDK is already loaded
      if (window.vapiSDK) {
        resolve();
        return;
      }

      // Check if script is already being loaded
      if (vapiScriptRef.current) {
        vapiScriptRef.current.onload = () => resolve();
        vapiScriptRef.current.onerror = () =>
          reject(new Error("Failed to load Vapi SDK"));
        return;
      }

      addDebugInfo("Loading Vapi SDK...");
      setVapiLoading(true);

      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js";
      script.defer = true;
      script.async = true;

      script.onload = () => {
        addDebugInfo("Vapi SDK loaded successfully");
        setVapiLoading(false);
        vapiScriptRef.current = script;
        resolve();
      };

      script.onerror = () => {
        addDebugInfo("Failed to load Vapi SDK");
        setVapiLoading(false);
        reject(new Error("Failed to load Vapi SDK"));
      };

      document.body.appendChild(script);
    });
  }, [addDebugInfo]);

  // Initialize Vapi assistant
  const initializeVapi = useCallback(async () => {
    try {
      addDebugInfo("Initializing Vapi assistant...");

      await loadVapiSDK();

      if (!window.vapiSDK) {
        throw new Error("Vapi SDK not available");
      }

      // Stop any existing instance
      if (vapiInstanceRef.current) {
        try {
          vapiInstanceRef.current.stop();
        } catch (error) {
          console.warn("Error stopping previous Vapi instance:", error);
        }
      }

      // Initialize new instance with empty buttonConfig to prevent floating button
      vapiInstanceRef.current = window.vapiSDK.run({
        apiKey: VAPI_CONFIG.apiKey,
        assistant: VAPI_CONFIG.assistant,
        config: {}, // Empty config prevents floating button
      });

      // Add event listeners for call status
      if (vapiInstanceRef.current.addEventListener) {
        vapiInstanceRef.current.addEventListener("call-start", () => {
          addDebugInfo("Vapi call started");
          setIsVapiCallActive(true);
        });

        vapiInstanceRef.current.addEventListener("call-end", () => {
          addDebugInfo("Vapi call ended");
          setIsVapiCallActive(false);
        });

        vapiInstanceRef.current.addEventListener("error", (error: any) => {
          addDebugInfo(`Vapi error: ${error.message || "Unknown error"}`);
          setIsVapiCallActive(false);
        });
      }

      addDebugInfo("Vapi assistant initialized successfully");
      setVapiLoading(false);
    } catch (error) {
      console.error("Error initializing Vapi:", error);
      addDebugInfo(
        `Vapi initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setVapiError(
        error instanceof Error ? error.message : "Failed to initialize Vapi"
      );
      setVapiLoading(false);
    }
  }, [addDebugInfo, loadVapiSDK]);

  // Start Vapi call
  const startVapiCall = useCallback(async () => {
    try {
      if (!vapiInstanceRef.current) {
        await initializeVapi();
      }

      if (vapiInstanceRef.current && vapiInstanceRef.current.start) {
        addDebugInfo("Starting Vapi call...");
        vapiInstanceRef.current.start();
        setIsVapiCallActive(true);
      } else {
        throw new Error("Vapi instance not available or missing start method");
      }
    } catch (error) {
      console.error("Error starting Vapi call:", error);
      addDebugInfo(
        `Failed to start Vapi call: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setVapiError(
        error instanceof Error ? error.message : "Failed to start call"
      );
    }
  }, [initializeVapi, addDebugInfo]);

  // Stop Vapi call
  const stopVapiCall = useCallback(() => {
    try {
      if (vapiInstanceRef.current && vapiInstanceRef.current.stop) {
        addDebugInfo("Stopping Vapi call...");
        vapiInstanceRef.current.stop();
        setIsVapiCallActive(false);
      }
    } catch (error) {
      console.error("Error stopping Vapi call:", error);
      addDebugInfo(
        `Error stopping Vapi call: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [addDebugInfo]);

  // Stop Vapi assistant completely
  const stopVapi = useCallback(() => {
    try {
      if (vapiInstanceRef.current) {
        addDebugInfo("Stopping Vapi assistant...");
        vapiInstanceRef.current.stop();
        vapiInstanceRef.current = null;
      }

      // Remove script if it exists
      if (vapiScriptRef.current) {
        document.body.removeChild(vapiScriptRef.current);
        vapiScriptRef.current = null;
      }

      // Clear window.vapiSDK
      if (window.vapiSDK) {
        delete window.vapiSDK;
      }

      setIsVapiCallActive(false);
      addDebugInfo("Vapi assistant stopped");
    } catch (error) {
      console.error("Error stopping Vapi:", error);
      addDebugInfo(
        `Error stopping Vapi: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, [addDebugInfo]);

  // Handle voice analysis completion with VAPI integration
  const handleVoiceAnalysisComplete = useCallback(
    async (results: any) => {
      if (!user || !sessionActive) {
        addDebugInfo(
          "Analysis complete but session not active or user not found"
        );
        return;
      }

      addDebugInfo(
        `Voice analysis completed: ${JSON.stringify(results).substring(
          0,
          100
        )}...`
      );

      try {
        setIsProcessing(true);
        setSessionState((prev) => ({ ...prev, analysisResult: results }));
        setVapiError(null);

        // Convert analysis results to VAPI metrics format
        const vapiMetrics: VAPIMetrics = {
          mean_pitch: results.mean_pitch || 0,
          vibrato_rate: results.vibrato_rate || 0,
          jitter: results.jitter || 0,
          shimmer: results.shimmer || 0,
          dynamics: results.dynamics || "stable",
          voice_type: results.voice_type || "unknown",
          lowest_note: results.lowest_note || "C3",
          highest_note: results.highest_note || "C5",
        };

        addDebugInfo(
          `Converted to VAPI metrics: voice_type=${vapiMetrics.voice_type}, mean_pitch=${vapiMetrics.mean_pitch}`
        );

        // Generate custom line using VAPI
        addDebugInfo("Generating custom line with VAPI...");
        const customLineResponse = await vapiClient.generateCustomLine(
          vapiMetrics,
          user.id
        );

        if (!customLineResponse.success) {
          throw new Error("Failed to generate custom line");
        }

        addDebugInfo(
          `Custom line generated: ${customLineResponse.custom_line}`
        );

        // Simulate user practicing the custom line (in real implementation, this would be another recording)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Generate exercise using VAPI
        addDebugInfo("Generating exercise with VAPI...");
        const exerciseResponse = await vapiClient.generateExercise(
          vapiMetrics,
          customLineResponse.custom_line,
          customLineResponse.vapi_session_id
        );

        if (!exerciseResponse.success) {
          throw new Error("Failed to generate exercise");
        }

        addDebugInfo(
          `Exercise generated: ${exerciseResponse.exercise_prompt.title}`
        );

        // Update session state with VAPI results
        setSessionState((prev) => ({
          ...prev,
          phase: "feedback",
          customLine: customLineResponse.custom_line,
          feedback: exerciseResponse.feedback,
          exercise: exerciseResponse.exercise_prompt,
          vapiSessionId: customLineResponse.vapi_session_id,
        }));

        // Show Vapi controls after successful analysis and feedback generation
        addDebugInfo("Showing Vapi assistant controls...");
        setShowVapiControls(true);

        addDebugInfo("VAPI integration completed successfully");
      } catch (error) {
        console.error("VAPI integration error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        addDebugInfo(`VAPI integration error: ${errorMessage}`);
        setVapiError(errorMessage);

        // Fallback to hardcoded content
        addDebugInfo("Falling back to hardcoded content");

        const customLines = {
          soprano:
            "Sing 'Twinkle, twinkle, little star' with clear, bright tones in your upper register.",
          alto: "Recite 'Amazing Grace' with rich, warm tones in your comfortable range.",
          tenor:
            "Sing 'Do Re Mi Fa Sol La Ti Do' with strong, clear projection.",
          baritone:
            "Recite 'Row, row, row your boat' with deep, resonant tones.",
          bass: "Sing 'Old Man River' with powerful, deep chest voice.",
          unknown:
            "Please sing the phrase 'Do Re Mi Fa Sol La Ti Do' slowly and clearly.",
        };

        const voiceType = results.voice_type || "unknown";
        const customLine =
          customLines[voiceType as keyof typeof customLines] ||
          customLines.unknown;

        const feedback = `Great work! Your voice analysis shows a ${voiceType} voice type with a mean pitch of ${results.mean_pitch}Hz. Your vibrato rate is ${results.vibrato_rate}Hz, which is excellent for your voice type.`;

        const exercise = {
          title: "Breath Control Exercise",
          description:
            "Take a deep breath and sing a comfortable vowel sound (like 'Ah') for as long as possible, maintaining steady volume and tone. Focus on engaging your diaphragm and controlling the airflow. Repeat 5 times with 30-second breaks.",
          duration_seconds: 180,
          target_focus: "breath_control",
          difficulty: "beginner",
        };

        setSessionState((prev) => ({
          ...prev,
          phase: "feedback",
          customLine,
          feedback,
          exercise,
        }));

        // Still show Vapi controls even with fallback content
        setShowVapiControls(true);
      } finally {
        setIsProcessing(false);
      }
    },
    [user, sessionActive, addDebugInfo]
  );

  // Voice analysis hook
  const {
    isRecording,
    recordingComplete,
    isAnalyzing,
    analysisComplete,
    error: voiceError,
    currentPitch,
    currentNote,
    displayedNote,
    recordingDuration,
    startRecording,
    stopRecording,
    analyzeVoice,
    resetRecording,
    analysisResult,
    audioBlob,
  } = useVoiceAnalysis({
    onAnalysisComplete: handleVoiceAnalysisComplete,
  });

  // Start coaching session
  const startCoachingSession = async () => {
    try {
      addDebugInfo("Starting coaching session...");

      setSessionActive(true);
      setSessionState({ phase: "recording" });
      setSessionTime(0);
      setVapiError(null);
      setShowVapiControls(false); // Hide Vapi controls when starting new session
      setIsVapiCallActive(false);

      // Start session timer
      sessionTimerRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);

      addDebugInfo("Coaching session started successfully");
    } catch (error) {
      console.error("Failed to start coaching session:", error);
      addDebugInfo(
        `Failed to start session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Stop coaching session
  const stopCoachingSession = () => {
    addDebugInfo("Stopping coaching session...");
    setSessionActive(false);
    setSessionState({ phase: "welcome" });
    setShowVapiControls(false); // Hide Vapi controls when stopping session
    stopRecording();
    resetRecording();
    setDebugInfo([]);
    setVapiError(null);
    stopVapi(); // Stop Vapi completely

    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  };

  // Handle recording completion
  useEffect(() => {
    if (
      recordingComplete &&
      audioBlob &&
      user &&
      sessionActive &&
      sessionState.phase === "recording" &&
      !isAnalyzing &&
      !analysisComplete
    ) {
      addDebugInfo(
        `Recording completed. Audio blob size: ${audioBlob.size} bytes`
      );
      setSessionState((prev) => ({ ...prev, phase: "analyzing" }));

      const apiUrl =
        import.meta.env.VITE_FASTAPI_URL || "http://localhost:8080";
      addDebugInfo(`Starting voice analysis with API URL: ${apiUrl}`);

      setTimeout(() => {
        analyzeVoice(user.id, apiUrl);
      }, 100);
    }
  }, [
    recordingComplete,
    audioBlob,
    user,
    sessionActive,
    sessionState.phase,
    analyzeVoice,
    addDebugInfo,
    isAnalyzing,
    analysisComplete,
  ]);

  // Start recording for current phase
  const handleStartRecording = async () => {
    try {
      addDebugInfo("Starting voice recording...");
      resetRecording();
      await startRecording();
      addDebugInfo("Voice recording started successfully");
    } catch (error) {
      console.error("Failed to start recording:", error);
      addDebugInfo(
        `Failed to start recording: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  // Complete session
  const completeSession = () => {
    addDebugInfo("Completing session...");
    setSessionState((prev) => ({ ...prev, phase: "complete" }));
    // Keep Vapi controls visible in complete phase
  };

  // Navigate to voice assistant page
  const navigateToVoiceAssistant = () => {
    navigate("/voice-assistant");
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
      stopVapi(); // Cleanup Vapi on unmount
    };
  }, [stopVapi]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-transition max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold gradient-text flex items-center">
            <Zap size={32} className="mr-3" />
            Live Coach with VAPI AI
          </h2>
          <p className="text-gray-300 mt-1">
            AI-powered vocal coaching with real-time feedback and personalized
            exercises
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-colors"
          >
            <Settings size={20} className="text-gray-300" />
          </button>

          {sessionActive && (
            <div className="flex items-center space-x-2 px-4 py-2 bg-red-900/20 border border-red-500/30 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 font-medium">LIVE</span>
              <span className="text-white font-mono">
                {formatTime(sessionTime)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* VAPI Connection Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-3 ${
                vapiConnected === true
                  ? "bg-green-400 animate-pulse"
                  : vapiConnected === false
                  ? "bg-red-400"
                  : "bg-yellow-400 animate-pulse"
              }`}
            ></div>
            <span className="text-white font-medium">
              {vapiConnected === true
                ? "VAPI Voice Agent Connected"
                : vapiConnected === false
                ? "VAPI Voice Agent Disconnected"
                : "Checking VAPI Connection..."}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            {vapiConnected === true
              ? "Real-time AI vocal coaching enabled"
              : vapiConnected === false
              ? "Using fallback coaching mode"
              : "Initializing..."}
          </div>
        </div>

        {/* Voice Agent Details */}
        {vapiConnected === true && vapiAgentDetails && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-gray-400 mb-1">Agent Name</div>
              <div className="text-white">
                {vapiAgentDetails?.name || "Vocal Coach AI Agent"}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-gray-400 mb-1">Status</div>
              <div
                className={
                  vapiAgentDetails?.status === "fallback"
                    ? "text-yellow-400"
                    : "text-green-400"
                }
              >
                {vapiAgentDetails?.status === "fallback"
                  ? "Fallback Mode"
                  : "Active & Ready"}
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-gray-400 mb-1">Mode</div>
              <div className="text-white">
                {vapiAgentDetails?.agentverse_ready
                  ? "Full VAPI Integration"
                  : "Backend Processing"}
              </div>
            </div>
          </div>
        )}

        {/* Connection Error */}
        {vapiConnected === false && (
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center text-red-400">
              <AlertTriangle size={16} className="mr-2" />
              <span className="text-sm">
                {vapiError ||
                  "Unable to connect to VAPI voice agent. Using fallback coaching mode."}
              </span>
            </div>
            <div className="text-xs text-red-300 mt-1">
              The app will continue to work with AI-powered backend processing.
            </div>
          </div>
        )}
      </motion.div>

      {/* Debug Info (only show in development) - COMMENTED OUT */}
      {/* 
        {import.meta.env.DEV && debugInfo.length > 0 && (
          <div className="card mb-4 bg-gray-900/50 border border-gray-700/50">
            <h4 className="text-sm font-medium text-gray-400 mb-2">Debug Info:</h4>
            <div className="space-y-1">
              {debugInfo.map((info, index) => (
                <div key={index} className="text-xs text-gray-500 font-mono">
                  {info}
                </div>
              ))}
            </div>
          </div>
        )}
        */}

      {/* Main Content */}
      <div className="card">
        <div className="text-center">
          <AnimatePresence mode="wait">
            {/* Welcome Phase */}
            {sessionState.phase === "welcome" && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="mb-8">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-accent/20 to-blue-accent/20 flex items-center justify-center mx-auto mb-6 border border-purple-accent/30 shadow-lg">
                    <Brain size={48} className="text-purple-accent" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    AI-Powered Vocal Coaching
                  </h3>
                  <h4 className="text-lg md:text-xl text-purple-accent mb-4">
                    Get personalized feedback and exercises from{" "}
                    {vapiConnected ? "VAPI AI" : "AI"}
                  </h4>
                  <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed text-sm md:text-base">
                    Start a live coaching session with real-time voice analysis
                    and AI-generated practice exercises tailored to your vocal
                    performance.
                  </p>
                </div>

                {/* Feature Cards - Horizontal Layout */}
                <div className="flex flex-col lg:flex-row gap-6 max-w-5xl mx-auto mb-8">
                  <div className="flex-1 bg-purple-900/20 border border-purple-500/30 rounded-xl p-6 hover:bg-purple-900/30 transition-colors">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-purple-900/40 flex items-center justify-center mb-4">
                        <BarChart3 size={28} className="text-purple-accent" />
                      </div>
                      <h5 className="font-semibold text-white mb-2">
                        Voice Analysis
                      </h5>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        Real-time pitch detection and vocal metrics analysis
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 bg-blue-900/20 border border-blue-500/30 rounded-xl p-6 hover:bg-blue-900/30 transition-colors">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-blue-900/40 flex items-center justify-center mb-4">
                        <Brain size={28} className="text-blue-accent" />
                      </div>
                      <h5 className="font-semibold text-white mb-2">
                        {vapiConnected ? "VAPI AI Feedback" : "AI Feedback"}
                      </h5>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        Personalized coaching insights from{" "}
                        {vapiConnected ? "VAPI" : "AI"} analysis
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 bg-green-900/20 border border-green-500/30 rounded-xl p-6 hover:bg-green-900/30 transition-colors">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-green-900/40 flex items-center justify-center mb-4">
                        <Target size={28} className="text-green-400" />
                      </div>
                      <h5 className="font-semibold text-white mb-2">
                        Custom Exercises
                      </h5>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        Tailored practice routines for your voice type
                      </p>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startCoachingSession}
                  className="px-8 py-4 bg-gradient-primary text-white font-medium rounded-lg hover:shadow-lg transition-all flex items-center mx-auto text-lg"
                >
                  <Play size={24} className="mr-3" />
                  Start Coaching Session
                </motion.button>
              </motion.div>
            )}

            {/* Recording Phase */}
            {sessionState.phase === "recording" && (
              <motion.div
                key="recording"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="mb-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    Record Your Voice
                  </h3>
                  <h4 className="text-lg md:text-xl text-red-accent mb-4">
                    Sing Any Melody or Scale
                  </h4>
                  <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed text-sm md:text-base">
                    Record yourself singing any comfortable melody, scale, or
                    vocal exercise. This will help AI analyze your voice.
                  </p>
                </div>

                {/* Recording Controls */}
                <div className="flex flex-col items-center space-y-6">
                  <div className="flex items-center justify-center">
                    {!isRecording && !recordingComplete && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStartRecording}
                        disabled={isAnalyzing}
                        className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-primary flex items-center justify-center text-white hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      >
                        <Mic size={40} className="md:w-12 md:h-12" />
                      </motion.button>
                    )}

                    {isRecording && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={stopRecording}
                        className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-md"></div>
                      </motion.button>
                    )}
                  </div>

                  {/* Recording Status */}
                  <div className="text-center space-y-3">
                    {isRecording && (
                      <div className="space-y-2">
                        <div className="text-3xl md:text-4xl font-bold text-red-accent">
                          {formatTime(recordingDuration)}
                        </div>
                        <div className="text-sm md:text-base text-gray-400">
                          Recording... (
                          {formatTime(Math.max(0, 15 - recordingDuration))}{" "}
                          remaining)
                        </div>
                        {currentNote && (
                          <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                            <div className="text-2xl md:text-3xl font-bold text-purple-accent">
                              {displayedNote || currentNote}
                            </div>
                            <div className="text-sm text-gray-400">
                              {currentPitch} Hz
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {recordingComplete && (
                      <div className="text-green-400 font-medium text-lg">
                        <CheckCircle size={24} className="inline mr-2" />
                        Recording Complete!
                      </div>
                    )}
                  </div>
                </div>

                {/* Voice Error */}
                {voiceError && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto">
                    <div className="flex items-center text-red-400">
                      <AlertTriangle size={16} className="mr-2" />
                      <span className="text-sm">{voiceError}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Analyzing Phase */}
            {sessionState.phase === "analyzing" && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="mb-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    Analyzing Your Voice
                  </h3>
                  <h4 className="text-lg md:text-xl text-blue-accent mb-4">
                    {vapiConnected
                      ? "VAPI AI Processing in Progress"
                      : "AI Processing in Progress"}
                  </h4>
                  <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed text-sm md:text-base">
                    Our AI is analyzing your vocal performance to generate
                    personalized feedback and practice exercises.
                  </p>
                </div>

                <div className="flex flex-col items-center space-y-6">
                  {/* Loading Animation */}
                  <div className="relative">
                    <div className="w-20 h-20 md:w-24 md:h-24 border-4 border-blue-accent/30 rounded-full"></div>
                    <div className="absolute inset-0 w-20 h-20 md:w-24 md:h-24 border-4 border-blue-accent border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Radio
                        size={32}
                        className="text-blue-accent animate-pulse"
                      />
                    </div>
                  </div>

                  <div className="text-center space-y-3">
                    <div className="text-blue-accent font-semibold text-lg md:text-xl">
                      {isAnalyzing
                        ? "Analyzing voice patterns..."
                        : isProcessing
                        ? `Generating ${
                            vapiConnected ? "VAPI" : "AI"
                          } feedback...`
                        : "Processing complete"}
                    </div>
                    <div className="text-sm md:text-base text-gray-400 max-w-md mx-auto">
                      Our {vapiConnected ? "VAPI" : "AI"} is analyzing your
                      vocal performance to generate personalized feedback and
                      practice exercises.
                    </div>

                    {/* Progress indicators */}
                    <div className="flex items-center justify-center space-x-2 mt-4">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isAnalyzing ? "bg-blue-accent" : "bg-gray-600"
                        }`}
                      ></div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isProcessing ? "bg-blue-accent" : "bg-gray-600"
                        }`}
                      ></div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          analysisComplete ? "bg-blue-accent" : "bg-gray-600"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* VAPI Processing Error */}
                {vapiError && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 max-w-md mx-auto">
                    <div className="flex items-center text-yellow-400">
                      <AlertTriangle size={16} className="mr-2" />
                      <span className="text-sm">VAPI Error: {vapiError}</span>
                    </div>
                    <div className="text-xs text-yellow-300 mt-1">
                      Falling back to standard AI processing...
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Feedback Phase */}
            {sessionState.phase === "feedback" && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="mb-8">
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    {vapiConnected
                      ? "VAPI AI Feedback & Custom Line"
                      : "AI Feedback & Custom Line"}
                  </h3>
                  <h4 className="text-lg md:text-xl text-green-400 mb-4">
                    Personalized Practice Recommendation
                  </h4>
                  <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed text-sm md:text-base">
                    Based on your voice analysis, here's a custom practice line
                    designed specifically for your vocal characteristics.
                  </p>
                  {sessionState.vapiSessionId && (
                    <div className="text-xs text-gray-500 mt-2">
                      Session ID: {sessionState.vapiSessionId}
                    </div>
                  )}
                </div>

                {/* AI Feedback */}
                {sessionState.feedback && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-8 max-w-3xl mx-auto mb-8">
                    <h5 className="font-semibold text-blue-400 mb-4 flex items-center justify-center">
                      <Brain size={20} className="mr-2" />
                      {vapiConnected
                        ? "VAPI AI Analysis Results"
                        : "AI Analysis Results"}
                    </h5>
                    <p className="text-white text-center leading-relaxed">
                      {sessionState.feedback}
                    </p>
                  </div>
                )}

                {/* Custom Line */}
                {sessionState.customLine && (
                  <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-8 max-w-3xl mx-auto">
                    <h5 className="font-semibold text-green-400 mb-4 flex items-center justify-center">
                      <Target size={20} className="mr-2" />
                      Your Personalized Practice Line
                    </h5>
                    <p className="text-xl md:text-2xl text-white italic font-medium text-center leading-relaxed mb-4">
                      "{sessionState.customLine}"
                    </p>
                    <p className="text-sm md:text-base text-green-300 text-center">
                      This line was generated specifically for your voice type
                      and current skill level
                      {vapiConnected ? " by VAPI AI" : ""}.
                    </p>
                  </div>
                )}

                {/* Exercise */}
                {sessionState.exercise && (
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-8 max-w-3xl mx-auto">
                    <h5 className="font-semibold text-purple-400 mb-4 flex items-center justify-center">
                      <Target size={20} className="mr-2" />
                      {sessionState.exercise.title}
                    </h5>
                    <p className="text-white text-center leading-relaxed mb-6">
                      {sessionState.exercise.description}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-purple-300">
                      <span className="bg-purple-900/30 px-3 py-1 rounded-full">
                        Duration:{" "}
                        {Math.floor(
                          sessionState.exercise.duration_seconds / 60
                        )}{" "}
                        min
                      </span>
                      <span className="bg-purple-900/30 px-3 py-1 rounded-full">
                        Focus:{" "}
                        {sessionState.exercise.target_focus.replace("_", " ")}
                      </span>
                      <span className="bg-purple-900/30 px-3 py-1 rounded-full">
                        Level: {sessionState.exercise.difficulty}
                      </span>
                    </div>
                  </div>
                )}

                {/* Custom Vapi Voice Controls */}
                {showVapiControls && (
                  <div style={customPanelStyle} className="max-w-3xl mx-auto">
                    <div className="text-center">
                      <div className="flex justify-center gap-4">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={navigateToVoiceAssistant}
                          style={customButtonStyle}
                        >
                          <PhoneCall size={16} className="mr-2 inline" />
                          Start Voice Chat
                        </motion.button>
                      </div>
                    </div>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={completeSession}
                  className="px-8 py-4 bg-gradient-primary text-white font-medium rounded-lg hover:shadow-lg transition-all flex items-center mx-auto text-lg"
                >
                  Complete Session
                  <ArrowRight size={24} className="ml-3" />
                </motion.button>
              </motion.div>
            )}

            {/* Complete Phase */}
            {sessionState.phase === "complete" && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="mb-8">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-green-400/20 to-blue-accent/20 flex items-center justify-center mx-auto mb-6 border border-green-400/30 shadow-lg">
                    <CheckCircle size={48} className="text-green-400" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                    Session Complete!
                  </h3>
                  <h4 className="text-lg md:text-xl text-green-400 mb-4">
                    Great Work!
                  </h4>
                  <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed text-sm md:text-base">
                    You've completed your {vapiConnected ? "VAPI" : "AI"}-guided
                    vocal coaching session. Review your feedback and continue
                    practicing.
                  </p>

                  {/* Custom Vapi Voice Controls in Complete Phase */}
                  {showVapiControls && (
                    <div className="mt-8" style={customPanelStyle}>
                      <div className="text-center">
                        <h5 className="font-semibold text-white mb-3">
                          Continue with AI Coach
                        </h5>
                        <p className="text-gray-300 text-sm mb-4">
                          Your AI voice assistant is available for questions and
                          additional guidance.
                        </p>

                        <div className="flex justify-center">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={navigateToVoiceAssistant}
                            style={{
                              ...customButtonStyle,
                              padding: "10px 24px",
                              fontSize: "13px",
                            }}
                          >
                            <PhoneCall size={14} className="mr-2 inline" />
                            Start Voice Chat
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopCoachingSession}
                    className="px-8 py-4 bg-gradient-primary text-white font-medium rounded-lg hover:shadow-lg transition-all text-lg"
                  >
                    Start New Session
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => (window.location.href = "/progress")}
                    className="px-8 py-4 border border-purple-accent text-purple-accent rounded-lg hover:bg-purple-accent/10 transition-all text-lg"
                  >
                    View Progress
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Session Controls */}
          {sessionActive &&
            sessionState.phase !== "welcome" &&
            sessionState.phase !== "complete" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-12 pt-8 border-t border-gray-700/50"
              >
                <button
                  onClick={stopCoachingSession}
                  className="px-6 py-3 bg-red-600/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors"
                >
                  End Session
                </button>
              </motion.div>
            )}
        </div>
      </div>
    </motion.div>
  );
};

export default LiveCoach;
