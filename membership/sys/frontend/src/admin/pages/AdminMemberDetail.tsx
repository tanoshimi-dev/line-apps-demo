import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { AdminMemberDetail as MemberDetailType } from '../types'
import { getMemberDetail } from '../services/adminApi'

export default function AdminMemberDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<MemberDetailType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    getMemberDetail(id)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="admin-page-loading">読み込み中...</div>
  }

  if (!data) {
    return <div className="admin-page-error">会員が見つかりません</div>
  }

  const { member, point_history } = data

  return (
    <div className="admin-page">
      <button className="admin-btn-back" onClick={() => navigate('/admin/members')}>
        &larr; 会員一覧に戻る
      </button>

      <div className="admin-detail-header">
        <div className="admin-detail-avatar">
          {member.picture_url ? (
            <img src={member.picture_url} alt={member.display_name} />
          ) : (
            <div className="admin-detail-avatar-placeholder">
              {member.display_name.charAt(0)}
            </div>
          )}
        </div>
        <div className="admin-detail-info">
          <h2>{member.display_name}</h2>
          <p className="admin-detail-number">{member.member_number}</p>
        </div>
      </div>

      <div className="admin-detail-grid">
        <div className="admin-detail-card">
          <div className="admin-detail-label">ポイント</div>
          <div className="admin-detail-value">{member.points.toLocaleString()} pt</div>
        </div>
        <div className="admin-detail-card">
          <div className="admin-detail-label">ランク</div>
          <div className="admin-detail-value">
            <span className={`admin-badge rank-${member.rank}`}>{member.rank}</span>
          </div>
        </div>
        <div className="admin-detail-card">
          <div className="admin-detail-label">登録日</div>
          <div className="admin-detail-value">
            {new Date(member.created_at).toLocaleDateString('ja-JP')}
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h3>ポイント履歴</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>日時</th>
              <th>種別</th>
              <th>ポイント</th>
              <th>残高</th>
              <th>理由</th>
            </tr>
          </thead>
          <tbody>
            {point_history.map(h => (
              <tr key={h.id}>
                <td>{new Date(h.created_at).toLocaleString('ja-JP')}</td>
                <td>
                  <span className={`admin-badge ${h.type === 'add' ? 'badge-add' : 'badge-use'}`}>
                    {h.type === 'add' ? '付与' : '利用'}
                  </span>
                </td>
                <td className={h.type === 'add' ? 'text-add' : 'text-use'}>
                  {h.type === 'add' ? '+' : '-'}{h.points.toLocaleString()}
                </td>
                <td>{h.balance.toLocaleString()} pt</td>
                <td>{h.reason}</td>
              </tr>
            ))}
            {point_history.length === 0 && (
              <tr><td colSpan={5} className="admin-table-empty">履歴がありません</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
