import React from 'react';
import { motion } from 'framer-motion';
import { useVocalProfile } from '../../context/VocalProfileContext';
import { TrendingUp, TrendingDown } from 'lucide-react';

const VocalStats: React.FC = () => {
  const { profile } = useVocalProfile();
  
  const metrics = [
    { name: 'Pitch Accuracy', value: profile?.pitchAccuracy || 0, change: 5, trend: 'up' },
    { name: 'Breath Control', value: profile?.breathControl || 0, change: 2, trend: 'up' },
    { name: 'Rhythm Accuracy', value: profile?.rhythmAccuracy || 0, change: -1, trend: 'down' },
    { name: 'Tone Quality', value: profile?.toneQuality || 0, change: 3, trend: 'up' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Vocal Performance</h3>
        <div className="text-sm text-gray-400">Last 30 days</div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <motion.div 
            key={metric.name} 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="text-center"
          >
            <div className="text-sm text-gray-400 mb-1">{metric.name}</div>
            <div className="text-2xl font-bold text-white">{metric.value}%</div>
            <div className={`flex items-center justify-center text-sm ${
              metric.trend === 'up' ? 'text-green-400' : 'text-red-400'
            }`}>
              {metric.trend === 'up' ? (
                <TrendingUp size={14} className="mr-1" />
              ) : (
                <TrendingDown size={14} className="mr-1" />
              )}
              <span>{Math.abs(metric.change)}%</span>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="mt-6">
        <div className="w-full h-40 bg-dark-lighter rounded-lg border border-dark-accent relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full px-4">
              <svg viewBox="0 0 400 100" className="w-full">
                <path
                  d="M0,50 C50,30 100,70 150,40 C200,10 250,60 300,50 C350,40 400,20 400,50"
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M0,70 C50,60 100,80 150,60 C200,40 250,70 300,60 C350,50 400,40 400,70"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M0,60 C50,70 100,50 150,60 C200,70 250,50 300,40 C350,30 400,50 400,60"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
          <div className="absolute bottom-2 left-4 right-4 flex justify-between text-xs text-gray-500">
            <div>Aug 1</div>
            <div>Aug 15</div>
            <div>Aug 31</div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-center space-x-6">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-purple-accent mr-2"></div>
          <span className="text-sm text-gray-300">Pitch</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-accent mr-2"></div>
          <span className="text-sm text-gray-300">Breath</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-accent mr-2"></div>
          <span className="text-sm text-gray-300">Rhythm</span>
        </div>
      </div>
    </motion.div>
  );
};

export default VocalStats;