import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { redeemSpendPoints, getPointBalance } from '../services/api';
import type { QrRedeemResponse } from '../types';

export default function ScanSpendPoints() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'scan' | 'input' | 'confirm' | 'result'>('scan');
  const [qrToken, setQrToken] = useState('');
  const [points, setPoints] = useState('');
  const [balance, setBalance] = useState(0);
  const [result, setResult] = useState<QrRedeemResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    getPointBalance().then((res) => setBalance(res.balance)).catch(console.error);
  }, []);

  useEffect(() => {
    if (step !== 'scan') return;
    let mounted = true;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!mounted) return;
      const scanner = new Html5Qrcode('reader');
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText: string) => {
          await scanner.stop();
          scannerRef.current = null;
          setQrToken(decodedText);
          setStep('input');
        },
        undefined
      ).catch((err: any) => {
        if (mounted) setError('カメラを起動できませんでした: ' + err);
      });
    });

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [step]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await redeemSpendPoints(qrToken, Number(points));
      setResult(res);
      setStep('result');
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Header />
      <div className="scan-container">
        <div className="scan-title">ポイント使用</div>

        {step === 'scan' && (
          <>
            <div className="scan-description">スタッフが提示するQRコードをスキャンしてください</div>
            {!error && <div className="scanner-wrapper"><div id="reader" style={{ width: '100%' }}></div></div>}
          </>
        )}

        {step === 'input' && (
          <div className="points-input-section">
            <div>現在のポイント残高: <strong>{balance.toLocaleString()} pt</strong></div>
            <input
              type="number"
              className="points-input"
              placeholder="0"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              min="1"
              max={balance}
            />
            <div style={{ fontSize: 12, color: '#999', marginBottom: 16 }}>使用するポイント数を入力</div>
            <button
              className="btn btn-primary btn-block"
              disabled={!points || Number(points) < 1 || Number(points) > balance}
              onClick={() => setStep('confirm')}
            >
              確認する
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="scan-result">
            <div className="scan-result-icon">💳</div>
            <div className="scan-result-title">確認</div>
            <div className="scan-result-points">{Number(points).toLocaleString()} pt</div>
            <div className="scan-result-message">上記のポイントを使用しますか？</div>
            <div className="confirm-actions">
              <button className="btn btn-outline" onClick={() => setStep('input')}>戻る</button>
              <button className="btn btn-primary" onClick={handleConfirm} disabled={loading}>
                {loading ? '処理中...' : '使用する'}
              </button>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div className="scan-result">
            <div className="scan-result-icon">✅</div>
            <div className="scan-result-title">ポイント使用完了</div>
            <div className="scan-result-points">-{result.pointsSpent?.toLocaleString()} pt</div>
            <div className="scan-result-message">残高: {result.balance?.toLocaleString()} pt</div>
            <button className="btn btn-primary btn-block" onClick={() => navigate('/')}>
              ホームに戻る
            </button>
          </div>
        )}

        {error && (
          <div className="scan-result">
            <div className="scan-result-icon">❌</div>
            <div className="scan-result-title">エラー</div>
            <div className="scan-result-message">{error}</div>
            <button className="btn btn-primary" onClick={() => { setError(''); setStep('scan'); }}>
              もう一度
            </button>
          </div>
        )}
      </div>
      <Navigation />
    </div>
  );
}
