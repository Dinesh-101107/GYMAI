import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import IndianPhoneInput from '../../components/common/IndianPhoneInput.js';
import { Dumbbell, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      setError('All fields are required.');
      return;
    }

    const digits = phone.replace(/\D/g, '').replace(/^91/, '');
    if (digits.length !== 10 || !/^[6-9]/.test(digits)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await register({
        name,
        email,
        phone,
        password,
        feeAmount: 60.0,
      });

      navigate('/member/home');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gym-darkest flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-gym-red to-red-800 shadow-glow-red mb-3">
          <Dumbbell className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-display text-3xl text-white tracking-wider">
          JOIN <span className="text-gym-red">GYMMATE AI</span>
        </h1>
        <p className="mt-1 text-xs text-gym-muted">
          Self-register as a member to start tracking workouts with dynamic QR check-ins
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-gym-card border-2 border-gym-border rounded-2xl p-6 shadow-plate">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Marcus Vance"
                className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white placeholder-gym-muted focus:outline-none focus:border-gym-red"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marcus@example.com"
                className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white placeholder-gym-muted focus:outline-none focus:border-gym-red"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1">
                Mobile Number (Indian +91)
              </label>
              <IndianPhoneInput
                value={phone}
                onChange={setPhone}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white placeholder-gym-muted focus:outline-none focus:border-gym-red"
              />
            </div>

            <div className="p-3 bg-gym-plate/50 rounded-xl border border-gym-border/60 text-xs text-gym-muted flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-gym-greenBright flex-shrink-0" />
              <span>Standard Monthly Tier: $60.00 / month. 30-day initial pass included.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold tracking-wider text-white bg-gym-red hover:bg-gym-redHover disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-glow-red mt-2"
            >
              <span>{loading ? 'CREATING MEMBERSHIP...' : 'ACTIVATE MEMBERSHIP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-gym-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-gym-red hover:underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
