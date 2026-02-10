import { NavLink } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

export default function AdminSidebar() {
  const { user } = useAdminAuth();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">Sweets Shop</div>
      <nav className="admin-sidebar-nav">
        <NavLink to="/admin" end>ダッシュボード</NavLink>
        <NavLink to="/admin/categories">カテゴリ管理</NavLink>
        <NavLink to="/admin/items">商品管理</NavLink>
        <NavLink to="/admin/stock">在庫管理</NavLink>
        <NavLink to="/admin/news">お知らせ管理</NavLink>
        <NavLink to="/admin/members">会員管理</NavLink>
        <NavLink to="/admin/point-transactions">ポイント履歴</NavLink>
        <NavLink to="/admin/review-tickets">レビューチケット</NavLink>
        <NavLink to="/admin/reviews">レビュー管理</NavLink>
        <NavLink to="/admin/qr">QRコード発行</NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/admin/settings">設定</NavLink>
        )}
      </nav>
    </aside>
  );
}
