import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiff } from '../hooks/useLiff';
import { useMember } from '../hooks/useMember';
import { getReservations } from '../services/api';
import type { ReservationInfo } from '../types';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import ReservationCard from '../components/ReservationCard';

export default function Home() {
  const { user } = useLiff();
  const { member, loading: memberLoading, register } = useMember();
  const [upcoming, setUpcoming] = useState<ReservationInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (memberLoading) return;
    if (!member) {
      setLoading(false);
      return;
    }

    getReservations('upcoming')
      .then((data) => setUpcoming(data.slice(0, 3)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [member, memberLoading]);

  const handleRegister = async () => {
    try {
      await register();
    } catch {
      // Error handled in hook
    }
  };

  if (memberLoading || loading) {
    return (
      <div className="page">
        <Header user={user} />
        <main className="main-content">
          <div className="loading-spinner">読み込み中...</div>
        </main>
        <Navigation />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="page">
        <Header user={user} />
        <main className="main-content">
          <div className="welcome-section">
            <h2>ようこそ!</h2>
            <p>サロンの予約をするには、会員登録が必要です。</p>
            <button className="btn btn-primary" onClick={handleRegister}>
              会員登録する
            </button>
          </div>
        </main>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="page">
      <Header title="Salon Reservation" user={user} />
      <main className="main-content">
        <div className="welcome-section">
          <h2>こんにちは、{member.displayName}さん</h2>
        </div>

        <button
          className="btn btn-primary btn-large"
          onClick={() => navigate('/reserve')}
        >
          予約する
        </button>

        <section className="section">
          <h3 className="section-title">今後の予約</h3>
          {upcoming.length === 0 ? (
            <p className="empty-text">予約はありません</p>
          ) : (
            <div className="card-list">
              {upcoming.map((r) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  onClick={(res) => navigate(`/reservations/${res.id}`)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="quick-actions">
            <button className="btn btn-outline" onClick={() => navigate('/services')}>
              メニューを見る
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/messages')}>
              メッセージ
            </button>
          </div>
        </section>
      </main>
      <Navigation />
    </div>
  );
}
