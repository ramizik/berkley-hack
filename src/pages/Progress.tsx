import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, TrendingUp, Clock, BarChart2, ChevronLeft, ChevronRight, FileText, Sparkles, AlertCircle, RefreshCw, CheckCircle, Zap, X, MessageCircle, Brain } from 'lucide-react';
import { useVocalProfile } from '../context/VocalProfileContext';
import { useAuth } from '../context/AuthContext';
import LettaChat from '../components/letta/LettaChat';

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
  const [reportSource, setReportSource] = useState<'cache' | 'generated' | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [isLettaOpen, setIsLettaOpen] = useState(false);

  // Fetch Fetch AI reports
  const fetchReports = async (dateStr: string) => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiUrl}/api/vocal-reports/${user.id}/${dateStr}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to fetch reports: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.data) {
        setFetchAiReports([data.data]);
        setReportSource(data.source);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  // Fetch agent status
  const fetchAgentStatus = async () => {
    try {
      const apiUrl = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/agent/status`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setAgentStatus(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching agent status:', err);
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
    fetchAgentStatus();
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
        return <TrendingUp size={14} className="text-green-400" />;
      case 'down':
        return <TrendingUp size={14} className="text-red-400 rotate-180" />;
      default:
        return <TrendingUp size={14} className="text-gray-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const renderMetricsSection = (title: string, metrics: Record<string, any> | undefined | null, type: 'vocal' | 'practice' | 'range') => {
    if (!metrics) return null;

    return (
      <div className="card mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          {title}
          {type === 'vocal' && <Sparkles size={16} className="ml-2 text-purple-accent" />}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(metrics).map(([key, metric]) => (
            <div key={key} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="text-xl font-bold text-white mb-1">
                {typeof metric.current === 'number' 
                  ? metric.current.toFixed(2) 
                  : metric.current}
              </div>
              <div className={`text-sm ${getTrendColor(metric.trend)}`}>
                {formatMetricChange(metric.change)}
              </div>
              {metric.improvement_percentage && (
                <div className="text-xs text-blue-400 mt-1">
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
      {/* Fetch AI Agent Status */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold gradient-text flex items-center">
            <Zap size={20} className="mr-2" />
            Fetch AI Agent Status
          </h2>
          <button
            onClick={fetchAgentStatus}
            className="flex items-center space-x-2 px-3 py-1 bg-purple-accent/20 hover:bg-purple-accent/30 rounded-lg transition-colors text-sm"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
        
        {agentStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
              <div className="text-sm text-green-400 mb-1">Status</div>
              <div className="text-white font-semibold flex items-center">
                <CheckCircle size={14} className="mr-1" />
                {agentStatus.status}
              </div>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
              <div className="text-sm text-blue-400 mb-1">Processed Users</div>
              <div className="text-white font-semibold">{agentStatus.processed_users_count}</div>
            </div>
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
              <div className="text-sm text-purple-400 mb-1">Last Processed</div>
              <div className="text-white font-semibold">
                {agentStatus.last_processed_date || 'Never'}
              </div>
            </div>
            <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
              <div className="text-sm text-orange-400 mb-1">Agent Address</div>
              <div className="text-white font-semibold text-xs truncate">
                {agentStatus.agent_address}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-400">
            <RefreshCw size={20} className="mx-auto mb-2 animate-spin" />
            Loading agent status...
          </div>
        )}
      </motion.div>

      {/* Report Source Indicator */}
      {reportSource && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            reportSource === 'cache' 
              ? 'bg-green-900/20 text-green-400 border border-green-500/30' 
              : 'bg-blue-900/20 text-blue-400 border border-blue-500/30'
          }`}>
            {reportSource === 'cache' ? (
              <CheckCircle size={14} className="mr-1" />
            ) : (
              <Sparkles size={14} className="mr-1" />
            )}
            {reportSource === 'cache' ? 'Cached Report' : 'Generated On-Demand'}
            {lastUpdated && (
              <span className="ml-2 text-xs opacity-75">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Date Selection */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold gradient-text">Progress Overview</h2>
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
              <span>{selectedDate.toLocaleDateString('en-US', { 
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
                <h3 className="text-lg font-semibold text-white">Select Date</h3>
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
                <h4 className="text-white font-medium">
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
                  <div key={day} className="text-xs text-gray-400 py-2 font-medium">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day, index) => (
                  <button
                    key={index}
                    onClick={() => selectDate(day.date)}
                    disabled={day.isDisabled}
                    className={`p-3 text-sm rounded-lg transition-all ${
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
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowCalendar(false)}
                  className="px-4 py-2 bg-purple-accent text-white rounded-lg hover:bg-purple-light transition-colors"
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
            <span className="text-gray-400">Generating Fetch AI report...</span>
          </div>
        </motion.div>
      )}
        
      {/* Error State */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6 border border-red-500/30 bg-red-900/10"
        >
          <div className="flex items-start">
            <AlertCircle size={20} className="text-red-400 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-400 font-semibold mb-1">Error Loading Report</h3>
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={() => fetchReports(toYYYYMMDD(selectedDate))}
                className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
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
          {/* Summary */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <FileText size={18} className="mr-2 text-purple-accent" />
              AI Analysis Summary
            </h3>
            <p className="text-gray-300 leading-relaxed mb-6">
              {getCurrentReport()?.summary}
            </p>
            
            {/* Enhanced Letta Integration */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.button
                onClick={() => setIsLettaOpen(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
              >
                <Brain size={18} />
                <span>Deep Analysis</span>
              </motion.button>
              
              <motion.button
                onClick={() => {
                  // Trigger health monitoring analysis
                  const currentReport = getCurrentReport();
                  if (currentReport && user) {
                    // Call health monitoring API
                    fetch(`${import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080'}/api/letta/health/monitor`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        user_id: user.id,
                        vocal_metrics: currentReport.vocal_metrics,
                        environmental_data: {}
                      })
                    }).then(res => res.json()).then(data => {
                      console.log('Health monitoring result:', data);
                      setIsLettaOpen(true);
                    });
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle size={18} />
                <span>Health Check</span>
              </motion.button>
              
              <motion.button
                onClick={() => {
                  // Trigger personality evolution analysis
                  const currentReport = getCurrentReport();
                  if (currentReport && user) {
                    // Call personality analysis API
                    fetch(`${import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080'}/api/letta/personality/analyze`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        user_id: user.id,
                        vocal_metrics: currentReport.vocal_metrics
                      })
                    }).then(res => res.json()).then(data => {
                      console.log('Personality evolution result:', data);
                      setIsLettaOpen(true);
                    });
                  }
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2"
              >
                <Sparkles size={18} />
                <span>Evolution</span>
              </motion.button>
            </div>
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
            
          {/* Practice Session Details */}
          {getCurrentReport()?.practice_sessions && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Clock size={18} className="mr-2 text-purple-accent" />
                Practice Session Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                  <div className="text-sm text-gray-400 mb-1">Total Sessions</div>
                  <div className="text-xl font-bold text-white">{getCurrentReport()?.practice_sessions}</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                  <div className="text-sm text-gray-400 mb-1">Total Practice Time</div>
                  <div className="text-xl font-bold text-white">{getCurrentReport()?.total_practice_time} min</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                  <div className="text-sm text-gray-400 mb-1">Best Time of Day</div>
                  <div className="text-xl font-bold text-white">{getCurrentReport()?.best_time_of_day}</div>
                </div>
              </div>
            </div>
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
            <h3 className="text-lg font-semibold text-white mb-2">No Report Available</h3>
            <p className="text-gray-400 text-sm mb-4">
              There is no Fetch.ai analysis report available for this date.
            </p>
            <button
              onClick={() => fetchReports(toYYYYMMDD(selectedDate))}
              className="px-4 py-2 bg-purple-accent text-white rounded-lg hover:bg-purple-light transition-colors"
            >
              Refresh
            </button>
          </div>
        </motion.div>
      )}

      {/* Letta Chat */}
      <LettaChat
        isOpen={isLettaOpen}
        onClose={() => setIsLettaOpen(false)}
        fetchAiReport={getCurrentReport()}
        conversationType="daily_feedback"
      />
    </motion.div>
  );
};

export default Progress;