import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import api from '../../services/api.js';
import { Member } from '../../types/index.js';
import PlateCard from '../../components/common/PlateCard.js';
import ChalkBadge from '../../components/common/ChalkBadge.js';
import BarbellLoader from '../../components/common/BarbellLoader.js';
import { User, Mail, Lock, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export const MemberProfile: React.FC = () => {
  const { user } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.memberId) return;
      try {
        setLoading(true);
        const res = await api.get(`/members/${user.memberId}`);
        setMember(res.data);
        setName(res.data.name);
      } catch (e) {
        console.error('Failed to load profile', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    try {
      setSaving(true);
      setStatusMessage(null);
      await api.put(`/members/${member.id}`, { name });
      setStatusMessage({ type: 'success', text: 'Profile details updated successfully!' });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !member) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <BarbellLoader text="Loading Profile..." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
          MEMBER PROFILE & SETTINGS
        </h1>
        <p className="text-xs sm:text-sm text-gym-muted">
          Manage your personal details, contact preferences, and membership records.
        </p>
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

      {/* Account Overview Plate */}
      <PlateCard className="flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-full bg-gym-plate border border-gym-border flex items-center justify-center font-display text-2xl text-white">
            {member.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-lg">{member.name}</h3>
              <ChalkBadge status={member.membershipStatus} />
            </div>
            <p className="text-xs text-gym-muted">
              Member since {new Date(member.joinDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs text-gym-muted">
          <span className="block text-white font-bold">${member.feeAmount.toFixed(2)}/mo</span>
          <span>Renewal: {new Date(member.feeDueDate).toLocaleDateString()}</span>
        </div>
      </PlateCard>

      {/* Profile Edit Form */}
      <PlateCard accent="red">
        <div className="flex items-center space-x-2.5 border-b border-gym-border pb-3 mb-5">
          <User className="w-5 h-5 text-gym-red" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Contact Information
          </h3>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white focus:outline-none focus:border-gym-red"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1">
              Registered Email (Login ID)
            </label>
            <input
              type="email"
              disabled
              value={member.email || user?.email || ''}
              className="w-full px-3.5 py-2.5 bg-gym-plate/50 border border-gym-border rounded-xl text-sm text-gym-muted cursor-not-allowed"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gym-red hover:bg-gym-redHover disabled:opacity-50 text-white text-xs font-bold tracking-wider transition-colors shadow-glow-red"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'SAVING...' : 'SAVE CHANGES'}</span>
            </button>
          </div>
        </form>
      </PlateCard>
    </div>
  );
};

export default MemberProfile;
