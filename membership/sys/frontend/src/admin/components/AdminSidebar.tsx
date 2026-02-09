import { NavLink } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

export default function AdminSidebar() {
  const { user } = useAdminAuth()

  return (
    <nav className="admin-sidebar">
      <div className="admin-sidebar-logo">
        Members Card
      </div>
      <ul className="admin-sidebar-nav">
        <li>
          <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''}>
            ダッシュボード
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/members" className={({ isActive }) => isActive ? 'active' : ''}>
            会員管理
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/transactions" className={({ isActive }) => isActive ? 'active' : ''}>
            取引履歴
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/qr/spend" className={({ isActive }) => isActive ? 'active' : ''}>
            QR: ポイント利用
          </NavLink>
        </li>
        <li>
          <NavLink to="/admin/qr/earn" className={({ isActive }) => isActive ? 'active' : ''}>
            QR: ポイント付与
          </NavLink>
        </li>
        {user?.role === 'admin' && (
          <li>
            <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'active' : ''}>
              設定
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  )
}
