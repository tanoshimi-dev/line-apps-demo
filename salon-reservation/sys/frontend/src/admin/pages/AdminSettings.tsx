import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  getOperators,
  createOperator,
  deleteOperator,
  setup2fa,
  confirm2fa,
  disable2fa,
  get2faStatus,
} from '../services/adminApi';
import type { Operator } from '../types';

export default function AdminSettings() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    username: '',
    password: '',
    name: '',
    specialty: '',
  });

  // 2FA state
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaSetup, setTwoFaSetup] = useState<{
    secret: string;
    provisioningUri: string;
  } | null>(null);
  const [twoFaCode, setTwoFaCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ops, status] = await Promise.all([getOperators(), get2faStatus()]);
      setOperators(ops);
      setTwoFaEnabled(status.enabled);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (twoFaSetup?.provisioningUri && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, twoFaSetup.provisioningUri, { width: 200 });
    }
  }, [twoFaSetup]);

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOperator(addForm);
      setAddForm({ username: '', password: '', name: '', specialty: '' });
      setShowAddForm(false);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDeleteOperator = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return;
    try {
      await deleteOperator(id);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleSetup2fa = async () => {
    try {
      const data = await setup2fa();
      setTwoFaSetup(data);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleConfirm2fa = async () => {
    try {
      const data = await confirm2fa(twoFaCode);
      setRecoveryCodes(data.recoveryCodes);
      setTwoFaEnabled(true);
      setTwoFaSetup(null);
      setTwoFaCode('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDisable2fa = async () => {
    try {
      await disable2fa(disablePassword);
      setTwoFaEnabled(false);
      setDisablePassword('');
      alert('2FAを無効にしました');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page">
      <h2 className="admin-page-title">設定</h2>

      {/* 2FA Section */}
      <div className="admin-section">
        <h3>二要素認証 (2FA)</h3>
        {twoFaEnabled ? (
          <div>
            <p className="admin-badge admin-badge-confirmed" style={{ display: 'inline-block', marginBottom: 12 }}>
              2FA 有効
            </p>
            <div className="admin-form-group">
              <label>2FAを無効にする（パスワードを入力）</label>
              <input
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                className="admin-input"
                placeholder="パスワード"
              />
              <button
                className="admin-btn admin-btn-danger"
                onClick={handleDisable2fa}
                style={{ marginTop: 8 }}
              >
                2FAを無効にする
              </button>
            </div>
          </div>
        ) : twoFaSetup ? (
          <div>
            <p>認証アプリでQRコードをスキャンしてください:</p>
            <canvas ref={qrCanvasRef} style={{ marginBottom: 12 }} />
            <div className="admin-form-group" style={{ marginTop: 16 }}>
              <label>認証コード</label>
              <input
                type="text"
                value={twoFaCode}
                onChange={(e) => setTwoFaCode(e.target.value)}
                className="admin-input"
                placeholder="6桁のコード"
                maxLength={6}
              />
              <button
                className="admin-btn admin-btn-primary"
                onClick={handleConfirm2fa}
                style={{ marginTop: 8 }}
              >
                確認
              </button>
            </div>
          </div>
        ) : (
          <button className="admin-btn admin-btn-primary" onClick={handleSetup2fa}>
            2FAを設定する
          </button>
        )}

        {recoveryCodes.length > 0 && (
          <div className="admin-recovery-codes">
            <h4>リカバリーコード（安全な場所に保管してください）</h4>
            <div className="admin-codes-grid">
              {recoveryCodes.map((code) => (
                <code key={code}>{code}</code>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Operators Section */}
      <div className="admin-section">
        <div className="admin-page-header">
          <h3>スタッフ管理</h3>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            スタッフ追加
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddOperator} className="admin-form-card">
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>ユーザー名</label>
                <input
                  type="text"
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                  required
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label>パスワード</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  required
                  className="admin-input"
                />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>名前</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  required
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label>専門</label>
                <input
                  type="text"
                  value={addForm.specialty}
                  onChange={(e) => setAddForm({ ...addForm, specialty: e.target.value })}
                  className="admin-input"
                />
              </div>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="admin-btn admin-btn-primary">
                追加
              </button>
              <button
                type="button"
                className="admin-btn"
                onClick={() => setShowAddForm(false)}
              >
                キャンセル
              </button>
            </div>
          </form>
        )}

        <table className="admin-table">
          <thead>
            <tr>
              <th>名前</th>
              <th>ユーザー名</th>
              <th>状態</th>
              <th>2FA</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {operators.map((op) => (
              <tr key={op.id}>
                <td>{op.name}</td>
                <td>{op.username}</td>
                <td>
                  <span className={`admin-badge ${op.isActive ? 'admin-badge-confirmed' : 'admin-badge-cancelled'}`}>
                    {op.isActive ? '有効' : '無効'}
                  </span>
                </td>
                <td>{op.twoFactorEnabled ? '有効' : '無効'}</td>
                <td>
                  <button
                    className="admin-btn admin-btn-sm admin-btn-danger"
                    onClick={() => handleDeleteOperator(op.id)}
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
            {operators.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty-cell">スタッフがいません</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
