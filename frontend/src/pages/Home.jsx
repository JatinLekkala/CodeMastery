import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Code2, Zap, ShieldAlert, Users, Play, Trophy } from 'lucide-react';
import { fetchProblems } from '../redux/slices/problemSlice';
import { fetchLeaderboard } from '../redux/slices/leaderboardSlice';

const Home = () => {
  const dispatch = useDispatch();
  const { totalProblems } = useSelector((state) => state.problems.pagination);
  const { leaderboard } = useSelector((state) => state.leaderboard);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchProblems({ page: 1, limit: 1 }));
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem', paddingBottom: '5rem' }}>
      
      {/* Hero Section */}
      <section 
        style={{ 
          padding: '6rem 0 4rem 0', 
          background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.08), transparent 40%), radial-gradient(circle at top left, rgba(59, 130, 246, 0.08), transparent 40%)',
          textAlign: 'center' 
        }}
      >
        <div className="container" style={{ maxWidth: '800px' }}>
          <div 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              background: 'var(--primary-glow)', 
              color: 'var(--primary)', 
              border: '1px solid rgba(59, 130, 246, 0.2)', 
              padding: '0.4rem 1rem', 
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '2rem'
            }}
          >
            <Zap size={14} />
            <span>Asynchronous Containerized Compiler Running Live</span>
          </div>

          <h1 
            style={{ 
              fontSize: '3.6rem', 
              fontWeight: 800, 
              lineHeight: 1.1, 
              letterSpacing: '-1.5px', 
              marginBottom: '1.5rem',
            }}
          >
            Master Competitive Coding in <span className="gradient-text">Real Time</span>
          </h1>
          
          <p 
            style={{ 
              fontSize: '1.2rem', 
              color: 'var(--text-secondary)', 
              marginBottom: '2.5rem',
              lineHeight: 1.6
            }}
          >
            Write C++, Java, and Python code inside our premium Monaco-integrated editor. Get instant containerized feedback secure from host escapes.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/problems" className="btn btn-primary" style={{ padding: '0.8rem 1.8rem', fontSize: '1.05rem' }}>
              <Play size={16} fill="white" />
              <span>Start Coding Now</span>
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn btn-secondary" style={{ padding: '0.8rem 1.8rem', fontSize: '1.05rem' }}>
                <span>Create Free Account</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="container">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Platform Features</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Everything you need to sharpen your algorithmic problem-solving skills</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          
          <div className="glass-card">
            <div 
              style={{ 
                background: 'rgba(59, 130, 246, 0.1)', 
                color: 'var(--primary)', 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <Code2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Monaco Editor Support</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Use the industry-standard code editor with bracket matching, syntax highlighting, and custom formatting for C++, Java, and Python.
            </p>
          </div>

          <div className="glass-card">
            <div 
              style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                color: 'var(--success)', 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <Zap size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Isolated Execution</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              All codes run in dedicated gcc, openjdk, and python Docker containers limited to 256MB memory and 1 CPU core to guarantee extreme safety.
            </p>
          </div>

          <div className="glass-card">
            <div 
              style={{ 
                background: 'rgba(139, 92, 246, 0.1)', 
                color: 'var(--accent)', 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <Trophy size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Global Leaderboard</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
              Compare rankings with users globally. Solve harder questions to earn higher rating adjustments (+10 for Easy, +20 for Medium, +30 for Hard).
            </p>
          </div>

        </div>
      </section>

      {/* Platform Statistics */}
      <section className="container">
        <div className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', padding: '2.5rem', textAlign: 'center', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)' }}>
              {totalProblems || 10}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Standard Coding Problems
            </div>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--success)' }}>
              {leaderboard.length || 5}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Registered Active Competitors
            </div>
          </div>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent)' }}>
              5s
            </div>
            <div style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem', marginTop: '0.25rem' }}>
              Container Timeout Limits
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
