import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { FeeReminder } from '../../types/index.js';
import PlateCard from '../../components/common/PlateCard.js';
import BarbellLoader from '../../components/common/BarbellLoader.js';
import { Bell, Mail, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MemberReminders: React.FC = () => {
  const [reminders, setReminders] = useState<FeeReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        setLoading(true);
        const res = await api.get('/reminders/my-reminders');
        setReminders(res.data);
      } catch (e) {
        console.error('Failed to load member reminders', e);
      } finally {
        setLoading(false);
      }
    };
    fetchReminders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <BarbellLoader text="Fetching Member Notifications..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
          MEMBERSHIP NOTIFICATIONS
        </h1>
        <p className="text-xs sm:text-sm text-gym-muted">
          Your fee renewal alerts, gym announcements, and motivational touchpoints.
        </p>
      </div>

      <PlateCard className="p-0 overflow-hidden">
        <div className="divide-y divide-gym-border/50">
          {reminders.length === 0 ? (
            <div className="py-12 text-center text-gym-muted space-y-2">
              <CheckCircle2 className="w-8 h-8 text-gym-greenBright mx-auto opacity-70" />
              <p className="text-sm font-bold text-white">No Unread Reminders</p>
              <p className="text-xs">Your membership account is fully up to date.</p>
            </div>
          ) : (
            reminders.map((rem) => (
              <div key={rem.id} className="p-5 space-y-3 hover:bg-gym-plate/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-gym-plate text-gym-red border border-gym-border">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">
                      GymMate Notification
                    </span>
                  </div>

                  <span className="text-xs text-gym-muted font-mono">
                    {new Date(rem.sentAt).toLocaleDateString()} at{' '}
                    {new Date(rem.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-sm text-zinc-200 bg-gym-darkest/50 p-3.5 rounded-xl border border-gym-border/60">
                  {rem.message}
                </p>

                <div className="flex items-center justify-end space-x-3 pt-1">
                  <Link
                    to="/member/home"
                    className="inline-flex items-center space-x-1 text-xs font-bold text-gym-red hover:underline"
                  >
                    <span>View Membership & Pay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </PlateCard>
    </div>
  );
};

export default MemberReminders;
