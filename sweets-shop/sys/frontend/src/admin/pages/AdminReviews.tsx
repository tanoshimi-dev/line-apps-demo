import { useState, useEffect } from 'react';
import { getAdminReviews, updateReviewVisibility } from '../services/adminApi';
import type { AdminReview, PaginatedResponse } from '../types';

export default function AdminReviews() {
  const [data, setData] = useState<PaginatedResponse<AdminReview> | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = () => { setLoading(true); getAdminReviews({ page }).then(setData).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, [page]);

  const toggleVisibility = async (id: string, current: boolean) => {
    await updateReviewVisibility(id, !current);
    load();
  };

  if (loading && !data) return <div className="admin-loading">Loading...</div>;

  return (
    <div>
      <h1 className="admin-page-title">レビュー管理</h1>
      <table className="admin-table">
        <thead><tr><th>会員</th><th>評価</th><th>コメント</th><th>表示</th><th>日時</th><th>操作</th></tr></thead>
        <tbody>
          {data?.data.map((r) => (
            <tr key={r.id}>
              <td>{r.member?.displayName || '-'}</td>
              <td className="admin-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
              <td>{r.comment || '-'}</td>
              <td><span className={`admin-badge ${r.isVisible ? 'admin-badge-visible' : 'admin-badge-hidden'}`}>{r.isVisible ? '表示' : '非表示'}</span></td>
              <td>{new Date(r.createdAt).toLocaleString('ja-JP')}</td>
              <td><button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => toggleVisibility(r.id, r.isVisible)}>{r.isVisible ? '非表示' : '表示'}</button></td>
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
