import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { Member, AttendanceLog } from '../../types/index.js';
import PlateCard from '../../components/common/PlateCard.js';
import ChalkBadge from '../../components/common/ChalkBadge.js';
import BarbellLoader from '../../components/common/BarbellLoader.js';
import PaymentModal from '../../components/staff/PaymentModal.js';
import ManualCheckInModal from '../../components/staff/ManualCheckInModal.js';
import { formatIndianPhone } from '../../utils/phone.js';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  QrCode,
  Sparkles,
  Clock,
  CheckCircle2,
  Mail,
  Phone,
  Activity,
  History,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const MemberDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);

  const fetchMember = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get(`/members/${id}`);
      setMember(res.data);
    } catch (err) {
      console.error('Failed to load member profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMember();
  }, [id]);

  if (loading || !member) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <BarbellLoader text="Loading Member Profile..." />
      </div>
    );
  }

  // Calculate attendance distribution for Recharts (day of week)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];

  (member.attendanceLogs || []).forEach((log: AttendanceLog) => {
    const day = new Date(log.checkInTime).getDay();
    dayCounts[day]++;
  });

  const chartData = dayNames.map((day, idx) => ({
    day,
    sessions: dayCounts[idx],
  }));

  const latestInsight = member.aiInsights?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back link & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/staff/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs text-gym-muted hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Members Roster</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="font-display text-3xl text-white tracking-wide">
              {member.name}
            </h1>
            <ChalkBadge status={member.membershipStatus} />
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsCheckInModalOpen(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gym-plate hover:bg-gym-plate/80 border border-gym-border text-white text-xs font-bold tracking-wide transition-colors"
          >
            <QrCode className="w-4 h-4 text-gym-red" />
            <span>DESK CHECK-IN</span>
          </button>

          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gym-green hover:bg-emerald-600 text-white text-xs font-bold tracking-wide transition-colors shadow-glow-green"
          >
            <DollarSign className="w-4 h-4" />
            <span>LOG PAYMENT</span>
          </button>
        </div>
      </div>

      {/* Profile Overview & AI Insight Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Member Card */}
        <PlateCard className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gym-muted border-b border-gym-border pb-2">
            MEMBER DETAILS
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex items-center space-x-2.5 text-gym-subtext">
              <Mail className="w-4 h-4 text-gym-muted" />
              <span>{member.email || 'No email provided'}</span>
            </div>
            <div className="flex items-center space-x-2.5 text-gym-subtext">
              <Phone className="w-4 h-4 text-gym-muted" />
              <span className="font-mono">{formatIndianPhone(member.phone)}</span>
            </div>
            <div className="flex items-center space-x-2.5 text-gym-subtext">
              <Calendar className="w-4 h-4 text-gym-muted" />
              <span>Joined {new Date(member.joinDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gym-border space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gym-muted">Monthly Fee:</span>
              <span className="font-bold text-white">${member.feeAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gym-muted">Fee Due Date:</span>
              <span className="font-mono font-bold text-gym-amber">
                {new Date(member.feeDueDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gym-muted">Last Payment:</span>
              <span className="text-zinc-300">
                {member.lastPaymentDate ? new Date(member.lastPaymentDate).toLocaleDateString() : 'None logged'}
              </span>
            </div>
          </div>
        </PlateCard>

        {/* Center/Right Column: AI Insight Panel */}
        <PlateCard
          accent={latestInsight?.type === 'drop_risk' ? 'red' : 'green'}
          className="lg:col-span-2 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-gym-border pb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-gym-red" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                AI ATTENDANCE INSIGHT ENGINE
              </h3>
            </div>
            {latestInsight && (
              <span className="text-[11px] font-mono text-gym-muted">
                Confidence: {Math.round(latestInsight.confidence * 100)}%
              </span>
            )}
          </div>

          {latestInsight ? (
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-gym-muted uppercase">Observation</span>
                <p className="text-sm font-semibold text-white mt-0.5">
                  {latestInsight.observation}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-gym-muted uppercase">Suggested Coach / Staff Action</span>
                <p className="text-xs text-zinc-300 mt-0.5 bg-gym-plate/60 p-3 rounded-xl border border-gym-border">
                  {latestInsight.suggestedAction}
                </p>
              </div>

              {latestInsight.timing && (
                <div className="flex items-center space-x-2 text-xs text-gym-subtext font-mono">
                  <Clock className="w-3.5 h-3.5 text-gym-red" />
                  <span>Preferred Slot: {latestInsight.timing}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-gym-muted text-xs">
              AI Insight engine is calibrating baseline for this member.
            </div>
          )}
        </PlateCard>
      </div>

      {/* Attendance Chart & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Day Distribution */}
        <PlateCard className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gym-border pb-2">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-gym-red" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                WEEKDAY WORKOUT DISTRIBUTION (LAST 60 DAYS)
              </h3>
            </div>
            <span className="text-xs text-gym-muted font-mono">
              Total Visits: {member.attendanceLogs?.length || 0}
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282830" vertical={false} />
                <XAxis dataKey="day" stroke="#8E8E9F" fontSize={12} tickLine={false} />
                <YAxis stroke="#8E8E9F" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181C', borderColor: '#2A2A32', borderRadius: '8px' }}
                  labelStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
                />
                <Bar dataKey="sessions" fill="#E63946" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </PlateCard>

        {/* Recent Check-Ins List */}
        <PlateCard className="space-y-3">
          <div className="flex items-center space-x-2 border-b border-gym-border pb-2">
            <History className="w-4 h-4 text-gym-muted" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              VISIT LOGS
            </h3>
          </div>

          <div className="divide-y divide-gym-border/40 max-h-64 overflow-y-auto">
            {(!member.attendanceLogs || member.attendanceLogs.length === 0) ? (
              <p className="text-xs text-gym-muted py-6 text-center">No visits logged yet.</p>
            ) : (
              member.attendanceLogs.slice(0, 15).map((l: AttendanceLog) => (
                <div key={l.id} className="py-2 flex items-center justify-between text-xs">
                  <span className="text-white font-medium">
                    {new Date(l.checkInTime).toLocaleDateString()}
                  </span>
                  <span className="font-mono text-gym-muted">
                    {new Date(l.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </PlateCard>
      </div>

      {/* Reminder History Table */}
      <PlateCard className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-gym-border pb-2">
          NOTIFICATION & REMINDER DISPATCH LOG
        </h3>

        <div className="divide-y divide-gym-border/40">
          {(!member.feeReminders || member.feeReminders.length === 0) ? (
            <p className="text-xs text-gym-muted py-4 text-center">No fee reminders sent to this member.</p>
          ) : (
            member.feeReminders.map((r: any) => (
              <div key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-gym-plate rounded text-[10px] font-mono uppercase font-bold text-gym-muted">
                      {r.channel}
                    </span>
                    <span className="text-zinc-300 font-medium">{r.message}</span>
                  </div>
                </div>
                <div className="text-right text-gym-muted font-mono whitespace-nowrap">
                  {new Date(r.sentAt).toLocaleDateString()} {new Date(r.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </PlateCard>

      {/* Modals */}
      <PaymentModal
        member={member}
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={fetchMember}
      />

      <ManualCheckInModal
        member={member}
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onSuccess={fetchMember}
      />
    </div>
  );
};

export default MemberDetails;
