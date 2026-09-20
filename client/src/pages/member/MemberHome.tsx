import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import api from '../../services/api.js';
import { Member } from '../../types/index.js';
import PlateCard from '../../components/common/PlateCard.js';
import ChalkBadge from '../../components/common/ChalkBadge.js';
import BarbellLoader from '../../components/common/BarbellLoader.js';
import MemberScanner from '../../components/member/MemberScanner.js';
import PaymentModal from '../../components/staff/PaymentModal.js';
import {
  Dumbbell,
  ScanLine,
  Calendar,
  Sparkles,
  DollarSign,
  ArrowRight,
  Clock,
  Award,
} from 'lucide-react';

export const MemberHome: React.FC = () => {
  const { user } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const fetchMemberData = async () => {
    if (!user?.memberId) return;
    try {
      setLoading(true);
      const [memberRes, statsRes, insightRes] = await Promise.all([
        api.get(`/members/${user.memberId}`),
        api.get(`/attendance/member/${user.memberId}`),
        api.get(`/insights/member/${user.memberId}`),
      ]);

      setMember(memberRes.data);
      setAttendanceStats(statsRes.data);
      setInsight(insightRes.data);
    } catch (err) {
      console.error('Failed to load member home data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, [user]);

  if (loading || !member) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <BarbellLoader text="Loading Member Dashboard..." />
      </div>
    );
  }

  const dueDate = new Date(member.feeDueDate);
  const daysUntilDue = Math.round((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const isDueSoon = daysUntilDue <= 5 && daysUntilDue >= 0;
  const isOverdue = daysUntilDue < 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gym-card border-2 border-gym-border p-6 rounded-2xl shadow-plate">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
              WELCOME BACK, {member.name.split(' ')[0].toUpperCase()}!
            </h1>
            <ChalkBadge status={member.membershipStatus} daysUntilDue={daysUntilDue} />
          </div>
          <p className="text-xs sm:text-sm text-gym-muted">
            Ready to train? Scan the gym front-desk QR code below to log your workout.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/member/attendance"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gym-red hover:bg-gym-redHover text-white text-xs font-bold tracking-wider transition-colors shadow-glow-red"
          >
            <ScanLine className="w-4 h-4" />
            <span>SCANNER & STREAK</span>
          </Link>
        </div>
      </div>

      {/* Grid: Status Cards & Pay Now Stub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Summary */}
        <PlateCard accent="red" className="flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gym-muted">
                THIS MONTH'S SESSIONS
              </span>
              <Award className="w-5 h-5 text-gym-red" />
            </div>
            <div className="font-display text-4xl text-white leading-none">
              {attendanceStats?.totalVisitsThisMonth || 0}{' '}
              <span className="text-sm text-gym-muted">VISITS</span>
            </div>
            <p className="text-xs text-gym-muted">
              Last check-in:{' '}
              <span className="text-zinc-300 font-mono">
                {attendanceStats?.lastVisit
                  ? new Date(attendanceStats.lastVisit).toLocaleDateString()
                  : 'No visits yet'}
              </span>
            </p>
          </div>

          <Link
            to="/member/attendance"
            className="mt-4 pt-3 border-t border-gym-border flex items-center justify-between text-xs font-bold text-gym-red hover:underline"
          >
            <span>VIEW ATTENDANCE & CALENDAR</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </PlateCard>

        {/* Membership & Fee Due Stub */}
        <PlateCard accent={isOverdue ? 'red' : isDueSoon ? 'gold' : 'green'} className="flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gym-muted">
                MEMBERSHIP STATUS
              </span>
              <DollarSign className="w-5 h-5 text-gym-greenBright" />
            </div>

            <div className="flex items-baseline space-x-2">
              <span className="font-display text-4xl text-white leading-none">
                ${member.feeAmount.toFixed(2)}
              </span>
              <span className="text-xs text-gym-muted font-mono">/ month</span>
            </div>

            <p className="text-xs text-gym-muted">
              Renewal Date:{' '}
              <span className={`font-mono font-bold ${isOverdue ? 'text-red-400' : isDueSoon ? 'text-amber-400' : 'text-white'}`}>
                {dueDate.toLocaleDateString()}
              </span>{' '}
              ({daysUntilDue > 0 ? `${daysUntilDue} days remaining` : isOverdue ? `${Math.abs(daysUntilDue)} days overdue` : 'Due today'})
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gym-border flex items-center justify-between">
            <span className="text-[11px] text-gym-muted font-mono">Secure Stripe Stub</span>
            <button
              onClick={() => setIsPaymentOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-gym-green hover:bg-emerald-600 text-white text-xs font-bold tracking-wider transition-colors shadow-glow-green"
            >
              PAY / RENEW NOW
            </button>
          </div>
        </PlateCard>

        {/* AI Insight Teaser */}
        <PlateCard className="flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gym-muted">
                AI WORKOUT ADVISOR
              </span>
              <Sparkles className="w-5 h-5 text-gym-red" />
            </div>

            {insight ? (
              <div className="space-y-1">
                <div className="text-xs font-semibold text-white line-clamp-2">
                  {insight.observation}
                </div>
                <div className="text-[11px] text-zinc-300 font-mono mt-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-gym-red flex-shrink-0" />
                  <span className="truncate">{insight.timing || 'Preferred: Evening 18:30'}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gym-muted">
                Log 3+ sessions to reveal personalized AI insights.
              </p>
            )}
          </div>

          <Link
            to="/member/insight"
            className="mt-4 pt-3 border-t border-gym-border flex items-center justify-between text-xs font-bold text-gym-subtext hover:text-white"
          >
            <span>EXPLORE FULL AI INSIGHTS</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </PlateCard>
      </div>

      {/* Front-Desk QR Scanner for Member */}
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="font-display text-2xl text-white tracking-wider">
            QUICK ENTRANCE SCANNER
          </h2>
          <p className="text-xs text-gym-muted">
            Point your camera at the front-desk monitor to check in
          </p>
        </div>

        <MemberScanner onCheckInSuccess={fetchMemberData} />
      </div>

      {/* Payment Renewal Modal */}
      <PaymentModal
        member={member}
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={fetchMemberData}
      />
    </div>
  );
};

export default MemberHome;
