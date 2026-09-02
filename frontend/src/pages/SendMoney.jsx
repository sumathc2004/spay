import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';
import { playPaymentChime } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const QUICK_AMOUNTS = [100, 500, 1000, 2000, 5000];

const RECENT_CONTACTS = [
  { name: 'Rahul Sharma', phone: '9876543210', upi: '9876543210@spay', avatar: 'R', color: '#6366f1' },
  { name: 'Priya Patel', phone: '9822334455', upi: 'priya@okaxis', avatar: 'P', color: '#ec4899' },
  { name: 'Amit Kumar', phone: '9711223344', upi: 'amit@paytm', avatar: 'A', color: '#10b981' },
  { name: 'Sneha Rao', phone: '9655443322', upi: 'sneha@okhdfcbank', avatar: 'S', color: '#f59e0b' }
];

const SendMoney = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { liveBalance, setLiveBalance } = useAuth();
  
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [recipientData, setRecipientData] = useState(null);

  const [form, setForm] = useState({
    recipient: '',
    amount: '',
    description: '',
  });

  // Scanner Modal State
  const [showScanner, setShowScanner] = useState(false);

  // UPI Security PIN State
  const [showPinModal, setShowPinModal] = useState(false);
  const [upiPin, setUpiPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Bank Processing Steps Animation
  const [transferStep, setTransferStep] = useState(0); // 0: idle, 1: connecting NPCI, 2: core banking, 3: success

  // Success Screen State
  const [successReceipt, setSuccessReceipt] = useState(null);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const { data } = await api.get('/wallet');
        if (data?.balance !== undefined) {
          setBalance(data.balance);
          if (setLiveBalance) setLiveBalance(data.balance);
        }
      } catch (_) {
        // fallback
      }
    };
    loadBalance();
  }, [setLiveBalance]);

  // Sync with global liveBalance
  useEffect(() => {
    if (liveBalance !== null && liveBalance !== undefined) {
      setBalance(liveBalance);
    }
  }, [liveBalance]);

  // Debounced live recipient lookup
  useEffect(() => {
    const query = form.recipient.trim();
    if (!query || query.length < 3) {
      setRecipientData(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLookingUp(true);
      try {
        const { data } = await api.get(`/transactions/lookup-recipient?query=${encodeURIComponent(query)}`);
        if (data.exists) {
          setRecipientData(data);
        } else {
          setRecipientData(null);
        }
      } catch (_) {
        setRecipientData(null);
      } finally {
        setLookingUp(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [form.recipient]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleQuickAmount = (amt) => {
    setForm((prev) => ({ ...prev, amount: String(amt) }));
  };

  const handleSelectRecentContact = (contact) => {
    setForm((prev) => ({ ...prev, recipient: contact.upi || contact.phone }));
    setRecipientData({
      name: contact.name,
      phone: contact.phone,
      upi_id: contact.upi,
      avatar: contact.avatar,
      verified: true
    });
  };

  // Step 1: Validate and open UPI PIN modal
  const handleInitiateTransfer = (e) => {
    e.preventDefault();

    if (!form.recipient || !form.amount || Number(form.amount) <= 0) {
      toast.error('Please enter a recipient and valid transfer amount.');
      return;
    }

    if (Number(form.amount) > Number(balance)) {
      toast.error('Insufficient wallet balance.');
      return;
    }

    setUpiPin('');
    setPinError('');
    setShowPinModal(true);
  };

  // Step 2: Keypad input
  const handlePinDigit = (digit) => {
    if (upiPin.length < 4) {
      setUpiPin((prev) => prev + digit);
    }
  };

  const handlePinDelete = () => {
    setUpiPin((prev) => prev.slice(0, -1));
  };

  // Step 3: Execute transfer with authentic banking switch simulation
  const handleConfirmPin = async () => {
    if (upiPin.length !== 4) {
      setPinError('Please enter a 4-digit UPI PIN');
      return;
    }

    setLoading(true);
    setPinError('');
    setTransferStep(1); // Connecting to NPCI

    try {
      await new Promise((r) => setTimeout(r, 450));
      setTransferStep(2); // Core Banking Authorization

      const { data } = await api.post('/transactions/send', {
        recipient: form.recipient,
        amount: Number(form.amount),
        description: form.description || 'Instant Transfer',
        upiPin: upiPin,
      });

      await new Promise((r) => setTimeout(r, 400));
      setTransferStep(3); // Success

      setShowPinModal(false);
      const newBal = data.balance ?? balance - Number(form.amount);
      setBalance(newBal);
      if (setLiveBalance) setLiveBalance(newBal);

      setSuccessReceipt({
        amount: Number(form.amount),
        recipient: recipientData?.name || form.recipient,
        upi_id: recipientData?.upi_id || form.recipient,
        transaction_id: data.transaction?.transaction_id || `TXN-${Date.now()}`,
        utr_number: data.utr_number || data.transaction?.utr_number || '260902998877',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + new Date().toLocaleDateString('en-GB')
      });

      // Play Sound & Confetti
      playPaymentChime();
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (_) {}

    } catch (err) {
      setTransferStep(0);
      setPinError(err.response?.data?.message || 'Transfer failed. Check PIN and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleScanSampleQR = (qrData) => {
    setForm((prev) => ({
      ...prev,
      recipient: qrData.upi,
      amount: qrData.amount ? String(qrData.amount) : prev.amount
    }));
    setShowScanner(false);
    toast.success(`Scanned QR for ${qrData.name}!`);
  };

  const formatAmount = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel page-fade-in">
        <header className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span className="eyebrow">Real-Time UPI Transfer</span>
            <h2>Send Money</h2>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowScanner(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '999px', padding: '10px 18px', fontWeight: 800 }}
          >
            <span>📸</span> Scan Any UPI QR
          </button>
        </header>

        {/* Available Balance Header */}
        <section className="content-panel form-panel" style={{ maxWidth: '680px' }}>
          <div className="balance-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem' }}>Available SPay Balance</span>
              <strong>{formatAmount(balance)}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.12)', color: 'var(--success)', padding: '6px 14px', borderRadius: '999px', fontWeight: 800, fontSize: '0.8rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} /> Live 24x7 IMPS / UPI
            </div>
          </div>

          {/* Recent Contacts Carousel */}
          <div style={{ marginBottom: '22px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '10px', letterSpacing: '0.04em' }}>
              RECENT CONTACTS & FREQUENT TRANSFERS
            </span>
            <div style={{ display: 'flex', gap: '14px', overflowX: 'auto', paddingBottom: '6px' }}>
              {RECENT_CONTACTS.map((c) => (
                <div
                  key={c.phone}
                  onClick={() => handleSelectRecentContact(c)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    minWidth: '76px',
                    padding: '8px 6px',
                    borderRadius: '16px',
                    background: form.recipient === c.upi || form.recipient === c.phone ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
                    border: form.recipient === c.upi || form.recipient === c.phone ? '1px solid var(--primary-2)' : '1px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: c.color, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '1.2rem', boxShadow: '0 6px 16px rgba(0,0,0,0.1)' }}>
                    {c.avatar}
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {c.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <form className="payment-form" onSubmit={handleInitiateTransfer}>
            {/* Recipient Input */}
            <label>
              To: Mobile Number or UPI ID
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="recipient"
                  value={form.recipient}
                  onChange={handleChange}
                  placeholder="e.g. 9606773589 or suman@spay / rahul@okaxis"
                  required
                  style={{ paddingRight: '40px' }}
                />
                {lookingUp && (
                  <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    🔍
                  </span>
                )}
              </div>
            </label>

            {/* Contact Verified Badge */}
            {recipientData && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(79, 70, 229, 0.06)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '18px', padding: '12px 16px', animation: 'fadeInUp 0.2s ease' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-2), var(--accent))', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '1.2rem' }}>
                  {recipientData.avatar || 'U'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ color: 'var(--primary)', fontSize: '1rem' }}>{recipientData.name}</strong>
                    <span style={{ background: '#10b981', color: '#fff', fontSize: '0.68rem', padding: '2px 7px', borderRadius: '999px', fontWeight: 800 }}>
                      ✓ VERIFIED BENEFICIARY
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '2px' }}>
                    UPI: {recipientData.upi_id || recipientData.phone}
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Amount */}
            <label>
              Enter Amount
              <input
                type="number"
                name="amount"
                min="1"
                max={balance}
                value={form.amount}
                onChange={handleChange}
                placeholder="₹0.00"
                required
                style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}
              />
            </label>

            {/* Quick Amount Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => handleQuickAmount(amt)}
                  style={{
                    background: Number(form.amount) === amt ? 'var(--primary-2)' : '#f8faff',
                    color: Number(form.amount) === amt ? '#fff' : 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '999px',
                    padding: '6px 14px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  +₹{amt}
                </button>
              ))}
            </div>

            {/* Note / Description */}
            <label>
              Add a Message (Optional)
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="e.g. Rent, Dinner, Project payment"
              />
            </label>

            <button type="submit" className="btn btn-primary submit-btn" style={{ padding: '1rem', fontSize: '1.05rem', fontWeight: 800 }}>
              🔒 Pay Securely {form.amount ? `₹${Number(form.amount).toLocaleString('en-IN')}` : ''}
            </button>
          </form>
        </section>

        {/* ── INTERACTIVE QR SCANNER MODAL ── */}
        {showScanner && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 10, 26, 0.8)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'grid', placeItems: 'center', padding: '16px' }}>
            <div className="page-fade-in" style={{ background: '#ffffff', borderRadius: '28px', width: 'min(100%, 420px)', padding: '28px 24px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>📸 Scan UPI QR Code</strong>
                <button onClick={() => setShowScanner(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
              </div>

              {/* Viewfinder Graphic */}
              <div style={{ width: '220px', height: '220px', border: '3px dashed var(--primary-2)', borderRadius: '24px', margin: '0 auto 20px', display: 'grid', placeItems: 'center', background: '#f8faff', position: 'relative' }}>
                <div style={{ fontSize: '3rem' }}>📷</div>
                <div style={{ position: 'absolute', bottom: '12px', fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600 }}>
                  Camera Ready / Tap Below
                </div>
              </div>

              <span style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block', marginBottom: '14px' }}>
                Or select a test merchant QR to test instant transfer:
              </span>

              <div style={{ display: 'grid', gap: '8px' }}>
                {[
                  { name: 'Starbucks Coffee', upi: 'starbucks@okaxis', amount: 350 },
                  { name: 'Fresh Supermarket', upi: 'freshmart@paytm', amount: 820 },
                  { name: 'Sumanth C (Personal)', upi: '9606773589@spay', amount: 500 }
                ].map((m) => (
                  <button
                    key={m.upi}
                    type="button"
                    onClick={() => handleScanSampleQR(m)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8faff', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    <span>🏪 {m.name}</span>
                    <strong style={{ color: 'var(--primary-2)' }}>₹{m.amount}</strong>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 4-DIGIT UPI PIN KEYPAD MODAL (PhonePe Style) ── */}
        {showPinModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 10, 26, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'grid', placeItems: 'center', padding: '16px' }}>
            <div className="page-fade-in" style={{ background: '#ffffff', borderRadius: '28px', width: 'min(100%, 380px)', padding: '28px 24px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', textAlign: 'center' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontWeight: 800, color: 'var(--primary-2)', fontSize: '0.95rem' }}>SPay UPI Secure Switch</span>
                {!loading && <button onClick={() => setShowPinModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--muted)' }}>✕</button>}
              </div>

              <div style={{ margin: '14px 0 20px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Paying to</span>
                <h3 style={{ margin: '4px 0 2px', color: 'var(--primary)' }}>{recipientData?.name || form.recipient}</h3>
                <h2 style={{ fontSize: '2.1rem', color: 'var(--primary-2)', margin: '8px 0 0', fontWeight: 900 }}>
                  ₹{Number(form.amount).toLocaleString('en-IN')}
                </h2>
              </div>

              {/* Progress State during transfer */}
              {transferStep > 0 && (
                <div style={{ background: 'rgba(79, 70, 229, 0.08)', padding: '14px', borderRadius: '16px', marginBottom: '16px', animation: 'fadeInUp 0.2s ease' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>
                    <span className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />
                    {transferStep === 1 && 'Connecting to NPCI UPI Switch...'}
                    {transferStep === 2 && 'Authorizing with Core Banking System...'}
                    {transferStep === 3 && 'Payment Confirmed!'}
                  </div>
                </div>
              )}

              <div style={{ background: '#f8faff', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '18px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: '10px' }}>
                  ENTER 4-DIGIT UPI PIN (Demo: 1234)
                </span>
                
                {/* 4 Pin Indicator Dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', margin: '8px 0' }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: upiPin.length > i ? 'var(--primary-2)' : '#e2e8f0',
                        transform: upiPin.length > i ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all 0.15s ease'
                      }}
                    />
                  ))}
                </div>

                {pinError && <div style={{ color: '#e11d48', fontSize: '0.8rem', fontWeight: 700, marginTop: '8px' }}>{pinError}</div>}
              </div>

              {/* Numeric Keypad */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '10px' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={loading}
                    onClick={() => handlePinDigit(String(num))}
                    style={{ background: '#f8faff', border: '1px solid var(--border)', borderRadius: '14px', height: '48px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', cursor: 'pointer' }}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handlePinDelete}
                  style={{ background: '#f8faff', border: '1px solid var(--border)', borderRadius: '14px', height: '48px', fontSize: '1.1rem', cursor: 'pointer' }}
                >
                  ⌫
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handlePinDigit('0')}
                  style={{ background: '#f8faff', border: '1px solid var(--border)', borderRadius: '14px', height: '48px', fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', cursor: 'pointer' }}
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPin}
                  disabled={loading || upiPin.length !== 4}
                  style={{ background: 'var(--primary-2)', border: 'none', color: '#fff', borderRadius: '14px', height: '48px', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer' }}
                >
                  {loading ? '...' : '✓'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ANIMATED PAYMENT SUCCESS RECEIPT MODAL ── */}
        {successReceipt && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(7, 10, 26, 0.85)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'grid', placeItems: 'center', padding: '16px' }}>
            <div className="page-fade-in" style={{ background: '#ffffff', borderRadius: '28px', width: 'min(100%, 420px)', padding: '32px 28px', boxShadow: '0 30px 80px rgba(0,0,0,0.4)', textAlign: 'center' }}>
              
              {/* Green Animated Success Tick */}
              <div style={{ width: '76px', height: '76px', borderRadius: '50%', background: '#10b981', color: '#ffffff', display: 'grid', placeItems: 'center', fontSize: '2.5rem', margin: '0 auto 16px', boxShadow: '0 12px 30px rgba(16, 185, 129, 0.4)' }}>
                ✓
              </div>

              <h2 style={{ color: 'var(--primary)', margin: '0 0 4px', fontSize: '1.6rem', fontWeight: 900 }}>
                Payment Successful!
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                Transferred to {successReceipt.recipient}
              </span>

              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)', margin: '18px 0' }}>
                ₹{successReceipt.amount.toLocaleString('en-IN')}.00
              </div>

              {/* Receipt Details Box */}
              <div style={{ background: '#f8faff', border: '1px solid var(--border)', borderRadius: '18px', padding: '16px', textAlign: 'left', display: 'grid', gap: '10px', fontSize: '0.85rem', marginBottom: '22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Bank Ref (UTR):</span>
                  <strong style={{ color: 'var(--primary)' }}>{successReceipt.utr_number}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Transaction ID:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{successReceipt.transaction_id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Paid To:</span>
                  <strong style={{ color: 'var(--text)' }}>{successReceipt.upi_id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--muted)' }}>Time:</span>
                  <span style={{ color: 'var(--text)' }}>{successReceipt.timestamp}</span>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setSuccessReceipt(null);
                    setForm({ recipient: '', amount: '', description: '' });
                  }}
                  style={{ width: '100%' }}
                >
                  Make Another Payment
                </button>
                <Link to="/transactions" className="btn btn-ghost" style={{ width: '100%' }}>
                  View All Transactions
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SendMoney;
