import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link to="/" className="brand">
          <span className="brand-mark">S</span>
          <span>SPay</span>
        </Link>

        <nav className={`nav ${mobileNavOpen ? 'nav-mobile-open' : ''}`}>
          <Link to="/">Home</Link>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#about">About Us</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="nav-actions">
          {user ? (
            <div className="user-menu" ref={dropdownRef}>
              <button
                type="button"
                className="user-menu-btn"
                onClick={() => setDropdownOpen((prev) => !prev)}
              >
                <span className="avatar-sm">{initial}</span>
                <span>{user.name}</span>
              </button>
              <div className={`user-dropdown ${dropdownOpen ? 'open' : ''}`}>
                <Link to="/dashboard" onClick={() => setDropdownOpen(false)}>🏠 Dashboard</Link>
                <Link to="/profile" onClick={() => setDropdownOpen(false)}>👤 Profile</Link>
                <Link to="/wallet" onClick={() => setDropdownOpen(false)}>💳 Wallet</Link>
                <hr />
                <button type="button" onClick={() => { logout(); setDropdownOpen(false); }}>
                  🚪 Logout
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Get Started</Link>
            </>
          )}

          <button
            type="button"
            className="mobile-toggle"
            onClick={() => setMobileNavOpen((prev) => !prev)}
          >
            {mobileNavOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
