import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { Code2, User, LogOut, Moon, Sun, Menu, X } from 'lucide-react';
import socket from '../utils/socket';

const Navbar = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    socket.disconnect();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar glass-panel" style={{ position: 'relative', height: 'auto', minHeight: '70px', padding: '0.5rem 0' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        
        {/* Top Navbar Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', height: '55px' }}>
          
          {/* Logo */}
          <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'inherit' }}>
            <Code2 size={28} className="gradient-text" style={{ filter: 'drop-shadow(0 0 8px var(--primary-glow))' }} />
            <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }} className="gradient-text">
              CODEMASTERY
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="desktop-only" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link to="/problems" className={`nav-link ${isActive('/problems') ? 'active' : ''}`}>
              Problems
            </Link>
            <Link to="/playground" className={`nav-link ${isActive('/playground') ? 'active' : ''}`}>
              Playground
            </Link>
            <Link to="/leaderboard" className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`}>
              Leaderboard
            </Link>
            {isAuthenticated && (
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Action Menu (Desktop / Hamburger toggler) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Theme Toggle always visible */}
            <button 
              onClick={toggleTheme} 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Desktop User Section */}
            <div className="desktop-only" style={{ display: 'flex', alignItems: 'center' }}>
              {isAuthenticated && user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{user.fullName}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                      Rating: {user.rating}
                    </span>
                  </div>
                  <Link 
                    to={`/profile/${user.id || user._id}`}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="View Profile"
                  >
                    <User size={18} />
                  </Link>
                  <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '0.5rem 0.8rem', display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                    <LogOut size={16} />
                    <span style={{ fontSize: '0.85rem' }}>Logout</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link to="/login" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Hamburger Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-secondary mobile-only"
              style={{ padding: '0.5rem', display: 'none', alignItems: 'center', justifyContent: 'center' }}
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="mobile-only-dropdown" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', padding: '1rem 0', borderTop: '1px solid var(--border)' }}>
            
            {/* Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/problems" onClick={() => setMobileMenuOpen(false)} className={`nav-link ${isActive('/problems') ? 'active' : ''}`} style={{ padding: '0.5rem 0', fontSize: '1.05rem' }}>
                Problems
              </Link>
              <Link to="/playground" onClick={() => setMobileMenuOpen(false)} className={`nav-link ${isActive('/playground') ? 'active' : ''}`} style={{ padding: '0.5rem 0', fontSize: '1.05rem' }}>
                Playground
              </Link>
              <Link to="/leaderboard" onClick={() => setMobileMenuOpen(false)} className={`nav-link ${isActive('/leaderboard') ? 'active' : ''}`} style={{ padding: '0.5rem 0', fontSize: '1.05rem' }}>
                Leaderboard
              </Link>
              {isAuthenticated && (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} style={{ padding: '0.5rem 0', fontSize: '1.05rem' }}>
                  Dashboard
                </Link>
              )}
            </div>

            {/* User section */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              {isAuthenticated && user ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 600 }}>{user.fullName}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
                      Rating: {user.rating}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link 
                      to={`/profile/${user.id || user._id}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '0.6rem', display: 'flex', gap: '0.3rem', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <User size={16} />
                      <span>View Profile</span>
                    </Link>
                    <button onClick={handleLogout} className="btn btn-danger" style={{ flex: 1, padding: '0.6rem', display: 'flex', gap: '0.3rem', alignItems: 'center', justifyContent: 'center' }}>
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', padding: '0.6rem' }}>
                    Sign In
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ flex: 1, textAlign: 'center', padding: '0.6rem' }}>
                    Register
                  </Link>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </nav>
  );
};

export default Navbar;
