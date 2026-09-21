import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  Dumbbell,
  Users,
  QrCode,
  Bell,
  Settings,
  User as UserIcon,
  LogOut,
  Calendar,
  Sparkles,
  PlusCircle,
  Activity,
  Shield,
  Briefcase,
} from 'lucide-react';
import ChalkBadge from './ChalkBadge.js';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) return null;

  const isAdmin = user.role === 'ADMIN';
  const isStaff = user.role === 'STAFF';

  // Distinct links per role
  const adminLinks = [
    { label: 'Admin Console', path: '/admin/dashboard', icon: Shield },
    { label: 'Staff View', path: '/staff/dashboard', icon: Activity },
    { label: 'Live Check-In', path: '/staff/attendance', icon: QrCode },
    { label: 'Reminders', path: '/staff/reminders', icon: Bell },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const staffLinks = [
    { label: 'Operations Desk', path: '/staff/dashboard', icon: Activity },
    { label: 'Live Check-In', path: '/staff/attendance', icon: QrCode },
    { label: 'Reminders', path: '/staff/reminders', icon: Bell },
  ];

  const memberLinks = [
    { label: 'Home', path: '/member/home', icon: Dumbbell },
    { label: 'QR Scanner & Streak', path: '/member/attendance', icon: QrCode },
    { label: 'AI Insights', path: '/member/insight', icon: Sparkles },
    { label: 'Reminders', path: '/member/reminders', icon: Bell },
  ];

  const links = isAdmin ? adminLinks : isStaff ? staffLinks : memberLinks;
  const brandHome = isAdmin ? '/admin/dashboard' : isStaff ? '/staff/dashboard' : '/member/home';

  return (
    <nav className="sticky top-0 z-50 bg-gym-dark/95 backdrop-blur border-b border-gym-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-6">
            <Link to={brandHome} className="flex items-center space-x-2.5 group">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center transform group-hover:scale-105 transition-transform ${
                  isStaff
                    ? 'bg-gradient-to-br from-gym-green to-emerald-800 shadow-glow-green'
                    : 'bg-gradient-to-br from-gym-red to-red-800 shadow-glow-red'
                }`}
              >
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-display text-2xl tracking-wider text-white">
                  GYMMATE<span className={isStaff ? 'text-gym-greenBright' : 'text-gym-red'}>.AI</span>
                </span>
                <span
                  className={`hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-widest border ${
                    isAdmin
                      ? 'bg-red-950/80 text-gym-red border-red-800'
                      : isStaff
                      ? 'bg-emerald-950/80 text-gym-greenBright border-emerald-800'
                      : 'bg-gym-plate text-gym-muted border-white/5'
                  }`}
                >
                  {isAdmin ? 'ADMIN PORTAL' : isStaff ? 'STAFF PORTAL' : 'MEMBER PORTAL'}
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <div className="hidden md:flex items-center space-x-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? isStaff
                          ? 'bg-gym-plate text-white border-b-2 border-gym-greenBright'
                          : 'bg-gym-plate text-white border-b-2 border-gym-red'
                        : 'text-gym-subtext hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? isStaff
                            ? 'text-gym-greenBright'
                            : 'text-gym-red'
                          : 'text-gym-muted'
                      }`}
                    />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Action Items & User Profile */}
          <div className="flex items-center space-x-3">
            {(isAdmin || isStaff) && (
              <Link
                to="/staff/members/new"
                className={`hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-bold tracking-wide transition-all shadow-sm ${
                  isStaff
                    ? 'bg-gym-green hover:bg-emerald-600'
                    : 'bg-gym-red hover:bg-gym-redHover'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>ADD MEMBER</span>
              </Link>
            )}

            {/* User badge */}
            <div className="flex items-center space-x-2.5 pl-2 border-l border-gym-border">
              <Link
                to={isAdmin ? '/admin/settings' : isStaff ? '/staff/dashboard' : '/member/profile'}
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold ${
                    isAdmin
                      ? 'bg-red-950/60 border-red-800 text-gym-red'
                      : isStaff
                      ? 'bg-emerald-950/60 border-emerald-800 text-gym-greenBright'
                      : 'bg-gym-plate border-gym-border text-gym-text'
                  }`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left text-xs leading-tight">
                  <div className="font-semibold text-white truncate max-w-[120px]">{user.name}</div>
                  <div
                    className={`text-[10px] font-mono font-bold ${
                      isAdmin
                        ? 'text-gym-red'
                        : isStaff
                        ? 'text-gym-greenBright'
                        : 'text-gym-muted'
                    }`}
                  >
                    {user.role} {user.designation ? `• ${user.designation}` : ''}
                  </div>
                </div>
              </Link>

              {user.membershipStatus && (
                <div className="hidden sm:block">
                  <ChalkBadge status={user.membershipStatus} size="sm" />
                </div>
              )}

              <button
                onClick={logout}
                title="Log Out"
                className="p-1.5 text-gym-muted hover:text-gym-red hover:bg-gym-plate rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-gym-border/50 text-xs">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex flex-col items-center py-1 px-2 rounded ${
                  isActive
                    ? isStaff
                      ? 'text-gym-greenBright font-bold'
                      : 'text-gym-red font-bold'
                    : 'text-gym-muted'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span className="text-[10px]">{link.label.split(' ')[0]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
