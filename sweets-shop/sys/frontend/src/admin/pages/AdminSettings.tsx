import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { getOperators, createOperator, updateOperator, deleteOperator, setup2fa, confirm2fa, disable2fa, get2faStatus } from '../services/adminApi';
import type { Operator } from '../types';

export default function AdminSettings() {
  const { user } = useAdminAuth();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'staff' });
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaSetup, setTwoFaSetup] = useState<{ secret: string; provisioningUri: string } | null>(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const load = () => {
    Promise.all([getOperators(), get2faStatus()])
      .then(([ops, status]) => { setOperators(ops); setTwoFaEnabled(status.enabled); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  useEffect(() => {
    if (twoFaSetup?.provisioningUri && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, twoFaSetup.provisioningUri, { width: 200 });
    }
  }, [twoFaSetup]);

  const handleCreateOperator = async () => {
    await createOperator({ username: form.username, password: form.password, name: form.name, role: form.role });
    setShowModal(false);
    setForm({ username: '', password: '', name: '', role: 'staff' });
    load();
  };

  const handleDeleteOperator = async (id: string) => { if (confirm('削除しますか？')) { await deleteOperator(id); load(); } };

  const handleToggleActive = async (op: Operator) => { await updateOperator(op.id, { is_active: !op.isActive }); load(); };

  const handleSetup2fa = async () => { const data = await setup2fa(); setTwoFaSetup(data); };

  const handleConfirm2fa = async () => {
    await confirm2fa(twoFaCode);
    setTwoFaSetup(null);
    setTwoFaCode('');
    load();
  };

  const handleDisable2fa = async () => {
    await disable2fa(disablePassword);
    setDisablePassword('');
    load();
  };

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (user?.role !== 'admin') return <div className="admin-loading">管理者権限が必要です</div>;

  return (
    <div>
      <h1 className="admin-page-title">設定</h1>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>二要素認証</h2>
      <div className="admin-form">
        {twoFaEnabled ? (
          <div>
            <p style={{ marginBottom: 12 }}>二要素認証は<strong>有効</strong>です</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="form-input" type="password" placeholder="パスワード" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} style={{ width: 200 }} />
              <button className="admin-btn admin-btn-danger" onClick={handleDisable2fa}>2FAを無効化</button>
            </div>
          </div>
        ) : twoFaSetup ? (
          <div>
            <p style={{ marginBottom: 8 }}>認証アプリでQRコードをスキャンしてください:</p>
            <canvas ref={qrCanvasRef} style={{ marginBottom: 12 }} />
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input className="form-input" type="text" placeholder="6桁のコード" value={twoFaCode} onChange={(e) => setTwoFaCode(e.target.value)} style={{ width: 150 }} />
              <button className="admin-btn admin-btn-primary" onClick={handleConfirm2fa}>確認</button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: 12 }}>二要素認証は<strong>無効</strong>です</p>
            <button className="admin-btn admin-btn-primary" onClick={handleSetup2fa}>2FAを設定する</button>
          </div>
        )}
      </div>

      <div className="admin-toolbar" style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 18, margin: 0 }}>オペレーター管理</h2>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowModal(true)}>新規追加</button>
      </div>

      <table className="admin-table">
        <thead><tr><th>ユーザー名</th><th>名前</th><th>権限</th><th>状態</th><th>2FA</th><th>操作</th></tr></thead>
        <tbody>
          {operators.map((op) => (
            <tr key={op.id}>
              <td>{op.username}</td>
              <td>{op.name}</td>
              <td>{op.role}</td>
              <td><span className={`admin-badge ${op.isActive ? 'admin-badge-active' : 'admin-badge-inactive'}`}>{op.isActive ? '有効' : '無効'}</span></td>
              <td>{op.twoFactorEnabled ? '有効' : '-'}</td>
              <td>
                <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => handleToggleActive(op)}>{op.isActive ? '無効化' : '有効化'}</button>{' '}
                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDeleteOperator(op.id)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-title">オペレーター追加</div>
            <div className="form-group"><label className="form-label">ユーザー名</label><input className="form-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">パスワード</label><input className="form-input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">名前</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">権限</label><select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="staff">スタッフ</option><option value="admin">管理者</option></select></div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>キャンセル</button>
              <button className="admin-btn admin-btn-primary" onClick={handleCreateOperator}>作成</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
