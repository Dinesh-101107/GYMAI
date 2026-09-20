import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { ReminderCandidate, FeeReminder } from '../../types/index.js';
import PlateCard from '../../components/common/PlateCard.js';
import BarbellLoader from '../../components/common/BarbellLoader.js';
import {
  Bell,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Mail,
  Zap,
  RefreshCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const RemindersLog: React.FC = () => {
  const [candidates, setCandidates] = useState<ReminderCandidate[]>([]);
  const [logs, setLogs] = useState<FeeReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candRes, logsRes] = await Promise.all([
        api.get('/reminders/candidates'),
        api.get('/reminders/logs'),
      ]);
      setCandidates(candRes.data);
      setLogs(logsRes.data);
    } catch (e) {
      console.error('Failed to load reminders data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSendSingle = async (candidate: ReminderCandidate) => {
    try {
      setStatusMessage(null);
      const res = await api.post('/reminders/send', {
        memberId: candidate.memberId,
        message: candidate.message,
        channel: 'email',
      });

      setStatusMessage({ type: 'success', text: res.data.message });
      // Remove from candidate list
      setCandidates((prev) => prev.filter((c) => c.memberId !== candidate.memberId));
      // Refresh logs
      const logsRes = await api.get('/reminders/logs');
      setLogs(logsRes.data);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to dispatch reminder.',
      });
    }
  };

  const handleBulkSend = async () => {
    if (candidates.length === 0) return;
    try {
      setSendingBulk(true);
      setStatusMessage(null);
      const res = await api.post('/reminders/bulk-send', {
        candidates: candidates.map((c) => ({
          memberId: c.memberId,
          message: c.message,
        })),
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#E63946', '#E09F3E'],
      });

      setStatusMessage({ type: 'success', text: res.data.message });
      setCandidates([]);
      const logsRes = await api.get('/reminders/logs');
      setLogs(logsRes.data);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to dispatch bulk reminders.',
      });
    } finally {
      setSendingBulk(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <BarbellLoader text="Scanning Reminder Triggers..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
            SMART REMINDER ENGINE
          </h1>
          <p className="text-xs sm:text-sm text-gym-muted">
            Automated, friendly, non-guilt notifications triggered by fee due dates and attendance gaps.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-gym-plate hover:bg-gym-plate/80 border border-gym-border text-gym-subtext hover:text-white transition-colors"
            title="Scan Again"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {candidates.length > 0 && (
            <button
              onClick={handleBulkSend}
              disabled={sendingBulk}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gym-red hover:bg-gym-redHover disabled:opacity-50 text-white text-xs font-bold tracking-wider transition-colors shadow-glow-red"
            >
              <Zap className="w-4 h-4" />
              <span>{sendingBulk ? 'DISPATCHING...' : `BULK SEND (${candidates.length})`}</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-2 border-emerald-600'
              : 'bg-red-950/80 text-red-200 border-2 border-red-600'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Candidate Queue Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-white tracking-wider flex items-center space-x-2">
            <span>PENDING REMINDER QUEUE</span>
            <span className="text-xs font-mono bg-gym-plate px-2 py-0.5 rounded text-gym-amber">
              {candidates.length} Triggered
            </span>
          </h2>
        </div>

        {candidates.length === 0 ? (
          <PlateCard className="py-12 text-center text-gym-muted space-y-2">
            <CheckCircle2 className="w-8 h-8 text-gym-greenBright mx-auto opacity-70" />
            <p className="text-sm font-bold text-white">All Clear!</p>
            <p className="text-xs">No pending fee renewals or prolonged inactivity gaps requiring reminders.</p>
          </PlateCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {candidates.map((c) => {
              let reasonBadgeClass = 'bg-amber-950/60 text-amber-300 border-amber-800';
              let reasonText = 'FEE DUE SOON';

              if (c.reason === 'fee_overdue') {
                reasonBadgeClass = 'bg-red-950/60 text-red-300 border-red-800';
                reasonText = `OVERDUE (${c.details.daysOverdue}D)`;
              } else if (c.reason === 'inactivity_gap') {
                reasonBadgeClass = 'bg-blue-950/60 text-blue-300 border-blue-800';
                reasonText = `INACTIVITY (${c.details.daysSinceLastVisit}D GAP)`;
              }

              return (
                <PlateCard key={c.memberId} className="space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{c.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${reasonBadgeClass}`}>
                        {reasonText}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-300 bg-gym-plate/50 p-3 rounded-lg border border-gym-border italic">
                      "{c.message}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gym-border/40">
                    <div className="text-[11px] text-gym-muted font-mono flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{c.email || 'Email notification'}</span>
                    </div>

                    <button
                      onClick={() => handleSendSingle(c)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gym-red hover:bg-gym-redHover text-white text-xs font-bold tracking-wide transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>SEND</span>
                    </button>
                  </div>
                </PlateCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Reminder History Log */}
      <div className="space-y-4">
        <h2 className="font-display text-2xl text-white tracking-wider">
          DISPATCH HISTORY LOG
        </h2>

        <PlateCard className="p-0 overflow-hidden">
          <div className="divide-y divide-gym-border/40 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="py-8 text-center text-xs text-gym-muted">No reminders recorded yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-gym-plate/20 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white text-sm">
                        {log.member?.name || 'Member'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-gym-plate text-[10px] font-mono uppercase text-gym-muted">
                        {log.channel}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-xs">{log.message}</p>
                  </div>

                  <div className="text-right text-gym-muted font-mono whitespace-nowrap">
                    <div>{new Date(log.sentAt).toLocaleDateString()}</div>
                    <div className="text-[10px]">{new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </PlateCard>
      </div>
    </div>
  );
};

export default RemindersLog;
