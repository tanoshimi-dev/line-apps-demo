import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminReservations } from '../services/adminApi';
import type { AdminReservation } from '../types';

const statusLabels: Record<string, string> = {
  pending: '確認待ち',
  confirmed: '確認済み',
  in_progress: '施術中',
  completed: '完了',
  cancelled: 'キャンセル',
  no_show: '未来店',
};

export default function AdminReservations() {
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getAdminReservations({
      date: dateFilter || undefined,
      status: statusFilter || undefined,
      page,
    })
      .then((data) => {
        setReservations(data.data);
        setLastPage(data.last_page);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dateFilter, statusFilter, page]);

  return (
    <div className="admin-page">
      <h2 className="admin-page-title">予約管理</h2>

      <div className="admin-filters">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          className="admin-input"
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="admin-select"
        >
          <option value="">全ステータス</option>
          <option value="pending">確認待ち</option>
          <option value="confirmed">確認済み</option>
          <option value="in_progress">施術中</option>
          <option value="completed">完了</option>
          <option value="cancelled">キャンセル</option>
          <option value="no_show">未来店</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">Loading...</div>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>日付</th>
                <th>時間</th>
                <th>お客様</th>
                <th>メニュー</th>
                <th>担当</th>
                <th>ステータス</th>
                <th>料金</th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr
                  key={r.id}
                  className="admin-table-row-clickable"
                  onClick={() => navigate(`/admin/reservations/${r.id}`)}
                >
                  <td>{r.reservationDate}</td>
                  <td>{r.startTime} - {r.endTime}</td>
                  <td>{r.member.displayName}</td>
                  <td>{r.service.name}</td>
                  <td>{r.staff.name}</td>
                  <td>
                    <span className={`admin-badge admin-badge-${r.status}`}>
                      {statusLabels[r.status] || r.status}
                    </span>
                  </td>
                  <td>¥{r.service.price.toLocaleString()}</td>
                </tr>
              ))}
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-empty-cell">
                    予約がありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {lastPage > 1 && (
            <div className="admin-pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="admin-btn admin-btn-sm"
              >
                前へ
              </button>
              <span>
                {page} / {lastPage}
              </span>
              <button
                disabled={page >= lastPage}
                onClick={() => setPage(page + 1)}
                className="admin-btn admin-btn-sm"
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
