import { useState, useEffect } from 'react'
import type { Operator } from '../types'
import { getOperators, createOperator, updateOperator, deleteOperator } from '../services/adminApi'

export default function AdminSettings() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ username: '', password: '', name: '', role: 'operator' })
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)

  const fetchOperators = async () => {
    try {
      const result = await getOperators()
      setOperators(result.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOperators()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      await createOperator(formData)
      setShowForm(false)
      setFormData({ username: '', password: '', name: '', role: 'operator' })
      fetchOperators()
    } catch (err: any) {
      setFormError(err.message || '作成に失敗しました')
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleActive = async (op: Operator) => {
    try {
      await updateOperator(op.id, { is_active: !op.is_active })
      fetchOperators()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (op: Operator) => {
    if (!confirm(`${op.name} を削除しますか？`)) return
    try {
      await deleteOperator(op.id)
      fetchOperators()
    } catch (err: any) {
      alert(err.message || '削除に失敗しました')
    }
  }

  return (
    <div className="admin-page">
      <h2>設定</h2>

      <div className="admin-section">
        <div className="admin-section-header">
          <h3>オペレーター管理</h3>
          <button className="admin-btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'キャンセル' : '新規追加'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="admin-operator-form">
            {formError && <div className="admin-error">{formError}</div>}
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>ユーザー名</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  minLength={3}
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label>パスワード</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label>名前</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="admin-input"
                />
              </div>
              <div className="admin-form-group">
                <label>権限</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="admin-select"
                >
                  <option value="operator">オペレーター</option>
                  <option value="admin">管理者</option>
                </select>
              </div>
            </div>
            <button type="submit" className="admin-btn-primary" disabled={formLoading}>
              {formLoading ? '作成中...' : '追加'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="admin-page-loading">読み込み中...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ユーザー名</th>
                <th>名前</th>
                <th>権限</th>
                <th>状態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {operators.map(op => (
                <tr key={op.id}>
                  <td>{op.username}</td>
                  <td>{op.name}</td>
                  <td>{op.role === 'admin' ? '管理者' : 'オペレーター'}</td>
                  <td>
                    <span className={`admin-badge ${op.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      {op.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button
                        className="admin-btn-small"
                        onClick={() => handleToggleActive(op)}
                      >
                        {op.is_active ? '無効化' : '有効化'}
                      </button>
                      <button
                        className="admin-btn-small admin-btn-danger"
                        onClick={() => handleDelete(op)}
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {operators.length === 0 && (
                <tr><td colSpan={5} className="admin-table-empty">オペレーターがいません</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
