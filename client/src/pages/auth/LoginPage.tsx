import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Dumbbell, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await login(email, password);

      // Single /login, redirect by role: STAFF -> /staff/dashboard, MEMBER -> /member/home
      if (user.role === 'STAFF') {
        navigate('/staff/dashboard');
      } else {
        navigate('/member/home');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to authenticate. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gym-darkest flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gym-red/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gym-green/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gym-red to-red-800 shadow-glow-red mb-4">
          <Dumbbell className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-display text-4xl text-white tracking-wider">
          GYMMATE<span className="text-gym-red">.AI</span>
        </h1>
        <p className="mt-2 text-sm text-gym-muted">
          AI-Powered Gym Management & High-Performance Member Experience
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-gym-card border-2 border-gym-border rounded-2xl p-6 sm:p-8 shadow-plate">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@gymmate.ai"
                className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white placeholder-gym-muted focus:outline-none focus:border-gym-red"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gym-subtext uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-gym-muted hover:text-gym-red transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white placeholder-gym-muted focus:outline-none focus:border-gym-red"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold tracking-wider text-white bg-gym-red hover:bg-gym-redHover disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-glow-red mt-2"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN TO PORTAL'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gym-muted">
            New member?{' '}
            <Link to="/register" className="font-bold text-gym-red hover:underline">
              Self-register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
