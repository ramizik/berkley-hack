import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Heart, TrendingUp, AlertTriangle, CheckCircle, MessageCircle, Activity, Target, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LettaChat from './LettaChat';

interface PersonalitySummary {
  type: string;
  evolution_score: number;
  days_training: number;
  insights_learned: number;
  adaptation_score: number;
}

interface HealthSummary {
  risk_level: string;
  strain_indicators: number;
  optimal_windows: number;
  last_check: string;
}

interface DashboardInsights {
  personality_summary: PersonalitySummary;
  health_summary: HealthSummary;
  recommendations: string[];
}

const EnhancedLettaWidget: React.FC = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLettaOpen, setIsLettaOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchDashboardInsights();
    }
  }, [user?.id]);

  const fetchDashboardInsights = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const apiUrl = (import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8080').replace(/\/$/, '');
      const response = await fetch(`${apiUrl}/api/letta/dashboard/insights/${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInsights(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard insights:', err);
      setError('Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'text-blue-accent';
      case 'moderate': return 'text-pink-600';
      case 'high': return 'text-pink-600';
      case 'critical': return 'text-pink-600';
      default: return 'text-gray-400';
    }
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return <CheckCircle size={16} />;
      case 'moderate': return <AlertTriangle size={16} />;
      case 'high': return <AlertTriangle size={16} />;
      case 'critical': return <AlertTriangle size={16} />;
      default: return <Activity size={16} />;
    }
  };

  const getPersonalityTypeColor = (type: string) => {
    const colors = {
      analytical: 'text-blue-accent',
      expressive: 'text-purple-accent',
      methodical: 'text-blue-accent',
      intuitive: 'text-purple-accent',
      perfectionist: 'text-pink-600'
    };
    return colors[type as keyof typeof colors] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !insights) {
    return (
      <div className="card border-pink-600/30">
        <p className="text-pink-600">Unable to load AI insights</p>
        <button
          onClick={fetchDashboardInsights}
          className="mt-2 text-sm text-purple-accent hover:text-purple-light transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Brain size={24} className="mr-2 text-purple-accent" />
              AI Vocal Intelligence
            </h3>
            <p className="text-xs text-gray-400 mt-1">Powered by Letta</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Personality Evolution Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-lighter border border-purple-accent/20 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white flex items-center">
                <Sparkles size={18} className="mr-2 text-purple-accent" />
                Vocal Personality
              </h4>
              <span className={`text-sm font-medium ${getPersonalityTypeColor(insights.personality_summary.type)}`}>
                {insights.personality_summary.type.charAt(0).toUpperCase() + insights.personality_summary.type.slice(1)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-accent">
                  {insights.personality_summary.evolution_score.toFixed(1)}
                </div>
                <div className="text-gray-400">Evolution Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-accent">
                  {insights.personality_summary.days_training}
                </div>
                <div className="text-gray-400">Days Training</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-pink-600">
                  {insights.personality_summary.insights_learned}
                </div>
                <div className="text-gray-400">Insights Learned</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-accent">
                  {insights.personality_summary.adaptation_score.toFixed(1)}
                </div>
                <div className="text-gray-400">Adaptation</div>
              </div>
            </div>
          </motion.div>

          {/* Health Monitoring Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-dark-lighter border border-blue-accent/20 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-white flex items-center">
                <Heart size={18} className="mr-2 text-blue-accent" />
                Vocal Health
              </h4>
              <span className={`text-sm font-medium flex items-center gap-1 ${getRiskLevelColor(insights.health_summary.risk_level)}`}>
                {getRiskLevelIcon(insights.health_summary.risk_level)}
                {insights.health_summary.risk_level.charAt(0).toUpperCase() + insights.health_summary.risk_level.slice(1)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-accent">
                  {insights.health_summary.strain_indicators}
                </div>
                <div className="text-gray-400">Strain Indicators</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-accent">
                  {insights.health_summary.optimal_windows}
                </div>
                <div className="text-gray-400">Optimal Windows</div>
              </div>
              <div className="col-span-2 text-center">
                <div className="text-xs text-gray-400">
                  Last Check: {new Date(insights.health_summary.last_check).toLocaleDateString()}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Letta Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-lighter border border-dark-accent rounded-lg p-4"
        >
          <h4 className="font-semibold text-white mb-3 flex items-center">
            <Target size={18} className="mr-2 text-pink-600" />
            Letta Recommendations for Improvement
          </h4>
          <div className="space-y-2">
            {insights.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-gray-300">
                <div className="w-1.5 h-1.5 bg-pink-600 rounded-full mt-2 flex-shrink-0"></div>
                <span>{recommendation}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Evolution Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4"
        >
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Vocal Evolution Progress</span>
            <span>{Math.round((insights.personality_summary.evolution_score / 10) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(insights.personality_summary.evolution_score / 10) * 100}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className="bg-gradient-to-r from-purple-accent to-pink-600 h-2 rounded-full"
            />
          </div>
        </motion.div>
      </div>

      <LettaChat
        isOpen={isLettaOpen}
        onClose={() => setIsLettaOpen(false)}
        fetchAiReport={null}
        conversationType="coaching"
      />
    </>
  );
};

export default EnhancedLettaWidget;