import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { Member } from '../../types/index.js';
import LiveCheckInFeed from '../../components/staff/LiveCheckInFeed.js';
import FrontDeskQRCode from '../../components/staff/FrontDeskQRCode.js';
import PlateCard from '../../components/common/PlateCard.js';
import { QrCode, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const AttendanceConsole: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const res = await api.get('/members');
        setMembers(res.data);
      } catch (e) {
        console.error('Failed to load members for console', e);
      }
    };
    loadMembers();
  }, []);

  const handleManualCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    try {
      setSubmitting(true);
      setStatusMessage(null);
      const res = await api.post('/attendance/check-in', {
        memberId: selectedMemberId,
      });

      setStatusMessage({ type: 'success', text: res.data.message });
      setSelectedMemberId('');

      confetti({
        particleCount: 35,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#E63946', '#2E8B57'],
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || 'Manual check-in failed.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
          FRONT-DESK CHECK-IN KIOSK
        </h1>
        <p className="text-xs sm:text-sm text-gym-muted">
          Display this dynamic QR code on the front-desk monitor. Members scan it with their phone camera to check in.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg transition-all ${
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Official Front-Desk QR Code Display & Manual Fallback (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Dynamic Front-Desk QR Display (Staff Only) */}
          <FrontDeskQRCode />

          {/* Manual Member Selector Fallback */}
          <PlateCard className="space-y-4">
            <div className="flex items-center space-x-2.5 border-b border-gym-border pb-3">
              <div className="p-2 rounded-lg bg-gym-plate text-gym-greenBright border border-gym-border">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Staff Manual Check-In Fallback
                </h3>
                <p className="text-[11px] text-gym-muted">
                  Use if member's smartphone battery died or camera is unavailable
                </p>
              </div>
            </div>

            <form onSubmit={handleManualCheckIn} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1">
                  Select Member from Roster
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-xs text-white focus:outline-none focus:border-gym-red"
                >
                  <option value="">-- Select Member --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.membershipStatus.toUpperCase()}{m.email ? ` · ${m.email}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedMemberId}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold tracking-wider text-white bg-gym-green hover:bg-emerald-600 disabled:opacity-40 transition-colors shadow-glow-green"
              >
                {submitting ? 'CHECKING IN...' : 'LOG DESK CHECK-IN'}
              </button>
            </form>
          </PlateCard>
        </div>

        {/* Right Column: Live WebSocket Check-In Feed (6 cols) */}
        <div className="lg:col-span-6">
          <LiveCheckInFeed />
        </div>
      </div>
    </div>
  );
};

export default AttendanceConsole;
