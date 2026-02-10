import { useState, useEffect } from 'react';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { getPointBalance, getPointTransactions } from '../services/api';
import type { PointTransaction } from '../types';

export default function PointHistory() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPointBalance(), getPointTransactions()])
      .then(([bal, txns]) => {
        setBalance(bal.balance);
        setTransactions(txns.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><Header /><div className="loading">Loading...</div><Navigation /></div>;

  return (
    <div className="page">
      <Header />
      <div className="page-content">
        <div className="points-display">
          <div className="points-label">ポイント残高</div>
          <div className="points-value">{balance.toLocaleString()}<span className="points-unit">pt</span></div>
        </div>

        <div className="card">
          <div className="card-title">ポイント履歴</div>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-text">まだポイント履歴がありません</div>
            </div>
          ) : (
            <ul className="transaction-list">
              {transactions.map((tx) => (
                <li key={tx.id} className="transaction-item">
                  <div className="transaction-info">
                    <div className={`transaction-type ${tx.type}`}>
                      {tx.type === 'earn' ? 'ポイント獲得' : 'ポイント使用'}
                    </div>
                    <div className="transaction-date">
                      {new Date(tx.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className={`transaction-points ${tx.type}`}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.points.toLocaleString()} pt
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Navigation />
    </div>
  );
}
