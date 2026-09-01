import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';
import api from '../services/api';

const SendMoney = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    recipient: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const { data } = await api.get('/wallet');
        if (data?.balance !== undefined) setBalance(data.balance);
      } catch (_) {
        // fallback
      }
    };
    loadBalance();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.recipient || !form.amount || Number(form.amount) <= 0) {
      toast.error('Please fill in recipient and a valid amount.');
      return;
    }

    if (Number(form.amount) > Number(balance)) {
      toast.error('Insufficient wallet balance.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/transactions/send', {
        recipient: form.recipient,
        amount: Number(form.amount),
        description: form.description || 'Money transfer',
      });
      toast.success(data.message || 'Money sent successfully!');
      setBalance(data.balance ?? balance - Number(form.amount));
      setForm({ recipient: '', amount: '', description: '' });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transaction failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel page-fade-in">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Transfer</p>
            <h2>Send Money</h2>
          </div>
        </header>

        <section className="content-panel form-panel">
          <div className="balance-box">
            <span>Available Balance</span>
            <strong>{formatAmount(balance)}</strong>
          </div>

          <form className="payment-form" onSubmit={handleSubmit}>
            <label>
              Recipient (Email, Phone, or SPay ID)
              <input
                type="text"
                name="recipient"
                value={form.recipient}
                onChange={handleChange}
                placeholder="Enter email, phone, or SPay ID"
                required
              />
            </label>

            <label>
              Amount
              <input
                type="number"
                name="amount"
                min="1"
                value={form.amount}
                onChange={handleChange}
                placeholder="₹0.00"
                required
              />
            </label>

            <label>
              Payment Description
              <textarea
                name="description"
                rows="3"
                value={form.description}
                onChange={handleChange}
                placeholder="Add a note for this transfer"
              />
            </label>

            <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Money'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default SendMoney;
