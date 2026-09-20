import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api.js';
import PlateCard from '../../components/common/PlateCard.js';
import { ArrowLeft, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

export const NewMemberPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [feeAmount, setFeeAmount] = useState('2000');
  const [membershipStatus, setMembershipStatus] = useState('active');
  const [password, setPassword] = useState('MemberPass123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Name and email are required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/members', {
        name,
        email,
        feeAmount: Number(feeAmount),
        membershipStatus,
        password,
      });

      navigate(`/staff/members/${res.data.member.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create member record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link
        to="/staff/dashboard"
        className="inline-flex items-center space-x-1.5 text-xs text-gym-muted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Staff Dashboard</span>
      </Link>

      <div>
        <h1 className="font-display text-3xl sm:text-4xl text-white tracking-wide">
          REGISTER NEW MEMBER
        </h1>
        <p className="text-xs sm:text-sm text-gym-muted">
          Staff onboarding portal for new gym club members.
        </p>
      </div>

      <PlateCard accent="red">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1.5">
                Full Legal Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Elena Rostova"
                className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white placeholder-gym-muted focus:outline-none focus:border-gym-red"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1.5">
                Email Address (Login Username)
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="elena@example.com"
                className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white placeholder-gym-muted focus:outline-none focus:border-gym-red"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1.5">
                Monthly Fee Rate (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white focus:outline-none focus:border-gym-red"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1.5">
                Initial Membership Status
              </label>
              <select
                value={membershipStatus}
                onChange={(e) => setMembershipStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white focus:outline-none focus:border-gym-red"
              >
                <option value="active">Active (Full Access)</option>
                <option value="expired">Expired (Pending Payment)</option>
                <option value="frozen">Frozen (Medical/Travel Hold)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1.5">
              Initial Temporary Password
            </label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white font-mono focus:outline-none focus:border-gym-red"
            />
            <p className="text-[11px] text-gym-muted mt-1">
              Member can change this anytime from their Member Portal profile.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gym-border">
            <Link
              to="/staff/dashboard"
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gym-subtext hover:text-white bg-gym-plate border border-gym-border transition-colors"
            >
              CANCEL
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gym-red hover:bg-gym-redHover disabled:opacity-50 text-white text-xs font-bold tracking-wider transition-colors shadow-glow-red"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'ONBOARDING...' : 'ENROLL MEMBER'}</span>
            </button>
          </div>
        </form>
      </PlateCard>
    </div>
  );
};

export default NewMemberPage;
