import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Brain, Loader2, User, Bot, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LettaService, { LettaMessage } from '../../services/LettaService';

interface UniversalLettaChatProps {
  isOpen: boolean;
  onClose: () => void;
  contextType: 'lessons' | 'progress' | 'practice' | 'general';
  contextData?: {
    date?: string;
    fetchAiReport?: any;
    lessonContext?: any;
    practiceContext?: any;
  };
  title?: string;
  description?: string;
}

const UniversalLettaChat: React.FC<UniversalLettaChatProps> = ({
  isOpen,
  onClose,
  contextType,
  contextData,
  title,
  description
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<LettaMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lettaService = LettaService.getInstance();

  // Helper function to format Letta's responses to be more natural and conversational
  const formatLettaResponse = (content: string): string => {
    // Remove markdown formatting like ** and ###
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
      .replace(/### (.*?):/g, '$1:') // Clean up section headers
      .replace(/## (.*?):/g, '$1:') // Clean up section headers
      .replace(/# (.*?):/g, '$1:') // Clean up section headers
      .replace(/\*\*/g, '') // Remove any remaining ** 
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up excessive line breaks
      .replace(/- /g, '• ') // Replace markdown bullets with bullet points
      .trim();

    // Make the response more conversational by replacing formal language patterns
    formatted = formatted
      .replace(/\*\*Areas for Improvement & Next Steps:\*\*/gi, "Here's what I think you should focus on next:")
      .replace(/\*\*Strengths:\*\*/gi, "You're doing really well with:")
      .replace(/\*\*In summary:\*\*/gi, "Overall,")
      .replace(/\*\*Next Steps:\*\*/gi, "Here's what I'd suggest:")
      .replace(/\*\*Recommendations:\*\*/gi, "My recommendations for you:")
      .replace(/Areas for Improvement & Next Steps:/gi, "Here's what I think you should focus on next:")
      .replace(/Strengths:/gi, "You're doing really well with:")
      .replace(/In summary:/gi, "Overall,")
      .replace(/Next Steps:/gi, "Here's what I'd suggest:")
      .replace(/Recommendations:/gi, "My recommendations for you:")
      // Replace technical phrases with more natural ones
      .replace(/\b(vocal folds are vibrating evenly)\b/gi, "your voice sounds really stable")
      .replace(/\b(pitch stability)\b/gi, "keeping your pitch steady")
      .replace(/\b(vibrato refinement)\b/gi, "working on your vibrato")
      .replace(/\b(consistency of airflow)\b/gi, "breathing steadily")
      .replace(/\b(breath management)\b/gi, "breathing technique")
      .replace(/\b(technical base)\b/gi, "foundation")
      .replace(/\b(trending upward)\b/gi, "getting better")
      .replace(/\b(your progress deserves to be celebrated)\b/gi, "you should be proud of your progress")
      // Add more natural transitions
      .replace(/Want a new routine or specific exercise ideas\?/gi, "Want me to suggest some specific exercises for you?")
      .replace(/Let me know what interests you!/gi, "Just let me know what you'd like to work on!");

    return formatted;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen && user?.id && !conversationStarted) {
      startConversation();
    } else if (!isOpen) {
      resetChat();
    }
  }, [isOpen, user?.id, conversationStarted]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const resetChat = () => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setConversationId(null);
    setConversationStarted(false);
    setSuggestions([]);
    lettaService.clearCurrentConversation();
  };

  const startConversation = async () => {
    if (!user || conversationStarted || isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await lettaService.startConversation(
        user.id,
        contextType,
        contextData
      );
      
      setConversationId(result.conversation_id);
      setConversationStarted(true);
      
      // Format the starter message to be more natural
      const formattedStarterMessage = formatLettaResponse(result.starter_message);
      setMessages([{
        role: 'assistant',
        content: formattedStarterMessage,
        timestamp: new Date().toISOString()
      }]);

      // Set contextual suggestions
      setSuggestions(getContextualSuggestions(contextType));
    } catch (error) {
      console.error('Error starting conversation:', error);
      setMessages([{
        role: 'assistant',
        content: 'Sorry, I am having trouble connecting right now. Please try again later.',
        timestamp: new Date().toISOString()
      }]);
      setConversationStarted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (input.trim() === '' || !conversationId || !user) return;
    
    const userMessage: LettaMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await lettaService.sendMessage(conversationId, user.id, input);
      
      // Format the response to be more natural and conversational
      const formattedContent = formatLettaResponse(response.message);
      const assistantMessage: LettaMessage = {
        role: 'assistant',
        content: formattedContent,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.suggestions) {
        setSuggestions(response.suggestions);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry about that! Something went wrong on my end. Could you try asking me again? I'm here to help!",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const getContextualSuggestions = (contextType: string): string[] => {
    switch (contextType) {
      case 'lessons':
        return [
          "Where should I start as a beginner?",
          "How can I sing more in tune?",
          "Help me with breathing while singing"
        ];
      case 'progress':
        return [
          "What does my data tell you about how I'm doing?",
          "What should I work on next?",
          "How has my voice improved recently?"
        ];
      case 'practice':
        return [
          "What should I practice today?",
          "Help me improve my technique",
          "How should I warm up before singing?"
        ];
      default:
        return [
          "How can I become a better singer?",
          "What exercises do you recommend?",
          "Tell me about my progress"
        ];
    }
  };

  const getContextualTitle = () => {
    if (title) return title;
    
    switch (contextType) {
      case 'lessons':
        return 'AI Lesson Advisor';
      case 'progress':
        return 'Your Personal Vocal Coach';
      case 'practice':
        return 'Practice Session Coach';
      default:
        return 'AI Vocal Coach';
    }
  };

  const getContextualDescription = () => {
    if (description) return description;
    
    switch (contextType) {
      case 'lessons':
        return 'Get personalized lesson recommendations and vocal technique guidance';
      case 'progress':
        return 'Discuss your vocal data, trends, and get targeted improvement advice';
      case 'practice':
        return 'Real-time coaching and exercise recommendations for your practice';
      default:
        return 'Your AI-powered vocal coaching assistant';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={onClose}
          onWheel={(e) => e.preventDefault()}
          style={{ overscrollBehavior: 'contain' }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 border border-purple-500/30 rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Brain size={20} className="mr-2 text-purple-400" />
                  {getContextualTitle()}
                </h3>
                <p className="text-sm text-gray-400 mt-1">{getContextualDescription()}</p>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-700/50 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            {/* Messages */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ overscrollBehavior: 'contain' }}
              onWheel={(e) => {
                const target = e.currentTarget;
                const atTop = target.scrollTop === 0;
                const atBottom = target.scrollTop >= target.scrollHeight - target.clientHeight;
                
                if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
                  e.preventDefault();
                }
              }}
              onTouchMove={(e) => {
                const target = e.currentTarget;
                const atTop = target.scrollTop === 0;
                const atBottom = target.scrollTop >= target.scrollHeight - target.clientHeight;
                
                // For touch events, we need to check the touch direction
                if (atTop || atBottom) {
                  e.stopPropagation();
                }
              }}
            >
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot size={18} className="text-purple-400" />
                    </div>
                  )}
                  <div className={`max-w-md rounded-xl p-3 text-white ${
                    msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-800'
                  }`}>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-blue-400" />
                    </div>
                  )}
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot size={18} className="text-purple-400" />
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3 flex items-center space-x-2">
                    <Loader2 size={16} className="animate-spin text-purple-400" />
                    <span className="text-gray-300">Thinking...</span>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="px-4 pb-2">
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="text-xs px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full hover:bg-purple-500/30 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-700/50">
              <div className="flex items-center bg-gray-800 rounded-lg pr-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                  placeholder="What would you like to talk about?"
                  className="w-full bg-transparent p-3 focus:outline-none text-white"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-500 disabled:bg-gray-600 transition-colors"
                >
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UniversalLettaChat;