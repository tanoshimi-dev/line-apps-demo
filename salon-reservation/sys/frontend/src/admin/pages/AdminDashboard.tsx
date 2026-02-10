import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../services/adminApi';
import type { DashboardStats } from '../types';

const statusLabels: Record<string, string> = {
  pending: '確認待ち',
  confirmed: '確認済み',
  in_progress: '施術中',
  completed: '完了',
  cancelled: 'キャンセル',
  no_show: '未来店',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboard()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (!stats) return <div className="admin-error">Failed to load dashboard</div>;

  return (
    <div className="admin-page">
      <h2 className="admin-page-title">ダッシュボード</h2>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-value">{stats.totalMembers}</span>
          <span className="admin-stat-label">総会員数</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{stats.todayReservations}</span>
          <span className="admin-stat-label">本日の予約</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{stats.pendingReservations}</span>
          <span className="admin-stat-label">確認待ち</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-value">{stats.weeklyReservations}</span>
          <span className="admin-stat-label">今週の予約</span>
        </div>
      </div>

      <div className="admin-section">
        <h3>本日のスケジュール</h3>
        {stats.todaySchedule.length === 0 ? (
          <p className="admin-empty">本日の予約はありません</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>時間</th>
                <th>お客様</th>
                <th>メニュー</th>
                <th>担当</th>
                <th>ステータス</th>
              </tr>
            </thead>
            <tbody>
              {stats.todaySchedule.map((item) => (
                <tr
                  key={item.id}
                  className="admin-table-row-clickable"
                  onClick={() => navigate(`/admin/reservations/${item.id}`)}
                >
                  <td>{item.startTime} - {item.endTime}</td>
                  <td>{item.memberName}</td>
                  <td>{item.serviceName}</td>
                  <td>{item.staffName}</td>
                  <td>
                    <span className={`admin-badge admin-badge-${item.status}`}>
                      {statusLabels[item.status] || item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
