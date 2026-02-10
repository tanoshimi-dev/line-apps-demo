import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminMemberDetail } from '../services/adminApi';
import type { AdminMemberDetail as AdminMemberDetailType } from '../types';

export default function AdminMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<AdminMemberDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getAdminMemberDetail(id).then(setMember).catch(() => navigate('/admin/members')).finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (!member) return null;

  return (
    <div>
      <button className="admin-btn admin-btn-outline" onClick={() => navigate('/admin/members')} style={{ marginBottom: 16 }}>&#8592; 戻る</button>
      <h1 className="admin-page-title">{member.displayName}</h1>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">ポイント残高</div><div className="stat-value">{member.pointsBalance.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">取引数</div><div className="stat-value">{member.pointTransactions?.length || 0}</div></div>
        <div className="stat-card"><div className="stat-label">レビュー数</div><div className="stat-value">{member.reviews?.length || 0}</div></div>
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>ポイント取引履歴</h2>
      <table className="admin-table">
        <thead><tr><th>種別</th><th>ポイント</th><th>残高</th><th>日時</th></tr></thead>
        <tbody>
          {member.pointTransactions?.map((tx) => (
            <tr key={tx.id}>
              <td><span className={`admin-badge admin-badge-${tx.type}`}>{tx.type === 'earn' ? '獲得' : '使用'}</span></td>
              <td>{tx.type === 'earn' ? '+' : '-'}{tx.points.toLocaleString()}</td>
              <td>{tx.balanceAfter.toLocaleString()}</td>
              <td>{new Date(tx.createdAt).toLocaleString('ja-JP')}</td>
            </tr>
          ))}
          {(!member.pointTransactions || member.pointTransactions.length === 0) && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>データなし</td></tr>}
        </tbody>
      </table>

      <h2 style={{ fontSize: 18, margin: '24px 0 12px' }}>レビュー</h2>
      <table className="admin-table">
        <thead><tr><th>評価</th><th>コメント</th><th>日時</th></tr></thead>
        <tbody>
          {member.reviews?.map((r) => (
            <tr key={r.id}>
              <td className="admin-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</td>
              <td>{r.comment || '-'}</td>
              <td>{new Date(r.createdAt).toLocaleString('ja-JP')}</td>
            </tr>
          ))}
          {(!member.reviews || member.reviews.length === 0) && <tr><td colSpan={3} style={{ textAlign: 'center', color: '#999' }}>データなし</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
