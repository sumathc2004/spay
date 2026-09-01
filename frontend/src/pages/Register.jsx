import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      setSuccess('🎉 Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card wide-card page-fade-in">
        <div className="auth-header">
          <Link to="/" className="auth-logo-badge">
            <span className="brand-mark small">S</span>
            <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>SPay</span>
          </Link>
          <h2>Create your account</h2>
          <p>Instant transfers, smart wallet, and secure digital payments</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="form-alert error">{error}</div>}
          {success && <div className="form-alert success">{success}</div>}

          <div className="two-col">
            <label>
              Full Name
              <input
                type="text"
                name="name"
                placeholder="e.g. Suman Sharma"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Phone Number
              <input
                type="tel"
                name="phone"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <label>
            Email Address
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          <div className="two-col">
            <label>
              Password
              <div className="password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈 Hide' : '👁️ Show'}
                </button>
              </div>
            </label>

            <label>
              Confirm Password
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </label>
          </div>

          <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Get Started with SPay'}
          </button>
        </form>

        <p className="switch-link">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>

        <div style={{ textAlign: 'center', marginTop: '14px' }}>
          <Link to="/" className="back-home-link">
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
