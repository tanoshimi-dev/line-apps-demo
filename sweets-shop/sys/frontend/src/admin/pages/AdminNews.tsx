import { useState, useEffect } from 'react';
import { getAdminNews, createNews, updateNews, deleteNews } from '../services/adminApi';
import type { AdminNews as AdminNewsType } from '../types';

export default function AdminNews() {
  const [news, setNews] = useState<AdminNewsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminNewsType | null>(null);
  const [form, setForm] = useState({ title: '', content: '', isPublished: false });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const load = () => { getAdminNews().then(setNews).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm({ title: '', content: '', isPublished: false }); setImageFile(null); setShowModal(true); };
  const openEdit = (item: AdminNewsType) => { setEditing(item); setForm({ title: item.title, content: item.content, isPublished: item.isPublished }); setImageFile(null); setShowModal(true); };

  const handleSave = async () => {
    const data = new FormData();
    data.append('title', form.title);
    data.append('content', form.content);
    data.append('is_published', form.isPublished ? '1' : '0');
    if (imageFile) data.append('image', imageFile);
    if (editing) { await updateNews(editing.id, data); } else { await createNews(data); }
    setShowModal(false); load();
  };

  const handleDelete = async (id: string) => { if (confirm('削除しますか？')) { await deleteNews(id); load(); } };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>お知らせ管理</h1>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>新規追加</button>
      </div>

      <table className="admin-table">
        <thead><tr><th>タイトル</th><th>公開状態</th><th>公開日</th><th>操作</th></tr></thead>
        <tbody>
          {news.map((item) => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td><span className={`admin-badge ${item.isPublished ? 'admin-badge-active' : 'admin-badge-inactive'}`}>{item.isPublished ? '公開' : '下書き'}</span></td>
              <td>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('ja-JP') : '-'}</td>
              <td>
                <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => openEdit(item)}>編集</button>{' '}
                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(item.id)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-title">{editing ? 'お知らせ編集' : 'お知らせ追加'}</div>
            <div className="form-group"><label className="form-label">タイトル</label><input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">内容</label><textarea className="form-textarea" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">画像</label><input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} /></div>
            <div className="form-group"><label><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> 公開する</label></div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>キャンセル</button>
              <button className="admin-btn admin-btn-primary" onClick={handleSave}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
