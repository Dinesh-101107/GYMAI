import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  ShieldAlert,
  UserCheck,
  Dumbbell,
  Lock,
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Unauthorized flash banner
  const [showUnauthorizedAlert, setShowUnauthorizedAlert] = useState(
    Boolean((location.state as any)?.unauthorized)
  );

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
      console.error('Failed to load staff dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <BarbellLoader text="Loading Staff Operations Console..." />
      </div>
    );
  }

  // Find at-risk members for high-priority alert plate
  const atRiskMembers = members.filter(
    (m) => m.latestInsight?.type === 'drop_risk' || (m.daysUntilDue !== undefined && m.daysUntilDue < 0)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Unauthorized Access Toast/Banner if redirected from Admin page */}
      {showUnauthorizedAlert && (
        <div className="p-4 rounded-xl bg-amber-950/70 border border-amber-800 text-amber-200 text-xs flex items-center justify-between shadow-plate animate-fade-in">
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <span className="font-bold text-white uppercase tracking-wider block">
                Restricted Access
              </span>
              <span>
                Staff credentials do not have permission to access Admin-only configuration pages. You have been redirected to your Staff Dashboard.
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowUnauthorizedAlert(false)}
            className="text-amber-400 hover:text-white font-bold ml-4"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Top Banner / Welcome with Staff Badge */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-widest bg-emerald-950/80 text-gym-greenBright border border-emerald-800">
              <Dumbbell className="w-3.5 h-3.5" />
              <span>STAFF PORTAL ACCESS</span>
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
            STAFF OPERATIONS DESK
          </h1>
          <p className="text-xs sm:text-sm text-gym-muted">
            Welcome back, <span className="text-white font-semibold">{user?.name}</span> ({user?.designation || 'Staff Coach'}). Front-desk attendance management, member support, and live workouts.
          </p>
        </div>

        {/* Staff Quick Action Hub */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/staff/attendance"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gym-plate hover:bg-gym-plate/80 border border-gym-border text-white text-xs font-bold tracking-wider transition-colors"
          >
            <QrCode className="w-4 h-4 text-gym-greenBright" />
            <span>LIVE QR SCANNER</span>
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

      {/* 4 Core Summary Metric Plates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Members */}
        <PlateCard accent="green" className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gym-muted uppercase tracking-wider">
              ACTIVE MEMBERS
            </span>
            <div className="font-display text-4xl text-white mt-1 leading-none">
              {stats?.activeMembers ?? 0}
            </div>
            <span className="text-[10px] text-gym-greenBright font-mono">
              Currently enrolled
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-950/50 border border-emerald-800 text-gym-greenBright flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </PlateCard>

        {/* Card 2: Today's Check-Ins */}
        <PlateCard className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gym-muted uppercase tracking-wider">
              TODAY'S CHECK-INS
            </span>
            <div className="font-display text-4xl text-white mt-1 leading-none">
              {stats?.checkInsToday ?? 0}
            </div>
            <span className="text-[10px] text-cyan-400 font-mono">
              Gym visits recorded
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-cyan-950/50 border border-cyan-800 text-cyan-400 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </PlateCard>

        {/* Card 3: Fees Due This Week */}
        <PlateCard accent="gold" className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gym-muted uppercase tracking-wider">
              RENEWALS DUE (7 DAYS)
            </span>
            <div className="font-display text-4xl text-gym-amber mt-1 leading-none">
              {stats?.feesDueThisWeek ?? 0}
            </div>
            <span className="text-[10px] text-gym-muted font-mono">
              Upcoming dues
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-950/50 border border-amber-800 text-gym-amber flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </PlateCard>

        {/* Card 4: At-Risk Members */}
        <PlateCard accent="red" className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-gym-muted uppercase tracking-wider">
              AT-RISK ATTENDANCE
            </span>
            <div className="font-display text-4xl text-gym-red mt-1 leading-none">
              {stats?.atRiskMembers ?? 0}
            </div>
            <span className="text-[10px] text-red-400 font-mono">
              Drop &gt; 40% detected
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-950/50 border border-red-800 text-gym-red flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </PlateCard>
      </div>

      {/* Staff Scope Notice */}
      <div className="bg-gym-card/60 border border-gym-border/70 rounded-xl p-4 flex items-center justify-between text-xs text-gym-muted">
        <div className="flex items-center space-x-2.5">
          <Lock className="w-4 h-4 text-gym-muted" />
          <span>
            Staff permissions active. System settings, billing rules, and employee administration are managed by Gym Administrators.
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase text-gym-greenBright font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
          ROLE: STAFF
        </span>
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
                {atRiskMembers.length} member(s) have dropped attendance by more than 40% vs baseline or are overdue on fees. Reach out to motivate them!
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
              MEMBER DIRECTORY & CHECK-IN
            </h2>
            <p className="text-xs text-gym-muted">
              Search members by name or phone, log check-ins, record membership fees, and view workout history.
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

export default StaffDashboard;
