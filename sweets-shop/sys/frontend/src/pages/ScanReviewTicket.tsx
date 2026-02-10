import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Navigation from '../components/Navigation';
import { redeemReviewTicket } from '../services/api';
import type { QrRedeemResponse } from '../types';

export default function ScanReviewTicket() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState<QrRedeemResponse | null>(null);
  const [error, setError] = useState('');
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (!scanning) return;
    let mounted = true;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (!mounted) return;
      const scanner = new Html5Qrcode('reader');
      scannerRef.current = scanner;

      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText: string) => {
          try {
            await scanner.stop();
            scannerRef.current = null;
            setScanning(false);
            const res = await redeemReviewTicket(decodedText);
            setResult(res);
          } catch (err: any) {
            setError(err.message || 'エラーが発生しました');
          }
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
  }, [scanning]);

  return (
    <div className="page">
      <Header />
      <div className="scan-container">
        <div className="scan-title">レビューチケット取得</div>
        <div className="scan-description">スタッフが提示するQRコードをスキャンしてください</div>

        {scanning && !error && (
          <div className="scanner-wrapper"><div id="reader" style={{ width: '100%' }}></div></div>
        )}

        {error && (
          <div className="scan-result">
            <div className="scan-result-icon">❌</div>
            <div className="scan-result-title">エラー</div>
            <div className="scan-result-message">{error}</div>
            <button className="btn btn-primary" onClick={() => { setError(''); setScanning(true); }}>
              もう一度スキャン
            </button>
          </div>
        )}

        {result && (
          <div className="scan-result">
            <div className="scan-result-icon">📝</div>
            <div className="scan-result-title">チケット取得完了！</div>
            <div className="scan-result-message">レビューを投稿できるようになりました</div>
            <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
              <button className="btn btn-primary btn-block" onClick={() => navigate('/review')}>
                レビューを書く
              </button>
              <button className="btn btn-outline btn-block" onClick={() => navigate('/')}>
                ホームに戻る
              </button>
            </div>
          </div>
        )}
      </div>
      <Navigation />
    </div>
  );
}
