import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthPage from './components/auth/AuthPage';
import TopNav from './components/layout/TopNav';
import Dashboard from './pages/Dashboard';
import Lessons from './pages/Lessons';
import Practice from './pages/Practice';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Introduction from './pages/Introduction';
import LiveCoach from './pages/LiveCoach';
import VoiceAssistant from './pages/VoiceAssistant';
import { VocalProfileProvider } from './context/VocalProfileContext';

function App() {
  return (
    <AuthProvider>
      <VocalProfileProvider>
        <Router>
          <div className="min-h-screen animated-bg">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Introduction />} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <div className="min-h-screen">
                    <TopNav />
                    <main className="p-6">
                      <Dashboard />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/lessons" element={
                <ProtectedRoute>
                  <div className="min-h-screen">
                    <TopNav />
                    <main className="p-6">
                      <Lessons />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/practice" element={
                <ProtectedRoute>
                  <div className="min-h-screen">
                    <TopNav />
                    <main className="p-6">
                      <Practice />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/live-coach" element={
                <ProtectedRoute>
                  <div className="min-h-screen">
                    <TopNav />
                    <main className="p-6">
                      <LiveCoach />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/voice-assistant" element={
                <ProtectedRoute>
                  <VoiceAssistant />
                </ProtectedRoute>
              } />
              
              <Route path="/progress" element={
                <ProtectedRoute>
                  <div className="min-h-screen">
                    <TopNav />
                    <main className="p-6">
                      <Progress />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/settings" element={
                <ProtectedRoute>
                  <div className="min-h-screen">
                    <TopNav />
                    <main className="p-6">
                      <Settings />
                    </main>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <Onboarding onComplete={() => window.location.href = '/dashboard'} />
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </Router>
      </VocalProfileProvider>
    </AuthProvider>
  );
}

export default App;