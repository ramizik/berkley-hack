import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Star, ChevronRight } from 'lucide-react';
import { useVocalProfile } from '../../context/VocalProfileContext';


const RecommendedLessons: React.FC = () => {
  const { profile } = useVocalProfile();
  
  const lessons = [
    {
      id: 1,
      title: 'Breath Control Fundamentals',
      duration: 15,
      level: 'Beginner',
      focus: 'Breathing',
      image: 'https://images.pexels.com/photos/7383469/pexels-photo-7383469.jpeg?auto=compress&cs=tinysrgb&w=300',
      recommended: true,
    },
    {
      id: 2,
      title: 'Improving Pitch Accuracy',
      duration: 20,
      level: 'Intermediate',
      focus: 'Pitch',
      image: 'https://images.pexels.com/photos/4149256/pexels-photo-4149256.jpeg?auto=compress&cs=tinysrgb&w=300',
      recommended: profile?.pitchAccuracy && profile.pitchAccuracy < 75,
    },
    {
      id: 3,
      title: 'Vocal Range Extension',
      duration: 25,
      level: 'Advanced',
      focus: 'Range',
      image: 'https://images.pexels.com/photos/8412414/pexels-photo-8412414.jpeg?auto=compress&cs=tinysrgb&w=300',
      recommended: profile?.range !== 'unknown',
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Recommended Lessons</h3>
        <button className="text-sm text-purple-accent font-medium hover:text-purple-light transition-colors flex items-center">
          View All <ChevronRight size={16} />
        </button>
      </div>
      
      <div className="space-y-4">
        {lessons.map((lesson, index) => (
          <motion.div 
            key={lesson.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center p-3 border border-dark-accent rounded-lg hover:bg-dark-lighter hover:border-purple-accent/50 transition-all cursor-pointer"
          >
            <div className="w-16 h-16 rounded-md overflow-hidden mr-4 flex-shrink-0">
              <img 
                src={lesson.image} 
                alt={lesson.title} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-white">{lesson.title}</h4>
              <div className="flex items-center mt-1 text-sm text-gray-400">
                <Clock size={14} className="mr-1" />
                <span className="mr-3">{lesson.duration} min</span>
                <div className="bg-purple-accent/20 text-purple-light text-xs px-2 py-0.5 rounded">
                  {lesson.level}
                </div>
                <div className="ml-2 bg-blue-accent/20 text-blue-light text-xs px-2 py-0.5 rounded">
                  {lesson.focus}
                </div>
              </div>
            </div>
            <div>
              {lesson.recommended && (
                <div className="w-8 h-8 rounded-full bg-red-accent/20 flex items-center justify-center">
                  <Star size={16} className="text-red-accent" />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      
      <button className="mt-6 w-full py-3 bg-gradient-primary hover:opacity-90 text-white font-medium rounded-lg transition-all">
        Start Today's Lesson
      </button>
    </motion.div>
  );
};

export default RecommendedLessons;