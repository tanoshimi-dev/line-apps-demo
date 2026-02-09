import { Navigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

export default function AdminGuard() {
  const { isAuthenticated, loading } = useAdminAuth()

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-loading-spinner" />
        <p>読み込み中...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return <Outlet />
}
