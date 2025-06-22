import React, { useState, useEffect } from 'react';
import { Brain, MessageCircle } from 'lucide-react';
import LettaChat from '../letta/LettaChat';

interface LettaIntegrationProps {
  context: 'dashboard' | 'practice' | 'progress' | 'lessons';
  fetchAiReport?: any;
  triggerText?: string;
  className?: string;
}

const LettaIntegration: React.FC<LettaIntegrationProps> = ({ 
  context, 
  fetchAiReport, 
  triggerText = "Ask Your Coach", 
  className = "" 
}) => {
  const [isLettaOpen, setIsLettaOpen] = useState(false);

  const getConversationType = (context: string) => {
    switch (context) {
      case 'dashboard': return 'daily_feedback';
      case 'practice': return 'exercise_guidance';
      case 'progress': return 'progress_review';
      case 'lessons': return 'exercise_guidance';
      default: return 'daily_feedback';
    }
  };

  const getContextualMessage = (context: string) => {
    switch (context) {
      case 'dashboard': 
        return "Get personalized insights about your vocal journey";
      case 'practice':
        return "Real-time coaching during your practice session";
      case 'progress':
        return "Deep dive into your vocal development patterns";
      case 'lessons':
        return "Personalized lesson recommendations";
      default:
        return "Chat with your AI vocal coach";
    }
  };

  return (
    <>
      <button
        onClick={() => setIsLettaOpen(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg transition-colors ${className}`}
      >
        <Brain size={20} />
        {triggerText}
      </button>

      <LettaChat
        isOpen={isLettaOpen}
        onClose={() => setIsLettaOpen(false)}
        fetchAiReport={fetchAiReport}
        conversationType={getConversationType(context)}
      />
    </>
  );
};

export default LettaIntegration; 