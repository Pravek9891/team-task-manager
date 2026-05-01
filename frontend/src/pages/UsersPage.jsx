import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import { authApi } from '../api';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    authApi.listUsers()
      .then((res) => setUsers(res.data.results || res.data))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout title="Users">
      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="user-search"
          style={{ minWidth: 250 }}
        />
        <span style={{ color: 'var(--text-2)', fontSize: 12.5, marginLeft: 'auto' }}>
          {filtered.length} {filtered.length === 1 ? 'user' : 'users'}
        </span>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <div className="table-wrapper">
          <table id="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} id={`user-row-${u.id}`}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
                        {(u.full_name || u.email).slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{u.full_name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span></td>
                  <td style={{ color: 'var(--text-2)', fontSize: 12.5 }}>
                    {new Date(u.date_joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-2)', padding: 40 }}>
                    No users match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
