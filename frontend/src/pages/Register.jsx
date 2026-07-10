import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, clearError } from '../redux/slices/authSlice';
import { Code2, KeyRound, Mail, User, Calendar, AlertCircle } from 'lucide-react';
import socket from '../utils/socket';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    dateOfBirth: ''
  });
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
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
    if (!formData.email || !formData.password || !formData.fullName || !formData.dateOfBirth) return;

    const result = await dispatch(registerUser(formData));
    if (registerUser.fulfilled.match(result)) {
      socket.connect();
      socket.emit('join', result.payload.user.id || result.payload.user._id);
      toast.success('Registration successful! Welcome to CodeMastery!');
      navigate('/problems');
    } else {
      toast.error(result.payload?.message || result.error?.message || 'Registration failed. Please check details.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 120px)', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <Code2 size={32} className="gradient-text" />
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }} className="gradient-text">CODEMASTERY</span>
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Create Account</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Get access to live code compilations and evaluations</p>
        </div>

        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                id="fullName" 
                name="fullName" 
                placeholder="John Doe" 
                className="form-input" 
                style={{ paddingLeft: '38px' }}
                value={formData.fullName}
                onChange={handleChange}
                autocomplete="name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="john@example.com" 
                className="form-input" 
                style={{ paddingLeft: '38px' }}
                value={formData.email}
                onChange={handleChange}
                autocomplete="username email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="dateOfBirth">Date of Birth</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
              <input 
                type="date" 
                id="dateOfBirth" 
                name="dateOfBirth" 
                className="form-input" 
                style={{ paddingLeft: '38px' }}
                value={formData.dateOfBirth}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                min="1900-01-01"
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label className="form-label" htmlFor="password">Password (min 6 characters)</label>
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
                autocomplete="new-password"
                required
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.75rem', fontWeight: 600 }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Register;
