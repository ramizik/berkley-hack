import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { PhoneCall, MessageCircle, Mic, Target, Clock, Volume2, Headphones, Settings } from 'lucide-react';

const LiveCoach: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-transition max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      {/* Page Header with Description */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">AI Vocal Coach</h1>
        <p className="text-gray-300 text-xl mb-4">Talk to your AI vocal coach</p>
        
        {/* Description */}
        <div className="text-gray-400 text-base leading-relaxed max-w-3xl">
          <p className="mb-2">Ask questions, get personalized advice, and receive guidance based on your progress.</p>
          <p className="mb-2">Ask Coach to correctly sing a song for you to hear proper vocal.</p>
          <p className="mb-2">Talk naturally, like you would with a real coach. Coach analyses your voice and is able to help improving it.</p>
        </div>
      </motion.div>

      {/* Main CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-12"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/voice-assistant')}
          className="px-8 py-4 bg-gradient-to-r from-purple-accent to-blue-accent text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center space-x-3 text-xl mx-auto"
        >
          <PhoneCall size={24} />
          <span>Talk to Coach LIVE</span>
        </motion.button>
      </motion.div>

      {/* What You Can Ask Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">What You Can Ask Your AI Coach</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="w-12 h-12 bg-blue-accent/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <MessageCircle size={24} className="text-blue-accent" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3 text-center">Vocal Technique Questions</h3>
            <ul className="text-gray-400 text-base space-y-2">
              <li>"How can I improve my breath control?"</li>
              <li>"What exercises help with pitch accuracy?"</li>
              <li>"How do I develop better vibrato?"</li>
            </ul>
          </div>

          <div className="card">
            <div className="w-12 h-12 bg-purple-accent/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Target size={24} className="text-purple-accent" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3 text-center">Performance Feedback</h3>
            <ul className="text-gray-400 text-base space-y-2">
              <li>"What was my progress on DD-MM-YYYY"</li>
              <li>"What should I focus on improving?"</li>
              <li>"How is my vocal progress?"</li>
            </ul>
          </div>

          <div className="card">
            <div className="w-12 h-12 bg-red-accent/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Mic size={24} className="text-red-accent" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3 text-center">Song & Style Guidance</h3>
            <ul className="text-gray-400 text-base space-y-2">
              <li>"What songs suit my voice type?"</li>
              <li>"Help me with this specific song"</li>
              <li>"Tips for different music genres"</li>
            </ul>
          </div>

          <div className="card">
            <div className="w-12 h-12 bg-blue-accent/20 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Clock size={24} className="text-blue-accent" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3 text-center">Goal Setting & Progress</h3>
            <ul className="text-gray-400 text-base space-y-2">
              <li>"Create a practice schedule for me"</li>
              <li>"Set vocal improvement goals"</li>
              <li>"Track my weekly progress"</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Tips for Best Experience</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Headphones size={28} className="text-blue-accent" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Audio Setup</h3>
            <p className="text-gray-400 text-base">Use headphones and find a quiet environment for the best voice chat experience.</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Volume2 size={28} className="text-purple-accent" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Speak Clearly</h3>
            <p className="text-gray-400 text-base">Speak naturally and clearly. Ask specific questions for more targeted coaching advice.</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-red-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings size={28} className="text-red-accent" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Be Patient</h3>
            <p className="text-gray-400 text-base">Allow a moment for the AI to process your questions and provide thoughtful responses.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LiveCoach;