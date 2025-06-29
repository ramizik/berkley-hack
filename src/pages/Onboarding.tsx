import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Music, Volume2, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useVocalProfile } from '../context/VocalProfileContext';
import { useAuth } from '../context/AuthContext';
import ParticleBackground from '../components/animations/ParticleBackground';
import { useVoiceAnalysis } from '../lib/useVoiceAnalysis';
import LyricsRequest from '../components/practice/LyricsRequest';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { profile, updateVocalProfile } = useVocalProfile();
  const { user } = useAuth();
  const [step, setStep] = React.useState(1);
  const totalSteps = 3;
  const [currentLyrics, setCurrentLyrics] = useState<string>('');

  // Use the custom hook for all voice analysis logic
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
    onAnalysisComplete: async (results) => {
      if (!user) return;
      await updateVocalProfile({
        mean_pitch: results.mean_pitch,
        vibrato_rate: results.vibrato_rate,
        jitter: results.jitter,
        shimmer: results.shimmer,
        dynamics: results.dynamics,
        voice_type: results.voice_type,
        lowestNote: results.lowest_note,
        highestNote: results.highest_note,
        voice_recorded: true,
      });
    },
  });

  useEffect(() => {
    if (recordingComplete && audioBlob && user) {
      const apiUrl = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080';
      analyzeVoice(user.id, apiUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingComplete, audioBlob, user]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-purple-accent flex items-center justify-center mx-auto">
              <Mic size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mt-6 mb-2 text-white">Welcome to VocalAI</h2>
            <p className="text-gray-300 mb-8 max-w-md mx-auto">
              Your personal AI singing coach. Let's analyze your voice to create a personalized training plan.
            </p>
            <button 
              onClick={handleNext}
              className="px-6 py-3 bg-purple-accent text-white font-medium rounded-lg hover:bg-purple-light transition-colors"
            >
              Get Started
            </button>
          </div>
        );
      
      case 2:
        return (
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-white">Record Your Voice</h2>
            <p className="text-gray-300 mb-4 max-w-lg mx-auto">
              We need to analyze your voice to determine your vocal characteristics. Please sing a few notes, scales, or hum a melody.
            </p>
            
            {/* Lyrics Generator - Wider container */}
            <div className="mb-6 max-w-2xl mx-auto">
              <LyricsRequest onLyricsGenerated={setCurrentLyrics} />
            </div>
            
            {error && (
              <div className="mb-6 p-3 bg-red-accent/10 border border-red-accent/30 rounded-lg flex items-start max-w-lg mx-auto">
                <AlertCircle size={16} className="text-red-accent mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-red-light text-sm">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-accent hover:text-red-light text-xs mt-1 underline"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
            
            <div className="w-64 h-64 rounded-full bg-gradient-to-r from-purple-accent to-purple-light flex items-center justify-center mx-auto mb-8 relative">
              {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-purple-accent animate-pulse"></div>
              )}
              
              <button 
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isAnalyzing || analysisComplete}
                className={`w-40 h-40 rounded-full ${
                  isRecording 
                    ? 'bg-red-accent animate-pulse' 
                    : recordingComplete 
                      ? 'bg-green-500' 
                      : 'bg-purple-accent hover:bg-purple-light'
                } flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {recordingComplete ? (
                  <CheckCircle size={40} />
                ) : (
                  <Mic size={40} />
                )}
              </button>
              
              {/* Fixed height container for sound visualization */}
              {isRecording && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                  {/* Fixed height container for sound bars */}
                  <div className="flex space-x-1 h-10 items-end">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i} 
                        className="w-1 bg-purple-accent soundwave-bar" 
                        style={{ 
                          height: `${Math.random() * 40 + 10}px`,
                          animationDelay: `${i * 0.1}s`,
                          maxHeight: '40px'
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Fixed height container for recording status */}
            <div className="h-32 flex flex-col items-center justify-start">
              {isRecording && (
                <div className="text-center mb-4">
                  <div className="text-lg font-bold text-purple-light">
                    {formatTime(recordingDuration)}
                  </div>
                  <div className="text-sm text-gray-400 mb-2">
                    Recording... (max 15 seconds)
                  </div>
                  {currentNote && (
                    <div className="text-lg font-bold text-purple-accent">
                      {displayedNote || currentNote} ({currentPitch} Hz)
                    </div>
                  )}
                </div>
              )}
              
              {isAnalyzing && (
                <div className="h-20 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-4 border-purple-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-purple-light font-medium">Analyzing your vocal profile...</p>
                  <p className="text-sm text-gray-400 mt-1">Processing with AI voice analysis</p>
                </div>
              )}
              
              {analysisComplete && (
                <div className="h-20 flex flex-col items-center justify-center">
                  <p className="text-green-400 font-medium flex items-center justify-center">
                    <CheckCircle size={20} className="mr-2" />
                    Voice analysis complete!
                  </p>
                  <button 
                    onClick={handleNext}
                    className="mt-4 px-6 py-3 bg-purple-accent text-white font-medium rounded-lg hover:bg-purple-light transition-colors"
                  >
                    Continue <ArrowRight size={16} className="ml-2 inline" />
                  </button>
                </div>
              )}
              
              {recordingComplete && !isAnalyzing && !analysisComplete && (
                <div className="h-20 flex flex-col items-center justify-center">
                  <p className="text-green-400 font-medium mb-4">Recording saved successfully!</p>
                  <button 
                    onClick={resetRecording}
                    className="px-4 py-2 border border-gray-500 text-gray-300 rounded-lg hover:bg-gray-500/10 transition-colors mr-3"
                  >
                    Record Again
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-white">Your Voice Analysis</h2>
            <p className="text-gray-300 mb-8 max-w-lg mx-auto">
              Based on our analysis, here are your vocal characteristics.
            </p>
            
            <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-600/30 max-w-xl mx-auto mb-8 backdrop-blur-md">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-accent flex items-center justify-center mr-4">
                  <Music size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-white">{profile?.lowestNote || 'C3'} - {profile?.highestNote || 'C5'}</h3>
                  <p className="text-gray-400">Your vocal range</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-left">
                  <p className="text-sm text-gray-400">Voice Type</p>
                  <div className="text-lg font-bold text-purple-accent">{profile?.voice_type || 'Unknown'}</div>
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-400">Mean Pitch</p>
                  <div className="text-lg font-bold text-purple-accent">{profile?.mean_pitch ? `${profile.mean_pitch} Hz` : '—'}</div>
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-400">Vibrato Rate</p>
                  <div className="text-lg font-bold text-purple-accent">{profile?.vibrato_rate ? `${profile.vibrato_rate} Hz` : '—'}</div>
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-400">Dynamics</p>
                  <div className="text-lg font-bold text-purple-accent">{profile?.dynamics || '—'}</div>
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-400">Jitter</p>
                  <div className="text-lg font-bold text-purple-accent">{profile?.jitter || '—'}</div>
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-400">Shimmer</p>
                  <div className="text-lg font-bold text-purple-accent">{profile?.shimmer || '—'}</div>
                </div>
              </div>
            </div>
            
            <button 
              onClick={onComplete}
              className="px-6 py-3 bg-purple-accent text-white font-medium rounded-lg hover:bg-purple-light transition-colors"
            >
              Start Practicing <Volume2 size={16} className="ml-2 inline" />
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <ParticleBackground />
      <div className="py-6 px-8 border-b border-slate-600/30 relative z-10">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-purple-accent flex items-center justify-center">
            <Mic className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold gradient-text">
            VocalAI
          </h1>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 overflow-y-auto">
        <div className="w-full max-w-4xl">
          {renderStep()}
          
          {step > 1 && (
            <div className="mt-8 flex justify-center space-x-2">
              {[...Array(totalSteps)].map((_, i) => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i + 1 === step 
                      ? 'bg-purple-accent' 
                      : i + 1 < step 
                        ? 'bg-purple-light' 
                        : 'bg-slate-600'
                  }`}
                ></div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <style>
        {`
          .soundwave-bar {
            animation: soundwave 0.5s infinite alternate;
          }
          
          @keyframes soundwave {
            0% { height: 10px; }
            100% { height: 40px; }
          }
        `}
      </style>
    </div>
  );
};

export default Onboarding;