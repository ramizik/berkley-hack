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
      setMessages([{
        role: 'assistant',
        content: result.starter_message,
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
      
      const assistantMessage: LettaMessage = {
        role: 'assistant',
        content: response.message,
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
        content: 'My apologies, I encountered an error. Could you try asking again?',
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
          "What lesson should I start with as a beginner?",
          "How do I improve my pitch accuracy?",
          "What exercises help with breath control?"
        ];
      case 'progress':
        return [
          "What does my vocal data tell you about my progress?",
          "What should I focus on improving next?",
          "How has my voice changed over time?"
        ];
      case 'practice':
        return [
          "What exercises should I do today?",
          "How can I improve my vocal technique?",
          "What's the best way to warm up my voice?"
        ];
      default:
        return [
          "How can I improve my singing?",
          "What vocal exercises do you recommend?",
          "Tell me about my vocal progress"
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                    {msg.content}
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
                  placeholder="Ask your coach anything..."
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