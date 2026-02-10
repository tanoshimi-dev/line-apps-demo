import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReservation, cancelReservation } from '../services/api';
import type { ReservationInfo } from '../types';
import Header from '../components/Header';
import Navigation from '../components/Navigation';

const statusLabels: Record<string, string> = {
  pending: '確認待ち',
  confirmed: '確認済み',
  in_progress: '施術中',
  completed: '完了',
  cancelled: 'キャンセル',
  no_show: '未来店',
};

export default function ReservationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [reservation, setReservation] = useState<ReservationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    getReservation(id)
      .then(setReservation)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      await cancelReservation(id);
      setReservation((prev) =>
        prev ? { ...prev, status: 'cancelled' } : null
      );
      setShowCancelConfirm(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'キャンセルに失敗しました');
    } finally {
      setCancelling(false);
    }
  };

  const canCancel =
    reservation &&
    (reservation.status === 'pending' || reservation.status === 'confirmed');

  if (loading) {
    return (
      <div className="page">
        <Header title="予約詳細" />
        <main className="main-content">
          <div className="loading-spinner">読み込み中...</div>
        </main>
        <Navigation />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="page">
        <Header title="予約詳細" />
        <main className="main-content">
          <div className="empty-state">
            <p>予約が見つかりません</p>
            <button className="btn btn-primary" onClick={() => navigate('/reservations')}>
              予約一覧に戻る
            </button>
          </div>
        </main>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="page">
      <Header title="予約詳細" />
      <main className="main-content">
        <div className="detail-card">
          <div className="detail-status">
            <span className={`reservation-status status-${reservation.status}`}>
              {statusLabels[reservation.status]}
            </span>
          </div>

          <div className="detail-section">
            <h3>メニュー</h3>
            <p className="detail-value">{reservation.service.name}</p>
            {reservation.service.description && (
              <p className="detail-description">{reservation.service.description}</p>
            )}
          </div>

          <div className="detail-section">
            <h3>日時</h3>
            <p className="detail-value">
              {reservation.reservationDate} {reservation.startTime} - {reservation.endTime}
            </p>
          </div>

          <div className="detail-section">
            <h3>担当スタッフ</h3>
            <p className="detail-value">{reservation.staff.name}</p>
            {reservation.staff.specialty && (
              <p className="detail-description">{reservation.staff.specialty}</p>
            )}
          </div>

          <div className="detail-section">
            <h3>料金</h3>
            <p className="detail-value detail-price">
              ¥{reservation.service.price.toLocaleString()}
            </p>
          </div>

          {reservation.notes && (
            <div className="detail-section">
              <h3>備考</h3>
              <p className="detail-value">{reservation.notes}</p>
            </div>
          )}

          {reservation.cancelReason && (
            <div className="detail-section">
              <h3>キャンセル理由</h3>
              <p className="detail-value">{reservation.cancelReason}</p>
            </div>
          )}
        </div>

        {canCancel && !showCancelConfirm && (
          <button
            className="btn btn-danger"
            onClick={() => setShowCancelConfirm(true)}
          >
            予約をキャンセル
          </button>
        )}

        {showCancelConfirm && (
          <div className="cancel-confirm">
            <p>本当にキャンセルしますか？</p>
            <div className="cancel-actions">
              <button
                className="btn btn-danger"
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'キャンセル中...' : 'はい、キャンセルする'}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setShowCancelConfirm(false)}
              >
                戻る
              </button>
            </div>
          </div>
        )}
      </main>
      <Navigation />
    </div>
  );
}
