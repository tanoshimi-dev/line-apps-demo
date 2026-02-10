import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminReservation, updateReservationStatus } from '../services/adminApi';
import type { AdminReservation } from '../types';

const statusLabels: Record<string, string> = {
  pending: '確認待ち',
  confirmed: '確認済み',
  in_progress: '施術中',
  completed: '完了',
  cancelled: 'キャンセル',
  no_show: '未来店',
};

export default function AdminReservationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<AdminReservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) return;
    getAdminReservation(id)
      .then(setReservation)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!id) return;
    setUpdating(true);
    try {
      let reason: string | undefined;
      if (newStatus === 'cancelled') {
        reason = prompt('キャンセル理由を入力してください') || undefined;
      }
      await updateReservationStatus(id, newStatus, reason);
      setReservation((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (!reservation) return <div className="admin-error">Reservation not found</div>;

  const r = reservation;

  return (
    <div className="admin-page">
      <button className="admin-btn admin-btn-text" onClick={() => navigate('/admin/reservations')}>
        ← 予約一覧に戻る
      </button>

      <h2 className="admin-page-title">予約詳細</h2>

      <div className="admin-detail-grid">
        <div className="admin-detail-card">
          <h3>予約情報</h3>
          <div className="admin-detail-row">
            <span>ステータス</span>
            <span className={`admin-badge admin-badge-${r.status}`}>
              {statusLabels[r.status]}
            </span>
          </div>
          <div className="admin-detail-row">
            <span>日付</span>
            <span>{r.reservationDate}</span>
          </div>
          <div className="admin-detail-row">
            <span>時間</span>
            <span>{r.startTime} - {r.endTime}</span>
          </div>
          <div className="admin-detail-row">
            <span>メニュー</span>
            <span>{r.service.name}</span>
          </div>
          <div className="admin-detail-row">
            <span>料金</span>
            <span>¥{r.service.price.toLocaleString()}</span>
          </div>
          <div className="admin-detail-row">
            <span>担当</span>
            <span>{r.staff.name}</span>
          </div>
          {r.notes && (
            <div className="admin-detail-row">
              <span>備考</span>
              <span>{r.notes}</span>
            </div>
          )}
          {r.cancelReason && (
            <div className="admin-detail-row">
              <span>キャンセル理由</span>
              <span>{r.cancelReason}</span>
            </div>
          )}
        </div>

        <div className="admin-detail-card">
          <h3>お客様情報</h3>
          <div className="admin-detail-row">
            <span>名前</span>
            <span
              className="admin-link"
              onClick={() => navigate(`/admin/members/${r.member.id}`)}
            >
              {r.member.displayName}
            </span>
          </div>
          {r.member.phone && (
            <div className="admin-detail-row">
              <span>電話番号</span>
              <span>{r.member.phone}</span>
            </div>
          )}
        </div>
      </div>

      <div className="admin-actions">
        <h3>ステータスを変更</h3>
        <div className="admin-action-buttons">
          {r.status === 'pending' && (
            <button
              className="admin-btn admin-btn-success"
              onClick={() => handleStatusUpdate('confirmed')}
              disabled={updating}
            >
              確認する
            </button>
          )}
          {(r.status === 'confirmed') && (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => handleStatusUpdate('in_progress')}
              disabled={updating}
            >
              施術開始
            </button>
          )}
          {r.status === 'in_progress' && (
            <button
              className="admin-btn admin-btn-success"
              onClick={() => handleStatusUpdate('completed')}
              disabled={updating}
            >
              完了
            </button>
          )}
          {['pending', 'confirmed'].includes(r.status) && (
            <>
              <button
                className="admin-btn admin-btn-danger"
                onClick={() => handleStatusUpdate('cancelled')}
                disabled={updating}
              >
                キャンセル
              </button>
              <button
                className="admin-btn admin-btn-warning"
                onClick={() => handleStatusUpdate('no_show')}
                disabled={updating}
              >
                未来店
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
