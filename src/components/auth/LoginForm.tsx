import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GoogleSignInButton from './GoogleSignInButton';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToSignup }) => {
  const { signInWithEmail, loading, error, clearError, authSuccess } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    // Clear errors when component mounts or when switching forms
    clearError();
  }, [clearError]);

  const validateForm = () => {
    const errors: { email?: string; password?: string } = {};
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      errors.password = 'Password is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await signInWithEmail(email, password);
  };
  
  // Don't render the form if authentication was successful
  if (authSuccess) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="card">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-300">Sign in to continue your vocal journey</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-accent/10 border border-red-accent/30 rounded-lg flex items-start"
          >
            <AlertCircle size={20} className="text-red-accent mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-light text-sm">{error}</p>
              <button
                onClick={clearError}
                className="text-red-accent hover:text-red-light text-xs mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formErrors.email) {
                    setFormErrors(prev => ({ ...prev, email: undefined }));
                  }
                }}
                className={`w-full pl-10 pr-4 py-3 rounded-lg bg-slate-800/50 border ${
                  formErrors.email ? 'border-red-accent' : 'border-slate-600/30'
                } text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-accent focus:border-transparent backdrop-blur-sm`}
                placeholder="Enter your email"
                disabled={loading}
              />
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
            </div>
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-accent">{formErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formErrors.password) {
                    setFormErrors(prev => ({ ...prev, password: undefined }));
                  }
                }}
                className={`w-full pl-10 pr-12 py-3 rounded-lg bg-slate-800/50 border ${
                  formErrors.password ? 'border-red-accent' : 'border-slate-600/30'
                } text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-accent focus:border-transparent backdrop-blur-sm`}
                placeholder="Enter your password"
                disabled={loading}
              />
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-200"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formErrors.password && (
              <p className="mt-1 text-sm text-red-accent">{formErrors.password}</p>
            )}
          </div>

          <motion.button
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800/60 text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleSignInButton />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="text-purple-accent hover:text-purple-light font-medium transition-colors"
              disabled={loading}
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default LoginForm;