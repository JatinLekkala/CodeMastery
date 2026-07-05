import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, clearError } from '../redux/slices/authSlice';
import { Code2, KeyRound, Mail, AlertCircle } from 'lucide-react';
import socket from '../utils/socket';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Clear auth errors on page mount
    dispatch(clearError());
    if (isAuthenticated) {
      navigate('/problems');
    }
  }, [isAuthenticated, navigate, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    
    const result = await dispatch(loginUser(formData));
    if (loginUser.fulfilled.match(result)) {
      // Connect to WebSocket room on successful login
      socket.connect();
      socket.emit('join', result.payload.user.id || result.payload.user._id);
      toast.success(`Logged in successfully! Welcome back, ${result.payload.user.fullName}!`);
      navigate('/problems');
    } else {
      toast.error(result.payload?.message || result.error?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Code2 size={32} className="gradient-text" />
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }} className="gradient-text">CODEMASTERY</span>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Welcome Back</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sign in to continue your coding journey</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="you@example.com" 
                className="form-input" 
                style={{ paddingLeft: '38px' }}
                value={formData.email}
                onChange={handleChange}
                autocomplete="username email"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                id="password" 
                name="password" 
                placeholder="••••••••" 
                className="form-input" 
                style={{ paddingLeft: '38px' }}
                value={formData.password}
                onChange={handleChange}
                autocomplete="current-password"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', fontWeight: 600 }}
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Register here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
