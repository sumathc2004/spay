import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';
import api from '../services/api';

const Settings = () => {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('password'); // 'password' | 'email' | 'notifications' | 'activity'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password state
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Preferences state
  const [prefs, setPrefs] = useState({
    emailTxnAlerts: true,
    emailSecurityAlerts: true,
    emailMarketing: false,
    emailWeeklyDigest: true,
    pushNotifications: true,
    smsHighValueAlerts: true,
    newDeviceAlerts: true
  });

  // Login Activity state
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const loadSettingsData = async () => {
      try {
        const [prefsRes, activityRes] = await Promise.allSettled([
          api.get('/users/preferences'),
          api.get('/users/login-activity')
        ]);

        if (prefsRes.status === 'fulfilled') setPrefs(prefsRes.value.data);
        if (activityRes.status === 'fulfilled') setSessions(activityRes.value.data);
      } catch (_) {
        // fallback
      } finally {
        setLoading(false);
      }
    };

    loadSettingsData();
  }, []);

  const handlePasswordChange = (e) => {
    setPasswords((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();

    if (passwords.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePref = async (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);

    try {
      await api.put('/users/preferences', updated);
      toast.success('Preferences saved!');
    } catch (_) {
      toast.error('Failed to update preference.');
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('Are you sure you want to log out of all other devices and active sessions?')) {
      return;
    }

    try {
      await api.post('/auth/logout-all');
      toast.success('Logged out of all other devices successfully!');
      const { data } = await api.get('/users/login-activity');
      setSessions(data);
    } catch (_) {
      toast.error('Failed to log out of all devices.');
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel page-fade-in">
        <header className="panel-header">
          <div>
            <span className="eyebrow">Settings & Security</span>
            <h2>Account & Security</h2>
          </div>
        </header>

        {loading ? (
          <LoadingSpinner message="Loading your settings..." />
        ) : (
          <div style={{ display: 'grid', gap: '28px' }}>
            {/* Top Cards Grid */}
            <section className="settings-grid">
              {/* Account Settings Box */}
              <div className="content-panel">
                <h3 style={{ color: 'var(--primary)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>👤</span> Account Settings
                </h3>
                <ul className="settings-list">
                  <li
                    onClick={() => setActiveSection('password')}
                    style={{
                      background: activeSection === 'password' ? 'rgba(79, 70, 229, 0.08)' : '',
                      borderColor: activeSection === 'password' ? 'var(--primary-2)' : '',
                      color: activeSection === 'password' ? 'var(--primary-2)' : ''
                    }}
                  >
                    <span>🔐</span>
                    <div style={{ flex: 1 }}>
                      <strong>Update Password</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>
                        Change your login credentials
                      </div>
                    </div>
                    <span>→</span>
                  </li>

                  <li
                    onClick={() => setActiveSection('email')}
                    style={{
                      background: activeSection === 'email' ? 'rgba(79, 70, 229, 0.08)' : '',
                      borderColor: activeSection === 'email' ? 'var(--primary-2)' : '',
                      color: activeSection === 'email' ? 'var(--primary-2)' : ''
                    }}
                  >
                    <span>📧</span>
                    <div style={{ flex: 1 }}>
                      <strong>Email Preferences</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>
                        Transaction and security digests
                      </div>
                    </div>
                    <span>→</span>
                  </li>

                  <li
                    onClick={() => setActiveSection('notifications')}
                    style={{
                      background: activeSection === 'notifications' ? 'rgba(79, 70, 229, 0.08)' : '',
                      borderColor: activeSection === 'notifications' ? 'var(--primary-2)' : '',
                      color: activeSection === 'notifications' ? 'var(--primary-2)' : ''
                    }}
                  >
                    <span>🔔</span>
                    <div style={{ flex: 1 }}>
                      <strong>Notification Settings</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>
                        Push and SMS alerts
                      </div>
                    </div>
                    <span>→</span>
                  </li>
                </ul>
              </div>

              {/* Security Settings Box */}
              <div className="content-panel">
                <h3 style={{ color: 'var(--primary)', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🛡️</span> Security & Devices
                </h3>
                <ul className="settings-list">
                  <li
                    onClick={() => setActiveSection('activity')}
                    style={{
                      background: activeSection === 'activity' ? 'rgba(79, 70, 229, 0.08)' : '',
                      borderColor: activeSection === 'activity' ? 'var(--primary-2)' : '',
                      color: activeSection === 'activity' ? 'var(--primary-2)' : ''
                    }}
                  >
                    <span>📋</span>
                    <div style={{ flex: 1 }}>
                      <strong>Login Activity</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>
                        View active sessions and device IPs
                      </div>
                    </div>
                    <span>→</span>
                  </li>

                  <li
                    onClick={handleLogoutAll}
                    style={{
                      color: 'var(--danger)',
                      background: 'rgba(244, 63, 94, 0.04)',
                      borderColor: 'rgba(244, 63, 94, 0.2)'
                    }}
                  >
                    <span>🚪</span>
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: 'var(--danger)' }}>Logout From All Devices</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>
                        Revoke all sessions on other browsers
                      </div>
                    </div>
                    <span>⚡</span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Dynamic Active Section Panel */}
            <section className="content-panel page-fade-in" style={{ padding: '32px' }}>
              {/* 1. PASSWORD SECTION */}
              {activeSection === 'password' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 6px', color: 'var(--primary)' }}>🔐 Change Account Password</h3>
                    <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
                      Ensure your account is using a long, random password to stay secure.
                    </p>
                  </div>

                  <form className="payment-form" onSubmit={submitPasswordChange} style={{ maxWidth: '520px' }}>
                    <label>
                      Current Password
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwords.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                        required
                      />
                    </label>

                    <label>
                      New Password (Min. 6 characters)
                      <input
                        type="password"
                        name="newPassword"
                        value={passwords.newPassword}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </label>

                    <label>
                      Confirm New Password
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwords.confirmPassword}
                        onChange={handlePasswordChange}
                        placeholder="••••••••"
                        required
                      />
                    </label>

                    <button type="submit" className="btn btn-primary submit-btn" disabled={saving}>
                      {saving ? 'Updating Password...' : 'Save New Password'}
                    </button>
                  </form>
                </div>
              )}

              {/* 2. EMAIL PREFERENCES */}
              {activeSection === 'email' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 6px', color: 'var(--primary)' }}>📧 Email Preferences</h3>
                    <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
                      Select which emails you would like to receive from SPay.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gap: '14px', maxWidth: '640px' }}>
                    {[
                      { key: 'emailTxnAlerts', title: 'Instant Transaction Receipts', desc: 'Receive an email receipt whenever money is sent or added.' },
                      { key: 'emailSecurityAlerts', title: 'Security & Login Alerts', desc: 'Get notified immediately of unusual sign-ins or password updates.' },
                      { key: 'emailWeeklyDigest', title: 'Weekly Spending Summary', desc: 'A weekly snapshot of your wallet cashflow and payments.' },
                      { key: 'emailMarketing', title: 'Product Updates & Offers', desc: 'Occasional emails about new SPay features and developer perks.' }
                    ].map((item) => (
                      <div
                        key={item.key}
                        onClick={() => handleTogglePref(item.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#f8faff',
                          padding: '16px 20px',
                          borderRadius: '16px',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--primary)', display: 'block', fontSize: '0.95rem' }}>
                            {item.title}
                          </strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                            {item.desc}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={prefs[item.key] ?? false}
                          onChange={() => {}}
                          style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary-2)' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. NOTIFICATION SETTINGS */}
              {activeSection === 'notifications' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 6px', color: 'var(--primary)' }}>🔔 Notification Channels</h3>
                    <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
                      Control how you receive real-time push notifications and alerts.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gap: '14px', maxWidth: '640px' }}>
                    {[
                      { key: 'pushNotifications', title: 'In-App & Browser Push Notifications', desc: 'Show instant popups on incoming money transfers.' },
                      { key: 'smsHighValueAlerts', title: 'SMS OTP & High-Value Alerts (> ₹5,000)', desc: 'Send SMS verification for large payments.' },
                      { key: 'newDeviceAlerts', title: 'New Device Detection Prompts', desc: 'Trigger approval when logging in from a new computer.' }
                    ].map((item) => (
                      <div
                        key={item.key}
                        onClick={() => handleTogglePref(item.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#f8faff',
                          padding: '16px 20px',
                          borderRadius: '16px',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all 0.12s ease'
                        }}
                      >
                        <div>
                          <strong style={{ color: 'var(--primary)', display: 'block', fontSize: '0.95rem' }}>
                            {item.title}
                          </strong>
                          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                            {item.desc}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          checked={prefs[item.key] ?? false}
                          onChange={() => {}}
                          style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary-2)' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. LOGIN ACTIVITY */}
              {activeSection === 'activity' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 6px', color: 'var(--primary)' }}>📋 Active Login Sessions</h3>
                      <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
                        Devices currently signed in to your SPay wallet account.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-danger small-btn"
                      onClick={handleLogoutAll}
                    >
                      🚪 Revoke Other Sessions
                    </button>
                  </div>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    {sessions.map((sess) => (
                      <div
                        key={sess.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: '#f8faff',
                          border: '1px solid var(--border)',
                          borderRadius: '16px',
                          padding: '16px 20px'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span style={{ fontSize: '1.8rem' }}>
                            {sess.device.includes('iPhone') || sess.device.includes('Android') ? '📱' : '💻'}
                          </span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ color: 'var(--primary)' }}>{sess.device}</strong>
                              {sess.isCurrent && (
                                <span className="status" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                                  This Device
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '2px' }}>
                              IP: {sess.ip} • {sess.location} • {sess.lastActive}
                            </div>
                          </div>
                        </div>

                        <span style={{ color: sess.isCurrent ? 'var(--success)' : 'var(--muted)', fontWeight: 700, fontSize: '0.85rem' }}>
                          {sess.isCurrent ? '● Online' : 'Signed In'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;
