import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import api from '../../services/api.js';
import { AIInsight } from '../../types/index.js';
import PlateCard from '../../components/common/PlateCard.js';
import BarbellLoader from '../../components/common/BarbellLoader.js';
import { Sparkles, Clock, Target, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export const MemberInsight: React.FC = () => {
  const { user } = useAuth();
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsight = async () => {
    if (!user?.memberId) return;
    try {
      setLoading(true);
      const res = await api.get(`/insights/member/${user.memberId}`);
      setInsight(res.data);
    } catch (e) {
      console.error('Failed to load member AI insight', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsight();
  }, [user]);

  if (loading || !insight) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <BarbellLoader text="Synthesizing Workout Analytics..." />
      </div>
    );
  }

  const confidencePercent = Math.round(insight.confidence * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide flex items-center space-x-3">
            <span>AI WORKOUT INTELLIGENCE</span>
            <Sparkles className="w-6 h-6 text-gym-red animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-gym-muted">
            Personalized behavioral patterns, optimal session timings, and momentum recommendations.
          </p>
        </div>

        {/* Mandatory "Demo Data Only" Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-950/40 border border-amber-800/60 text-gym-amber text-xs font-mono font-bold tracking-wide">
          <ShieldCheck className="w-4 h-4" />
          <span>DEMO DATA ONLY</span>
        </div>
      </div>

      {/* Main AI Insight Card */}
      <PlateCard
        accent={insight.type === 'drop_risk' ? 'red' : 'green'}
        className="p-8 space-y-6"
      >
        {/* Top bar with confidence score */}
        <div className="flex items-center justify-between border-b border-gym-border pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-gym-plate border border-gym-border text-gym-red">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-gym-muted">
                Pattern Analysis Engine
              </span>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">
                {insight.type === 'drop_risk'
                  ? 'Attendance Deceleration Detected'
                  : insight.type === 'high_consistency'
                  ? 'Peak Momentum & Consistency'
                  : 'Circadian Training Adherence'}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-gym-muted uppercase block">
              Model Confidence
            </span>
            <span className="font-display text-2xl text-white">
              {confidencePercent}%
            </span>
          </div>
        </div>

        {/* Observation */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-gym-muted uppercase tracking-wider">
            Key Behavioral Observation
          </span>
          <p className="text-base sm:text-lg text-white font-medium bg-gym-plate/50 p-4 rounded-xl border border-gym-border/80">
            {insight.observation}
          </p>
        </div>

        {/* Suggested Action */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-gym-muted uppercase tracking-wider">
            Recommended Next Action
          </span>
          <p className="text-sm text-zinc-300 bg-black/40 p-4 rounded-xl border border-white/5">
            {insight.suggestedAction}
          </p>
        </div>

        {/* Preferred Timing */}
        {insight.timing && (
          <div className="flex items-center space-x-3 p-3.5 rounded-xl bg-gym-plate/30 border border-gym-border text-sm">
            <Clock className="w-5 h-5 text-gym-red flex-shrink-0" />
            <div>
              <span className="text-xs text-gym-muted block">Optimal Training Window:</span>
              <span className="font-mono font-bold text-white">{insight.timing}</span>
            </div>
          </div>
        )}
      </PlateCard>

      {/* Engine Architecture Note */}
      <div className="p-4 rounded-xl bg-gym-card/50 border border-gym-border/60 text-xs text-gym-muted space-y-1 font-mono">
        <div className="font-bold text-white flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-gym-red" />
          <span>About the Engine</span>
        </div>
        <p>
          GymMate AI evaluates your trailing 14-day check-in cadence against your historical 8-week baseline. The system operates on pure statistical functions today and seamlessly interfaces with LLM personalization for adaptive workout prompts.
        </p>
      </div>
    </div>
  );
};

export default MemberInsight;
