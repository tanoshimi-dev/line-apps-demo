import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { setup2fa, confirm2fa, disable2fa, get2faStatus } from '../services/adminApi'

type Step = 'idle' | 'setup' | 'verify' | 'recovery' | 'disable'

export default function TwoFactorSetup() {
  const [step, setStep] = useState<Step>('idle')
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Setup state
  const [secret, setSecret] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifying, setVerifying] = useState(false)

  // Recovery codes
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])

  // Disable state
  const [disablePassword, setDisablePassword] = useState('')
  const [disabling, setDisabling] = useState(false)

  useEffect(() => {
    get2faStatus()
      .then((res) => setEnabled(res.two_factor_enabled))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleStartSetup = async () => {
    setError('')
    setLoading(true)
    try {
      const res = await setup2fa()
      setSecret(res.secret)
      const dataUrl = await QRCode.toDataURL(res.otpauth_uri, { width: 200, margin: 2 })
      setQrDataUrl(dataUrl)
      setStep('setup')
    } catch (err: any) {
      setError(err.message || 'セットアップに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setVerifying(true)
    try {
      const res = await confirm2fa(verifyCode)
      setRecoveryCodes(res.recovery_codes)
      setEnabled(true)
      setStep('recovery')
    } catch (err: any) {
      setError(err.message || '確認に失敗しました')
    } finally {
      setVerifying(false)
    }
  }

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setDisabling(true)
    try {
      await disable2fa(disablePassword)
      setEnabled(false)
      setStep('idle')
      setDisablePassword('')
      setSecret('')
      setQrDataUrl('')
      setVerifyCode('')
    } catch (err: any) {
      setError(err.message || '無効化に失敗しました')
    } finally {
      setDisabling(false)
    }
  }

  if (loading) {
    return <div className="admin-page-loading">読み込み中...</div>
  }

  // Recovery codes display
  if (step === 'recovery') {
    return (
      <div className="admin-2fa-section">
        <h4>リカバリーコード</h4>
        <div className="admin-2fa-warning">
          これらのコードは安全な場所に保存してください。認証アプリが使用できない場合に必要です。
          このコードは一度しか表示されません。
        </div>
        <div className="admin-2fa-recovery-grid">
          {recoveryCodes.map((code, i) => (
            <div key={i} className="admin-2fa-recovery-code">{code}</div>
          ))}
        </div>
        <button className="admin-btn-primary" onClick={() => setStep('idle')}>
          完了
        </button>
      </div>
    )
  }

  // Disable confirmation
  if (step === 'disable') {
    return (
      <div className="admin-2fa-section">
        <h4>二要素認証を無効化</h4>
        {error && <div className="admin-error">{error}</div>}
        <form onSubmit={handleDisable}>
          <div className="admin-form-group">
            <label>パスワードを入力して確認</label>
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              required
              className="admin-input"
            />
          </div>
          <div className="admin-actions">
            <button type="submit" className="admin-btn-small admin-btn-danger" disabled={disabling}>
              {disabling ? '処理中...' : '無効化する'}
            </button>
            <button type="button" className="admin-btn-small" onClick={() => { setStep('idle'); setError('') }}>
              キャンセル
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Setup flow: show QR code
  if (step === 'setup') {
    return (
      <div className="admin-2fa-section">
        <h4>二要素認証のセットアップ</h4>
        {error && <div className="admin-error">{error}</div>}

        <p className="admin-2fa-description">
          Google Authenticator や Authy などの認証アプリで以下のQRコードをスキャンしてください。
        </p>

        <div className="admin-2fa-qr">
          <img src={qrDataUrl} alt="2FA QR Code" />
        </div>

        <div className="admin-2fa-secret">
          <span className="admin-2fa-secret-label">手動入力用シークレット:</span>
          <code className="admin-2fa-secret-value">{secret}</code>
        </div>

        <form onSubmit={handleConfirm}>
          <div className="admin-form-group">
            <label>認証アプリに表示された6桁のコードを入力</label>
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              required
              maxLength={6}
              placeholder="000000"
              className="admin-input admin-2fa-code-input"
              autoComplete="one-time-code"
            />
          </div>
          <div className="admin-actions">
            <button type="submit" className="admin-btn-primary" disabled={verifying}>
              {verifying ? '確認中...' : '有効化する'}
            </button>
            <button type="button" className="admin-btn-secondary" onClick={() => { setStep('idle'); setError('') }}>
              キャンセル
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Idle: show enable/disable button
  return (
    <div className="admin-2fa-section">
      <h4>二要素認証 (2FA)</h4>
      {error && <div className="admin-error">{error}</div>}

      {enabled ? (
        <div>
          <p className="admin-2fa-status-enabled">二要素認証は有効です</p>
          <button className="admin-btn-small admin-btn-danger" onClick={() => setStep('disable')}>
            無効化する
          </button>
        </div>
      ) : (
        <div>
          <p className="admin-2fa-status-disabled">
            二要素認証を有効にすると、ログイン時に認証コードの入力が必要になります。
          </p>
          <button className="admin-btn-primary" onClick={handleStartSetup}>
            セットアップを開始
          </button>
        </div>
      )}
    </div>
  )
}
