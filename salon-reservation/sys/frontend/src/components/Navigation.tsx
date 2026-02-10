import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'ホーム', icon: '🏠' },
  { path: '/reserve', label: '予約', icon: '📅' },
  { path: '/reservations', label: '履歴', icon: '📋' },
  { path: '/messages', label: 'メッセージ', icon: '💬' },
  { path: '/profile', label: 'マイページ', icon: '👤' },
];

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
