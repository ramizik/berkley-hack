import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, Volume2, Pause, Play, Save, RotateCcw, CheckCircle, AlertCircle, Music, Brain, MessageCircle, MessageSquare, Loader2 } from 'lucide-react';
import { useVocalProfile } from '../context/VocalProfileContext';
import { useAuth } from '../context/AuthContext';
import { useVoiceAnalysis } from '../lib/useVoiceAnalysis';
import { supabase } from '../lib/supabase';
import LyricsRequest from '../components/practice/LyricsRequest';
import LettaChat from '../components/letta/LettaChat';
import FeedbackModal from '../components/practice/FeedbackModal';

const Practice: React.FC = () => {
  // ... [rest of the component code remains the same until the return statement]

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
        {/* ... [rest of the JSX remains the same] */}
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsFeedbackModalOpen(true)}
                            className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-400 transition-colors"
                          >
                            <Brain size={20} />
                          </motion.button>
                        )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Practice History */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Recent Practice Sessions</h3>
          
          <div className="bg-dark-lighter rounded-lg border border-dark-accent p-4">
            <div className="text-center text-gray-400 py-8">
              <Mic size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No practice sessions yet</p>
              <p className="text-sm">Complete your first practice session to see your progress here</p>
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

      {/* RENDER THE MODAL HERE */}
      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        feedback={aiFeedback}
      />
    </>
  );
};

export default Practice;