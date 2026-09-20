import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import api from '../../services/api.js';
import PlateCard from '../../components/common/PlateCard.js';
import WeightPlateStreak from '../../components/common/WeightPlateStreak.js';
import AttendanceCalendar from '../../components/member/AttendanceCalendar.js';
import MemberScanner from '../../components/member/MemberScanner.js';
import BarbellLoader from '../../components/common/BarbellLoader.js';
import { Award, Calendar, Clock, Activity, Camera } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const MemberAttendance: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    if (!user?.memberId) return;
    try {
      setLoading(true);
      const res = await api.get(`/attendance/member/${user.memberId}`);
      setStats(res.data);
    } catch (e) {
      console.error('Failed to load attendance statistics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  if (loading || !stats) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <BarbellLoader text="Calculating Attendance Streaks..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
          ATTENDANCE SCANNER & STREAK
        </h1>
        <p className="text-xs sm:text-sm text-gym-muted">
          Scan the front-desk QR code with your camera to check in, track monthly consistency, and rack plates.
        </p>
      </div>

      {/* 1. Stacked Olympic Weight Plate Barbell Streak Visualizer */}
      <WeightPlateStreak
        currentVisits={stats.totalVisitsThisMonth || 0}
        monthlyTarget={16}
      />

      {/* 2. Main Layout: Left Column = Member Camera Scanner, Right Column = Calendar & Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (5 cols): Member Scanner */}
        <div className="lg:col-span-5 space-y-6">
          <MemberScanner onCheckInSuccess={fetchStats} />

          {/* Quick Stats Plate */}
          <PlateCard className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-gym-plate/40 rounded-xl border border-gym-border/60">
              <span className="text-[10px] font-bold text-gym-muted uppercase tracking-wider block">
                Total All-Time Visits
              </span>
              <span className="font-display text-3xl text-white mt-1 block">
                {stats.allTimeVisits}
              </span>
            </div>

            <div className="p-3 bg-gym-plate/40 rounded-xl border border-gym-border/60">
              <span className="text-[10px] font-bold text-gym-muted uppercase tracking-wider block">
                Last Check-In
              </span>
              <span className="font-mono text-xs font-bold text-gym-greenBright mt-2 block">
                {stats.lastVisit
                  ? new Date(stats.lastVisit).toLocaleDateString()
                  : 'None'}
              </span>
            </div>
          </PlateCard>
        </div>

        {/* Right Column (7 cols): Calendar & Monthly Trend */}
        <div className="lg:col-span-7 space-y-6">
          {/* Monthly Attendance Calendar */}
          <AttendanceCalendar logs={stats.logs || []} />

          {/* Monthly Trend Recharts */}
          <PlateCard className="space-y-4">
            <div className="flex items-center justify-between border-b border-gym-border pb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-gym-red" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  6-MONTH VISIT VELOCITY
                </h3>
              </div>
              <span className="text-xs text-gym-muted font-mono">
                Consistency Tracker
              </span>
            </div>

            <div className="h-56 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#282830" vertical={false} />
                  <XAxis dataKey="month" stroke="#8E8E9F" fontSize={12} tickLine={false} />
                  <YAxis stroke="#8E8E9F" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181C', borderColor: '#2A2A32', borderRadius: '8px' }}
                    labelStyle={{ color: '#FFFFFF', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="visits" fill="#E63946" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </PlateCard>
        </div>
      </div>
    </div>
  );
};

export default MemberAttendance;
