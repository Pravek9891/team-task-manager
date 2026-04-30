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
          placeholder="🔍 Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="user-search"
          style={{ minWidth: 260 }}
        />
        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginLeft: 'auto' }}>
          {filtered.length} user{filtered.length !== 1 ? 's' : ''}
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
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Member Since</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} id={`user-row-${u.id}`}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '12px' }}>
                        {(u.full_name?.[0] || u.email[0]).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 500 }}>{u.full_name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>{u.email}</td>
                  <td>
                    <span className={`badge badge-${u.role.toLowerCase()}`}>{u.role}</span>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)' }}>
                    {new Date(u.date_joined).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: 'var(--space-8)' }}>
                    No users found.
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
