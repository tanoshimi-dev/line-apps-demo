import { useState, useEffect } from 'react';
import { getDashboard } from '../services/adminApi';
import type { DashboardStats } from '../types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (!stats) return <div className="admin-loading">データの取得に失敗しました</div>;

  return (
    <div>
      <h1 className="admin-page-title">ダッシュボード</h1>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">会員数</div><div className="stat-value">{stats.totalMembers}</div></div>
        <div className="stat-card"><div className="stat-label">発行ポイント合計</div><div className="stat-value">{stats.totalPointsIssued.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">使用ポイント合計</div><div className="stat-value">{stats.totalPointsSpent.toLocaleString()}</div></div>
        <div className="stat-card"><div className="stat-label">レビュー数</div><div className="stat-value">{stats.totalReviews}</div></div>
        <div className="stat-card"><div className="stat-label">商品数</div><div className="stat-value">{stats.totalItems}</div></div>
        <div className="stat-card"><div className="stat-label">未使用チケット</div><div className="stat-value">{stats.pendingReviewTickets}</div></div>
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>最近のポイント取引</h2>
      <table className="admin-table">
        <thead><tr><th>会員</th><th>種別</th><th>ポイント</th><th>日時</th></tr></thead>
        <tbody>
          {stats.recentTransactions.map((tx) => (
            <tr key={tx.id}>
              <td>{tx.member?.displayName || '-'}</td>
              <td><span className={`admin-badge admin-badge-${tx.type}`}>{tx.type === 'earn' ? '獲得' : '使用'}</span></td>
              <td>{tx.type === 'earn' ? '+' : '-'}{tx.points.toLocaleString()}</td>
              <td>{new Date(tx.createdAt).toLocaleString('ja-JP')}</td>
            </tr>
          ))}
          {stats.recentTransactions.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>データなし</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
