import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Profile = () => {
  const { user, login, token } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/users/profile');
        setProfile(data);
        setForm({ name: data.name || '', phone: data.phone || '' });
      } catch (_) {
        // Fallback to context
        if (user) {
          setProfile(user);
          setForm({ name: user.name || '', phone: user.phone || '' });
        }
      }
    };
    loadProfile();
  }, [user]);

  const p = profile || user || {};
  const initial = p.name?.charAt(0)?.toUpperCase() || 'U';

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/users/profile', form);
      toast.success('Profile updated successfully!');
      setProfile((prev) => ({ ...prev, ...form }));
      // Update auth context
      login({ ...user, ...form }, token);
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-panel page-fade-in">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Profile</p>
            <h2>Manage Your Profile</h2>
          </div>
        </header>

        <section className="content-panel profile-grid">
          <div className="profile-card">
            <div className="avatar large">{initial}</div>
            <h3>{p.name || 'User'}</h3>
            <p>{p.email || '—'}</p>
            <p>{p.phone || '—'}</p>
            <div className="spay-id-box">
              SPay ID: {p.spay_id || '—'}
            </div>
          </div>

          <div className="profile-form-wrap">
            <form className="payment-form" onSubmit={(e) => e.preventDefault()}>
              <label>
                Full Name
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </label>
              <label>
                Email
                <input type="email" value={p.email || ''} disabled />
              </label>
              <label>
                Phone Number
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </label>

              {editing ? (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditing(false);
                      setForm({ name: p.name || '', phone: p.phone || '' });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
                  Edit Profile
                </button>
              )}
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Profile;
