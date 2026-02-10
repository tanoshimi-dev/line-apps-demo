import { useState, useEffect, useRef } from 'react';
import { getMessages, sendMessage } from '../services/api';
import type { MessageInfo } from '../types';
import Header from '../components/Header';
import Navigation from '../components/Navigation';

export default function Messages() {
  const [messages, setMessages] = useState<MessageInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMessages()
      .then((data) => setMessages(data.reverse()))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const msg = await sendMessage(newMessage.trim());
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
    } catch {
      alert('メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="page">
      <Header title="メッセージ" />
      <main className="main-content messages-page">
        <div className="messages-container">
          {loading ? (
            <div className="loading-spinner">読み込み中...</div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <p>メッセージはありません</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message ${
                    msg.direction === 'member_to_salon' ? 'message-sent' : 'message-received'
                  }`}
                >
                  <div className="message-bubble">
                    <p className="message-content">{msg.content}</p>
                    <span className="message-time">
                      {new Date(msg.createdAt).toLocaleString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="message-input-bar">
          <textarea
            className="message-input"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="メッセージを入力..."
            rows={1}
          />
          <button
            className="btn btn-primary message-send-btn"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            送信
          </button>
        </div>
      </main>
      <Navigation />
    </div>
  );
}
