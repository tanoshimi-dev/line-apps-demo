import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
import type { ReactNode } from 'react';

export default function AdminGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return <div className="admin-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
