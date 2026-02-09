import { useAdminAuth } from '../hooks/useAdminAuth'

export default function AdminHeader() {
  const { user, logout } = useAdminAuth()

  return (
    <header className="admin-header">
      <div className="admin-header-title">
        <h1>Members Card 管理</h1>
      </div>
      <div className="admin-header-user">
        <span className="admin-header-name">{user?.name}</span>
        <span className="admin-header-role">{user?.role === 'admin' ? '管理者' : 'オペレーター'}</span>
        <button className="admin-header-logout" onClick={logout}>
          ログアウト
        </button>
      </div>
    </header>
  )
}
