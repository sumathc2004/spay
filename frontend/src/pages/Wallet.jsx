import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import api from '../services/api';

const Wallet = () => {
  const toast = useToast();
  const [wallet, setWallet] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI (Demo)');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [walletRes, historyRes] = await Promise.allSettled([
        api.get('/wallet'),
        api.get('/wallet/history'),
      ]);
      if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data);
      if (historyRes.status === 'fulfilled') setHistory(historyRes.value.data);
    } catch (_) {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const balance = wallet?.balance ?? 0;
  const totalAdded = history
    .filter((t) => t.transaction_type === 'added')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalSent = history
    .filter((t) => t.transaction_type === 'sent')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalReceived = history
    .filter((t) => t.transaction_type === 'received')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const formatAmount = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

  const handleAddMoney = async (e) => {
    e.preventDefault();
    if (!addAmount || Number(addAmount) <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post('/wallet/add-money', {
        amount: Number(addAmount),
        paymentMethod,
      });
      toast.success(`${formatAmount(addAmount)} added to your wallet!`);
      setWallet((prev) => ({ ...prev, balance: data.balance }));
      setAddAmount('');
      loadData(); // refresh stats
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add money.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel page-fade-in">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Wallet</p>
            <h2>Available Balance</h2>
          </div>
        </header>

        {loading ? (
          <LoadingSpinner message="Loading wallet..." />
        ) : (
          <>
            <section className="wallet-hero">
              <div className="wallet-balance-box">
                <span>Current Balance</span>
                <h3>{formatAmount(balance)}</h3>
              </div>
            </section>

            <section className="stats-grid">
              <div className="stat-box">
                <span>Total Money Added</span>
                <strong>{formatAmount(totalAdded)}</strong>
              </div>
              <div className="stat-box">
                <span>Total Money Sent</span>
                <strong>{formatAmount(totalSent)}</strong>
              </div>
              <div className="stat-box">
                <span>Total Money Received</span>
                <strong>{formatAmount(totalReceived)}</strong>
              </div>
            </section>

            <section className="content-panel form-panel">
              <h3>Add Money</h3>
              <div className="demo-note">
                Demo payment methods are simulated for this educational project and do not process real payments or collect real card data.
              </div>

              <form className="payment-form" onSubmit={handleAddMoney}>
                <label>
                  Amount
                  <input
                    type="number"
                    placeholder="₹1000"
                    min="1"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Payment Method
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option>UPI (Demo)</option>
                    <option>Debit Card (Demo)</option>
                    <option>Bank Transfer (Demo)</option>
                  </select>
                </label>

                <button type="submit" className="btn btn-primary submit-btn" disabled={submitting}>
                  {submitting ? 'Processing...' : 'Add Money'}
                </button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Wallet;
