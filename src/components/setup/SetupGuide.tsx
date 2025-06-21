import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Copy, CheckCircle, AlertTriangle } from 'lucide-react';

const SetupGuide: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  useEffect(() => {
    // Check if setup guide has been dismissed
    const dismissed = localStorage.getItem('vocalai-setup-guide-dismissed');
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const dismissGuide = () => {
    setIsVisible(false);
    localStorage.setItem('vocalai-setup-guide-dismissed', 'true');
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const currentUrl = window.location.origin;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-id.supabase.co';

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-dark-lighter rounded-xl border border-dark-accent max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">🚀 VocalAI Setup Guide</h2>
                <p className="text-gray-300 mt-1">Complete these steps to enable Google authentication</p>
              </div>
              <button
                onClick={dismissGuide}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Step 1: Environment Variables */}
              <div className="card">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-purple-accent flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Configure Environment Variables</h3>
                    <p className="text-gray-300 text-sm">Set up your Supabase credentials in .env.local</p>
                  </div>
                </div>

                <div className="bg-dark rounded-lg p-4 border border-dark-accent">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">Create .env.local file:</span>
                    <button
                      onClick={() => copyToClipboard(`VITE_SUPABASE_URL=${supabaseUrl}\nVITE_SUPABASE_ANON_KEY=your_anon_key_here`, 'env')}
                      className="flex items-center text-xs text-purple-accent hover:text-purple-light transition-colors"
                    >
                      {copiedText === 'env' ? <CheckCircle size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                      {copiedText === 'env' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-sm text-gray-300 overflow-x-auto">
{`VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=your_anon_key_here`}
                  </pre>
                </div>

                <div className="mt-3 p-3 bg-blue-accent/10 border border-blue-accent/30 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle size={16} className="text-blue-accent mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-light">
                      <strong>Find these values in your Supabase dashboard:</strong>
                      <br />Settings → API → Project URL and Project API keys (anon/public)
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Google Cloud Console */}
              <div className="card">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-purple-accent flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Configure Google OAuth</h3>
                    <p className="text-gray-300 text-sm">Set up Google Cloud Console for authentication</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-white mb-2">Authorized JavaScript origins:</h4>
                    <div className="space-y-2">
                      {[supabaseUrl, currentUrl, 'https://your-deployed-app.netlify.app'].map((url, index) => (
                        <div key={index} className="bg-dark rounded-lg p-3 border border-dark-accent flex items-center justify-between">
                          <code className="text-sm text-gray-300">{url}</code>
                          <button
                            onClick={() => copyToClipboard(url, `origin-${index}`)}
                            className="flex items-center text-xs text-purple-accent hover:text-purple-light transition-colors"
                          >
                            {copiedText === `origin-${index}` ? <CheckCircle size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                            {copiedText === `origin-${index}` ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-white mb-2">Authorized redirect URIs:</h4>
                    <div className="space-y-2">
                      {[
                        `${supabaseUrl}/auth/v1/callback`,
                        currentUrl,
                        'https://your-deployed-app.netlify.app'
                      ].map((url, index) => (
                        <div key={index} className="bg-dark rounded-lg p-3 border border-dark-accent flex items-center justify-between">
                          <code className="text-sm text-gray-300">{url}</code>
                          <button
                            onClick={() => copyToClipboard(url, `redirect-${index}`)}
                            className="flex items-center text-xs text-purple-accent hover:text-purple-light transition-colors"
                          >
                            {copiedText === `redirect-${index}` ? <CheckCircle size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                            {copiedText === `redirect-${index}` ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-4 px-4 py-2 bg-blue-accent text-white rounded-lg hover:bg-blue-light transition-colors"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Open Google Cloud Console
                </a>
              </div>

              {/* Step 3: Supabase Configuration */}
              <div className="card">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-purple-accent flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Configure Supabase Authentication</h3>
                    <p className="text-gray-300 text-sm">Enable Google provider and set redirect URLs</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-dark rounded-lg p-4 border border-dark-accent">
                    <h4 className="font-medium text-white mb-2">Required Settings:</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-purple-accent rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Enable Google provider in Authentication → Providers
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-purple-accent rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Add your Google OAuth Client ID and Secret
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-purple-accent rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Set Site URL to your deployment URL
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-purple-accent rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Add redirect URLs in Authentication → URL Configuration
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium text-white mb-2">Redirect URLs to add:</h4>
                    <div className="space-y-2">
                      {[currentUrl, 'https://your-deployed-app.netlify.app'].map((url, index) => (
                        <div key={index} className="bg-dark rounded-lg p-3 border border-dark-accent flex items-center justify-between">
                          <code className="text-sm text-gray-300">{url}</code>
                          <button
                            onClick={() => copyToClipboard(url, `supabase-redirect-${index}`)}
                            className="flex items-center text-xs text-purple-accent hover:text-purple-light transition-colors"
                          >
                            {copiedText === `supabase-redirect-${index}` ? <CheckCircle size={14} className="mr-1" /> : <Copy size={14} className="mr-1" />}
                            {copiedText === `supabase-redirect-${index}` ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <a
                  href={`${supabaseUrl.replace('https://', 'https://app.')}/project/_/auth/providers`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Open Supabase Auth Settings
                </a>
              </div>

              {/* Step 4: Testing */}
              <div className="card">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-purple-accent flex items-center justify-center text-white font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Test Your Setup</h3>
                    <p className="text-gray-300 text-sm">Verify everything is working correctly</p>
                  </div>
                </div>

                <div className="bg-dark rounded-lg p-4 border border-dark-accent">
                  <h4 className="font-medium text-white mb-2">Testing Checklist:</h4>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-accent rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Restart your development server after adding environment variables
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-accent rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Check the connection status indicator (top-right corner)
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-accent rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Try signing in with Google
                    </li>
                    <li className="flex items-start">
                      <span className="w-2 h-2 bg-purple-accent rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      Update Google OAuth URLs after deploying to production
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={dismissGuide}
                className="px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:opacity-90 transition-all"
              >
                Got it, let's start!
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SetupGuide;