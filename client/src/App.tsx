import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { SocketProvider } from './context/SocketContext.js';
import Navbar from './components/common/Navbar.js';
import ProtectedRoute from './components/common/ProtectedRoute.js';

// Auth Pages
import LoginPage from './pages/auth/LoginPage.js';
import RegisterPage from './pages/auth/RegisterPage.js';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.js';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.js';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard.js';
import MemberDetails from './pages/staff/MemberDetails.js';
import AttendanceConsole from './pages/staff/AttendanceConsole.js';
import RemindersLog from './pages/staff/RemindersLog.js';
import SettingsPage from './pages/staff/SettingsPage.js';
import NewMemberPage from './pages/staff/NewMemberPage.js';

// Member Pages
import MemberHome from './pages/member/MemberHome.js';
import MemberAttendance from './pages/member/MemberAttendance.js';
import MemberInsight from './pages/member/MemberInsight.js';
import MemberReminders from './pages/member/MemberReminders.js';
import MemberProfile from './pages/member/MemberProfile.js';

const AppRoutes: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  const RootRedirect = () => {
    if (isLoading) return null;
    if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'STAFF') return <Navigate to="/staff/dashboard" replace />;
    return <Navigate to="/member/home" replace />;
  };

  return (
    <div className="min-h-screen bg-gym-darkest flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage initialPortal="admin" />} />
          <Route path="/staff/login" element={<LoginPage initialPortal="staff" />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Admin-Only Portal Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          {/* Legacy /staff/settings protected strictly to ADMIN */}
          <Route
            path="/staff/settings"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Staff Portal Routes (Accessible to STAFF and ADMIN) */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/members/:id"
            element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <MemberDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/attendance"
            element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <AttendanceConsole />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/reminders"
            element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <RemindersLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/members/new"
            element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <NewMemberPage />
              </ProtectedRoute>
            }
          />

          {/* Member Portal Routes */}
          <Route
            path="/member/home"
            element={
              <ProtectedRoute allowedRoles={['MEMBER']}>
                <MemberHome />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/attendance"
            element={
              <ProtectedRoute allowedRoles={['MEMBER']}>
                <MemberAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/insight"
            element={
              <ProtectedRoute allowedRoles={['MEMBER']}>
                <MemberInsight />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/reminders"
            element={
              <ProtectedRoute allowedRoles={['MEMBER']}>
                <MemberReminders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/profile"
            element={
              <ProtectedRoute allowedRoles={['MEMBER']}>
                <MemberProfile />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
