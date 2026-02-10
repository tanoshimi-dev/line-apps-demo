import { useAdminAuth } from '../hooks/useAdminAuth';

export default function AdminHeader() {
  const { user, logout } = useAdminAuth();

  return (
    <header className="admin-header">
      <div className="admin-header-title">Sweets Shop 管理画面</div>
      <div className="admin-header-user">
        <span>{user?.name} ({user?.role})</span>
        <button onClick={logout} className="btn btn-text">ログアウト</button>
      </div>
    </header>
  );
}
