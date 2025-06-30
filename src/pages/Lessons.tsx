import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, BarChart, BookOpen, Mic, MicOff, Brain, Sparkles, AlertCircle, X, CheckCircle, Target, Phone, PhoneOff, Play, Pause, Volume2, VolumeX, TrendingUp, Zap, RotateCcw, Music, Headphones, Activity, BarChart3, ArrowRight, Users, Radio, Square, AudioWaveform as Waveform, MessageCircle, Star } from 'lucide-react';
import { useVocalProfile } from '../context/VocalProfileContext';
import { useAuth } from '../context/AuthContext';
import { useVoiceAnalysis } from '../lib/useVoiceAnalysis';
import UniversalLettaChat from '../components/shared/UniversalLettaChat';

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

const Lessons: React.FC = () => {
  const { profile } = useVocalProfile();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Session management
  const [sessionActive, setSessionActive] = useState(false);
  const [sessionState, setSessionState] = useState<SessionState>({ phase: 'welcome' });
  const [sessionTime, setSessionTime] = useState(0);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  
  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  // UI feedback state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState<'success' | 'error' | 'info'>('info');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isLettaOpen, setIsLettaOpen] = useState(false);
  
  // Refs
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Add debug logging
  const addDebugInfo = useCallback((message: string) => {
    setDebugInfo(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(`[Lessons] ${message}`);
  }, []);

  // Handle voice analysis completion
  const handleVoiceAnalysisComplete = useCallback(async (results: any) => {
    if (!user || !sessionActive) {
      addDebugInfo('Analysis complete but session not active or user not found');
      return;
    }

    addDebugInfo(`Voice analysis completed: ${JSON.stringify(results).substring(0, 100)}...`);

    // Update session state with analysis results
    setSessionState(prev => ({
      ...prev,
      phase: 'feedback',
      analysisResult: results,
      feedback: `Voice analysis complete! Your voice type is ${results.voice_type} with a mean pitch of ${results.mean_pitch} Hz. Based on your vocal characteristics, here are personalized recommendations for improving your ${currentLesson?.category} skills.`,
    }));
  }, [user, sessionActive, addDebugInfo, currentLesson]);

  const {
    isRecording,
    isAnalyzing,
    startRecording,
    stopRecording,
    recordingDuration,
    analysisResult,
    error: analysisError,
    recordingComplete,
    audioBlob,
    analyzeVoice,
    resetRecording,
    currentNote,
    displayedNote,
    currentPitch,
    analysisComplete
  } = useVoiceAnalysis({ onAnalysisComplete: handleVoiceAnalysisComplete });

  // Automatically trigger analysis when recording is complete
  useEffect(() => {
    if (recordingComplete && audioBlob && !isAnalyzing && !analysisComplete) {
      addDebugInfo('Recording complete, starting analysis.');
      if (user) {
        const apiUrl = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080';
        analyzeVoice(user.id, apiUrl);
      }
    }
  }, [recordingComplete, audioBlob, user, analyzeVoice, addDebugInfo, isAnalyzing, analysisComplete]);

  useEffect(() => {
    if (analysisError) {
      showNotificationMessage('error', analysisError);
    }
  }, [analysisError]);

  // Show notification helper
  const showNotificationMessage = (type: 'success' | 'error' | 'info', message: string) => {
    setNotificationType(type);
    setNotificationMessage(message);
    setShowNotification(true);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
  };

  // Start coaching session
  const startCoachingSession = async (lesson: any) => {
    if (!user) {
      showNotificationMessage('error', 'Please log in to start a coaching session');
      return;
    }

    try {
      setCurrentLesson(lesson);
      setSessionActive(true);
      setSessionTime(0);
      setSessionState({
        phase: 'welcome'
      });
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(prevTime => prevTime + 1);
      }, 1000);
      addDebugInfo('Coaching session started.');

    } catch (error) {
      console.error('Error starting coaching session:', error);
    }
  };

  // Stop coaching session
  const stopCoachingSession = () => {
    addDebugInfo('Stopping coaching session.');
    setSessionActive(false);
    setCurrentLesson(null);
    setSessionState({ phase: 'welcome' });
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
    if (isRecording) {
      stopRecording();
    }
    resetRecording();
  };

  // Start recording for current phase
  const handleStartRecording = async () => {
    try {
      addDebugInfo('Starting voice recording...');
      resetRecording();
      await startRecording();
      addDebugInfo('Voice recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      addDebugInfo(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      showNotificationMessage('error', 'Failed to start recording');
    }
  };

  // Complete session
  const completeSession = () => {
    // Move to complete phase instead of stopping session immediately
    setSessionState(prev => ({ ...prev, phase: 'complete' }));
  };

  // Handle regular lesson start
  const handleStartLesson = (lesson: any) => {
    startCoachingSession(lesson);
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, []);
  
  const categories = [
    { id: 'all', name: 'All Lessons' },
    { id: 'pitch', name: 'Pitch Training' },
    { id: 'breath', name: 'Breath Control' },
    { id: 'rhythm', name: 'Rhythm' },
    { id: 'range', name: 'Vocal Range' },
    { id: 'tone', name: 'Tone Quality' },
  ];
  
  const lessons = [
    {
      id: 1,
      title: 'Breath Control Fundamentals',
      description: 'Learn the basics of diaphragmatic breathing and breath control techniques.',
      category: 'breath',
      level: 'beginner',
      duration: 15,
      rating: 4.8,
      completionRate: 0,
      image: 'https://i.imgur.com/QEPvpF1.png?auto=compress&cs=tinysrgb&w=600'
    },
    {
      id: 2,
      title: 'Pitch Accuracy Training',
      description: 'Improve your ability to hit and maintain correct pitch with these exercises.',
      category: 'pitch',
      level: 'intermediate',
      duration: 20,
      rating: 4.6,
      completionRate: 0,
      image: 'https://i.imgur.com/2k0v9Vs.png?auto=compress&cs=tinysrgb&w=600'
    },
    {
      id: 3,
      title: 'Rhythm and Timing Practice',
      description: 'Master rhythmic precision and timing with specialized vocal exercises.',
      category: 'rhythm',
      level: 'beginner',
      duration: 18,
      rating: 4.5,
      completionRate: 0,
      image: 'https://i.imgur.com/hXRaNKh.png?auto=compress&cs=tinysrgb&w=600'
    },
    {
      id: 4,
      title: 'Expanding Your Vocal Range',
      description: 'Safe techniques to gradually extend your vocal range without strain.',
      category: 'range',
      level: 'intermediate',
      duration: 25,
      rating: 4.9,
      completionRate: 0,
      image: 'https://i.imgur.com/ENUMjXi.png?auto=compress&cs=tinysrgb&w=600'
    },
    {
      id: 5,
      title: 'Tone Quality Enhancement',
      description: 'Develop rich, resonant tone quality through proper vocal placement.',
      category: 'tone',
      level: 'intermediate',
      duration: 22,
      rating: 4.7,
      completionRate: 0,
      image: 'https://i.imgur.com/7o4WS00.png?auto=compress&cs=tinysrgb&w=600'
    },
    {
      id: 6,
      title: 'Advanced Pitch Control',
      description: 'Master complex pitch variations and vocal agility exercises.',
      category: 'pitch',
      level: 'advanced',
      duration: 30,
      rating: 4.9,
      completionRate: 0,
      image: 'https://i.imgur.com/mIgYYwA.png?auto=compress&cs=tinysrgb&w=600'
    },
  ];
  
  const filteredLessons = lessons.filter(lesson => {
    const categoryMatch = selectedCategory === 'all' || lesson.category === selectedCategory;
    return categoryMatch;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-transition max-w-7xl mx-auto"
    >
      {/* Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
              notificationType === 'success' ? 'bg-green-600 text-white' :
              notificationType === 'error' ? 'bg-red-600 text-white' :
              'bg-blue-600 text-white'
            }`}
          >
            <div className="flex items-center space-x-2">
              {notificationType === 'success' && <CheckCircle size={20} />}
              {notificationType === 'error' && <AlertCircle size={20} />}
              {notificationType === 'info' && <Activity size={20} />}
              <span className="font-medium text-base">{notificationMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Interface */}
      <AnimatePresence>
        {sessionActive && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-900/95 to-blue-900/95 backdrop-blur-sm border-b border-purple-accent/30"
          >
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-white font-medium text-lg">AI COACHING SESSION</span>
                  </div>
                  <div className="text-white font-mono text-xl">{formatTime(sessionTime)}</div>
                  {currentLesson && (
                    <div className="text-purple-accent font-medium text-lg">{currentLesson.title}</div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={stopCoachingSession}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-base"
                  >
                    <X size={16} />
                    <span>End Session</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Content */}
      <AnimatePresence>
        {sessionActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-dark border border-purple-accent/30 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            >
              <div className="text-center">
                <AnimatePresence mode="wait">
                  {/* Welcome Phase */}
                  {sessionState.phase === 'welcome' && (
                    <motion.div
                      key="welcome"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <div className="mb-8">
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
                          Welcome to {currentLesson?.title}
                        </h3>
                        <h4 className="text-xl md:text-2xl text-purple-accent mb-4">
                          {currentLesson?.category?.charAt(0).toUpperCase() + currentLesson?.category?.slice(1)} Training
                        </h4>
                      </div>

                      {/* Lesson Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                        <div className="bg-dark-lighter border border-dark-accent rounded-lg p-4">
                          <div className="text-purple-accent font-medium text-base mb-1">Category</div>
                          <div className="text-white font-semibold text-lg">
                            {currentLesson?.category?.charAt(0).toUpperCase() + currentLesson?.category?.slice(1)}
                          </div>
                        </div>
                        <div className="bg-dark-lighter border border-dark-accent rounded-lg p-4">
                          <div className="text-purple-accent font-medium text-base mb-1">Level</div>
                          <div className="text-white font-semibold text-lg">
                            {currentLesson?.level?.charAt(0).toUpperCase() + currentLesson?.level?.slice(1)}
                          </div>
                        </div>
                        <div className="bg-dark-lighter border border-dark-accent rounded-lg p-4">
                          <div className="text-purple-accent font-medium text-base mb-1">Duration</div>
                          <div className="text-white font-semibold text-lg">{currentLesson?.duration} min</div>
                        </div>
                      </div>

                      {/* What You'll Learn */}
                      <div className="bg-dark-lighter border border-dark-accent rounded-lg p-6 max-w-2xl mx-auto">
                        <h5 className="text-white font-medium mb-3 flex items-center text-lg">
                          <Target size={16} className="mr-2 text-purple-accent" />
                          What You'll Learn
                        </h5>
                        <p className="text-gray-300 text-base leading-relaxed mb-4">
                          {currentLesson?.description}
                        </p>
                        <div className="text-base text-gray-400">
                          <strong>Focus Areas:</strong>
                          <ul className="mt-2 space-y-1">
                            {currentLesson?.category === 'pitch' && (
                              <>
                                <li>• Pitch accuracy and control</li>
                                <li>• Note recognition and matching</li>
                                <li>• Vocal intonation improvement</li>
                              </>
                            )}
                            {currentLesson?.category === 'breath' && (
                              <>
                                <li>• Diaphragmatic breathing techniques</li>
                                <li>• Breath support and control</li>
                                <li>• Sustained note practice</li>
                              </>
                            )}
                            {currentLesson?.category === 'rhythm' && (
                              <>
                                <li>• Tempo consistency</li>
                                <li>• Rhythmic pattern recognition</li>
                                <li>• Musical timing improvement</li>
                              </>
                            )}
                            {currentLesson?.category === 'range' && (
                              <>
                                <li>• Safe range expansion</li>
                                <li>• Register transitions</li>
                                <li>• Vocal flexibility development</li>
                              </>
                            )}
                            {currentLesson?.category === 'tone' && (
                              <>
                                <li>• Resonance and placement</li>
                                <li>• Tone quality improvement</li>
                                <li>• Vocal color development</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>

                      {/* Start Recording Button */}
                      <div className="flex flex-col items-center space-y-4">
                        <button
                          onClick={() => setSessionState(prev => ({ ...prev, phase: 'recording' }))}
                          className="px-8 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-all flex items-center space-x-2 text-lg"
                        >
                          <Mic size={20} />
                          <span>Start Recording</span>
                        </button>
                        <p className="text-gray-400 text-base max-w-md text-center">
                          When you're ready, click the button above to start recording your voice for analysis.
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Recording Phase */}
                  {sessionState.phase === 'recording' && (
                    <motion.div
                      key="recording"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <div className="mb-8">
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">Record Your Voice</h3>
                        <h4 className="text-xl md:text-2xl text-red-accent mb-4">Sing Any Melody or Scale</h4>
                        <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed text-base md:text-lg">
                          Record yourself singing any comfortable melody, scale, or vocal exercise. This will help AI analyze your voice.
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
                              {/* Current note display - NO ANIMATION */}
                              {currentNote && (
                                <div className="mb-4">
                                  <div className="text-4xl md:text-5xl font-bold text-purple-accent mb-1">
                                    {displayedNote || currentNote}
                                  </div>
                                  <div className="text-base text-gray-400">
                                    {currentPitch} Hz
                                  </div>
                                </div>
                              )}
                              
                              {/* Recording timer */}
                              <div className="text-center">
                                <div className="text-3xl font-bold text-white mb-1">
                                  {formatTime(recordingDuration)}
                                </div>
                                <div className="text-base text-gray-400">
                                  {formatTime(Math.max(0, 15 - recordingDuration))} remaining
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {recordingComplete && (
                            <div className="text-green-400 font-medium text-xl">
                              <CheckCircle size={24} className="inline mr-2" />
                              Recording Complete!
                            </div>
                          )}
                          
                          {isAnalyzing && (
                            <div className="space-y-2">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                              <div className="text-blue-400 font-medium text-lg">Analyzing your voice...</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Feedback Phase */}
                  {sessionState.phase === 'feedback' && (
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      <div className="mb-8">
                        <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">Your AI Coaching Results</h3>
                        <h4 className="text-xl md:text-2xl text-green-400 mb-4">Personalized Feedback & Exercise</h4>
                        <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed text-base md:text-lg">
                          Based on your voice analysis, here's your personalized feedback and recommended exercise.
                        </p>
                      </div>

                      {/* AI Feedback */}
                      {sessionState.feedback && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-8 max-w-3xl mx-auto">
                          <div className="flex items-center justify-between mb-4">
                            <h5 className="font-semibold text-blue-400 flex items-center text-lg">
                              <Brain size={20} className="mr-2" />
                              AI Analysis Results
                            </h5>
                          </div>
                          <p className="text-white text-center leading-relaxed text-base">{sessionState.feedback}</p>
                        </div>
                      )}

                      {/* Voice Analysis Results */}
                      {sessionState.analysisResult && (
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-6 max-w-3xl mx-auto">
                          <h5 className="font-semibold text-purple-accent mb-4 flex items-center text-lg">
                            <BarChart3 size={20} className="mr-2" />
                            Voice Metrics
                          </h5>
                          <div className="grid grid-cols-2 gap-4 text-base">
                            <div className="bg-dark-lighter rounded-lg p-3">
                              <div className="text-gray-400 mb-1">Voice Type</div>
                              <div className="text-white font-semibold text-lg">{sessionState.analysisResult.voice_type}</div>
                            </div>
                            <div className="bg-dark-lighter rounded-lg p-3">
                              <div className="text-gray-400 mb-1">Mean Pitch</div>
                              <div className="text-white font-semibold text-lg">{sessionState.analysisResult.mean_pitch} Hz</div>
                            </div>
                            <div className="bg-dark-lighter rounded-lg p-3">
                              <div className="text-gray-400 mb-1">Vocal Range</div>
                              <div className="text-white font-semibold text-lg">{sessionState.analysisResult.lowest_note} - {sessionState.analysisResult.highest_note}</div>
                            </div>
                            <div className="bg-dark-lighter rounded-lg p-3">
                              <div className="text-gray-400 mb-1">Vibrato Rate</div>
                              <div className="text-white font-semibold text-lg">{sessionState.analysisResult.vibrato_rate} Hz</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Complete Session Button */}
                      <div className="flex flex-col items-center space-y-4">
                        <button
                          onClick={completeSession}
                          className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 text-lg"
                        >
                          <CheckCircle size={20} />
                          <span>Complete Session</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Completion Phase */}
                  {sessionState.phase === 'complete' && (
                    <motion.div
                      key="complete"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="space-y-8"
                    >
                      {/* Completion Card */}
                      <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-xl p-8 max-w-3xl mx-auto">
                        <div className="text-center mb-6">
                          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star size={32} className="text-green-400" />
                          </div>
                          <h3 className="text-3xl font-bold text-white mb-4">Nice job completing this lesson!</h3>
                        </div>
                        
                        <div className="text-gray-300 leading-relaxed space-y-4 text-center text-base">
                          <p>Practice makes patterns — and repeating this lesson will help you build stronger habits.</p>
                          <p>The AI will keep tracking your vocal development every time you return.</p>
                          <p>Think of it like brushing up on a language — every round makes your voice more confident.</p>
                          <p className="font-medium text-white text-lg">Stay consistent, stay curious, and let your voice evolve naturally.</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                        <button
                          onClick={() => {
                            // Restart the same lesson
                            setSessionState({ phase: 'welcome' });
                            resetRecording();
                          }}
                          className="px-6 py-3 bg-purple-accent hover:bg-purple-light text-white font-medium rounded-lg transition-colors flex items-center space-x-2 text-base"
                        >
                          <RotateCcw size={20} />
                          <span>Practice Again</span>
                        </button>
                        
                        <button
                          onClick={stopCoachingSession}
                          className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors flex items-center space-x-2 text-base"
                        >
                          <CheckCircle size={20} />
                          <span>Finish & Return</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Voice Lessons</h1>
            <p className="text-gray-300 text-xl mb-4">Master your voice with personalized AI coaching</p>
            
            {/* Description */}
            <div className="text-gray-400 text-base leading-relaxed max-w-2xl">
              <p className="mb-2">Learn the fundamentals of singing through short, guided lessons.</p>
              <p className="mb-2">Each lesson focuses on a specific skill — pitch, breath control, tone, or resonance.</p>
              <p className="mb-2">Exercises are beginner-friendly and designed for daily practice.</p>
              <p>Perfect for building a strong vocal foundation.</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsLettaOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-base font-medium"
            >
              <Brain size={16} />
              AI Lesson Advisor
            </button>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full mr-2 text-base font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-gradient-primary text-white'
                    : 'bg-dark-lighter text-gray-300 hover:bg-dark-accent hover:text-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredLessons.map((lesson, index) => (
            <motion.div 
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:border-purple-accent/50 transition-all cursor-pointer group"
            >
              <div className="h-40 overflow-hidden rounded-lg mb-4">
                <img 
                  src={lesson.image} 
                  alt={lesson.title}
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm px-2 py-1 rounded-full bg-gray-600/20 text-white">
                  {lesson.category.charAt(0).toUpperCase() + lesson.category.slice(1)}
                </div>
                <div className="text-sm px-2 py-1 rounded-full bg-gray-600/20 text-white">
                  {lesson.level.charAt(0).toUpperCase() + lesson.level.slice(1)}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-2 text-white">{lesson.title}</h3>
              <p className="text-gray-300 text-base mb-4 line-clamp-2">{lesson.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center text-gray-400 text-base">
                  <Clock size={14} className="mr-1" />
                  <span>{lesson.duration} min</span>
                </div>
                <div className="flex items-center text-yellow-400 text-base">
                  <span className="mr-1">★</span>
                  <span>{lesson.rating}</span>
                </div>
              </div>
              
              {/* Lesson Action Buttons */}
              <div className="space-y-2">
                {/* AI Voice Coach Button */}
                <button 
                  onClick={() => startCoachingSession(lesson)}
                  disabled={sessionActive}
                  className={`w-full py-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 text-base ${
                    sessionActive
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-gradient-primary text-white hover:opacity-90'
                  }`}
                >
                  {sessionActive ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>Session Active</span>
                    </>
                  ) : (
                    <>
                      <Mic size={16} />
                      <span>Start AI Lesson</span>
                      <Sparkles size={16} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <UniversalLettaChat
          isOpen={isLettaOpen}
          onClose={() => setIsLettaOpen(false)}
          contextType="lessons"
          contextData={{
            lessonContext: {
              selectedCategory,
              availableLessons: filteredLessons
            }
          }}
          title="AI Lesson Advisor"
          description="Get personalized lesson recommendations and vocal technique guidance"
        />
      </div>
    </motion.div>
  );
};

export default Lessons;