import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';
import '../styles/admin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, verifyTwoFactor } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(username, password);
      if (res.twoFactorRequired) {
        setTwoFactorToken(res.token);
        setNeedsTwoFactor(true);
      } else {
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.message || 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyTwoFactor(twoFactorToken, twoFactorCode);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || '認証に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-title">Sweets Shop</div>
        <div className="admin-login-subtitle">管理画面</div>

        {error && <div className="admin-login-error">{error}</div>}

        {!needsTwoFactor ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">ユーザー名</label>
              <input className="form-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">パスワード</label>
              <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button className="admin-btn admin-btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTwoFactor}>
            <div className="form-group">
              <label className="form-label">認証コード</label>
              <input className="form-input" type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="6桁のコード" required />
            </div>
            <button className="admin-btn admin-btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              {loading ? '確認中...' : '認証する'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
