import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';

const PracticeReminder: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Practice Schedule</h3>
        <button className="text-sm text-purple-accent font-medium hover:text-purple-light transition-colors">
          Edit
        </button>
      </div>
      
      <div className="space-y-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-dark-accent rounded-lg p-4"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-accent/20 flex items-center justify-center mr-3">
              <Calendar size={18} className="text-purple-accent" />
            </div>
            <div>
              <h4 className="font-medium text-white">Today's Session</h4>
              <p className="text-sm text-gray-400">7:00 PM - 7:30 PM</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-300">
              <Clock size={14} className="mr-1" />
              <span>In 3 hours</span>
            </div>
            <button className="text-sm font-medium text-purple-accent hover:text-purple-light transition-colors">
              Reschedule
            </button>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="border border-dark-accent rounded-lg p-4"
        >
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-600/20 flex items-center justify-center mr-3">
              <Calendar size={18} className="text-gray-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">Tomorrow</h4>
              <p className="text-sm text-gray-400">8:00 AM - 8:30 AM</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-300">
              <Clock size={14} className="mr-1" />
              <span>Breath exercises</span>
            </div>
            <button className="text-sm font-medium text-purple-accent hover:text-purple-light transition-colors">
              Details
            </button>
          </div>
        </motion.div>
      </div>
      
      <div className="mt-6">
        <button className="w-full py-2 border border-purple-accent text-purple-accent font-medium rounded-lg hover:bg-purple-accent/10 transition-colors">
          Manage Schedule
        </button>
      </div>
    </motion.div>
  );
};

export default PracticeReminder;