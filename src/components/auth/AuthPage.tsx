import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';
import ParticleBackground from '../animations/ParticleBackground';

const AuthPage: React.FC = () => {
  const { user, loading, authSuccess, clearAuthSuccess } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  // Handle navigation after successful authentication
  useEffect(() => {
    if (authSuccess) {
      const timer = setTimeout(() => {
        clearAuthSuccess();
        navigate('/dashboard', { replace: true });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [authSuccess, clearAuthSuccess, navigate]);

  // Redirect if user is already authenticated
  if (!loading && user && !authSuccess) {
    return <Navigate to="/dashboard" replace />;
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show success message if authentication was successful
  if (authSuccess) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <ParticleBackground />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle size={40} className="text-green-400" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-white mb-4"
            >
              Authentication Successful!
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-gray-300 mb-6"
            >
              {authSuccess}
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="flex items-center justify-center space-x-2"
            >
              <div className="w-2 h-2 bg-purple-accent rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-purple-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />
      
      {/* Animated floating patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-pattern"></div>
        <div className="floating-pattern"></div>
        <div className="floating-pattern"></div>
        <div className="floating-pattern"></div>
        <div className="floating-pattern"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="py-6 px-8">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Mic className="text-white" size={20} />
            </div>
            <Link to="/">
              <h1 className="text-xl font-bold gradient-text hover:opacity-80 transition-opacity cursor-pointer">VocalAI</h1>
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait">
              {isLogin ? (
                <LoginForm 
                  key="login"
                  onSwitchToSignup={() => setIsLogin(false)} 
                />
              ) : (
                <SignupForm 
                  key="signup"
                  onSwitchToLogin={() => setIsLogin(true)} 
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 px-8 text-center">
          <p className="text-gray-400 text-sm">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;