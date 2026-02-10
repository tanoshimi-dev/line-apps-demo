import { useState, useEffect } from 'react';
import { getAdminCategories, createCategory, updateCategory, deleteCategory } from '../services/adminApi';
import type { AdminCategory } from '../types';

export default function AdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState({ name: '', description: '', sortOrder: '0', isActive: true });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const load = () => { getAdminCategories().then(setCategories).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', sortOrder: '0', isActive: true }); setImageFile(null); setShowModal(true); };
  const openEdit = (cat: AdminCategory) => { setEditing(cat); setForm({ name: cat.name, description: cat.description || '', sortOrder: String(cat.sortOrder), isActive: cat.isActive }); setImageFile(null); setShowModal(true); };

  const handleSave = async () => {
    const data = new FormData();
    data.append('name', form.name);
    data.append('description', form.description);
    data.append('sort_order', form.sortOrder);
    data.append('is_active', form.isActive ? '1' : '0');
    if (imageFile) data.append('image', imageFile);

    if (editing) { await updateCategory(editing.id, data); } else { await createCategory(data); }
    setShowModal(false); load();
  };

  const handleDelete = async (id: string) => { if (confirm('削除しますか？')) { await deleteCategory(id); load(); } };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>カテゴリ管理</h1>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>新規追加</button>
      </div>

      <table className="admin-table">
        <thead><tr><th>名前</th><th>説明</th><th>商品数</th><th>順序</th><th>状態</th><th>操作</th></tr></thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id}>
              <td>{cat.name}</td>
              <td>{cat.description || '-'}</td>
              <td>{cat.itemsCount ?? 0}</td>
              <td>{cat.sortOrder}</td>
              <td><span className={`admin-badge ${cat.isActive ? 'admin-badge-active' : 'admin-badge-inactive'}`}>{cat.isActive ? '有効' : '無効'}</span></td>
              <td>
                <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => openEdit(cat)}>編集</button>{' '}
                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(cat.id)}>削除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-title">{editing ? 'カテゴリ編集' : 'カテゴリ追加'}</div>
            <div className="form-group"><label className="form-label">名前</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">説明</label><textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">表示順</label><input className="form-input" type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">画像</label><input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} /></div>
            <div className="form-group"><label><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> 有効</label></div>
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
