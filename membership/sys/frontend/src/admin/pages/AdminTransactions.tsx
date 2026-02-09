import { useState, useEffect, useCallback } from 'react'
import type { AdminTransaction, Pagination } from '../types'
import { getTransactions } from '../services/adminApi'

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getTransactions({ page, type: typeFilter, per_page: 20 })
      setTransactions(result.data)
      setPagination(result.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return (
    <div className="admin-page">
      <h2>取引履歴</h2>

      <div className="admin-filters">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }}
          className="admin-select"
        >
          <option value="">全種別</option>
          <option value="add">付与</option>
          <option value="use">利用</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-page-loading">読み込み中...</div>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>日時</th>
                <th>会員番号</th>
                <th>会員名</th>
                <th>種別</th>
                <th>ポイント</th>
                <th>残高</th>
                <th>理由</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td>{new Date(tx.created_at).toLocaleString('ja-JP')}</td>
                  <td>{tx.member_number}</td>
                  <td>{tx.member_name}</td>
                  <td>
                    <span className={`admin-badge ${tx.type === 'add' ? 'badge-add' : 'badge-use'}`}>
                      {tx.type === 'add' ? '付与' : '利用'}
                    </span>
                  </td>
                  <td className={tx.type === 'add' ? 'text-add' : 'text-use'}>
                    {tx.type === 'add' ? '+' : '-'}{tx.points.toLocaleString()}
                  </td>
                  <td>{tx.balance.toLocaleString()} pt</td>
                  <td>{tx.reason}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={7} className="admin-table-empty">取引がありません</td></tr>
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
