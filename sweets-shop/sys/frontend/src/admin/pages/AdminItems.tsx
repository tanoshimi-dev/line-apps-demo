import { useState, useEffect } from 'react';
import { getAdminItems, getAdminCategories, createItem, updateItem, deleteItem } from '../services/adminApi';
import type { AdminItem, AdminCategory } from '../types';

export default function AdminItems() {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdminItem | null>(null);
  const [form, setForm] = useState({ categoryId: '', name: '', description: '', price: '0', stock: '0', sortOrder: '0', isActive: true });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const load = () => { Promise.all([getAdminItems(filterCategory || undefined), getAdminCategories()]).then(([i, c]) => { setItems(i); setCategories(c); }).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, [filterCategory]);

  const openCreate = () => { setEditing(null); setForm({ categoryId: categories[0]?.id || '', name: '', description: '', price: '0', stock: '0', sortOrder: '0', isActive: true }); setImageFile(null); setShowModal(true); };
  const openEdit = (item: AdminItem) => { setEditing(item); setForm({ categoryId: item.categoryId, name: item.name, description: item.description || '', price: String(item.price), stock: String(item.stock), sortOrder: String(item.sortOrder), isActive: item.isActive }); setImageFile(null); setShowModal(true); };

  const handleSave = async () => {
    const data = new FormData();
    data.append('category_id', form.categoryId);
    data.append('name', form.name);
    data.append('description', form.description);
    data.append('price', form.price);
    data.append('stock', form.stock);
    data.append('sort_order', form.sortOrder);
    data.append('is_active', form.isActive ? '1' : '0');
    if (imageFile) data.append('image', imageFile);
    if (editing) { await updateItem(editing.id, data); } else { await createItem(data); }
    setShowModal(false); load();
  };

  const handleDelete = async (id: string) => { if (confirm('削除しますか？')) { await deleteItem(id); load(); } };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div>
      <div className="admin-toolbar">
        <h1 className="admin-page-title" style={{ margin: 0 }}>商品管理</h1>
        <div className="admin-filters">
          <select className="filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="">すべてのカテゴリ</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="admin-btn admin-btn-primary" onClick={openCreate}>新規追加</button>
        </div>
      </div>

      <table className="admin-table">
        <thead><tr><th>商品名</th><th>カテゴリ</th><th>価格</th><th>在庫</th><th>状態</th><th>操作</th></tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.category?.name || '-'}</td>
              <td>&yen;{item.price.toLocaleString()}</td>
              <td>{item.stock}</td>
              <td><span className={`admin-badge ${item.isActive ? 'admin-badge-active' : 'admin-badge-inactive'}`}>{item.isActive ? '有効' : '無効'}</span></td>
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
            <div className="admin-modal-title">{editing ? '商品編集' : '商品追加'}</div>
            <div className="form-group"><label className="form-label">カテゴリ</label><select className="form-select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="form-group"><label className="form-label">商品名</label><input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">説明</label><textarea className="form-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">価格</label><input className="form-input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">在庫</label><input className="form-input" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
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
