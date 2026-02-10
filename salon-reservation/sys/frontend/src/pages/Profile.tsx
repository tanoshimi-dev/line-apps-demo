import { useLiff } from '../hooks/useLiff';
import { useMember } from '../hooks/useMember';
import Header from '../components/Header';
import Navigation from '../components/Navigation';

export default function Profile() {
  const { user, logout } = useLiff();
  const { member } = useMember();

  return (
    <div className="page">
      <Header title="プロフィール" />
      <main className="main-content">
        <div className="profile-section">
          <div className="profile-avatar">
            {user?.pictureUrl ? (
              <img src={user.pictureUrl} alt={user.displayName} />
            ) : (
              <div className="profile-avatar-placeholder">
                {member?.displayName?.charAt(0) || '?'}
              </div>
            )}
          </div>
          <h2 className="profile-name">{member?.displayName || user?.displayName}</h2>
        </div>

        {member && (
          <div className="profile-details">
            <div className="profile-row">
              <span className="profile-label">電話番号</span>
              <span className="profile-value">{member.phone || '未設定'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">メールアドレス</span>
              <span className="profile-value">{member.email || '未設定'}</span>
            </div>
            <div className="profile-row">
              <span className="profile-label">登録日</span>
              <span className="profile-value">
                {new Date(member.createdAt).toLocaleDateString('ja-JP')}
              </span>
            </div>
          </div>
        )}

        <button className="btn btn-outline btn-danger-text" onClick={logout}>
          ログアウト
        </button>
      </main>
      <Navigation />
    </div>
  );
}
