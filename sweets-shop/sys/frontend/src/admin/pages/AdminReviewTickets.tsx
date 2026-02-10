import { useState, useEffect } from 'react';
import { getAdminReviewTickets } from '../services/adminApi';
import type { AdminReviewTicket, PaginatedResponse } from '../types';

export default function AdminReviewTickets() {
  const [data, setData] = useState<PaginatedResponse<AdminReviewTicket> | null>(null);
  const [usedFilter, setUsedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: any = { page };
    if (usedFilter !== '') params.isUsed = usedFilter === 'true';
    getAdminReviewTickets(params).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [usedFilter, page]);

  if (loading && !data) return <div className="admin-loading">Loading...</div>;

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>レビューチケット</h1>
        <select className="filter-select" value={usedFilter} onChange={(e) => { setUsedFilter(e.target.value); setPage(1); }}>
          <option value="">すべて</option>
          <option value="false">未使用</option>
          <option value="true">使用済み</option>
        </select>
      </div>

      <table className="admin-table">
        <thead><tr><th>会員</th><th>発行者</th><th>状態</th><th>使用日</th><th>発行日</th></tr></thead>
        <tbody>
          {data?.data.map((t) => (
            <tr key={t.id}>
              <td>{t.member?.displayName || '-'}</td>
              <td>{t.issuedByAdmin?.name || '-'}</td>
              <td><span className={`admin-badge ${t.isUsed ? 'admin-badge-used' : 'admin-badge-unused'}`}>{t.isUsed ? '使用済み' : '未使用'}</span></td>
              <td>{t.usedAt ? new Date(t.usedAt).toLocaleString('ja-JP') : '-'}</td>
              <td>{new Date(t.createdAt).toLocaleString('ja-JP')}</td>
            </tr>
          ))}
          {data?.data.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#999' }}>データなし</td></tr>}
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
