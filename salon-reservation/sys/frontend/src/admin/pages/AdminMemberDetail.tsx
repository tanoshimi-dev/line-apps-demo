import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAdminMemberDetail,
  getMessageHistory,
  sendAdminMessage,
} from '../services/adminApi';
import type { AdminMemberDetail as MemberDetail, AdminMessage } from '../types';

const statusLabels: Record<string, string> = {
  pending: '確認待ち',
  confirmed: '確認済み',
  in_progress: '施術中',
  completed: '完了',
  cancelled: 'キャンセル',
  no_show: '未来店',
};

export default function AdminMemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [tab, setTab] = useState<'info' | 'reservations' | 'messages'>('info');

  useEffect(() => {
    if (!id) return;
    Promise.all([getAdminMemberDetail(id), getMessageHistory(id)])
      .then(([memberData, msgs]) => {
        setMember(memberData);
        setMessages(msgs.reverse());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSendMessage = async () => {
    if (!id || !newMessage.trim() || sending) return;
    setSending(true);
    try {
      await sendAdminMessage(id, newMessage.trim());
      setNewMessage('');
      // Refresh messages
      const msgs = await getMessageHistory(id);
      setMessages(msgs.reverse());
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (!member) return <div className="admin-error">Member not found</div>;

  return (
    <div className="admin-page">
      <button className="admin-btn admin-btn-text" onClick={() => navigate('/admin/members')}>
        ← 会員一覧に戻る
      </button>

      <div className="admin-member-header">
        <div className="admin-member-avatar">
          {member.pictureUrl ? (
            <img src={member.pictureUrl} alt={member.displayName} />
          ) : (
            <div className="admin-avatar-placeholder-lg">{member.displayName.charAt(0)}</div>
          )}
        </div>
        <h2>{member.displayName}</h2>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${tab === 'info' ? 'active' : ''}`} onClick={() => setTab('info')}>
          基本情報
        </button>
        <button className={`admin-tab ${tab === 'reservations' ? 'active' : ''}`} onClick={() => setTab('reservations')}>
          予約履歴
        </button>
        <button className={`admin-tab ${tab === 'messages' ? 'active' : ''}`} onClick={() => setTab('messages')}>
          メッセージ
        </button>
      </div>

      {tab === 'info' && (
        <div className="admin-detail-card">
          <div className="admin-detail-row">
            <span>電話番号</span>
            <span>{member.phone || '未設定'}</span>
          </div>
          <div className="admin-detail-row">
            <span>メールアドレス</span>
            <span>{member.email || '未設定'}</span>
          </div>
          <div className="admin-detail-row">
            <span>LINE ID</span>
            <span className="admin-text-mono">{member.lineUserId}</span>
          </div>
          <div className="admin-detail-row">
            <span>登録日</span>
            <span>{new Date(member.createdAt).toLocaleDateString('ja-JP')}</span>
          </div>
        </div>
      )}

      {tab === 'reservations' && (
        <div>
          {member.reservations.length === 0 ? (
            <p className="admin-empty">予約履歴はありません</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>日付</th>
                  <th>時間</th>
                  <th>メニュー</th>
                  <th>担当</th>
                  <th>ステータス</th>
                </tr>
              </thead>
              <tbody>
                {member.reservations.map((r) => (
                  <tr
                    key={r.id}
                    className="admin-table-row-clickable"
                    onClick={() => navigate(`/admin/reservations/${r.id}`)}
                  >
                    <td>{r.reservationDate}</td>
                    <td>{r.startTime} - {r.endTime}</td>
                    <td>{r.serviceName}</td>
                    <td>{r.staffName}</td>
                    <td>
                      <span className={`admin-badge admin-badge-${r.status}`}>
                        {statusLabels[r.status] || r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'messages' && (
        <div className="admin-messages-section">
          <div className="admin-messages-list">
            {messages.length === 0 ? (
              <p className="admin-empty">メッセージはありません</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`admin-message ${
                    msg.direction === 'salon_to_member' ? 'admin-message-sent' : 'admin-message-received'
                  }`}
                >
                  <div className="admin-message-bubble">
                    <p>{msg.content}</p>
                    <span className="admin-message-meta">
                      {new Date(msg.createdAt).toLocaleString('ja-JP')}
                      {msg.adminUserName && ` (${msg.adminUserName})`}
                      {msg.sentViaLine && ' ✓ LINE送信済'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="admin-message-input">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="メッセージを入力..."
              className="admin-textarea"
              rows={2}
            />
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
            >
              {sending ? '送信中...' : '送信'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
