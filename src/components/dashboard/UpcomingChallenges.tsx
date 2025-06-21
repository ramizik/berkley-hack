import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users } from 'lucide-react';

const UpcomingChallenges: React.FC = () => {
  const challenges = [
    {
      id: 1,
      title: '7-Day Vocal Warmup',
      participants: 245,
      days: 2,
      prize: 'Badge',
      type: 'community',
    },
    {
      id: 2,
      title: 'Perfect Pitch Challenge',
      participants: 128,
      days: 5,
      prize: 'Certificate',
      type: 'contest',
    },
  ];

 return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Upcoming Challenges</h3>
        <button className="text-sm text-purple-accent font-medium hover:text-purple-light transition-colors">
          Browse All
        </button>
      </div>
      
      <div className="space-y-4">
        {challenges.map((challenge, index) => (
          <motion.div 
            key={challenge.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="border border-dark-accent rounded-lg p-4 hover:border-red-accent/50 hover:bg-red-accent/5 transition-all cursor-pointer"
          >
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                challenge.type === 'contest' 
                  ? 'bg-red-accent/20 text-red-accent'
                  : 'bg-blue-accent/20 text-blue-accent'
              }`}>
                {challenge.type === 'contest' ? (
                  <Trophy size={18} />
                ) : (
                  <Users size={18} />
                )}
              </div>
              <div>
                <h4 className="font-medium text-white">{challenge.title}</h4>
                <div className="flex items-center mt-1">
                  <span className="text-xs text-gray-400 mr-2">
                    Starts in {challenge.days} days
                  </span>
                  <div className={`text-xs px-2 py-0.5 rounded ${
                    challenge.type === 'contest'
                      ? 'bg-red-accent/20 text-red-light'
                      : 'bg-blue-accent/20 text-blue-light'
                  }`}>
                    {challenge.type === 'contest' ? 'Contest' : 'Community'}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-300">
                <Users size={14} className="mr-1" />
                <span>{challenge.participants} joined</span>
              </div>
              <div className="text-sm font-medium text-white">
                {challenge.prize}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6">
        <button className="w-full py-2 border border-red-accent text-red-accent font-medium rounded-lg hover:bg-red-accent/10 transition-colors">
          Join a Challenge
        </button>
      </div>
    </motion.div>
  );
};

export default UpcomingChallenges;
