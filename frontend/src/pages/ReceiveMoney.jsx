import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const ReceiveMoney = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const p = user || {};
  const initial = p.name?.charAt(0)?.toUpperCase() || 'U';
  const spayId = p.spay_id || 'SPAY------';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(spayId);
      setCopied(true);
      toast.success('SPay ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      toast.error('Failed to copy. Please copy manually.');
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel page-fade-in">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Payment Request</p>
            <h2>Receive Money</h2>
          </div>
        </header>

        <section className="content-panel receive-grid">
          <div className="profile-card compact-card">
            <div className="avatar large">{initial}</div>
            <h3>{p.name || 'User'}</h3>
            <p>{p.email || '—'}</p>
            <p>{p.phone || '—'}</p>
            <div className="spay-id-box" onClick={handleCopy} title="Click to copy">
              SPay ID: {spayId}
              <button type="button" className="copy-btn">
                {copied ? '✅' : '📋'}
              </button>
            </div>
          </div>

          <div className="request-panel">
            <div className="qr-box">
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📱</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Share your SPay ID</div>
                <div style={{ fontSize: '1.1rem', marginTop: '4px', color: 'var(--primary-2)' }}>{spayId}</div>
              </div>
            </div>
            <button type="button" className="btn btn-primary" onClick={handleCopy}>
              {copied ? '✅ Copied!' : '📋 Copy SPay ID'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const link = `Pay me via SPay: ${spayId}`;
                navigator.clipboard.writeText(link);
                toast.info('Payment link copied!');
              }}
            >
              🔗 Copy Payment Link
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ReceiveMoney;
