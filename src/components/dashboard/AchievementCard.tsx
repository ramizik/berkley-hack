import React from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, Star, Sparkles } from 'lucide-react';

interface AchievementCardProps {
  onClose?: () => void;
}

const AchievementCard: React.FC<AchievementCardProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
      className="relative overflow-hidden"
    >
      <div className="bg-gradient-to-r from-purple-accent/20 via-pink-600/20 to-blue-accent/20 rounded-xl border border-purple-accent/30 p-4 md:p-6">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-600/10 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-primary flex items-center justify-center mr-4 shadow-lg">
                <Award size={24} className="text-white md:w-7 md:h-7" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold text-white flex items-center">
                  Vocal Progress Detected!
                  <Sparkles size={20} className="ml-2 text-yellow-400" />
                </h3>
                <p className="text-base md:text-lg text-gray-300 mt-1">
                  Your AI coach has noticed improvement
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center bg-dark-lighter/50 rounded-lg p-3">
              <TrendingUp size={20} className="text-green-400 mr-3" />
              <p className="text-white">
                <span className="font-semibold">Consistency Achieved:</span> You've been practicing regularly!
              </p>
            </div>
            
            <div className="flex items-center bg-dark-lighter/50 rounded-lg p-3">
              <Star size={20} className="text-yellow-400 mr-3" />
              <p className="text-white">
                <span className="font-semibold">Technical Improvement:</span> Your vocal metrics are improving!
              </p>
            </div>
            
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-accent/10 to-blue-accent/10 rounded-lg border border-purple-accent/20">
              <p className="text-gray-300 text-base italic">
                "Great work! Your dedication to practice is showing in your vocal performance. 
                Keep up this momentum - you're on the path to mastering your voice!"
              </p>
              <p className="text-sm text-purple-accent mt-2">- Your AI Vocal Coach</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AchievementCard; 