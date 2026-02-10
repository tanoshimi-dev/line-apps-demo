import { useState, useEffect } from 'react';
import {
  getAdminServices,
  createService,
  updateService,
  deleteService,
} from '../services/adminApi';
import type { AdminService } from '../types';

export default function AdminServices() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminService | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    durationMinutes: 60,
    price: 0,
    isActive: true,
    sortOrder: 0,
  });

  const loadServices = () => {
    setLoading(true);
    getAdminServices()
      .then(setServices)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(loadServices, []);

  const resetForm = () => {
    setForm({ name: '', description: '', durationMinutes: 60, price: 0, isActive: true, sortOrder: 0 });
    setEditing(null);
    setShowForm(false);
  };

  const handleEdit = (service: AdminService) => {
    setForm({
      name: service.name,
      description: service.description || '',
      durationMinutes: service.durationMinutes,
      price: service.price,
      isActive: service.isActive,
      sortOrder: service.sortOrder,
    });
    setEditing(service);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateService(editing.id, form);
      } else {
        await createService(form);
      }
      resetForm();
      loadServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return;
    try {
      await deleteService(id);
      loadServices();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h2 className="admin-page-title">メニュー管理</h2>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => { resetForm(); setShowForm(true); }}
        >
          メニュー追加
        </button>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h3>{editing ? 'メニュー編集' : 'メニュー追加'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label>名前</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="admin-input"
              />
            </div>
            <div className="admin-form-group">
              <label>説明</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="admin-textarea"
              />
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>所要時間（分）</label>
                <input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })}
                  min={15}
                  required
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label>料金（円）</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  min={0}
                  required
                  className="admin-input"
                />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>表示順</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />{' '}
                  有効
                </label>
              </div>
            </div>
            <div className="admin-form-actions">
              <button type="submit" className="admin-btn admin-btn-primary">
                {editing ? '更新' : '追加'}
              </button>
              <button type="button" className="admin-btn" onClick={resetForm}>
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>順序</th>
            <th>名前</th>
            <th>所要時間</th>
            <th>料金</th>
            <th>状態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s.id}>
              <td>{s.sortOrder}</td>
              <td>
                <strong>{s.name}</strong>
                {s.description && <br />}
                {s.description && <small>{s.description}</small>}
              </td>
              <td>{s.durationMinutes}分</td>
              <td>¥{s.price.toLocaleString()}</td>
              <td>
                <span className={`admin-badge ${s.isActive ? 'admin-badge-confirmed' : 'admin-badge-cancelled'}`}>
                  {s.isActive ? '有効' : '無効'}
                </span>
              </td>
              <td>
                <button className="admin-btn admin-btn-sm" onClick={() => handleEdit(s)}>
                  編集
                </button>
                <button
                  className="admin-btn admin-btn-sm admin-btn-danger"
                  onClick={() => handleDelete(s.id)}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
