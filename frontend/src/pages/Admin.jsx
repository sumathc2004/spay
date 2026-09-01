import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const Admin = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, usersRes] = await Promise.allSettled([
          api.get('/admin/statistics'),
          api.get('/admin/users'),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data);
      } catch (_) {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const formatAmount = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel page-fade-in">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Admin</p>
            <h2>Admin Dashboard</h2>
          </div>
        </header>

        {loading ? (
          <LoadingSpinner message="Loading admin data..." />
        ) : (
          <>
            <section className="summary-grid">
              <div className="summary-card primary">
                <div className="summary-card__head">
                  <span className="summary-icon">👥</span>
                  <span className="summary-label">Total Users</span>
                </div>
                <h3>{stats?.totalUsers ?? users.length}</h3>
              </div>
              <div className="summary-card success">
                <div className="summary-card__head">
                  <span className="summary-icon">✅</span>
                  <span className="summary-label">Active Users</span>
                </div>
                <h3>{stats?.activeUsers ?? '—'}</h3>
              </div>
              <div className="summary-card warning">
                <div className="summary-card__head">
                  <span className="summary-icon">💸</span>
                  <span className="summary-label">Total Transactions</span>
                </div>
                <h3>{stats?.totalTransactions ?? '—'}</h3>
              </div>
              <div className="summary-card neutral">
                <div className="summary-card__head">
                  <span className="summary-icon">📈</span>
                  <span className="summary-label">Volume</span>
                </div>
                <h3>{formatAmount(stats?.totalTransactionVolume)}</h3>
              </div>
            </section>

            <section className="content-panel">
              <div className="panel-header compact">
                <h3>Registered Users</h3>
              </div>

              {users.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👤</div>
                  <h3>No users found</h3>
                  <p>Users will appear here once they register.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>SPay ID</th>
                      <th>Role</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id || u.email}>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.spay_id || '—'}</td>
                        <td style={{ textTransform: 'capitalize' }}>{u.role || 'user'}</td>
                        <td>{formatDate(u.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Admin;
