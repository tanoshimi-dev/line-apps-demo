import type { ReservationInfo } from '../types';

interface ReservationCardProps {
  reservation: ReservationInfo;
  onClick?: (reservation: ReservationInfo) => void;
}

const statusLabels: Record<string, string> = {
  pending: '確認待ち',
  confirmed: '確認済み',
  in_progress: '施術中',
  completed: '完了',
  cancelled: 'キャンセル',
  no_show: '未来店',
};

const statusColors: Record<string, string> = {
  pending: 'status-pending',
  confirmed: 'status-confirmed',
  in_progress: 'status-in-progress',
  completed: 'status-completed',
  cancelled: 'status-cancelled',
  no_show: 'status-no-show',
};

export default function ReservationCard({ reservation, onClick }: ReservationCardProps) {
  return (
    <div
      className={`reservation-card ${onClick ? 'clickable' : ''}`}
      onClick={() => onClick?.(reservation)}
    >
      <div className="reservation-header">
        <span className="reservation-date">{reservation.reservationDate}</span>
        <span className={`reservation-status ${statusColors[reservation.status]}`}>
          {statusLabels[reservation.status]}
        </span>
      </div>
      <div className="reservation-body">
        <p className="reservation-service">{reservation.service.name}</p>
        <p className="reservation-time">
          {reservation.startTime} - {reservation.endTime}
        </p>
        <p className="reservation-staff">担当: {reservation.staff.name}</p>
      </div>
      <div className="reservation-footer">
        <span className="reservation-price">
          ¥{reservation.service.price.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
