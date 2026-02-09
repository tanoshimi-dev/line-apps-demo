import { useState } from 'react'
import { useLiff } from '../hooks/useLiff'
import { useMember } from '../hooks/useMember'
import { logout } from '../services/liff'
import Header from '../components/Header'
import Navigation from '../components/Navigation'
import './Profile.css'

function Profile() {
  const { profile } = useLiff()
  const { member, loading, register } = useMember()
  const [registering, setRegistering] = useState(false)

  const handleRegister = async () => {
    if (!profile) return

    try {
      setRegistering(true)
      await register(profile.displayName)
    } catch (error) {
      console.error('Registration failed:', error)
    } finally {
      setRegistering(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="profile-page">
      <Header profile={profile} />

      <main className="container">
        <section className="profile-section card">
          <div className="profile-header">
            {profile?.pictureUrl ? (
              <img
                src={profile.pictureUrl}
                alt={profile.displayName}
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                <span>{profile?.displayName?.charAt(0) || '?'}</span>
              </div>
            )}
            <div className="profile-info">
              <h2>{profile?.displayName || 'ゲスト'}</h2>
              {profile?.statusMessage && (
                <p className="status-message">{profile.statusMessage}</p>
              )}
            </div>
          </div>
        </section>

        {loading ? (
          <section className="member-section card">
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>会員情報を読み込み中...</p>
            </div>
          </section>
        ) : member ? (
          <section className="member-section card">
            <h3>会員情報</h3>
            <dl className="member-details">
              <div className="detail-row">
                <dt>会員番号</dt>
                <dd>{member.memberNumber}</dd>
              </div>
              <div className="detail-row">
                <dt>会員ランク</dt>
                <dd>
                  <span className="rank-badge" data-rank={member.rank}>
                    {member.rank.toUpperCase()}
                  </span>
                </dd>
              </div>
              <div className="detail-row">
                <dt>ポイント残高</dt>
                <dd>{member.points.toLocaleString()} pt</dd>
              </div>
              <div className="detail-row">
                <dt>登録日</dt>
                <dd>{formatDate(member.registeredAt)}</dd>
              </div>
            </dl>
          </section>
        ) : (
          <section className="register-section card">
            <h3>会員登録</h3>
            <p>会員登録をして、ポイントを貯めましょう</p>
            <button
              className="btn-primary"
              onClick={handleRegister}
              disabled={registering}
            >
              {registering ? '登録中...' : '会員登録する'}
            </button>
          </section>
        )}

        <section className="settings-section card">
          <h3>設定</h3>
          <ul className="settings-list">
            <li className="settings-item">
              <button className="settings-button" onClick={logout}>
                ログアウト
              </button>
            </li>
          </ul>
        </section>
      </main>

      <Navigation />
    </div>
  )
}

export default Profile
