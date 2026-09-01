import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleFillDemo = () => {
    setFormData({ email: 'sumathc2004@gmail.com', password: 'Suman@123' });
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', formData);
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to backend server. Make sure the backend is running on port 5000.');
      } else {
        setError(err.response.data?.message || 'Invalid email or password. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card page-fade-in">
        <div className="auth-header">
          <Link to="/" className="auth-logo-badge">
            <span className="brand-mark small">S</span>
            <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>SPay</span>
          </Link>
          <h2>Welcome back</h2>
          <p>Sign in to your digital payment wallet</p>
        </div>

        {/* 1-Click Demo Fill */}
        <div className="demo-autofill-box">
          <div style={{ color: 'var(--primary-2)', fontWeight: 600 }}>
            💡 Quick Demo Account
          </div>
          <button
            type="button"
            className="demo-autofill-btn"
            onClick={handleFillDemo}
          >
            ⚡ Auto-Fill
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="form-alert error">{error}</div>}

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

          <label>
            Password
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
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

          <div className="row-between">
            <label className="checkbox-label">
              <input type="checkbox" defaultChecked />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); alert('Demo password is "Suman@123"'); }}>
              Forgot password?
            </a>
          </div>

          <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="switch-link">
          Don’t have an account? <Link to="/register">Create an account</Link>
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

export default Login;
