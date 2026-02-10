import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

const menuItems = [
  { path: '/admin', label: 'ダッシュボード', icon: '📊' },
  { path: '/admin/reservations', label: '予約管理', icon: '📅' },
  { path: '/admin/services', label: 'メニュー管理', icon: '✂️' },
  { path: '/admin/staff', label: 'スタッフ管理', icon: '👤' },
  { path: '/admin/members', label: '会員管理', icon: '👥' },
];

const adminOnlyItems = [
  { path: '/admin/settings', label: '設定', icon: '⚙️' },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAdminAuth();

  const allItems = user?.role === 'admin' ? [...menuItems, ...adminOnlyItems] : menuItems;

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <h2>Salon Admin</h2>
      </div>
      <nav className="admin-nav">
        {allItems.map((item) => (
          <button
            key={item.path}
            className={`admin-nav-item ${
              location.pathname === item.path ? 'active' : ''
            }`}
            onClick={() => navigate(item.path)}
          >
            <span className="admin-nav-icon">{item.icon}</span>
            <span className="admin-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
