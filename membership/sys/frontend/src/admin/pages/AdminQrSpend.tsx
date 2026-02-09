import { useState, useEffect, useRef } from 'react'
import type { QrSessionResponse, QrSessionDetail } from '../types'
import { createSpendQr, getQrSessionDetail } from '../services/adminApi'

export default function AdminQrSpend() {
  const [session, setSession] = useState<QrSessionResponse | null>(null)
  const [sessionDetail, setSessionDetail] = useState<QrSessionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const pollingRef = useRef<number | null>(null)

  const handleCreate = async () => {
    setError('')
    setLoading(true)
    setSessionDetail(null)
    try {
      const result = await createSpendQr()
      setSession(result)
      startPolling(result.id)
    } catch (err) {
      setError('QRセッションの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const startPolling = (sessionId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = window.setInterval(async () => {
      try {
        const detail = await getQrSessionDetail(sessionId)
        setSessionDetail(detail)
        if (detail.status !== 'pending') {
          if (pollingRef.current) clearInterval(pollingRef.current)
        }
      } catch {
        // keep polling
      }
    }, 2000)
  }

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const handleReset = () => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    setSession(null)
    setSessionDetail(null)
    setError('')
  }

  return (
    <div className="admin-page">
      <h2>QR: ポイント利用</h2>
      <p className="admin-page-desc">
        お客様がポイントを使用するためのQRコードを表示します。
        お客様がスキャンした後、利用ポイント数を入力して確定します。
      </p>

      {error && <div className="admin-error">{error}</div>}

      {!session ? (
        <div className="admin-qr-create">
          <button
            className="admin-btn-primary admin-btn-large"
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? '作成中...' : 'QRコードを生成'}
          </button>
        </div>
      ) : (
        <div className="admin-qr-display">
          <div className="admin-qr-code">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(session.qr_data)}`}
              alt="QR Code"
              width={300}
              height={300}
            />
          </div>

          <div className="admin-qr-status">
            {sessionDetail?.status === 'completed' ? (
              <div className="admin-qr-completed">
                <div className="admin-qr-check">&#10003;</div>
                <h3>ポイント利用完了</h3>
                <p>会員: {sessionDetail.member_name} ({sessionDetail.member_number})</p>
                <p>利用ポイント: {sessionDetail.points?.toLocaleString()} pt</p>
              </div>
            ) : sessionDetail?.status === 'expired' ? (
              <div className="admin-qr-expired">
                <h3>有効期限切れ</h3>
                <p>このQRコードは有効期限が切れました。</p>
              </div>
            ) : (
              <div className="admin-qr-waiting">
                <div className="admin-loading-spinner" />
                <h3>お客様のスキャンを待っています...</h3>
                <p>有効期限: {new Date(session.expires_at).toLocaleTimeString('ja-JP')}</p>
              </div>
            )}
          </div>

          <button className="admin-btn-secondary" onClick={handleReset}>
            新しいQRコードを生成
          </button>
        </div>
      )}
    </div>
  )
}
