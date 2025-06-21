import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthPage from './components/auth/AuthPage';
import SetupGuide from './components/setup/SetupGuide';
import SupabaseConnectionStatus from './components/setup/SupabaseConnectionStatus';
import TopNav from './components/layout/TopNav';
import Dashboard from './pages/Dashboard';
import Lessons from './pages/Lessons';
import Practice from './pages/Practice';
import { VocalProfileProvider } from './context/VocalProfileContext';

function App() {
    return (
        <AuthProvider>
            <VocalProfileProvider>
                <Router>
                    <div className="min-h-screen animated-bg">
                        <SetupGuide/>
                        <SupabaseConnectionStatus/>
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
                        </Routes>
                    </div>
                </Router>
            </VocalProfileProvider>
        </AuthProvider>
    );
}

export default App