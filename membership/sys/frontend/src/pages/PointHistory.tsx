import { useState, useEffect } from 'react'
import { getPointHistory } from '../services/api'
import { useLiff } from '../hooks/useLiff'
import Header from '../components/Header'
import Navigation from '../components/Navigation'
import type { PointHistory as PointHistoryType } from '../types'
import './PointHistory.css'

function PointHistory() {
  const { profile } = useLiff()
  const [history, setHistory] = useState<PointHistoryType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true)
        const data = await getPointHistory()
        setHistory(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch history'))
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="point-history-page">
      <Header profile={profile} />

      <main className="container">
        <h1 className="page-title">ポイント履歴</h1>

        {loading ? (
          <div className="loading-state card">
            <div className="loading-spinner" />
            <p>履歴を読み込み中...</p>
          </div>
        ) : error ? (
          <div className="error-state card">
            <p>履歴の取得に失敗しました</p>
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state card">
            <p>ポイント履歴がありません</p>
          </div>
        ) : (
          <ul className="history-list">
            {history.map((item) => (
              <li key={item.id} className="history-item card">
                <div className="history-main">
                  <span className={`history-type ${item.type}`}>
                    {item.type === 'add' ? '+' : '-'}
                  </span>
                  <div className="history-details">
                    <span className="history-reason">{item.reason}</span>
                    <span className="history-date">{formatDate(item.createdAt)}</span>
                  </div>
                </div>
                <div className="history-points">
                  <span className={`points-change ${item.type}`}>
                    {item.type === 'add' ? '+' : '-'}{item.points.toLocaleString()}
                  </span>
                  <span className="points-balance">
                    残高: {item.balance.toLocaleString()} pt
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Navigation />
    </div>
  )
}

export default PointHistory
