import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { generateQrCode, getActiveQrCodes } from '../services/adminApi';
import type { AdminQrCode } from '../types';

export default function AdminQrGenerate() {
  const [type, setType] = useState('earn_points');
  const [points, setPoints] = useState('100');
  const [generatedQr, setGeneratedQr] = useState<AdminQrCode | null>(null);
  const [activeQrs, setActiveQrs] = useState<AdminQrCode[]>([]);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadActive = () => { getActiveQrCodes().then(setActiveQrs).catch(console.error); };
  useEffect(loadActive, []);

  useEffect(() => {
    if (generatedQr && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, generatedQr.token, { width: 256 });
    }
  }, [generatedQr]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const qr = await generateQrCode(type, type === 'earn_points' ? Number(points) : undefined);
      setGeneratedQr(qr);
      loadActive();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const typeLabels: Record<string, string> = { earn_points: 'ポイント付与', spend_points: 'ポイント使用', review_ticket: 'レビューチケット' };

  return (
    <div>
      <h1 className="admin-page-title">QRコード発行</h1>

      <div className="admin-form">
        <div className="form-group">
          <label className="form-label">種別</label>
          <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="earn_points">ポイント付与</option>
            <option value="spend_points">ポイント使用</option>
            <option value="review_ticket">レビューチケット</option>
          </select>
        </div>
        {type === 'earn_points' && (
          <div className="form-group">
            <label className="form-label">付与ポイント数</label>
            <input className="form-input" type="number" value={points} onChange={(e) => setPoints(e.target.value)} min="1" />
          </div>
        )}
        <button className="admin-btn admin-btn-primary" onClick={handleGenerate} disabled={loading}>
          {loading ? '生成中...' : 'QRコード生成'}
        </button>
      </div>

      {generatedQr && (
        <div className="qr-display">
          <h3 style={{ marginBottom: 12 }}>{typeLabels[generatedQr.type] || generatedQr.type}</h3>
          {generatedQr.pointsAmount && <p style={{ marginBottom: 8 }}>{generatedQr.pointsAmount}ポイント</p>}
          <canvas ref={canvasRef}></canvas>
          <p style={{ marginTop: 8, fontSize: 12, color: '#999' }}>有効期限: {new Date(generatedQr.expiresAt).toLocaleString('ja-JP')}</p>
        </div>
      )}

      <h2 style={{ fontSize: 18, marginTop: 24, marginBottom: 12 }}>有効なQRコード</h2>
      <table className="admin-table">
        <thead><tr><th>種別</th><th>ポイント</th><th>発行者</th><th>有効期限</th></tr></thead>
        <tbody>
          {activeQrs.map((qr) => (
            <tr key={qr.id}>
              <td>{typeLabels[qr.type] || qr.type}</td>
              <td>{qr.pointsAmount ?? '-'}</td>
              <td>{qr.adminUser?.name || '-'}</td>
              <td>{new Date(qr.expiresAt).toLocaleString('ja-JP')}</td>
            </tr>
          ))}
          {activeQrs.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>有効なQRコードなし</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
