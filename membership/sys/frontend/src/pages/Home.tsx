import { useNavigate } from 'react-router-dom'
import { useLiff } from '../hooks/useLiff'
import { useMember } from '../hooks/useMember'
import Header from '../components/Header'
import Navigation from '../components/Navigation'
import './Home.css'

function Home() {
  const navigate = useNavigate()
  const { isLoggedIn, profile, login, loading: liffLoading } = useLiff()
  const { member, loading: memberLoading } = useMember()

  if (liffLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>読み込み中...</p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="container">
        <div className="login-prompt card">
          <h2>メンバーズカード</h2>
          <p>LINEでログインしてメンバーズカードを利用しましょう</p>
          <button className="btn-primary" onClick={login}>
            LINEでログイン
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="home-page">
      <Header profile={profile} />

      <main className="container">
        <section className="welcome-section card">
          <h2>ようこそ、{profile?.displayName}さん</h2>
          {memberLoading ? (
            <p>会員情報を読み込み中...</p>
          ) : member ? (
            <div className="member-summary">
              <div className="points-display">
                <span className="points-label">ポイント</span>
                <span className="points-value">{member.points.toLocaleString()}</span>
                <span className="points-unit">pt</span>
              </div>
              <div className="rank-badge" data-rank={member.rank}>
                {member.rank.toUpperCase()}
              </div>
            </div>
          ) : (
            <div className="register-prompt">
              <p>まだ会員登録がお済みでありません</p>
              <button
                className="btn-primary"
                onClick={() => navigate('/profile')}
              >
                会員登録する
              </button>
            </div>
          )}
        </section>

        <section className="menu-section">
          <div className="menu-grid">
            <button className="menu-item" onClick={() => navigate('/card')}>
              <span className="menu-icon">💳</span>
              <span className="menu-label">会員証</span>
            </button>
            <button className="menu-item" onClick={() => navigate('/points')}>
              <span className="menu-icon">📊</span>
              <span className="menu-label">ポイント履歴</span>
            </button>
            <button className="menu-item" onClick={() => navigate('/profile')}>
              <span className="menu-icon">👤</span>
              <span className="menu-label">プロフィール</span>
            </button>
          </div>
        </section>
      </main>

      <Navigation />
    </div>
  )
}

export default Home
