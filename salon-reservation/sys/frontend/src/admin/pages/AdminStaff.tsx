import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminStaff } from '../services/adminApi';
import type { AdminStaffMember } from '../types';

export default function AdminStaff() {
  const [staff, setStaff] = useState<AdminStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAdminStaff()
      .then(setStaff)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page">
      <h2 className="admin-page-title">スタッフ管理</h2>

      <table className="admin-table">
        <thead>
          <tr>
            <th>名前</th>
            <th>ユーザー名</th>
            <th>専門</th>
            <th>対応メニュー</th>
            <th>状態</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((s) => (
            <tr
              key={s.id}
              className="admin-table-row-clickable"
              onClick={() => navigate(`/admin/staff/${s.id}`)}
            >
              <td>
                <div className="admin-user-cell">
                  {s.avatarUrl ? (
                    <img src={s.avatarUrl} alt={s.name} className="admin-avatar-sm" />
                  ) : (
                    <div className="admin-avatar-placeholder-sm">{s.name.charAt(0)}</div>
                  )}
                  <span>{s.name}</span>
                </div>
              </td>
              <td>{s.username}</td>
              <td>{s.specialty || '-'}</td>
              <td>{s.services.map((svc) => svc.name).join(', ') || '-'}</td>
              <td>
                <span className={`admin-badge ${s.isActive ? 'admin-badge-confirmed' : 'admin-badge-cancelled'}`}>
                  {s.isActive ? '有効' : '無効'}
                </span>
              </td>
            </tr>
          ))}
          {staff.length === 0 && (
            <tr>
              <td colSpan={5} className="admin-empty-cell">スタッフがいません</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
