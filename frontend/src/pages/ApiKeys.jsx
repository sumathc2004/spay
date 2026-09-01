import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import api from '../services/api';

const ApiKeys = () => {
  const toast = useToast();
  const [keys, setKeys] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [activeTab, setActiveTab] = useState('curl');
  const [testAmount, setTestAmount] = useState('500');
  const [testEmail, setTestEmail] = useState('customer@example.com');
  const [testingApi, setTestingApi] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const loadKeys = async () => {
    try {
      const { data } = await api.get('/keys');
      setKeys(data);
      setWebhookUrl(data.webhookUrl || '');
    } catch (_) {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleRegenerate = async () => {
    if (!window.confirm('Regenerating API keys will immediately revoke existing keys. Are you sure?')) {
      return;
    }

    setRegenerating(true);
    try {
      const { data } = await api.post('/keys/regenerate');
      setKeys(data.keys);
      toast.success('New API keys generated!');
    } catch (err) {
      toast.error('Failed to regenerate keys.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveWebhook = async (e) => {
    e.preventDefault();
    setSavingWebhook(true);
    try {
      await api.put('/keys/webhook', { webhookUrl });
      toast.success('Webhook URL updated successfully!');
    } catch (err) {
      toast.error('Failed to save webhook URL.');
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleTestCharge = async (e) => {
    e.preventDefault();
    setTestingApi(true);
    setTestResult(null);

    try {
      const res = await fetch('http://localhost:5000/api/keys/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': keys?.secretKey || '',
        },
        body: JSON.stringify({
          amount: Number(testAmount),
          customer_email: testEmail,
          order_id: `DEMO-${Date.now()}`,
        }),
      });

      const data = await res.json();
      setTestResult(data);
      if (res.ok) {
        toast.success('API Request Successful • HTTP 200');
      } else {
        toast.error(data.error || 'Test charge failed');
      }
    } catch (err) {
      toast.error('Error connecting to SPay API');
    } finally {
      setTestingApi(false);
    }
  };

  const pk = keys?.publicKey || 'spay_pk_live_98a72f10d48b';
  const sk = keys?.secretKey || 'spay_sk_live_e5c2194b3018f972a1d044';

  const snippets = {
    curl: `curl -X POST http://localhost:5000/api/keys/charge \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${sk}" \\
  -d '{
    "amount": 500,
    "customer_email": "customer@example.com",
    "order_id": "ORD-98765"
  }'`,
    js: `// JavaScript (Fetch)
const response = await fetch('http://localhost:5000/api/keys/charge', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${sk}'
  },
  body: JSON.stringify({
    amount: 500,
    customer_email: 'customer@example.com',
    order_id: 'ORD-98765'
  })
});

const data = await response.json();
console.log('Payment Link:', data.payment_link);`,
    python: `# Python (requests)
import requests

response = requests.post(
    'http://localhost:5000/api/keys/charge',
    headers={'x-api-key': '${sk}'},
    json={
        'amount': 500,
        'customer_email': 'customer@example.com',
        'order_id': 'ORD-98765'
    }
)
print(response.json())`,
    node: `// Node.js (Axios)
const axios = require('axios');

async function createPayment() {
  const { data } = await axios.post(
    'http://localhost:5000/api/keys/charge',
    {
      amount: 500,
      customer_email: 'customer@example.com',
      order_id: 'ORD-98765'
    },
    {
      headers: { 'x-api-key': '${sk}' }
    }
  );
  return data.payment_link;
}`
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel page-fade-in">
        <header className="panel-header">
          <div>
            <span className="eyebrow">Developer Platform</span>
            <h2>API Keys & Integration</h2>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            🔄 {regenerating ? 'Regenerating...' : 'Regenerate Keys'}
          </button>
        </header>

        {loading ? (
          <LoadingSpinner message="Loading credentials..." />
        ) : (
          <div style={{ display: 'grid', gap: '24px' }}>
            {/* 1. API Keys Box */}
            <section className="content-panel">
              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ margin: '0 0 6px', color: 'var(--primary)' }}>Merchant API Credentials</h3>
                <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.92rem' }}>
                  Authenticate requests from your backend server or frontend store. Keep secret keys private.
                </p>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                {/* Public Key Card */}
                <div className="key-card-box">
                  <div className="key-card-header">
                    <div className="key-card-title">
                      <span>🌐</span>
                      <span>Publishable Key</span>
                    </div>
                    <span className="badge-pill public">Client-side</span>
                  </div>
                  <div className="key-input-row">
                    <input
                      type="text"
                      readOnly
                      value={pk}
                      className="key-input-field"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => copyToClipboard(pk, 'Publishable Key')}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>

                {/* Secret Key Card */}
                <div className="key-card-box">
                  <div className="key-card-header">
                    <div className="key-card-title">
                      <span>🔐</span>
                      <span>Secret Key</span>
                    </div>
                    <span className="badge-pill secret">Server-side</span>
                  </div>
                  <div className="key-input-row">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      readOnly
                      value={sk}
                      className="key-input-field"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowSecret((prev) => !prev)}
                    >
                      {showSecret ? '🙈 Hide' : '👁️ Show'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => copyToClipboard(sk, 'Secret Key')}
                    >
                      📋 Copy
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Side-by-side: Live API Playground & Webhooks */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
              {/* Live Sandbox Test */}
              <section className="content-panel">
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{ margin: '0 0 4px', color: 'var(--primary)' }}>⚡ Live API Sandbox</h3>
                  <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.88rem' }}>
                    Simulate an instant checkout charge via the API.
                  </p>
                </div>

                <form className="payment-form" onSubmit={handleTestCharge}>
                  <label>
                    Amount (₹)
                    <input
                      type="number"
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Customer Email
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      required
                    />
                  </label>
                  <button
                    type="submit"
                    className="btn btn-primary submit-btn"
                    disabled={testingApi}
                  >
                    {testingApi ? 'Sending API Request...' : '🚀 Test Charge API'}
                  </button>
                </form>

                {testResult && (
                  <div style={{
                    marginTop: '16px',
                    background: '#090d1f',
                    border: '1px solid rgba(75,141,255,0.2)',
                    color: '#68d391',
                    padding: '14px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontFamily: 'monospace'
                  }}>
                    <div style={{ color: '#63b3ed', fontWeight: 700, marginBottom: '6px' }}>
                      ✓ HTTP 200 OK • Response
                    </div>
                    <pre style={{ margin: 0, overflowX: 'auto', color: '#cbd5e0' }}>
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </div>
                )}
              </section>

              {/* Webhook Configuration */}
              <section className="content-panel">
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{ margin: '0 0 4px', color: 'var(--primary)' }}>🔔 Webhook Callbacks</h3>
                  <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.88rem' }}>
                    Receive automated notifications whenever a customer pays.
                  </p>
                </div>

                <form className="payment-form" onSubmit={handleSaveWebhook}>
                  <label>
                    Webhook Listener URL
                    <input
                      type="url"
                      placeholder="https://yourwebsite.com/spay-callback"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                  </label>
                  <button
                    type="submit"
                    className="btn btn-secondary submit-btn"
                    disabled={savingWebhook}
                  >
                    {savingWebhook ? 'Saving...' : 'Save Webhook URL'}
                  </button>
                </form>

                <div style={{
                  marginTop: '18px',
                  background: '#f8faff',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '0.85rem',
                  color: 'var(--muted)'
                }}>
                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>
                    💡 Webhook Tip
                  </strong>
                  SPay will send a JSON payload with `event: "payment.succeeded"` whenever a transaction settles.
                </div>
              </section>
            </div>

            {/* 3. Terminal Style Code Snippets */}
            <section className="code-terminal">
              <div className="code-terminal-header">
                <div className="window-dots">
                  <span className="window-dot red" />
                  <span className="window-dot yellow" />
                  <span className="window-dot green" />
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginLeft: '8px', fontFamily: 'monospace' }}>
                    integration-guide.{activeTab}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="code-tabs">
                    {['curl', 'js', 'python', 'node'].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        className={`code-tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {tab === 'js' ? 'JavaScript' : tab.toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary small-btn"
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    onClick={() => copyToClipboard(snippets[activeTab], 'Code snippet')}
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              <pre className="code-pre-box">
                {snippets[activeTab]}
              </pre>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default ApiKeys;
