import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReservations } from '../services/api';
import type { ReservationInfo } from '../types';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import ReservationCard from '../components/ReservationCard';

export default function Reservations() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [reservations, setReservations] = useState<ReservationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getReservations(tab)
      .then(setReservations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="page">
      <Header title="予約履歴" />
      <main className="main-content">
        <div className="tab-bar">
          <button
            className={`tab ${tab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setTab('upcoming')}
          >
            今後の予約
          </button>
          <button
            className={`tab ${tab === 'past' ? 'active' : ''}`}
            onClick={() => setTab('past')}
          >
            過去の予約
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">読み込み中...</div>
        ) : reservations.length === 0 ? (
          <div className="empty-state">
            <p>{tab === 'upcoming' ? '今後の予約はありません' : '過去の予約はありません'}</p>
            {tab === 'upcoming' && (
              <button className="btn btn-primary" onClick={() => navigate('/reserve')}>
                予約する
              </button>
            )}
          </div>
        ) : (
          <div className="card-list">
            {reservations.map((r) => (
              <ReservationCard
                key={r.id}
                reservation={r}
                onClick={(res) => navigate(`/reservations/${res.id}`)}
              />
            ))}
          </div>
        )}
      </main>
      <Navigation />
    </div>
  );
}
