import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Role } from '../../types/index.js';
import BarbellLoader from './BarbellLoader.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gym-darkest flex flex-col items-center justify-center p-4">
        <BarbellLoader text="Racking Gym Data..." />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role mismatch: redirect to their respective primary home
    let redirectTarget = '/member/home';
    if (user.role === 'ADMIN') {
      redirectTarget = '/admin/dashboard';
    } else if (user.role === 'STAFF') {
      redirectTarget = '/staff/dashboard';
    }
    return <Navigate to={redirectTarget} replace state={{ unauthorized: true, attempted: location.pathname }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
