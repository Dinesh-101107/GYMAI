import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext.js';
import {
  Dumbbell,
  AlertCircle,
  ArrowRight,
  Shield,
  Briefcase,
} from 'lucide-react';

type LoginPortal = 'admin' | 'staff';

interface LoginPageProps {
  initialPortal?: LoginPortal;
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialPortal: propPortal }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Normalize path to safely ignore trailing slashes (e.g. Netlify Pretty URLs '/staff/login/')
  const normalizedPath = location.pathname.replace(/\/+$/, '');
  const isStaffPath =
    propPortal === 'staff' ||
    normalizedPath === '/staff/login' ||
    searchParams.get('portal') === 'staff';

  const [portal, setPortal] = useState<LoginPortal>(isStaffPath ? 'staff' : 'admin');

  // Admin / General login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Staff login state
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();

  const hasGoogleClientId = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  // Sync portal with URL or route prop changes (e.g., direct navigation or back/forward)
  useEffect(() => {
    const currentNormalized = location.pathname.replace(/\/+$/, '');
    if (
      propPortal === 'staff' ||
      currentNormalized === '/staff/login' ||
      searchParams.get('portal') === 'staff'
    ) {
      setPortal('staff');
    } else if (
      propPortal === 'admin' ||
      currentNormalized === '/login'
    ) {
      setPortal('admin');
    }
  }, [propPortal, location.pathname, searchParams]);

  const handlePortalSwitch = (newPortal: LoginPortal) => {
    setPortal(newPortal);
    setError(null);
    if (newPortal === 'staff') {
      navigate('/staff/login');
    } else {
      navigate('/login');
    }
  };

  // Real Email/Password Admin & General Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      setError('Please provide both email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await login(adminEmail, adminPassword);

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'STAFF') {
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

  // Real Email/Password Staff Login
  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffEmail || !staffPassword) {
      setError('Please provide staff email and password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await login(staffEmail, staffPassword);

      // Verify role for staff portal
      if (user.role === 'MEMBER') {
        setError('Access Denied: This portal is reserved for Gym Staff. Members please use the Member Login.');
        return;
      }

      // Successful staff login redirects to Staff Dashboard
      navigate('/staff/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Staff authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Real Google Sign-In Handler
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google Sign-In did not return a credential token.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await loginWithGoogle(credentialResponse.credential);

      // If user attempted to log in through the staff portal but their role is MEMBER
      if (portal === 'staff' && user.role === 'MEMBER') {
        setError('Access Denied: This portal is reserved for Gym Staff. Members please use the Member portal.');
        return;
      }

      // Role-based routing preserving existing database permissions
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'STAFF') {
        navigate('/staff/dashboard');
      } else {
        navigate('/member/home');
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      const serverError =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (err.code === 'ERR_NETWORK' || !err.response
          ? 'Unable to connect to backend server. Please verify the backend is running on port 5000.'
          : null) ||
        err.message ||
        'Google authentication failed. Please check your account.';
      setError(serverError);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In popup closed or failed to initialize. Please try again.');
  };

  return (
    <div className="min-h-screen bg-gym-darkest flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Glow Rings */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gym-red/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gym-green/10 rounded-full blur-3xl pointer-events-none" />

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
        {/* Portal Switcher Tabs */}
        <div className="bg-gym-card/80 border-2 border-gym-border rounded-2xl p-1 mb-4 flex shadow-plate">
          <button
            type="button"
            onClick={() => handlePortalSwitch('admin')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold tracking-wider flex items-center justify-center space-x-2 transition-all ${
              portal === 'admin'
                ? 'bg-gym-red text-white shadow-glow-red'
                : 'text-gym-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>ADMIN / GENERAL</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch('staff')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold tracking-wider flex items-center justify-center space-x-2 transition-all ${
              portal === 'staff'
                ? 'bg-gym-green text-white shadow-glow-green'
                : 'text-gym-muted hover:text-white hover:bg-white/5'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>STAFF LOGIN</span>
          </button>
        </div>

        {/* Login Card */}
        <div className="bg-gym-card border-2 border-gym-border rounded-2xl p-6 sm:p-8 shadow-plate relative">
          {/* Header indicator for active portal */}
          <div className="mb-5 pb-3 border-b border-gym-border/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {portal === 'staff' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-gym-green animate-pulse" />
                  <span className="text-xs font-mono font-bold tracking-wider text-gym-greenBright uppercase">
                    STAFF ACCESS PORTAL
                  </span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-gym-red animate-pulse" />
                  <span className="text-xs font-mono font-bold tracking-wider text-gym-red uppercase">
                    ADMIN & MEMBER ACCESS
                  </span>
                </>
              )}
            </div>

            <span className="text-[11px] text-gym-muted font-mono">
              {portal === 'staff' ? 'Operational Desk' : 'Executive / Member'}
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ==================== 1. STAFF LOGIN FORM ==================== */}
          {portal === 'staff' ? (
            <div className="space-y-5">
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1.5">
                    Staff Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    placeholder="coach@gymmate.ai"
                    className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white placeholder-gym-muted focus:outline-none focus:border-gym-green"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gym-subtext uppercase tracking-wider">
                      Staff Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-gym-muted hover:text-gym-green transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    required
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white placeholder-gym-muted focus:outline-none focus:border-gym-green"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold tracking-wider text-white bg-gym-green hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-glow-green"
                >
                  <span>{loading ? 'AUTHENTICATING STAFF...' : 'SIGN IN TO STAFF DASHBOARD'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gym-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gym-card px-3 text-gym-muted font-mono uppercase tracking-wider">
                    OR
                  </span>
                </div>
              </div>

              {/* Continue with Google */}
              <div className="flex justify-center w-full">
                {hasGoogleClientId ? (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_black"
                    shape="rectangular"
                    size="large"
                    text="continue_with"
                    width="360"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setError(
                        'Google Sign-In is not configured yet. Please set VITE_GOOGLE_CLIENT_ID in client/.env'
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-xl border border-gym-border bg-gym-darkest text-white text-xs font-semibold flex items-center justify-center space-x-2 hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                )}
              </div>

              <div className="pt-2 text-center text-xs text-gym-muted">
                Need staff credentials? Contact your{' '}
                <button
                  type="button"
                  onClick={() => handlePortalSwitch('admin')}
                  className="font-bold text-gym-red hover:underline"
                >
                  Gym Administrator
                </button>
              </div>
            </div>
          ) : (
            /* ==================== 2. ADMIN / GENERAL LOGIN FORM ==================== */
            <div className="space-y-5">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gym-subtext uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@gymmate.ai"
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
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 bg-gym-darkest border border-gym-border rounded-xl text-sm text-white placeholder-gym-muted focus:outline-none focus:border-gym-red"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold tracking-wider text-white bg-gym-red hover:bg-gym-redHover disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-glow-red"
                >
                  <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN TO PORTAL'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gym-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-gym-card px-3 text-gym-muted font-mono uppercase tracking-wider">
                    OR
                  </span>
                </div>
              </div>

              {/* Continue with Google */}
              <div className="flex justify-center w-full">
                {hasGoogleClientId ? (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_black"
                    shape="rectangular"
                    size="large"
                    text="continue_with"
                    width="360"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setError(
                        'Google Sign-In is not configured yet. Please set VITE_GOOGLE_CLIENT_ID in client/.env'
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-xl border border-gym-border bg-gym-darkest text-white text-xs font-semibold flex items-center justify-center space-x-2 hover:bg-white/5 transition-colors"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-gym-border/40 text-center text-xs text-gym-muted flex items-center justify-between">
                <span>
                  Are you gym staff?{' '}
                  <button
                    type="button"
                    onClick={() => handlePortalSwitch('staff')}
                    className="font-bold text-gym-greenBright hover:underline"
                  >
                    Staff Login &rarr;
                  </button>
                </span>
                <span>
                  New member?{' '}
                  <Link to="/register" className="font-bold text-gym-red hover:underline">
                    Register
                  </Link>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
