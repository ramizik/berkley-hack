import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Brain, Loader2, User, Bot } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LettaChatProps {
  isOpen: boolean;
  onClose: () => void;
  fetchAiReport: any | null;
  conversationType: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const LettaChat: React.FC<LettaChatProps> = ({ isOpen, onClose, fetchAiReport, conversationType }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationStarted, setConversationStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user?.id && !conversationStarted) {
      startConversation();
    } else if (!isOpen) {
      resetChat();
    }
  }, [isOpen, user?.id, conversationStarted]); // Prevent multiple starts with conversationStarted flag

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const resetChat = () => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setConversationId(null);
    setConversationStarted(false);
  };

  const startConversation = async () => {
    if (!user || conversationStarted || isLoading) return;
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080';
      const formData = new FormData();
      formData.append('user_id', user.id);
      formData.append('conversation_type', conversationType);
      
      // Pass the specific report date to ensure the correct context is loaded
      if (fetchAiReport?.date) {
        formData.append('date', fetchAiReport.date);
      }

      const response = await fetch(`${apiUrl}/api/letta/conversation/start`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to start conversation');
      const data = await response.json();
      
      setConversationId(data.data.conversation_id);
      setConversationStarted(true);
      setMessages([{ role: 'assistant', content: "Hello! I'm Letta, your personal voice coach. I've reviewed your daily report. What would you like to discuss?" }]);
    } catch (error) {
      console.error(error);
      setMessages([{ role: 'assistant', content: 'Sorry, I am having trouble connecting right now.' }]);
      setConversationStarted(true); // Prevent retries on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (input.trim() === '' || !conversationId || !user) return;
    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080';
      const formData = new FormData();
      formData.append('conversation_id', conversationId);
      formData.append('user_id', user.id);
      formData.append('message', input);

      const response = await fetch(`${apiUrl}/api/letta/conversation/chat`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to get response from Letta');
      const data = await response.json();
      
      const assistantMessage: Message = { role: 'assistant', content: data.data.response.message };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'My apologies, I encountered an error. Could you try asking again?' }]);
    } finally {
      setIsLoading(false);
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
            className="bg-gray-900 border border-pink-500/30 rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Brain size={20} className="mr-2 text-pink-400" />
                Your Personal Coach (Letta)
              </h3>
              <button onClick={onClose} className="p-1 hover:bg-gray-700/50 rounded-full transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot size={18} className="text-pink-400" />
                    </div>
                  )}
                  <div className={`max-w-md rounded-xl p-3 text-white ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-800'}`}>
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-blue-400" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

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
                  disabled={isLoading}
                  className="p-2 rounded-full bg-pink-600 text-white hover:bg-pink-500 disabled:bg-gray-600 transition-colors"
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

export default LettaChat; 