import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, TrendingUp, Clock, BarChart2, ChevronLeft, ChevronRight, FileText, Sparkles, AlertCircle, RefreshCw, CheckCircle, X, MessageCircle, Brain, User, Target, Activity } from 'lucide-react';
import { useVocalProfile } from '../context/VocalProfileContext';
import { useAuth } from '../context/AuthContext';
import UniversalLettaChat from '../components/shared/UniversalLettaChat';

// Helper to format date as YYYY-MM-DD in local timezone
const toYYYYMMDD = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Types for Fetch AI Response
interface VocalMetric {
  current: number;
  previous: number | null;
  change: number | null;
  trend: 'up' | 'down' | 'stable';
  improvement_percentage?: number | null;
}

interface PracticeMetric {
  current: number;
  previous: number | null;
  change: number | null;
  trend: 'up' | 'down' | 'stable';
}

interface RangeMetric {
  current: string | number;
  previous: string | number | null;
  change: number | null;
  trend: 'up' | 'down' | 'stable';
}

interface FetchAIReport {
  id: string;
  date: string;
  summary: string;
  vocal_metrics: {
    mean_pitch: VocalMetric;
    vibrato_rate: VocalMetric;
    jitter: VocalMetric;
    shimmer: VocalMetric;
  };
  practice_metrics: {
    total_sessions: PracticeMetric;
    total_duration: PracticeMetric;
    avg_session_length: PracticeMetric;
    consistency_score: PracticeMetric;
  };
  range_metrics: {
    lowest_note: RangeMetric;
    highest_note: RangeMetric;
    voice_type: RangeMetric;
    vocal_range: RangeMetric;
  };
  day_over_day_comparison: string[];
  insights: string[];
  recommendations: string[];
  practice_sessions?: number;
  total_practice_time?: number;
  best_time_of_day?: string;
}

interface AgentStatus {
  agent_address: string;
  agent_name: string;
  last_processed_date: string | null;
  processed_users_count: number;
  next_run_in_seconds: number;
  status: string;
}

const Progress: React.FC = () => {
  const { profile } = useVocalProfile();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [fetchAiReports, setFetchAiReports] = useState<FetchAIReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLettaOpen, setIsLettaOpen] = useState(false);

  // Fetch Fetch AI reports
  const fetchReports = async (dateStr: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = (import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080').replace(/\/$/, '');
      
      const response = await fetch(`${apiUrl}/api/vocal-reports/${user.id}/${dateStr}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to fetch reports: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setFetchAiReports([data.data]);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  // Fetch reports when selected date changes
  useEffect(() => {
    // Don't run the effect if the user is not yet available
    if (!user?.id) {
      return;
    }
    const dateStr = toYYYYMMDD(selectedDate);
    fetchReports(dateStr);
  }, [user?.id, toYYYYMMDD(selectedDate)]); // Use the formatted string for dependency

  // Get current report
  const getCurrentReport = () => fetchAiReports[0] || null;

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const selectDate = (date: Date) => {
    // Don't allow selecting future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date > today) {
      return;
    }
    
    setSelectedDate(date);
    setShowCalendar(false);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 42; i++) {
      const isCurrentMonth = currentDate.getMonth() === month;
      const isSelected = currentDate.toDateString() === selectedDate.toDateString();
      const isToday = currentDate.toDateString() === today.toDateString();
      const isFuture = currentDate > today;
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth,
        isSelected,
        isToday,
        isDisabled: isFuture
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  const formatMetricChange = (change: number | null, unit: string = '') => {
    if (change === null) return 'Baseline';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(3)}${unit}`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp size={14} className="text-blue-accent" />;
      case 'down':
        return <TrendingUp size={14} className="text-red-accent rotate-180" />;
      default:
        return <TrendingUp size={14} className="text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-blue-accent';
      case 'down':
        return 'text-red-accent';
      default:
        return 'text-gray-400';
    }
  };

  const renderMetricsSection = (title: string, metrics: Record<string, any> | undefined | null, type: 'vocal' | 'practice' | 'range') => {
    if (!metrics) return null;

    return (
      <div className="card mb-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          {title}
          {type === 'vocal' && <Sparkles size={16} className="ml-2 text-purple-accent" />}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(metrics).map(([key, metric]) => (
            <div key={key} className="bg-dark-lighter rounded-lg p-4 border border-dark-accent">
              <div className="flex items-center justify-between mb-2">
                <span className="text-base text-gray-400 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {typeof metric.current === 'number' 
                  ? metric.current.toFixed(2) 
                  : metric.current}
              </div>
              <div className={`text-base ${getTrendColor(metric.trend)}`}>
                {formatMetricChange(metric.change)}
              </div>
              {metric.improvement_percentage && (
                <div className="text-sm text-blue-accent mt-1">
                  {metric.improvement_percentage > 0 ? '+' : ''}{metric.improvement_percentage.toFixed(1)}% improvement
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="page-transition max-w-7xl mx-auto"
    >
      {/* Page Header with Description */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">Progress Overview</h1>
        <p className="text-gray-300 text-xl mb-4">View detailed reports on your vocal development</p>
        
        {/* Description */}
        <div className="text-gray-400 text-base leading-relaxed max-w-3xl">
          <p className="mb-2">See how your metrics like jitter, shimmer, and vibrato evolve over time.</p>
          <p className="mb-2">Track improvements and get smart insights from AI.</p>
          <p>Stay motivated with visual feedback and trend charts.</p>
        </div>
      </motion.div>

      {/* Date Selection */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Daily Reports</h2>
            <p className="text-gray-400 text-base mt-1">
              Choose a day from your past to review your vocal progress and discuss it with your AI coach.
            </p>
              <p className="text-gray-400 text-base mt-1">
              Powered by Fetch.ai and Letta AI.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            
            <button
              onClick={() => setShowCalendar(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-accent/20 hover:bg-purple-accent/30 rounded-lg transition-colors"
            >
              <Calendar size={16} />
              <span className="text-base">{selectedDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
              <ChevronDown size={16} />
            </button>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCalendar(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Select Date</h3>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="p-1 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <ChevronLeft size={16} className="text-gray-400" />
                </button>
                <h4 className="text-white font-medium text-lg">
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h4>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-sm text-gray-400 py-2 font-medium">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day, index) => (
                  <button
                    key={index}
                    onClick={() => selectDate(day.date)}
                    disabled={day.isDisabled}
                    className={`p-3 text-base rounded-lg transition-all ${
                      day.isSelected
                        ? 'bg-purple-accent text-white shadow-lg'
                        : day.isToday
                        ? 'bg-purple-accent/20 text-purple-accent border border-purple-accent/50'
                        : day.isCurrentMonth
                        ? 'hover:bg-gray-700/50 text-white'
                        : 'text-gray-600'
                    } ${day.isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:scale-105'}`}
                  >
                    {day.date.getDate()}
                  </button>
                ))}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCalendar(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="px-4 py-2 bg-purple-accent text-white rounded-lg hover:bg-purple-light transition-colors text-base"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        
      {/* Loading State */}
      {loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card mb-6"
        >
          <div className="flex items-center justify-center py-8">
            <RefreshCw size={24} className="animate-spin text-purple-accent mr-3" />
            <span className="text-gray-400 text-lg">Generating Fetch AI report...</span>
          </div>
        </motion.div>
      )}
        
      {/* Error State */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6 border border-red-accent/30 bg-red-accent/10"
        >
          <div className="flex items-start">
            <AlertCircle size={20} className="text-red-accent mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-accent font-semibold mb-1 text-lg">Error Loading Report</h3>
              <p className="text-red-light text-base">{error}</p>
              <button
                onClick={() => fetchReports(toYYYYMMDD(selectedDate))}
                className="mt-2 text-base text-red-accent hover:text-red-light underline"
              >
                Try again
              </button>
            </div>
          </div>
        </motion.div>
      )}
        
      {/* Fetch AI Report */}
      {!loading && !error && getCurrentReport() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Personal AI Coach Card */}
          <div className="card">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-accent to-blue-accent flex items-center justify-center flex-shrink-0">
                  <Brain size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                    Your Personal AI Vocal Coach
                    <Sparkles size={20} className="ml-2 text-purple-accent" />
                  </h3>
                  <p className="text-gray-300 text-lg mb-4">
                    I've analyzed your vocal data for {selectedDate.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric' 
                    })} and I'm ready to discuss your progress!
                  </p>
                  
                  {/* What I can help with */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-purple-accent/10 border border-purple-accent/20 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Activity size={16} className="text-purple-accent mr-2" />
                        <h4 className="font-semibold text-purple-accent">Vocal Data Analysis</h4>
                      </div>
                      <p className="text-sm text-gray-300">
                        Explain your jitter, shimmer, pitch trends and what they mean for your voice
                      </p>
                    </div>
                    
                    <div className="bg-blue-accent/10 border border-blue-accent/20 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <Target size={16} className="text-blue-accent mr-2" />
                        <h4 className="font-semibold text-blue-accent">Targeted Exercises</h4>
                      </div>
                      <p className="text-sm text-gray-300">
                        Get specific exercises based on your current vocal metrics and goals
                      </p>
                    </div>
                    
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <TrendingUp size={16} className="text-green-500 mr-2" />
                        <h4 className="font-semibold text-green-500">Progress Insights</h4>
                      </div>
                      <p className="text-sm text-gray-300">
                        Understand how your voice has changed and what to focus on next
                      </p>
                    </div>
                    
                    <div className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <User size={16} className="text-pink-500 mr-2" />
                        <h4 className="font-semibold text-pink-500">Personal Coaching</h4>
                      </div>
                      <p className="text-sm text-gray-300">
                        Get encouragement, motivation, and answers to your vocal questions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-dark-lighter rounded-lg p-3 text-center">
                <div className="text-sm text-gray-400 mb-1">Practice Sessions</div>
                <div className="text-xl font-bold text-purple-accent">
                  {getCurrentReport()?.practice_sessions || 0}
                </div>
              </div>
              <div className="bg-dark-lighter rounded-lg p-3 text-center">
                <div className="text-sm text-gray-400 mb-1">Practice Time</div>
                <div className="text-xl font-bold text-blue-accent">
                  {getCurrentReport()?.total_practice_time || 0}m
                </div>
              </div>
              <div className="bg-dark-lighter rounded-lg p-3 text-center">
                <div className="text-sm text-gray-400 mb-1">Voice Type</div>
                <div className="text-xl font-bold text-green-500">
                  {getCurrentReport()?.range_metrics?.voice_type?.current || 'Unknown'}
                </div>
              </div>
              <div className="bg-dark-lighter rounded-lg p-3 text-center">
                <div className="text-sm text-gray-400 mb-1">Best Time</div>
                <div className="text-xl font-bold text-pink-500">
                  {getCurrentReport()?.best_time_of_day || 'N/A'}
                </div>
              </div>
            </div>
            
            {/* CTA Button */}
            <motion.button
              onClick={() => setIsLettaOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-purple-accent to-blue-accent text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-3 text-lg"
            >
              <MessageCircle size={24} />
              <span>Start Conversation with Your AI Coach</span>
              <Brain size={24} />
            </motion.button>
          </div>

          {/* Vocal Metrics */}
          {renderMetricsSection(
            "Vocal Performance Metrics", 
            getCurrentReport()?.vocal_metrics, 
            'vocal'
          )}

          {/* Practice Metrics */}
          {renderMetricsSection(
            "Practice Session Metrics", 
            getCurrentReport()?.practice_metrics, 
            'practice'
          )}

          {/* Range Metrics */}
          {renderMetricsSection(
            "Vocal Range Analysis", 
            getCurrentReport()?.range_metrics, 
            'range'
          )}
        </motion.div>
      )}

      {/* No Report Available */}
      {!loading && !error && !getCurrentReport() && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="text-center p-8">
            <h3 className="text-xl font-semibold text-white mb-2">No Report Available</h3>
            <p className="text-gray-400 text-base mb-4">
              There is no Fetch.ai analysis report available for this date.
            </p>
            <button
              onClick={() => fetchReports(toYYYYMMDD(selectedDate))}
              className="px-4 py-2 bg-purple-accent text-white rounded-lg hover:bg-purple-light transition-colors text-base"
            >
              Refresh
            </button>
          </div>
        </motion.div>
      )}

      {/* Universal Letta Chat */}
      <UniversalLettaChat
        isOpen={isLettaOpen}
        onClose={() => setIsLettaOpen(false)}
        contextType="progress"
        contextData={{
          date: toYYYYMMDD(selectedDate),
          fetchAiReport: getCurrentReport()
        }}
        title="Your Personal Vocal Coach"
        description="Discuss your vocal data, trends, and get targeted improvement advice"
      />
    </motion.div>
  );
};

export default Progress;