import { useState, useEffect } from 'react';
import { getAdminPointTransactions } from '../services/adminApi';
import type { AdminPointTransaction, PaginatedResponse } from '../types';

export default function AdminPointTransactions() {
  const [data, setData] = useState<PaginatedResponse<AdminPointTransaction> | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAdminPointTransactions({ type: typeFilter || undefined, page }).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [typeFilter, page]);

  if (loading && !data) return <div className="admin-loading">Loading...</div>;

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>ポイント履歴</h1>
        <select className="filter-select" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">すべて</option>
          <option value="earn">獲得</option>
          <option value="spend">使用</option>
        </select>
      </div>

      <table className="admin-table">
        <thead><tr><th>会員</th><th>種別</th><th>ポイント</th><th>残高</th><th>スタッフ</th><th>日時</th></tr></thead>
        <tbody>
          {data?.data.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.member?.displayName || '-'}</td>
              <td><span className={`admin-badge admin-badge-${tx.type}`}>{tx.type === 'earn' ? '獲得' : '使用'}</span></td>
              <td>{tx.type === 'earn' ? '+' : '-'}{tx.points.toLocaleString()}</td>
              <td>{tx.balanceAfter.toLocaleString()}</td>
              <td>{tx.staff?.name || '-'}</td>
              <td>{new Date(tx.createdAt).toLocaleString('ja-JP')}</td>
            </tr>
          ))}
          {data?.data.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999' }}>データなし</td></tr>}
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
