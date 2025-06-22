import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useVocalProfile } from '../context/VocalProfileContext';
import { Calendar, Clock, TrendingUp, Award, Music, Mic, ArrowRight } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { profile, loading } = useVocalProfile();
  const today = new Date();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-transition max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 md:mb-8">
        <div className="text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-white">Welcome back!</h2>
          <p className="text-gray-300 mt-1">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
      
      {/* Voice Recording Prompt for New Users */}
      {!loading && profile && !profile.voice_recorded && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="bg-gradient-to-r from-purple-accent/20 via-red-accent/20 to-blue-accent/20 rounded-xl border border-purple-accent/30 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center mb-2">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-primary flex items-center justify-center mr-3 md:mr-4">
                    <Mic size={20} className="text-white md:w-6 md:h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-white">Complete Your Voice Profile</h3>
                    <p className="text-sm md:text-base text-gray-300">
                      Record your voice to unlock personalized lessons and AI-powered feedback
                    </p>
                  </div>
                </div>
                <div className="ml-13 md:ml-16">
                  <ul className="text-xs md:text-sm text-gray-300 space-y-1">
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-purple-accent rounded-full mr-2"></span>
                      Analyze your vocal range and voice type
                    </li>
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-red-accent rounded-full mr-2"></span>
                      Get detailed voice metrics (pitch, vibrato, jitter, shimmer)
                    </li>
                    <li className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-accent rounded-full mr-2"></span>
                      Track your progress with detailed analytics
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <Link
                  to="/onboarding"
                  className="inline-flex items-center px-4 md:px-6 py-2 md:py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl text-sm md:text-base"
                >
                  Start Voice Setup
                  <ArrowRight size={16} className="ml-2 md:w-5 md:h-5" />
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Voice Profile Complete Indicator */}
      {!loading && profile && profile.voice_recorded && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 md:p-4">
            <div className="flex items-center">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-3">
                <Mic size={14} className="text-green-400 md:w-4 md:h-4" />
              </div>
              <div>
                <h4 className="font-medium text-green-400 text-sm md:text-base">Voice Profile Complete</h4>
                <p className="text-xs md:text-sm text-green-300/80">
                  Voice type: {profile.voice_type || 'Unknown'} • Range: {profile.lowestNote} - {profile.highestNote}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs md:text-sm">Today's Goal</p>
              <h3 className="text-xl md:text-2xl font-bold mt-1 text-white">15 minutes</h3>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-accent/20 flex items-center justify-center">
              <Clock size={16} className="text-white md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-3 md:mt-4">
            <div className="w-full bg-dark rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-accent to-purple-light h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <p className="text-gray-300 text-xs md:text-sm mt-2">9 minutes completed</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs md:text-sm">Practice Sessions</p>
              <h3 className="text-xl md:text-2xl font-bold mt-1 text-white">24</h3>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-accent/20 flex items-center justify-center">
              <Award size={16} className="text-white md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-3 md:mt-4">
            <p className="text-gray-300 text-xs md:text-sm">This month</p>
            <p className="text-gray-300 text-xs md:text-sm mt-1">+8 from last month</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs md:text-sm">Voice Type</p>
              <h3 className="text-lg md:text-2xl font-bold mt-1 text-white">{profile?.voice_type || 'Unknown'}</h3>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-accent/20 flex items-center justify-center">
              <Music size={16} className="text-white md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-3 md:mt-4">
            <p className="text-gray-300 text-xs md:text-sm">Range: {profile?.lowestNote} - {profile?.highestNote}</p>
            <p className="text-gray-300 text-xs md:text-sm mt-1">
              {profile?.mean_pitch ? `Mean pitch: ${profile.mean_pitch} Hz` : 'Complete voice analysis to see details'}
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs md:text-sm">Next Session</p>
              <h3 className="text-xl md:text-2xl font-bold mt-1 text-white">Today</h3>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-accent/20 flex items-center justify-center">
              <Calendar size={16} className="text-white md:w-5 md:h-5" />
            </div>
          </div>
          <div className="mt-3 md:mt-4">
            <p className="text-gray-300 text-xs md:text-sm">Voice Analysis Practice</p>
            <Link 
              to="/practice"
              className="mt-2 text-xs md:text-sm font-medium text-purple-accent hover:text-purple-light transition-colors"
            >
              Start Now
            </Link>
          </div>
        </motion.div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h3 className="text-base md:text-lg font-semibold text-white mb-4">Voice Metrics</h3>
          
          {profile?.voice_recorded ? (
            <div className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-dark-lighter rounded-lg p-2 md:p-3">
                  <div className="text-xs md:text-sm text-gray-300 mb-1">Mean Pitch</div>
                  <div className="text-sm md:text-lg font-bold text-purple-accent">
                    {profile.mean_pitch ? `${profile.mean_pitch} Hz` : 'N/A'}
                  </div>
                </div>
                
                <div className="bg-dark-lighter rounded-lg p-2 md:p-3">
                  <div className="text-xs md:text-sm text-gray-300 mb-1">Vibrato Rate</div>
                  <div className="text-sm md:text-lg font-bold text-purple-accent">
                    {profile.vibrato_rate ? `${profile.vibrato_rate} Hz` : 'N/A'}
                  </div>
                </div>
                
                <div className="bg-dark-lighter rounded-lg p-2 md:p-3">
                  <div className="text-xs md:text-sm text-gray-300 mb-1">Jitter</div>
                  <div className="text-sm md:text-lg font-bold text-purple-accent">
                    {profile.jitter || 'N/A'}
                  </div>
                </div>
                
                <div className="bg-dark-lighter rounded-lg p-2 md:p-3">
                  <div className="text-xs md:text-sm text-gray-300 mb-1">Shimmer</div>
                  <div className="text-sm md:text-lg font-bold text-purple-accent">
                    {profile.shimmer || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div className="bg-dark-lighter rounded-lg p-2 md:p-3">
                <div className="text-xs md:text-sm text-gray-300 mb-1">Dynamics</div>
                <div className="text-sm md:text-lg font-bold text-purple-accent">
                  {profile.dynamics || 'N/A'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <Mic size={40} className="mx-auto mb-4 text-gray-500 md:w-12 md:h-12" />
              <p className="text-gray-400 mb-4 text-sm md:text-base">Complete your voice analysis to see detailed metrics</p>
              <Link
                to="/onboarding"
                className="inline-flex items-center px-3 md:px-4 py-2 bg-purple-accent text-white rounded-lg hover:bg-purple-light transition-colors text-sm md:text-base"
              >
                Start Voice Analysis
              </Link>
            </div>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h3 className="text-base md:text-lg font-semibold text-white mb-4">Quick Actions</h3>
          
          <div className="space-y-3">
            <Link
              to="/practice"
              className="block p-3 md:p-4 bg-gradient-to-r from-purple-accent/10 to-blue-accent/10 rounded-lg border border-purple-accent/30 hover:border-purple-accent/50 transition-all"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-accent/20 flex items-center justify-center mr-3">
                  <Mic size={16} className="text-purple-accent md:w-5 md:h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-white text-sm md:text-base">Practice Session</h4>
                  <p className="text-xs md:text-sm text-gray-400">Record and analyze your voice</p>
                </div>
              </div>
            </Link>
            
            <Link
              to="/progress"
              className="block p-3 md:p-4 bg-gradient-to-r from-blue-accent/10 to-red-accent/10 rounded-lg border border-blue-accent/30 hover:border-blue-accent/50 transition-all"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-accent/20 flex items-center justify-center mr-3">
                  <TrendingUp size={16} className="text-blue-accent md:w-5 md:h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-white text-sm md:text-base">View Progress</h4>
                  <p className="text-xs md:text-sm text-gray-400">Track your improvement over time</p>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;