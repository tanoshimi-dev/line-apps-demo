import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { getReviewTickets, submitReview } from '../services/api';
import type { ReviewTicket } from '../types';

export default function WriteReview() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<ReviewTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getReviewTickets()
      .then((data) => {
        const unused = data.filter((t) => !t.isUsed);
        setTickets(unused);
        if (unused.length > 0) setSelectedTicket(unused[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!selectedTicket || rating === 0) return;
    setSubmitting(true);
    setError('');
    try {
      await submitReview(selectedTicket, rating, comment || undefined);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page"><Header /><div className="loading">Loading...</div><Navigation /></div>;

  if (success) {
    return (
      <div className="page">
        <Header />
        <div className="scan-result" style={{ marginTop: 40 }}>
          <div className="scan-result-icon">✨</div>
          <div className="scan-result-title">レビュー投稿完了！</div>
          <div className="scan-result-message">ご感想ありがとうございます</div>
          <button className="btn btn-primary btn-block" onClick={() => navigate('/')}>
            ホームに戻る
          </button>
        </div>
        <Navigation />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="page">
        <Header />
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-text">利用可能なレビューチケットがありません</div>
          <button className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => navigate('/scan/review')}>
            チケットを取得する
          </button>
        </div>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="page">
      <Header />
      <div className="page-content">
        <div className="section-title">レビューを書く</div>

        {tickets.length > 1 && (
          <div className="card">
            <div className="card-title">チケットを選択</div>
            <select
              className="form-select"
              value={selectedTicket}
              onChange={(e) => setSelectedTicket(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd' }}
            >
              {tickets.map((t) => (
                <option key={t.id} value={t.id}>
                  {new Date(t.createdAt).toLocaleDateString('ja-JP')} 取得
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="card">
          <div className="card-title">評価</div>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`star ${star <= rating ? 'filled' : ''}`}
                onClick={() => setRating(star)}
              >
                ★
              </span>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">コメント（任意）</div>
          <textarea
            className="review-textarea"
            placeholder="ご感想をお聞かせください..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button
          className="btn btn-primary btn-block"
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          {submitting ? '送信中...' : 'レビューを投稿する'}
        </button>
      </div>
      <Navigation />
    </div>
  );
}
