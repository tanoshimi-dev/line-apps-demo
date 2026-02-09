import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AdminMember, Pagination } from '../types'
import { getMembers } from '../services/adminApi'

export default function AdminMembers() {
  const [members, setMembers] = useState<AdminMember[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [search, setSearch] = useState('')
  const [rankFilter, setRankFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getMembers({ page, search, rank: rankFilter, per_page: 20 })
      setMembers(result.data)
      setPagination(result.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search, rankFilter])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchMembers()
  }

  return (
    <div className="admin-page">
      <h2>会員管理</h2>

      <div className="admin-filters">
        <form onSubmit={handleSearch} className="admin-search-form">
          <input
            type="text"
            placeholder="名前・会員番号で検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
          />
          <button type="submit" className="admin-btn-secondary">検索</button>
        </form>
        <select
          value={rankFilter}
          onChange={(e) => { setRankFilter(e.target.value); setPage(1) }}
          className="admin-select"
        >
          <option value="">全ランク</option>
          <option value="bronze">Bronze</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-page-loading">読み込み中...</div>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>会員番号</th>
                <th>名前</th>
                <th>ランク</th>
                <th>ポイント</th>
                <th>登録日</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr
                  key={member.id}
                  onClick={() => navigate(`/admin/members/${member.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{member.member_number}</td>
                  <td>{member.display_name}</td>
                  <td>
                    <span className={`admin-badge rank-${member.rank}`}>
                      {member.rank}
                    </span>
                  </td>
                  <td>{member.points.toLocaleString()} pt</td>
                  <td>{new Date(member.created_at).toLocaleDateString('ja-JP')}</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={5} className="admin-table-empty">会員が見つかりません</td></tr>
              )}
            </tbody>
          </table>

          {pagination && pagination.last_page > 1 && (
            <div className="admin-pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="admin-btn-secondary"
              >
                前へ
              </button>
              <span>{page} / {pagination.last_page}</span>
              <button
                disabled={page >= pagination.last_page}
                onClick={() => setPage(p => p + 1)}
                className="admin-btn-secondary"
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
