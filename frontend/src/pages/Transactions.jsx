import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/transactions');
        setTransactions(data);
      } catch (_) {
        // fallback
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatAmount = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filtered = transactions.filter((t) => {
    const matchSearch =
      !search ||
      (t.transaction_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.sender_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.receiver_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(search.toLowerCase());

    const matchType = !typeFilter || t.transaction_type === typeFilter;

    const matchDate =
      !dateFilter ||
      (t.created_at && new Date(t.created_at).toISOString().slice(0, 10) === dateFilter);

    return matchSearch && matchType && matchDate;
  });

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel page-fade-in">
        <header className="panel-header">
          <div>
            <p className="eyebrow">History</p>
            <h2>Transaction History</h2>
          </div>
        </header>

        {loading ? (
          <LoadingSpinner message="Loading transactions..." />
        ) : (
          <section className="content-panel">
            <div className="toolbar">
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
                <option value="added">Added</option>
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>No transactions found</h3>
                <p>{transactions.length > 0 ? 'Try adjusting your filters.' : 'Start by sending or receiving money.'}</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Recipient / Sender</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>{item.transaction_id || `TXN-${item.id}`}</td>
                      <td>{item.sender_name || item.receiver_name || '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{item.transaction_type}</td>
                      <td>{formatAmount(item.amount)}</td>
                      <td>{item.description || '—'}</td>
                      <td>{formatDate(item.created_at)}</td>
                      <td>
                        <span className={`status ${(item.status || 'success').toLowerCase()}`}>
                          {item.status || 'Success'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Transactions;
