import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, Volume2, Pause, Play, Save, RotateCcw, CheckCircle, AlertCircle, Music, Brain, MessageCircle } from 'lucide-react';
import { useVocalProfile } from '../context/VocalProfileContext';
import { useAuth } from '../context/AuthContext';
import { useVoiceAnalysis } from '../lib/useVoiceAnalysis';
import { supabase } from '../lib/supabase';
import LyricsRequest from '../components/practice/LyricsRequest';
import LettaChat from '../components/letta/LettaChat';

const Practice: React.FC = () => {
  const { profile } = useVocalProfile();
  const { user } = useAuth();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [currentLyrics, setCurrentLyrics] = useState<string>('');
  const [isLettaOpen, setIsLettaOpen] = useState(false);

  // Save practice session to vocal_analysis_history table
  const savePracticeSession = useCallback(async (results: any) => {
    if (!user || sessionSaved) return; // Prevent duplicate saves

    try {
      setSaveStatus('saving');
      setSaveError(null);
      setSessionSaved(true); // Mark as saved immediately to prevent duplicates

      const sessionData = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        username: profile?.username || user.email?.split('@')[0] || 'User',
        voice_recorded: true,
        voice_type: results.voice_type,
        lowest_note: results.lowest_note,
        highest_note: results.highest_note,
        mean_pitch: results.mean_pitch,
        vibrato_rate: results.vibrato_rate,
        jitter: results.jitter,
        shimmer: results.shimmer,
        dynamics: results.dynamics,
        user_id: user.id,
      };

      console.log('Saving practice session:', sessionData);

      const { error: insertError } = await supabase
        .from('vocal_analysis_history')
        .insert([sessionData]);

      if (insertError) {
        console.error('Error saving practice session:', insertError);
        setSessionSaved(false); // Reset on error
        throw insertError;
      }

      console.log('Practice session saved successfully');
      setSaveStatus('saved');
      
      // Reset save status after 3 seconds
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error('Failed to save practice session:', err);
      setSaveError(err instanceof Error ? err.message : 'Failed to save session');
      setSaveStatus('error');
      setSessionSaved(false); // Reset on error
    }
  }, [user, profile?.username, sessionSaved]);

  // Use the voice analysis hook with memoized callback
  const {
    isRecording,
    recordingComplete,
    isAnalyzing,
    analysisComplete,
    error,
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
    pitchSamples,
    sungNotes,
  } = useVoiceAnalysis({
    onAnalysisComplete: savePracticeSession,
  });

  // Auto-analyze when recording is complete (only once)
  useEffect(() => {
    if (recordingComplete && audioBlob && user && !isAnalyzing && !analysisComplete) {
      const apiUrl = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080';
      analyzeVoice(user.id, apiUrl);
    }
  }, [recordingComplete, audioBlob, user, isAnalyzing, analysisComplete]); // Removed analyzeVoice from deps

  // Custom start recording with 15-second limit
  const handleStartRecording = async () => {
    // Reset session saved state when starting new recording
    setSessionSaved(false);
    setSaveStatus('idle');
    setSaveError(null);
    
    await startRecording();
    
    // Auto-stop after 15 seconds
    setTimeout(() => {
      if (isRecording) {
        stopRecording();
      }
    }, 15000); // Updated to 15 seconds
  };

  // Custom reset function
  const handleResetRecording = () => {
    resetRecording();
    setSessionSaved(false);
    setSaveStatus('idle');
    setSaveError(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    return Math.max(0, 15 - recordingDuration); // Updated to 15 seconds
  };

  return (
    <>
      <style>{`
        @keyframes soundbar {
          0% { height: 10px; }
          100% { height: 60px; }
        }
      `}</style>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="page-transition max-w-7xl mx-auto"
      >
        {/* Header with Description */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Practice Session</h2>
          <p className="text-gray-300 text-xl mb-4">Practice your vocals in real time with pitch feedback</p>
          
          {/* Description */}
          <div className="text-gray-400 text-base leading-relaxed max-w-2xl">
            <p className="mb-2">Record your voice, visualize your pitch accuracy, and track timing.</p>
            <p className="mb-2">This is your daily workout zone to strengthen technique.</p>
            <p>Every session is saved and analyzed by our AI.</p>
          </div>
        </motion.div>

        {/* Lyrics Request Section */}
        <LyricsRequest onLyricsGenerated={setCurrentLyrics} />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-8"
        >
          {/* Display Current Lyrics if Available */}
          {currentLyrics && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-gradient-to-r from-green-accent/10 to-blue-accent/10 border border-green-accent/30 rounded-lg p-4"
            >
              <div className="flex items-center mb-3">
                <Music size={20} className="text-green-accent mr-2" />
                <h3 className="font-semibold text-green-accent text-lg">Practice Lyrics</h3>
              </div>
              <div className="bg-dark/50 rounded p-3 max-h-32 overflow-y-auto">
                <pre className="text-base text-gray-300 whitespace-pre-wrap font-mono">
                  {currentLyrics}
                </pre>
              </div>
            </motion.div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="flex flex-col items-center justify-center bg-gradient-to-br from-purple-accent/10 to-blue-accent/10 rounded-lg p-8 min-h-[400px] border border-purple-accent/20">
                
                {/* Error Display */}
                {error && (
                  <div className="mb-6 p-3 bg-red-accent/10 border border-red-accent/30 rounded-lg flex items-start max-w-md">
                    <AlertCircle size={16} className="text-red-accent mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-base text-red-light">{error}</div>
                  </div>
                )}

                {/* Recording Visualization Area */}
                <div className="w-full max-w-md mb-8">
                  {isRecording ? (
                    <div className="text-center">
                      {/* Sound bars visualization */}
                      <div className="flex items-center justify-center space-x-1 mb-6">
                        {[...Array(16)].map((_, i) => (
                          <div 
                            key={i} 
                            className="w-2 bg-purple-accent rounded-full" 
                            style={{ 
                              height: `${Math.random() * 60 + 10}px`,
                              animationDelay: `${i * 0.05}s`,
                              animation: 'soundbar 0.5s infinite alternate'
                            }}
                          ></div>
                        ))}
                      </div>
                      
                      {/* Current note display - STATIC, NO ANIMATION */}
                      {currentNote && (
                        <div className="mb-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
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
                          {formatTime(getTimeRemaining())} remaining
                        </div>
                      </div>
                      
                      {/* Notes sung display */}
                      {sungNotes.size > 0 && (
                        <div className="mt-4 text-sm text-gray-500">
                          Notes: {Array.from(sungNotes).join(', ')}
                        </div>
                      )}
                    </div>
                  ) : recordingComplete && analysisResult ? (
                    <div className="text-center">
                      {/* Waveform visualization */}
                      <div className="w-full h-24 mb-6">
                        <svg viewBox="0 0 400 100" className="w-full h-full">
                          <path
                            d="M0,50 C20,30 40,60 60,50 C80,40 100,70 120,60 C140,50 160,20 180,40 C200,60 220,70 240,40 C260,10 280,50 300,60 C320,70 340,30 360,50 C380,70 400,50 400,50"
                            fill="none"
                            stroke="#7c3aed"
                            strokeWidth="2"
                          />
                        </svg>
                      </div>
                      
                      <div className="text-green-400 font-medium mb-2 text-lg">
                        <CheckCircle size={20} className="inline mr-2" />
                        Analysis Complete!
                      </div>
                      <div className="text-base text-gray-400">
                        Duration: {formatTime(recordingDuration)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-gray-400 mb-4 text-lg">
                        {analysisComplete ? 'Analysis Complete!' : 'Press the microphone to start recording'}
                      </div>
                      <div className="text-base text-gray-300 mb-4 max-w-md">
                        Sing any song or a line that you would like during this practice session and our AI will analyze your performance. Groq will then provide you with personalized feedback and suggestions on how to improve your voice.
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Recording Controls */}
                <div className="flex items-center justify-center space-x-4">
                  {!isRecording && !recordingComplete && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStartRecording}
                      disabled={isAnalyzing}
                      className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Mic size={24} />
                    </motion.button>
                  )}
                  
                  {isRecording && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={stopRecording}
                      className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                    >
                      <div className="w-6 h-6 bg-white rounded-sm"></div>
                    </motion.button>
                  )}

                  {isAnalyzing && (
                    <div className="text-center">
                      <div className="w-8 h-8 border-4 border-purple-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <div className="text-purple-light font-medium text-lg">Analyzing...</div>
                      <div className="text-base text-gray-400">Processing with AI</div>
                    </div>
                  )}
                  
                  {recordingComplete && !isAnalyzing && (
                    <>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleResetRecording}
                        className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white hover:bg-gray-500 transition-colors"
                      >
                        <RotateCcw size={20} />
                      </motion.button>
                      {audioBlob && (
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-12 h-12 rounded-full bg-purple-accent flex items-center justify-center text-white hover:bg-purple-light transition-colors"
                        >
                          <Play size={20} />
                        </motion.button>
                      )}
                    </>
                  )}
                </div>

                {/* Save Status */}
                {saveStatus !== 'idle' && (
                  <div className="mt-6 flex items-center justify-center">
                    {saveStatus === 'saving' && (
                      <div className="flex items-center text-blue-accent">
                        <div className="w-4 h-4 border-2 border-blue-accent border-t-transparent rounded-full animate-spin mr-2"></div>
                        <span className="text-base">Saving session...</span>
                      </div>
                    )}
                    {saveStatus === 'saved' && (
                      <div className="flex items-center text-green-400">
                        <CheckCircle size={16} className="mr-2" />
                        <span className="text-base">Session saved successfully!</span>
                      </div>
                    )}
                    {saveStatus === 'error' && (
                      <div className="flex items-center text-red-accent">
                        <AlertCircle size={16} className="mr-2" />
                        <span className="text-base">Failed to save: {saveError}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Analysis Results Panel */}
            <div>
              <div className="bg-gradient-to-br from-purple-accent/10 to-blue-accent/10 rounded-lg p-6 h-[400px] overflow-y-auto border border-purple-accent/20">
                <h3 className="text-xl font-semibold text-white mb-4">
                  {analysisResult ? 'Voice Analysis Results' : 'Recording Tips'}
                </h3>
                
                {analysisResult ? (
                  <div className="space-y-4">
                    {/* Voice Metrics */}
                    <div className="grid grid-cols-1 gap-3">
                      <div className="bg-dark-lighter rounded-lg p-3">
                        <div className="text-base text-gray-300 mb-1">Mean Pitch</div>
                        <div className="text-xl font-bold text-purple-accent">
                          {analysisResult.mean_pitch ? `${analysisResult.mean_pitch} Hz` : 'N/A'}
                        </div>
                      </div>
                      
                      <div className="bg-dark-lighter rounded-lg p-3">
                        <div className="text-base text-gray-300 mb-1">Voice Type</div>
                        <div className="text-xl font-bold text-purple-accent">
                          {analysisResult.voice_type || 'Unknown'}
                        </div>
                      </div>
                      
                      <div className="bg-dark-lighter rounded-lg p-3">
                        <div className="text-base text-gray-300 mb-1">Vocal Range</div>
                        <div className="text-xl font-bold text-purple-accent">
                          {analysisResult.lowest_note} - {analysisResult.highest_note}
                        </div>
                      </div>
                      
                      <div className="bg-dark-lighter rounded-lg p-3">
                        <div className="text-base text-gray-300 mb-1">Vibrato Rate</div>
                        <div className="text-xl font-bold text-purple-accent">
                          {analysisResult.vibrato_rate ? `${analysisResult.vibrato_rate} Hz` : 'N/A'}
                        </div>
                      </div>
                      
                      <div className="bg-dark-lighter rounded-lg p-3">
                        <div className="text-base text-gray-300 mb-1">Dynamics</div>
                        <div className="text-xl font-bold text-purple-accent">
                          {analysisResult.dynamics || 'N/A'}
                        </div>
                      </div>
                      
                      <div className="bg-dark-lighter rounded-lg p-3">
                        <div className="text-base text-gray-300 mb-1">Jitter</div>
                        <div className="text-xl font-bold text-purple-accent">
                          {analysisResult.jitter || 'N/A'}
                        </div>
                      </div>
                      
                      <div className="bg-dark-lighter rounded-lg p-3">
                        <div className="text-base text-gray-300 mb-1">Shimmer</div>
                        <div className="text-xl font-bold text-purple-accent">
                          {analysisResult.shimmer || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ul className="text-base text-gray-300 space-y-3">
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-purple-accent/20 text-purple-light rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                        1
                      </span>
                      Find a quiet environment for accurate voice analysis.
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-purple-accent/20 text-purple-light rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                        2
                      </span>
                      Maintain consistent distance from your microphone.
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-purple-accent/20 text-purple-light rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                        3
                      </span>
                      Sing scales, sustained notes, or short melodies.
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-purple-accent/20 text-purple-light rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                        4
                      </span>
                      Use your full vocal range for better analysis.
                    </li>
                    <li className="flex items-start">
                      <span className="w-5 h-5 bg-purple-accent/20 text-purple-light rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                        5
                      </span>
                      Record for up to 15 seconds for best results.
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <LettaChat
          isOpen={isLettaOpen}
          onClose={() => setIsLettaOpen(false)}
          fetchAiReport={analysisResult}
          conversationType="exercise_guidance"
        />
      </motion.div>
    </>
  );
};

export default Practice;