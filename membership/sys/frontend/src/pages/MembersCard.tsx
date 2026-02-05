import { useState, useEffect } from 'react'
import { useMember } from '../hooks/useMember'
import { getMemberQRCode } from '../services/api'
import Header from '../components/Header'
import Navigation from '../components/Navigation'
import { useLiff } from '../hooks/useLiff'
import './MembersCard.css'

function MembersCard() {
  const { profile } = useLiff()
  const { member, loading } = useMember()
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)

  useEffect(() => {
    async function fetchQRCode() {
      if (!member) return

      try {
        setQrLoading(true)
        const { qrCodeUrl } = await getMemberQRCode()
        setQrCodeUrl(qrCodeUrl)
      } catch (error) {
        console.error('Failed to fetch QR code:', error)
      } finally {
        setQrLoading(false)
      }
    }

    fetchQRCode()
  }, [member])

  if (loading) {
    return (
      <div className="member-card-page">
        <Header profile={profile} />
        <main className="container">
          <div className="loading-card card">
            <div className="loading-spinner" />
            <p>会員証を読み込み中...</p>
          </div>
        </main>
        <Navigation />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="member-card-page">
        <Header profile={profile} />
        <main className="container">
          <div className="no-member card">
            <p>会員登録が必要です</p>
          </div>
        </main>
        <Navigation />
      </div>
    )
  }

  return (
    <div className="member-card-page">
      <Header profile={profile} />

      <main className="container">
        <div className="digital-card" data-rank={member.rank}>
          <div className="card-header">
            <span className="card-title">MEMBERS CARD</span>
            <span className="card-rank">{member.rank.toUpperCase()}</span>
          </div>

          <div className="card-qr">
            {qrLoading ? (
              <div className="qr-loading">
                <div className="loading-spinner" />
              </div>
            ) : qrCodeUrl ? (
              <img src={qrCodeUrl} alt="会員QRコード" className="qr-image" />
            ) : (
              <div className="qr-placeholder">
                <span>QR Code</span>
              </div>
            )}
          </div>

          <div className="card-info">
            <div className="member-number">
              <span className="label">会員番号</span>
              <span className="value">{member.memberNumber}</span>
            </div>
            <div className="member-name">
              <span className="label">お名前</span>
              <span className="value">{member.displayName}</span>
            </div>
          </div>

          <div className="card-points">
            <span className="points-label">ポイント残高</span>
            <span className="points-value">{member.points.toLocaleString()} pt</span>
          </div>
        </div>

        <div className="card-instructions card">
          <h3>ご利用方法</h3>
          <ol>
            <li>お会計時にこの画面を提示してください</li>
            <li>店員がQRコードを読み取ります</li>
            <li>ポイントが自動的に加算されます</li>
          </ol>
        </div>
      </main>

      <Navigation />
    </div>
  )
}

export default MembersCard
