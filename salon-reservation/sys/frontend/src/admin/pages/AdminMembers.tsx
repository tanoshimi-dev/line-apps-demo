import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminMembers } from '../services/adminApi';
import type { AdminMember } from '../types';

export default function AdminMembers() {
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    getAdminMembers(search || undefined, page)
      .then((data) => {
        setMembers(data.data);
        setLastPage(data.last_page);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="admin-page">
      <h2 className="admin-page-title">会員管理</h2>

      <form onSubmit={handleSearch} className="admin-search-bar">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="名前・電話番号・メールで検索..."
          className="admin-input"
        />
      </form>

      {loading ? (
        <div className="admin-loading">Loading...</div>
      ) : (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>名前</th>
                <th>電話番号</th>
                <th>メール</th>
                <th>登録日</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr
                  key={m.id}
                  className="admin-table-row-clickable"
                  onClick={() => navigate(`/admin/members/${m.id}`)}
                >
                  <td>
                    <div className="admin-user-cell">
                      {m.pictureUrl ? (
                        <img src={m.pictureUrl} alt={m.displayName} className="admin-avatar-sm" />
                      ) : (
                        <div className="admin-avatar-placeholder-sm">
                          {m.displayName.charAt(0)}
                        </div>
                      )}
                      <span>{m.displayName}</span>
                    </div>
                  </td>
                  <td>{m.phone || '-'}</td>
                  <td>{m.email || '-'}</td>
                  <td>{new Date(m.createdAt).toLocaleDateString('ja-JP')}</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-empty-cell">会員がいません</td>
                </tr>
              )}
            </tbody>
          </table>

          {lastPage > 1 && (
            <div className="admin-pagination">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="admin-btn admin-btn-sm"
              >
                前へ
              </button>
              <span>{page} / {lastPage}</span>
              <button
                disabled={page >= lastPage}
                onClick={() => setPage(page + 1)}
                className="admin-btn admin-btn-sm"
              >
                次へ
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
