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
    return <Navigate to={user.role === 'STAFF' ? '/staff/dashboard' : '/member/home'} replace />;
  };

  return (
    <div className="min-h-screen bg-gym-darkest flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Staff Portal Routes */}
          <Route
            path="/staff/dashboard"
            element={
              <ProtectedRoute allowedRoles={['STAFF']}>
                <StaffDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/members/:id"
            element={
              <ProtectedRoute allowedRoles={['STAFF']}>
                <MemberDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/attendance"
            element={
              <ProtectedRoute allowedRoles={['STAFF']}>
                <AttendanceConsole />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/reminders"
            element={
              <ProtectedRoute allowedRoles={['STAFF']}>
                <RemindersLog />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/settings"
            element={
              <ProtectedRoute allowedRoles={['STAFF']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/members/new"
            element={
              <ProtectedRoute allowedRoles={['STAFF']}>
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
