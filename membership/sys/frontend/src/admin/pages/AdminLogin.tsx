import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'

export default function AdminLogin() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 2FA state
  const [twoFactorRequired, setTwoFactorRequired] = useState(false)
  const [pendingToken, setPendingToken] = useState('')
  const [totpCode, setTotpCode] = useState('')

  const { login, verifyTwoFactor } = useAdminAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await login(username, password)
      if (response.two_factor_required) {
        setTwoFactorRequired(true)
        setPendingToken(response.token)
      } else {
        navigate('/admin')
      }
    } catch {
      setError('ユーザー名またはパスワードが正しくありません')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await verifyTwoFactor(pendingToken, totpCode)
      navigate('/admin')
    } catch {
      setError('認証コードが正しくありません')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setTwoFactorRequired(false)
    setPendingToken('')
    setTotpCode('')
    setError('')
  }

  if (twoFactorRequired) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <h1>Members Card 管理</h1>
          <p className="admin-login-subtitle">二要素認証</p>

          <form onSubmit={handleVerify2fa}>
            {error && <div className="admin-login-error">{error}</div>}

            <p className="admin-2fa-description">
              認証アプリに表示されている6桁のコードを入力してください。
              リカバリーコードも使用できます。
            </p>

            <div className="admin-form-group">
              <label htmlFor="totp-code">認証コード</label>
              <input
                id="totp-code"
                type="text"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
                autoFocus
                autoComplete="one-time-code"
                placeholder="000000"
                className="admin-2fa-code-input"
              />
            </div>

            <button type="submit" className="admin-btn-primary" disabled={loading}>
              {loading ? '確認中...' : '確認'}
            </button>
          </form>

          <button className="admin-btn-back admin-2fa-back" onClick={handleBackToLogin}>
            ログインに戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <h1>Members Card 管理</h1>
        <p className="admin-login-subtitle">管理者ログイン</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="admin-login-error">{error}</div>}

          <div className="admin-form-group">
            <label htmlFor="username">ユーザー名</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="admin-form-group">
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="admin-btn-primary" disabled={loading}>
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}
