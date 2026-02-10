import { useAdminAuth } from '../hooks/useAdminAuth';
import { useNavigate } from 'react-router-dom';

export default function AdminHeader() {
  const { user, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <h1>Salon Reservation Admin</h1>
      </div>
      <div className="admin-header-right">
        <span className="admin-user-name">
          {user?.name} ({user?.role})
        </span>
        <button className="admin-logout-btn" onClick={handleLogout}>
          ログアウト
        </button>
      </div>
    </header>
  );
}
