import { NavLink } from 'react-router-dom';

export default function Navigation() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🏠</span>
        <span className="nav-label">ホーム</span>
      </NavLink>
      <NavLink to="/gallery" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">🍰</span>
        <span className="nav-label">ギャラリー</span>
      </NavLink>
      <NavLink to="/scan/earn" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">📷</span>
        <span className="nav-label">スキャン</span>
      </NavLink>
      <NavLink to="/points" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">💰</span>
        <span className="nav-label">ポイント</span>
      </NavLink>
      <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">👤</span>
        <span className="nav-label">マイページ</span>
      </NavLink>
    </nav>
  );
}
