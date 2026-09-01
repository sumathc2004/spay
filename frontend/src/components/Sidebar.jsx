import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '🏠' },
  { label: 'Send Money', path: '/send-money', icon: '💸' },
  { label: 'Receive Money', path: '/receive-money', icon: '📥' },
  { label: 'Wallet', path: '/wallet', icon: '💳' },
  { label: 'Transactions', path: '/transactions', icon: '📜' },
  { label: 'API Keys', path: '/api-keys', icon: '🔑' },
  { label: 'Profile', path: '/profile', icon: '👤' },
  { label: 'Settings', path: '/settings', icon: '⚙️' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const closeSidebar = () => setOpen(false);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay ${open ? 'visible' : ''}`}
        onClick={closeSidebar}
      />

      {/* Mobile FAB toggle */}
      <button
        type="button"
        className="mobile-sidebar-toggle"
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? '✕' : '☰'}
      </button>

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark small">S</div>
          <span>SPay</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebar}
            >
              <span>🛡️</span>
              Admin
            </NavLink>
          )}

          <button type="button" className="nav-link logout-link" onClick={logout}>
            <span>🚪</span>
            Logout
          </button>
        </nav>

        <div className="sidebar-card">
          <p>Developer Mode</p>
          <strong>API Ready</strong>
          <Link to="/api-keys" className="btn btn-primary small-btn" onClick={closeSidebar}>
            View API Keys
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
