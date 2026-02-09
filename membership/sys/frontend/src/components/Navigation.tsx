import { useLocation, useNavigate } from 'react-router-dom'
import './Navigation.css'

interface NavItem {
  path: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { path: '/', label: 'ホーム', icon: '🏠' },
  { path: '/card', label: '会員証', icon: '💳' },
  { path: '/scan?mode=earn', label: 'スキャン', icon: '📷' },
  { path: '/points', label: '履歴', icon: '📊' },
  { path: '/profile', label: 'マイページ', icon: '👤' },
]

function isActive(itemPath: string, currentPath: string): boolean {
  const itemPathname = itemPath.split('?')[0]
  return currentPath === itemPathname
}

function Navigation() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.path}
          className={`nav-item ${isActive(item.path, location.pathname) ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default Navigation
