import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { DashboardStats } from '../types'
import { getDashboard } from '../services/adminApi'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="admin-page-loading">読み込み中...</div>
  }

  if (!stats) {
    return <div className="admin-page-error">データの取得に失敗しました</div>
  }

  return (
    <div className="admin-page">
      <h2>ダッシュボード</h2>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.total_members.toLocaleString()}</div>
          <div className="admin-stat-label">総会員数</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.total_points_issued.toLocaleString()}</div>
          <div className="admin-stat-label">発行ポイント合計</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.total_points_used.toLocaleString()}</div>
          <div className="admin-stat-label">利用ポイント合計</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-value">{stats.today_transactions.toLocaleString()}</div>
          <div className="admin-stat-label">本日の取引数</div>
        </div>
      </div>

      <div className="admin-section">
        <h3>ランク別会員数</h3>
        <div className="admin-rank-grid">
          {(['platinum', 'gold', 'silver', 'bronze'] as const).map(rank => (
            <div key={rank} className={`admin-rank-card rank-${rank}`}>
              <div className="admin-rank-count">
                {stats.members_by_rank[rank].toLocaleString()}
              </div>
              <div className="admin-rank-label">{rank}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-section">
        <h3>最近の取引</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>日時</th>
              <th>会員</th>
              <th>種別</th>
              <th>ポイント</th>
              <th>理由</th>
            </tr>
          </thead>
          <tbody>
            {stats.recent_transactions.map(tx => (
              <tr key={tx.id} onClick={() => navigate('/admin/transactions')} style={{ cursor: 'pointer' }}>
                <td>{new Date(tx.created_at).toLocaleString('ja-JP')}</td>
                <td>{tx.member_name}</td>
                <td>
                  <span className={`admin-badge ${tx.type === 'add' ? 'badge-add' : 'badge-use'}`}>
                    {tx.type === 'add' ? '付与' : '利用'}
                  </span>
                </td>
                <td className={tx.type === 'add' ? 'text-add' : 'text-use'}>
                  {tx.type === 'add' ? '+' : '-'}{tx.points.toLocaleString()}
                </td>
                <td>{tx.reason}</td>
              </tr>
            ))}
            {stats.recent_transactions.length === 0 && (
              <tr><td colSpan={5} className="admin-table-empty">取引がありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
