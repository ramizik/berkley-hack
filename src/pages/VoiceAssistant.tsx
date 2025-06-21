import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PhoneOff, ArrowLeft, Volume2, Settings, Mic } from "lucide-react";
import Vapi from "@vapi-ai/web";

const VoiceAssistant: React.FC = () => {
  const navigate = useNavigate();

  // Vapi state
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<
    Array<{ role: string; text: string }>
  >([]);
  const [vapiLoading, setVapiLoading] = useState(true);
  const [isVapiCallActive, setIsVapiCallActive] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "active" | "disconnected"
  >("connecting");

  const vapiInstanceRef = useRef<Vapi | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Your actual Vapi configuration
  const VAPI_CONFIG = {
    apiKey: "7af82e9d-df22-44e3-8461-669668e88783",
    assistant: "4564c208-503c-4bf3-b057-0bedb25536b4",
  };

  // Initialize Vapi
  const initializeVapi = useCallback(() => {
    console.log("Initializing Vapi...");
    setVapiLoading(true);
    setConnectionStatus("connecting");

    try {
      const vapiInstance = new Vapi(VAPI_CONFIG.apiKey);
      setVapi(vapiInstance);
      vapiInstanceRef.current = vapiInstance;

      // Event listeners
      vapiInstance.on("call-start", () => {
        console.log("Call started");
        setIsConnected(true);
        setIsVapiCallActive(true);
        setConnectionStatus("active");
        setCallDuration(0);

        // Start call timer
        callTimerRef.current = setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      });

      vapiInstance.on("call-end", () => {
        console.log("Call ended");
        setIsConnected(false);
        setIsSpeaking(false);
        setIsVapiCallActive(false);
        setConnectionStatus("connected");
        setCallDuration(0);

        // Clear call timer
        if (callTimerRef.current) {
          clearInterval(callTimerRef.current);
          callTimerRef.current = null;
        }
      });

      vapiInstance.on("speech-start", () => {
        console.log("Assistant started speaking");
        setIsSpeaking(true);
      });

      vapiInstance.on("speech-end", () => {
        console.log("Assistant stopped speaking");
        setIsSpeaking(false);
      });

      vapiInstance.on("message", (message) => {
        if (message.type === "transcript") {
          setTranscript((prev) => [
            ...prev,
            {
              role: message.role,
              text: message.transcript,
            },
          ]);
        }
      });

      vapiInstance.on("error", (error) => {
        console.error("Vapi error:", error);
        setConnectionStatus("disconnected");
      });

      setConnectionStatus("connected");
      setVapiLoading(false);
      console.log("Vapi initialized successfully");
    } catch (error) {
      console.error("Error initializing Vapi:", error);
      setConnectionStatus("disconnected");
      setVapiLoading(false);
    }
  }, []);

  // Start Vapi call
  const startCall = useCallback(() => {
    if (vapi) {
      console.log("Starting Vapi call...");
      vapi.start(VAPI_CONFIG.assistant);
    }
  }, [vapi]);

  // Stop Vapi call
  const stopVapiCall = useCallback(() => {
    try {
      console.log("Stopping Vapi call...");
      setIsVapiCallActive(false);
      setConnectionStatus("connected");
      setCallDuration(0);

      // Clear call timer
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }

      // Stop the Vapi instance
      if (vapi) {
        vapi.stop();
      }
    } catch (error) {
      console.error("Error stopping Vapi call:", error);
    }
  }, [vapi]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Initialize on mount
  useEffect(() => {
    initializeVapi();

    return () => {
      // Cleanup on unmount
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      if (vapiInstanceRef.current) {
        vapiInstanceRef.current.stop();
      }
    };
  }, [initializeVapi]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Header */}
      <div className="relative z-10 p-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/live-coach")}
          className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Live Coach</span>
        </button>

        <div className="flex items-center space-x-4">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              connectionStatus === "active"
                ? "bg-green-500/20 text-green-400"
                : connectionStatus === "connected"
                ? "bg-blue-500/20 text-blue-400"
                : connectionStatus === "connecting"
                ? "bg-yellow-500/20 text-yellow-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {connectionStatus === "active"
              ? "● AI Coach Active"
              : connectionStatus === "connected"
              ? "● AI Coach Ready"
              : connectionStatus === "connecting"
              ? "● Connecting..."
              : "● Disconnected"}
          </div>

          {isVapiCallActive && (
            <div className="text-sm text-gray-300">
              {formatDuration(callDuration)}
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-6xl mx-auto w-full"
        >
          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            AI Voice Coach
          </h1>
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
            Have a natural conversation with your AI vocal coach
          </p>

          {/* Main Interface */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 max-w-4xl mx-auto">
            {/* Status Text */}
            <div className="mb-8">
              {vapiLoading && (
                <div className="text-yellow-400 font-medium">
                  <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Initializing AI Coach...
                </div>
              )}

              {!vapiLoading &&
                connectionStatus === "connected" &&
                !isVapiCallActive && (
                  <div className="text-green-400 font-medium">
                    AI Coach Ready - Click the microphone to start
                  </div>
                )}

              {!vapiLoading && connectionStatus === "active" && (
                <div className="space-y-2">
                  <div className="text-green-400 font-medium flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-2"></div>
                    {isSpeaking
                      ? "AI Coach is speaking..."
                      : "AI Coach is listening..."}
                  </div>
                  <div className="text-gray-300 text-lg">
                    🎤 Speak naturally - ask questions, get feedback, or request
                    exercises
                  </div>
                </div>
              )}

              {connectionStatus === "disconnected" && (
                <div className="text-red-400 font-medium">
                  Connection Failed - Please refresh and try again
                </div>
              )}
            </div>

            {/* Conversation Area */}
            {isVapiCallActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <div className="bg-gray-900/50 rounded-xl p-6 max-h-80 overflow-y-auto border border-gray-600/30">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Conversation
                  </h3>
                  {transcript.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      Conversation will appear here...
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {transcript.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex ${
                            msg.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              msg.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-gray-100"
                            }`}
                          >
                            <div className="text-xs opacity-75 mb-1">
                              {msg.role === "user" ? "You" : "AI Coach"}
                            </div>
                            <div className="text-sm">{msg.text}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Control Buttons */}
            <div className="flex items-center justify-center space-x-6">
              {!isVapiCallActive &&
                !vapiLoading &&
                connectionStatus === "connected" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startCall}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-full hover:shadow-lg transition-all flex items-center space-x-3"
                  >
                    <Mic size={24} />
                    <span>Start Voice Chat</span>
                  </motion.button>
                )}

              {isVapiCallActive && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={stopVapiCall}
                  className="px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-full hover:shadow-lg transition-all flex items-center space-x-3"
                >
                  <PhoneOff size={20} />
                  <span>End Call</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Features - Only show when call is not active */}
          {!isVapiCallActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-12"
            >
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Volume2 size={24} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Natural Conversation
                </h3>
                <p className="text-gray-400 text-sm">
                  Speak naturally with your AI coach. Ask questions, get
                  feedback, and receive personalized guidance.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Mic size={24} className="text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Real-time Feedback
                </h3>
                <p className="text-gray-400 text-sm">
                  Get instant vocal coaching advice and technique corrections
                  during your conversation.
                </p>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Settings size={24} className="text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Personalized Coaching
                </h3>
                <p className="text-gray-400 text-sm">
                  Receive coaching tailored to your voice type, skill level, and
                  specific goals.
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
