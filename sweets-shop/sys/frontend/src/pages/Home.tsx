import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { getMemberInfo, registerMember, getNews } from '../services/api';
import type { MemberInfo, ShopNews } from '../types';

export default function Home() {
  const [member, setMember] = useState<MemberInfo | null>(null);
  const [news, setNews] = useState<ShopNews[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        let info = await getMemberInfo();
        if (info && !info.registered) {
          const result = await registerMember();
          info = result;
        }
        setMember(info);
        const newsData = await getNews();
        setNews(newsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) return <div className="page"><Header /><div className="loading">Loading...</div><Navigation /></div>;

  const balance = member?.member?.pointsBalance ?? 0;

  return (
    <div className="page">
      <Header />
      <div className="page-content">
        <div className="points-display">
          <div className="points-label">ポイント残高</div>
          <div className="points-value">{balance.toLocaleString()}<span className="points-unit">pt</span></div>
        </div>

        <div className="quick-actions">
          <Link to="/scan/earn" className="quick-action">
            <span className="quick-action-icon">🎁</span>
            <span className="quick-action-label">ポイント獲得</span>
          </Link>
          <Link to="/scan/spend" className="quick-action">
            <span className="quick-action-icon">💳</span>
            <span className="quick-action-label">ポイント使用</span>
          </Link>
          <Link to="/scan/review" className="quick-action">
            <span className="quick-action-icon">📝</span>
            <span className="quick-action-label">レビュー</span>
          </Link>
        </div>

        {news.length > 0 && (
          <div className="card">
            <div className="card-title">お知らせ</div>
            {news.slice(0, 3).map((item) => (
              <div key={item.id} className="news-item">
                <div className="news-title">{item.title}</div>
                <div className="news-date">{new Date(item.publishedAt || item.createdAt).toLocaleDateString('ja-JP')}</div>
                <div className="news-content">{item.content}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Navigation />
    </div>
  );
}
