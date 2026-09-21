import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api.js';
import { DashboardStats, Member } from '../../types/index.js';
import PlateCard from '../../components/common/PlateCard.js';
import MembersTable from '../../components/staff/MembersTable.js';
import ManualCheckInModal from '../../components/staff/ManualCheckInModal.js';
import PaymentModal from '../../components/staff/PaymentModal.js';
import BarbellLoader from '../../components/common/BarbellLoader.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Users,
  Calendar,
  AlertTriangle,
  Bell,
  Activity,
  UserPlus,
  QrCode,
  TrendingDown,
  Settings,
  Shield,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [selectedMemberForCheckIn, setSelectedMemberForCheckIn] = useState<Member | null>(null);
  const [selectedMemberForPayment, setSelectedMemberForPayment] = useState<Member | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, membersRes] = await Promise.all([
        api.get('/staff/dashboard-stats'),
        api.get('/members'),
      ]);

      setStats(statsRes.data);
      setMembers(membersRes.data);
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecomputeInsights = async () => {
    try {
      setRecomputing(true);
      const res = await api.post('/insights/recompute');
      setToastMessage(res.data?.message || 'Attendance insights recomputed for all members!');
      await fetchData();
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to recompute insights', err);
      setToastMessage('Failed to trigger AI insight engine.');
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setRecomputing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <BarbellLoader text="Loading Admin Executive Console..." />
      </div>
    );
  }

  // Find at-risk members for high-priority alert plate
  const atRiskMembers = members.filter(
    (m) => m.latestInsight?.type === 'drop_risk' || (m.daysUntilDue !== undefined && m.daysUntilDue < 0)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast alert */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-gym-plate border border-gym-red text-white text-xs flex items-center justify-between shadow-glow-red animate-fade-in">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-gym-red" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-gym-muted hover:text-white text-xs">
            &times;
          </button>
        </div>
      )}

      {/* Top Banner / Welcome with Admin Badge */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-widest bg-red-950/80 text-gym-red border border-red-800">
              <Shield className="w-3.5 h-3.5" />
              <span>ADMIN PRIVILEGED ACCESS</span>
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
            GYM EXECUTIVE & OPERATIONS CONSOLE
          </h1>
          <p className="text-xs sm:text-sm text-gym-muted">
            Logged in as <span className="text-white font-semibold">{user?.name}</span> ({user?.designation || 'Administrator'}). Complete gym management, staff oversight, and financial controls.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRecomputeInsights}
            disabled={recomputing}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-gym-plate hover:bg-gym-plate/80 border border-gym-border text-white text-xs font-bold tracking-wider transition-colors disabled:opacity-50"
            title="Trigger AI Insight Engine"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gym-red ${recomputing ? 'animate-spin' : ''}`} />
            <span>{recomputing ? 'ANALYZING...' : 'RECOMPUTE AI'}</span>
          </button>

          <Link
            to="/admin/settings"
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-gym-plate hover:bg-gym-plate/80 border border-gym-border text-white text-xs font-bold tracking-wider transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-gym-amber" />
            <span>SYSTEM SETTINGS</span>
          </Link>

          <Link
            to="/staff/attendance"
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-gym-plate hover:bg-gym-plate/80 border border-gym-border text-white text-xs font-bold tracking-wider transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-gym-red" />
            <span>LIVE SCAN FEED</span>
          </Link>

          <Link
            to="/staff/members/new"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gym-red hover:bg-gym-redHover text-white text-xs font-bold tracking-wider transition-colors shadow-glow-red"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ ADD MEMBER</span>
          </Link>
        </div>
      </div>

      {/* 5 Core Summary Metric Plates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Active Members */}
        <PlateCard accent="green" className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gym-muted uppercase tracking-wider">
              ACTIVE MEMBERS
            </span>
            <div className="font-display text-3xl sm:text-4xl text-white mt-1 leading-none">
              {stats?.activeMembers ?? 0}
            </div>
            <span className="text-[10px] text-gym-greenBright font-mono">
              Enrolled members
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-950/50 border border-emerald-800 text-gym-greenBright flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </PlateCard>

        {/* Card 2: Fees Due This Week */}
        <PlateCard accent="gold" className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gym-muted uppercase tracking-wider">
              FEES DUE (7 DAYS)
            </span>
            <div className="font-display text-3xl sm:text-4xl text-gym-amber mt-1 leading-none">
              {stats?.feesDueThisWeek ?? 0}
            </div>
            <span className="text-[10px] text-gym-muted font-mono">
              Renewals pending
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-950/50 border border-amber-800 text-gym-amber flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </PlateCard>

        {/* Card 3: At-Risk Members */}
        <PlateCard accent="red" className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gym-muted uppercase tracking-wider">
              AT-RISK CHURN
            </span>
            <div className="font-display text-3xl sm:text-4xl text-gym-red mt-1 leading-none">
              {stats?.atRiskMembers ?? 0}
            </div>
            <span className="text-[10px] text-red-400 font-mono">
              Drop &gt; 40% detected
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-950/50 border border-red-800 text-gym-red flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </PlateCard>

        {/* Card 4: Today's Check-Ins */}
        <PlateCard className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gym-muted uppercase tracking-wider">
              TODAY'S CHECK-INS
            </span>
            <div className="font-display text-3xl sm:text-4xl text-white mt-1 leading-none">
              {stats?.checkInsToday ?? 0}
            </div>
            <span className="text-[10px] text-gym-greenBright font-mono">
              Front-desk logs
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-950/50 border border-cyan-800 text-cyan-400 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </PlateCard>

        {/* Card 5: Reminders Sent Today */}
        <PlateCard className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gym-muted uppercase tracking-wider">
              REMINDERS TODAY
            </span>
            <div className="font-display text-3xl sm:text-4xl text-white mt-1 leading-none">
              {stats?.remindersSentToday ?? 0}
            </div>
            <span className="text-[10px] text-gym-muted font-mono">
              Dispatched notices
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gym-plate border border-gym-border text-white flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
        </PlateCard>
      </div>

      {/* Admin Quick Control Banner */}
      <div className="bg-gym-card border-2 border-gym-border rounded-2xl p-5 shadow-plate">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-gym-red">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Admin Privilege Overview
              </h3>
              <p className="text-xs text-gym-muted">
                You have full governance access. Configure automated grace periods, billing rules, view all staff accounts, and trigger AI attendance recalculations.
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/admin/settings"
              className="px-4 py-2 rounded-xl bg-gym-plate hover:bg-gym-plate/80 border border-gym-border text-white text-xs font-bold tracking-wider transition-colors inline-flex items-center space-x-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-gym-amber" />
              <span>CONFIGURE GYM & STAFF</span>
            </Link>
          </div>
        </div>
      </div>

      {/* At-Risk Callout Section if members flagged */}
      {atRiskMembers.length > 0 && (
        <div className="bg-red-950/30 border border-red-800/60 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-900/40 text-gym-red border border-red-800">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wide">
                AI Churn Prevention Alert
              </h4>
              <p className="text-xs text-zinc-300">
                {atRiskMembers.length} member(s) have dropped attendance by more than 40% vs baseline or are overdue on membership dues.
              </p>
            </div>
          </div>

          <Link
            to="/staff/reminders"
            className="px-3.5 py-1.5 rounded-lg bg-gym-red hover:bg-gym-redHover text-white text-xs font-bold tracking-wide transition-colors whitespace-nowrap"
          >
            REVIEW SMART REMINDERS &rarr;
          </Link>
        </div>
      )}

      {/* Members Directory Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-white tracking-wider">
              ALL MEMBERS & ENROLLMENTS
            </h2>
            <p className="text-xs text-gym-muted">
              Complete member database. Filter by tier, log fee renewals, view profiles, or check in arriving athletes.
            </p>
          </div>
        </div>

        <MembersTable
          members={members}
          onLogPayment={(m) => setSelectedMemberForPayment(m)}
          onQuickCheckIn={(m) => setSelectedMemberForCheckIn(m)}
        />
      </div>

      {/* Modals */}
      <ManualCheckInModal
        member={selectedMemberForCheckIn}
        isOpen={!!selectedMemberForCheckIn}
        onClose={() => setSelectedMemberForCheckIn(null)}
        onSuccess={fetchData}
      />

      <PaymentModal
        member={selectedMemberForPayment}
        isOpen={!!selectedMemberForPayment}
        onClose={() => setSelectedMemberForPayment(null)}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default AdminDashboard;
