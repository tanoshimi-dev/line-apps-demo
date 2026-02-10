import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { getMemberInfo, getMyReviews } from '../services/api';
import { logout } from '../services/liff';
import type { MemberInfo, Review } from '../types';

export default function Profile() {
  const navigate = useNavigate();
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMemberInfo(), getMyReviews()])
      .then(([info, revs]) => {
        setMember(info);
        setReviews(revs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><Header /><div className="loading">Loading...</div><Navigation /></div>;

  const m = member?.member;

  return (
    <div className="page">
      <Header />
      <div className="profile-header">
        <div className="profile-avatar">
          {m?.pictureUrl ? <img src={m.pictureUrl} alt="" /> : '👤'}
        </div>
        <div className="profile-name">{m?.displayName || 'ゲスト'}</div>
      </div>

      <div className="page-content">
        <div className="points-display">
          <div className="points-label">ポイント残高</div>
          <div className="points-value">{(m?.pointsBalance ?? 0).toLocaleString()}<span className="points-unit">pt</span></div>
        </div>

        <div className="profile-section">
          <div className="profile-section-title">マイレビュー</div>
          {reviews.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-text">まだレビューがありません</div>
              </div>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="card">
                <div style={{ color: '#ffd700', marginBottom: 4 }}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                {review.comment && <div style={{ fontSize: 14, color: '#666' }}>{review.comment}</div>}
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {new Date(review.createdAt).toLocaleDateString('ja-JP')}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <button className="btn btn-danger btn-block" onClick={() => { logout(); navigate('/guest'); }}>
            ログアウト
          </button>
        </div>
      </div>
      <Navigation />
    </div>
  );
}
