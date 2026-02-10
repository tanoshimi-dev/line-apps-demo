import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminMembers } from '../services/adminApi';
import type { AdminMember, PaginatedResponse } from '../types';

export default function AdminMembers() {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedResponse<AdminMember> | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAdminMembers(search || undefined, page).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [search, page]);

  if (loading && !data) return <div className="admin-loading">Loading...</div>;

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>会員管理</h1>
        <input className="filter-input" placeholder="名前で検索..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <table className="admin-table">
        <thead><tr><th>名前</th><th>ポイント残高</th><th>登録日</th><th>操作</th></tr></thead>
        <tbody>
          {data?.data.map((m) => (
            <tr key={m.id}>
              <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {m.pictureUrl && <img src={m.pictureUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />}
                {m.displayName}
              </td>
              <td>{m.pointsBalance.toLocaleString()} pt</td>
              <td>{new Date(m.createdAt).toLocaleDateString('ja-JP')}</td>
              <td><button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => navigate(`/admin/members/${m.id}`)}>詳細</button></td>
            </tr>
          ))}
          {data?.data.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>会員が見つかりません</td></tr>}
        </tbody>
      </table>

      {data && data.lastPage > 1 && (
        <div className="admin-pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>前へ</button>
          <span style={{ padding: '6px 12px' }}>{page} / {data.lastPage}</span>
          <button disabled={page >= data.lastPage} onClick={() => setPage(page + 1)}>次へ</button>
        </div>
      )}
    </div>
  );
}
