import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import { useMember } from '../hooks/useMember'
import { addPoints, usePoints, validateQrSession, claimQrSession } from '../services/api'
import Navigation from '../components/Navigation'
import './QRScanner.css'

type Mode = 'earn' | 'spend'
type EarnStep = 'intro' | 'scanning' | 'confirm_session' | 'success' | 'error'
type SpendStep = 'scanning' | 'input' | 'confirm' | 'success' | 'error'

interface QrSessionData {
  type: 'spend' | 'earn'
  token: string
}

function parseQrSession(text: string): QrSessionData | null {
  try {
    const data = JSON.parse(text)
    if (data && (data.type === 'spend' || data.type === 'earn') && typeof data.token === 'string') {
      return data as QrSessionData
    }
  } catch {
    // Not JSON, not a session QR
  }
  return null
}

function QRScanner() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const mode: Mode = searchParams.get('mode') === 'spend' ? 'spend' : 'earn'

  const { member, refetch } = useMember()

  // Earn flow state
  const [earnStep, setEarnStep] = useState<EarnStep>('intro')
  // Spend flow state
  const [spendStep, setSpendStep] = useState<SpendStep>('scanning')

  const [scannedData, setScannedData] = useState('')
  const [pointsInput, setPointsInput] = useState('')
  const [earnedPoints, setEarnedPoints] = useState(0)
  const [usedPoints, setUsedPoints] = useState(0)
  const [remainingBalance, setRemainingBalance] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // QR session state
  const [sessionData, setSessionData] = useState<QrSessionData | null>(null)
  const [sessionPoints, setSessionPoints] = useState<number | null>(null)

  // QR Scanner ref
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerContainerId = 'qr-reader'

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState()
        if (state === 2) { // SCANNING
          await scannerRef.current.stop()
        }
      } catch {
        // ignore stop errors
      }
      scannerRef.current = null
    }
  }, [])

  const startScanner = useCallback(async () => {
    await stopScanner()

    // Wait for DOM element to be ready
    await new Promise(resolve => setTimeout(resolve, 100))

    const container = document.getElementById(scannerContainerId)
    if (!container) return

    const scanner = new Html5Qrcode(scannerContainerId)
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText)
        },
        () => {
          // ignore scan failures (no QR found in frame)
        }
      )
    } catch (err) {
      setErrorMessage('カメラを起動できませんでした。カメラへのアクセスを許可してください。')
      if (mode === 'earn') {
        setEarnStep('error')
      } else {
        setSpendStep('scanning') // stay, show error overlay
      }
      console.error('Camera start error:', err)
    }
  }, [stopScanner, mode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [stopScanner])

  const handleScanSuccess = async (decodedText: string) => {
    await stopScanner()
    setScannedData(decodedText)

    // Check if it's a QR session from admin
    const session = parseQrSession(decodedText)
    if (session) {
      await handleSessionQr(session)
      return
    }

    // Legacy flow: plain QR codes
    if (mode === 'earn') {
      await handleEarnPoints(decodedText)
    } else {
      setSpendStep('input')
    }
  }

  const handleSessionQr = async (session: QrSessionData) => {
    setLoading(true)
    try {
      const validation = await validateQrSession(session.token)
      setSessionData(session)

      if (validation.type === 'earn') {
        setSessionPoints(validation.points)
        setEarnStep('confirm_session')
      } else {
        // spend session: user enters amount
        setSessionPoints(null)
        setSpendStep('input')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'QRコードが無効または期限切れです')
      if (mode === 'earn') {
        setEarnStep('error')
      } else {
        setSpendStep('error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmSessionEarn = async () => {
    if (!sessionData) return
    setLoading(true)
    try {
      const result = await claimQrSession(sessionData.token)
      setEarnedPoints(result.points)
      setRemainingBalance(result.new_balance)
      setEarnStep('success')
      refetch()
    } catch (err: any) {
      setErrorMessage(err.message || 'ポイントの付与に失敗しました')
      setEarnStep('error')
    } finally {
      setLoading(false)
    }
  }

  const handleEarnPoints = async (qrData: string) => {
    setLoading(true)
    try {
      const result = await addPoints(100, `QRスキャン: ${qrData}`)
      setEarnedPoints(100)
      setRemainingBalance(result.points)
      setEarnStep('success')
      refetch()
    } catch (err) {
      setErrorMessage('ポイントの付与に失敗しました。もう一度お試しください。')
      setEarnStep('error')
      console.error('Add points error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSpendPoints = async () => {
    const amount = parseInt(pointsInput, 10)
    if (!amount || amount <= 0) return

    setLoading(true)
    try {
      if (sessionData) {
        // Claim via QR session
        const result = await claimQrSession(sessionData.token, amount)
        setUsedPoints(result.points)
        setRemainingBalance(result.new_balance)
      } else {
        // Legacy flow
        const result = await usePoints(amount, `QRスキャン利用: ${scannedData}`)
        setUsedPoints(amount)
        setRemainingBalance(result.points)
      }
      setSpendStep('success')
      refetch()
    } catch (err: any) {
      setErrorMessage(err.message || 'ポイントの利用に失敗しました。もう一度お試しください。')
      setSpendStep('error')
      console.error('Use points error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartEarnScan = () => {
    setEarnStep('scanning')
    startScanner()
  }

  const handleStartSpendScan = () => {
    setSpendStep('scanning')
    startScanner()
  }

  const handleBack = () => {
    stopScanner()
    navigate('/')
  }

  const handleReset = () => {
    stopScanner()
    setScannedData('')
    setPointsInput('')
    setErrorMessage('')
    setSessionData(null)
    setSessionPoints(null)
    if (mode === 'earn') {
      setEarnStep('intro')
    } else {
      setSpendStep('scanning')
      // Restart scanner for spend mode
      setTimeout(() => startScanner(), 100)
    }
  }

  // Auto-start scanner for spend mode on mount
  useEffect(() => {
    if (mode === 'spend' && spendStep === 'scanning') {
      startScanner()
    }
  }, [mode])

  // --- EARN MODE ---
  if (mode === 'earn') {
    return (
      <div className="scanner-page">
        <div className="scanner-header">
          <button className="scanner-back-btn" onClick={handleBack}>←</button>
          <h1>ポイントを貯める</h1>
        </div>

        <div className="scanner-content">
          {earnStep === 'intro' && (
            <div className="scanner-intro">
              <div className="scanner-intro-icon">📷</div>
              <h2>お店のQRコードをスキャン</h2>
              <p>お店に設置されたQRコードを読み取って、ポイントを獲得しましょう。</p>
              <button className="btn-primary scanner-start-btn" onClick={handleStartEarnScan}>
                スキャンする
              </button>
            </div>
          )}

          {earnStep === 'scanning' && (
            <div className="scanner-camera-section">
              <div id={scannerContainerId} className="scanner-viewfinder" />
              <p className="scanner-hint">QRコードをカメラに映してください</p>
              {loading && (
                <div className="scanner-loading-overlay">
                  <div className="loading-spinner" />
                  <p>確認中...</p>
                </div>
              )}
            </div>
          )}

          {earnStep === 'confirm_session' && (
            <div className="scanner-confirm-section">
              <h2>ポイント獲得の確認</h2>
              <div className="confirm-detail">
                <div className="confirm-row">
                  <span>獲得ポイント</span>
                  <strong className="confirm-points">{sessionPoints?.toLocaleString()} pt</strong>
                </div>
              </div>
              <div className="result-actions">
                <button className="btn-primary" onClick={handleConfirmSessionEarn} disabled={loading}>
                  {loading ? '処理中...' : 'ポイントを受け取る'}
                </button>
                <button className="btn-secondary" onClick={handleBack} disabled={loading}>
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {earnStep === 'success' && (
            <div className="scanner-result">
              <div className="result-icon success">✓</div>
              <h2>ポイント獲得!</h2>
              <div className="result-points earned">+{earnedPoints.toLocaleString()} pt</div>
              <div className="result-balance">
                残高: <strong>{remainingBalance.toLocaleString()} pt</strong>
              </div>
              <div className="result-actions">
                <button className="btn-primary" onClick={handleBack}>
                  ホームに戻る
                </button>
                <button className="btn-secondary" onClick={handleReset}>
                  もう一度スキャン
                </button>
              </div>
            </div>
          )}

          {earnStep === 'error' && (
            <div className="scanner-result">
              <div className="result-icon error">!</div>
              <h2>エラー</h2>
              <p className="error-message">{errorMessage}</p>
              <div className="result-actions">
                <button className="btn-primary" onClick={handleReset}>
                  もう一度試す
                </button>
                <button className="btn-secondary" onClick={handleBack}>
                  ホームに戻る
                </button>
              </div>
            </div>
          )}
        </div>

        <Navigation />
      </div>
    )
  }

  // --- SPEND MODE ---
  return (
    <div className="scanner-page">
      <div className="scanner-header">
        <button className="scanner-back-btn" onClick={handleBack}>←</button>
        <h1>ポイントを使う</h1>
      </div>

      <div className="scanner-content">
        {spendStep === 'scanning' && (
          <div className="scanner-camera-section">
            <div id={scannerContainerId} className="scanner-viewfinder" />
            <p className="scanner-hint">お店のQRコードをカメラに映してください</p>
            {errorMessage && (
              <div className="scanner-loading-overlay">
                <p className="error-message">{errorMessage}</p>
                <button className="btn-primary" onClick={handleStartSpendScan}>
                  再試行
                </button>
              </div>
            )}
          </div>
        )}

        {spendStep === 'input' && (
          <div className="scanner-input-section">
            <h2>利用ポイントを入力</h2>
            <p className="available-points">
              利用可能: <strong>{(member?.points ?? 0).toLocaleString()} pt</strong>
            </p>
            <div className="points-input-wrapper">
              <input
                type="number"
                className="points-input"
                placeholder="0"
                value={pointsInput}
                onChange={(e) => setPointsInput(e.target.value)}
                min="1"
                max={member?.points ?? 0}
              />
              <span className="points-input-unit">pt</span>
            </div>
            <div className="result-actions">
              <button
                className="btn-primary"
                onClick={() => setSpendStep('confirm')}
                disabled={!pointsInput || parseInt(pointsInput, 10) <= 0 || parseInt(pointsInput, 10) > (member?.points ?? 0)}
              >
                確認する
              </button>
              <button className="btn-secondary" onClick={handleBack}>
                キャンセル
              </button>
            </div>
          </div>
        )}

        {spendStep === 'confirm' && (
          <div className="scanner-confirm-section">
            <h2>ポイント利用の確認</h2>
            <div className="confirm-detail">
              <div className="confirm-row">
                <span>利用ポイント</span>
                <strong className="confirm-points">{parseInt(pointsInput, 10).toLocaleString()} pt</strong>
              </div>
              <div className="confirm-row">
                <span>利用後残高</span>
                <strong>{((member?.points ?? 0) - parseInt(pointsInput, 10)).toLocaleString()} pt</strong>
              </div>
            </div>
            <div className="result-actions">
              <button className="btn-primary" onClick={handleSpendPoints} disabled={loading}>
                {loading ? '処理中...' : 'ポイントを使う'}
              </button>
              <button className="btn-secondary" onClick={() => setSpendStep('input')} disabled={loading}>
                戻る
              </button>
            </div>
          </div>
        )}

        {spendStep === 'success' && (
          <div className="scanner-result">
            <div className="result-icon success">✓</div>
            <h2>ポイント利用完了!</h2>
            <div className="result-points spent">-{usedPoints.toLocaleString()} pt</div>
            <div className="result-balance">
              残高: <strong>{remainingBalance.toLocaleString()} pt</strong>
            </div>
            <div className="result-actions">
              <button className="btn-primary" onClick={handleBack}>
                ホームに戻る
              </button>
            </div>
          </div>
        )}

        {spendStep === 'error' && (
          <div className="scanner-result">
            <div className="result-icon error">!</div>
            <h2>エラー</h2>
            <p className="error-message">{errorMessage}</p>
            <div className="result-actions">
              <button className="btn-primary" onClick={handleReset}>
                もう一度試す
              </button>
              <button className="btn-secondary" onClick={handleBack}>
                ホームに戻る
              </button>
            </div>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  )
}

export default QRScanner
