import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DashboardCard from '../components/DashboardCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [walletRes, txRes] = await Promise.allSettled([
          api.get('/wallet'),
          api.get('/transactions'),
        ]);

        if (walletRes.status === 'fulfilled') {
          setWallet(walletRes.value.data);
        }
        if (txRes.status === 'fulfilled') {
          setTransactions(txRes.value.data);
        }
      } catch (_) {
        // Keep defaults if API is unavailable
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const balance = wallet?.balance ?? 0;
  const totalSent = transactions
    .filter((t) => t.transaction_type === 'sent' || (t.sender_id === user?.id && t.transaction_type !== 'added'))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalReceived = transactions
    .filter((t) => t.transaction_type === 'received' || t.transaction_type === 'added')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const recentTx = transactions.slice(0, 5);

  const formatAmount = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel page-fade-in">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>Welcome back, {user?.name || 'User'} 👋</h2>
          </div>
          <button type="button" className="icon-button">🔔</button>
        </header>

        {loading ? (
          <LoadingSpinner message="Loading dashboard..." />
        ) : (
          <>
            <section className="summary-grid">
              <DashboardCard title="Wallet Balance" value={formatAmount(balance)} icon="💰" tone="primary" />
              <DashboardCard title="Total Sent" value={formatAmount(totalSent)} icon="📤" tone="warning" />
              <DashboardCard title="Total Received" value={formatAmount(totalReceived)} icon="📥" tone="success" />
              <DashboardCard title="Transactions" value={String(transactions.length)} icon="📜" tone="neutral" />
            </section>

            <section className="quick-actions">
              <button type="button" className="btn btn-primary" onClick={() => navigate('/send-money')}>💸 Send Money</button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/receive-money')}>📥 Receive Money</button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/wallet')}>💳 Add Money</button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/transactions')}>📜 View Transactions</button>
            </section>

            <section className="content-panel">
              <div className="panel-header compact">
                <h3>Recent Transactions</h3>
                <a href="/transactions">View all</a>
              </div>

              {recentTx.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <h3>No transactions yet</h3>
                  <p>Send or receive money to see your transaction history here.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTx.map((item) => (
                        <tr key={item.id}>
                          <td>{item.sender_name || item.receiver_name || '—'}</td>
                          <td style={{ textTransform: 'capitalize' }}>{item.transaction_type || '—'}</td>
                          <td>{formatAmount(item.amount)}</td>
                          <td>{formatDate(item.created_at)}</td>
                          <td><span className={`status ${(item.status || 'success').toLowerCase()}`}>{item.status || 'Success'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
