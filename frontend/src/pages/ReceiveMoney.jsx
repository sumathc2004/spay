import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { getSocket, playPaymentChime } from '../services/socket';

const ReceiveMoney = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [copiedItem, setCopiedItem] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [incomingTx, setIncomingTx] = useState(null);

  const u = user || {};
  const name = u.name || 'Suman Sharma';
  const phone = u.phone || '9876543210';
  const spayId = u.spay_id || 'SPAY5CJK2ZP';
  const upiId = `${phone}@spay`;

  // Standard UPI URI Scheme accepted by all Indian UPI apps (PhonePe, GPay, Paytm, BHIM)
  const upiPayload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&cu=INR${customAmount && Number(customAmount) > 0 ? `&am=${customAmount}&tn=PaymentToSPay` : ''}`;

  // Listen for live incoming payments
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      const handlePaymentReceived = (data) => {
        setIncomingTx(data);
        playPaymentChime();
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } });
        } catch (_) {}
      };

      socket.on('payment_received', handlePaymentReceived);
      return () => {
        socket.off('payment_received', handlePaymentReceived);
      };
    }
  }, []);

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => setCopiedItem(''), 2500);
    } catch (_) {
      toast.error('Failed to copy to clipboard.');
    }
  };

  const shareOnWhatsApp = () => {
    const text = `Hey! Pay me ₹${customAmount || ''} on SPay / UPI:\n📱 Phone: ${phone}\n💳 UPI ID: ${upiId}\n🆔 SPay ID: ${spayId}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel page-fade-in">
        <header className="panel-header">
          <div>
            <span className="eyebrow">Instant Collections</span>
            <h2>Receive Money & UPI QR</h2>
          </div>
        </header>

        {/* Live Incoming Payment Alert Banner */}
        {incomingTx && (
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', padding: '18px 22px', borderRadius: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '2rem' }}>🎉</span>
              <div>
                <strong style={{ fontSize: '1.1rem', display: 'block' }}>
                  Received ₹{Number(incomingTx.amount).toLocaleString('en-IN')} from {incomingTx.sender_name}!
                </strong>
                <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                  Bank Ref (UTR): {incomingTx.utr_number} • Just now
                </span>
              </div>
            </div>
            <button
              onClick={() => setIncomingTx(null)}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}
            >
              Dismiss
            </button>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px', alignItems: 'start' }}>
          
          {/* ── LEFT COLUMN: PHONEPE STYLE UPI QR STANDEE ── */}
          <section className="content-panel" style={{ padding: '32px 28px', textAlign: 'center', background: '#ffffff', borderRadius: '28px' }}>
            {/* Standee Header */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(79, 70, 229, 0.08)', padding: '6px 16px', borderRadius: '999px', marginBottom: '16px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary-2)' }}>SPay All-in-One UPI QR</span>
            </div>

            <h3 style={{ margin: '0 0 4px', color: 'var(--primary)', fontSize: '1.35rem', fontWeight: 900 }}>
              {name}
            </h3>
            <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
              Scan to pay with any UPI App
            </span>

            {/* QR Code Container */}
            <div style={{ background: '#ffffff', padding: '20px', borderRadius: '24px', display: 'inline-block', margin: '20px 0', border: '2px solid rgba(99, 102, 241, 0.2)', boxShadow: '0 15px 35px rgba(79, 70, 229, 0.08)' }}>
              <QRCodeSVG
                value={upiPayload}
                size={200}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: '/favicon.svg',
                  x: undefined,
                  y: undefined,
                  height: 36,
                  width: 36,
                  excavate: true,
                }}
              />
            </div>

            {/* Supported App Logos Pill */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600, marginBottom: '20px' }}>
              <span>PhonePe</span> • <span>GPay</span> • <span>Paytm</span> • <span>BHIM</span> • <span>SPay</span>
            </div>

            {/* Optional Specific Amount Input */}
            <div style={{ background: '#f8faff', padding: '14px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '18px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                Set Specific Amount on QR (Optional):
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--border)', fontWeight: 700, fontSize: '0.95rem' }}
                />
                {customAmount && (
                  <button
                    onClick={() => setCustomAmount('')}
                    style={{ background: '#e2e8f0', border: 'none', borderRadius: '10px', padding: '0 12px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => copyToClipboard(upiPayload, 'Payment Link')}
                style={{ fontSize: '0.88rem', padding: '0.75rem' }}
              >
                {copiedItem === 'Payment Link' ? '✅ Copied!' : '🔗 Copy QR Link'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={shareOnWhatsApp}
                style={{ fontSize: '0.88rem', padding: '0.75rem', color: '#059669', borderColor: '#a7f3d0' }}
              >
                💬 WhatsApp Share
              </button>
            </div>
          </section>

          {/* ── RIGHT COLUMN: RECEIVE CHANNELS & DETAILS ── */}
          <section style={{ display: 'grid', gap: '16px' }}>
            
            {/* Channel 1: Mobile Number */}
            <div className="content-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-2)', display: 'grid', placeItems: 'center', fontSize: '1.4rem' }}>
                  📱
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>+91 {phone}</strong>
                    <span style={{ background: '#10b981', color: '#fff', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '999px', fontWeight: 800 }}>
                      ACTIVE
                    </span>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                    Anyone can send money using your Mobile Number
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(phone, 'Phone Number')}
                className="btn btn-ghost"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                {copiedItem === 'Phone Number' ? '✅ Copied' : '📋 Copy'}
              </button>
            </div>

            {/* Channel 2: Primary UPI ID */}
            <div className="content-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'grid', placeItems: 'center', fontSize: '1.4rem' }}>
                  💳
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>{upiId}</strong>
                    <span style={{ background: 'var(--primary-2)', color: '#fff', fontSize: '0.65rem', padding: '1px 6px', borderRadius: '999px', fontWeight: 800 }}>
                      PRIMARY UPI
                    </span>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                    Official UPI Virtual Payment Address (VPA)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(upiId, 'UPI ID')}
                className="btn btn-ghost"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                {copiedItem === 'UPI ID' ? '✅ Copied' : '📋 Copy'}
              </button>
            </div>

            {/* Channel 3: SPay Unique ID */}
            <div className="content-panel" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', display: 'grid', placeItems: 'center', fontSize: '1.4rem' }}>
                  🆔
                </div>
                <div>
                  <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>{spayId}</strong>
                  <span style={{ fontSize: '0.82rem', color: 'var(--muted)', display: 'block' }}>
                    SPay In-App Wallet Tag
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(spayId, 'SPay ID')}
                className="btn btn-ghost"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                {copiedItem === 'SPay ID' ? '✅ Copied' : '📋 Copy'}
              </button>
            </div>

            {/* Security Guarantee Box */}
            <div style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(99, 102, 241, 0.08))', border: '1px dashed rgba(99, 102, 241, 0.3)', borderRadius: '20px', padding: '18px 20px' }}>
              <strong style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', marginBottom: '6px' }}>
                <span>🛡️</span> 100% Zero-Downtime Settlement
              </strong>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                All incoming payments to your Mobile Number, UPI ID, or QR code are instantly credited to your SPay Wallet with real-time audio and push confirmations.
              </p>
            </div>

          </section>
        </div>
      </main>
    </div>
  );
};

export default ReceiveMoney;
