import { useState, useEffect } from 'react';
import { getAdminItems, updateStock } from '../services/adminApi';
import type { AdminItem } from '../types';

export default function AdminStock() {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState('');

  const load = () => { getAdminItems().then(setItems).catch(console.error).finally(() => setLoading(false)); };
  useEffect(load, []);

  const handleSave = async (id: string) => {
    await updateStock(id, Number(stockValue));
    setEditingId(null);
    load();
  };

  if (loading) return <div className="admin-loading">Loading...</div>;

  return (
    <div>
      <h1 className="admin-page-title">在庫管理</h1>
      <table className="admin-table">
        <thead><tr><th>商品名</th><th>カテゴリ</th><th>価格</th><th>在庫数</th><th>操作</th></tr></thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.category?.name || '-'}</td>
              <td>&yen;{item.price.toLocaleString()}</td>
              <td>
                {editingId === item.id ? (
                  <input className="form-input" type="number" value={stockValue} onChange={(e) => setStockValue(e.target.value)} style={{ width: 80 }} min="0" />
                ) : (
                  <span style={{ color: item.stock === 0 ? '#dc3545' : 'inherit' }}>{item.stock}</span>
                )}
              </td>
              <td>
                {editingId === item.id ? (
                  <>
                    <button className="admin-btn admin-btn-success admin-btn-sm" onClick={() => handleSave(item.id)}>保存</button>{' '}
                    <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => setEditingId(null)}>取消</button>
                  </>
                ) : (
                  <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => { setEditingId(item.id); setStockValue(String(item.stock)); }}>変更</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
