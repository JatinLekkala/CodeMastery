import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile, clearUserProfile } from '../redux/slices/leaderboardSlice';
import { User, Award, CheckCircle, BarChart2, Calendar, FileText, Globe, Clock } from 'lucide-react';

const Dashboard = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user: authUser, isAuthenticated } = useSelector((state) => state.auth);
  const { userStats, loading, error } = useSelector((state) => state.leaderboard);

  // If no userId in route params, look for logged in user's ID
  const targetUserId = userId || (authUser ? (authUser.id || authUser._id) : null);

  useEffect(() => {
    if (!targetUserId) {
      if (!isAuthenticated) {
        navigate('/login');
      }
      return;
    }

    dispatch(fetchUserProfile(targetUserId));

    return () => {
      dispatch(clearUserProfile());
    };
  }, [targetUserId, dispatch, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (error || !userStats) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <div className="alert alert-danger">
          <span>{error || 'User details could not be loaded.'}</span>
        </div>
      </div>
    );
  }

  const { user, recentSubmissions, stats } = userStats;
  const { difficultyStats, languageStats, uniqueSolvedCount, uniqueAttemptedCount } = stats;

  const totalSubmissionsCount = Object.values(languageStats).reduce((a, b) => a + b, 0);

  const getVerdictStyle = (verdict) => {
    if (verdict === 'Accepted') return { color: 'var(--success)', fontWeight: 600 };
    if (verdict === 'Compilation Error' || verdict === 'Pending') return { color: 'var(--warning)', fontWeight: 600 };
    return { color: 'var(--danger)', fontWeight: 600 };
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      
      {/* Profile Header Card */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '2rem' }}>
        <div 
          style={{ 
            background: 'var(--primary-glow)', 
            color: 'var(--primary)', 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid var(--border-active)'
          }}
        >
          <User size={40} />
        </div>

        <div style={{ flexGrow: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>{user.fullName}</h1>
            <span 
              style={{ 
                background: 'var(--success-glow)', 
                color: 'var(--success)', 
                border: '1px solid rgba(16, 185, 129, 0.2)', 
                padding: '0.2rem 0.6rem', 
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              {user.role}
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>{user.email}</p>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <Calendar size={14} /> Joined {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', minWidth: '150px', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Global Rating</span>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
            {user.rating || 1200}
          </div>
        </div>
      </div>

      {/* Grid: Statistics cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        
        {/* Left Stats pane: Difficulty Breakdown */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <BarChart2 size={18} /> Difficulty Progress
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Easy Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span className="badge diff-easy" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>Easy</span>
                <span style={{ fontWeight: 600 }}>{difficultyStats.Easy.solved} / {difficultyStats.Easy.attempted} Solved</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${difficultyStats.Easy.attempted > 0 ? (difficultyStats.Easy.solved / difficultyStats.Easy.attempted) * 100 : 0}%`, 
                    height: '100%', 
                    background: 'var(--success)' 
                  }}
                ></div>
              </div>
            </div>

            {/* Medium Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span className="badge diff-medium" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>Medium</span>
                <span style={{ fontWeight: 600 }}>{difficultyStats.Medium.solved} / {difficultyStats.Medium.attempted} Solved</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${difficultyStats.Medium.attempted > 0 ? (difficultyStats.Medium.solved / difficultyStats.Medium.attempted) * 100 : 0}%`, 
                    height: '100%', 
                    background: 'var(--warning)' 
                  }}
                ></div>
              </div>
            </div>

            {/* Hard Progress */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                <span className="badge diff-hard" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>Hard</span>
                <span style={{ fontWeight: 600 }}>{difficultyStats.Hard.solved} / {difficultyStats.Hard.attempted} Solved</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    width: `${difficultyStats.Hard.attempted > 0 ? (difficultyStats.Hard.solved / difficultyStats.Hard.attempted) * 100 : 0}%`, 
                    height: '100%', 
                    background: 'var(--danger)' 
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{uniqueSolvedCount}</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unique Solved</span>
            </div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{uniqueAttemptedCount}</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Unique Attempted</span>
            </div>
          </div>
        </div>

        {/* Right Stats pane: Language distribution & stats summary */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <FileText size={18} /> Submission Metrics
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
            
            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>C++ Submissions</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{languageStats['C++'] || 0}</span>
            </div>

            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Java Submissions</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{languageStats['Java'] || 0}</span>
            </div>

            <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Python Submissions</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{languageStats['Python'] || 0}</span>
            </div>

          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', background: 'rgba(59, 130, 246, 0.03)', border: '1px dashed var(--border-active)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>Platform Performance</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Submissions:</span>
              <span style={{ fontWeight: 600 }}>{totalSubmissionsCount} submissions</span>
              
              <span style={{ color: 'var(--text-secondary)' }}>Problems Attempted:</span>
              <span style={{ fontWeight: 600 }}>{user.totalProblemsAttempted || 0} unique challenges</span>
              
              <span style={{ color: 'var(--text-secondary)' }}>Problems Solved:</span>
              <span style={{ fontWeight: 600 }}>{user.totalProblemsSolved || 0} unique challenges</span>
            </div>
          </div>
        </div>

      </div>

      {/* Recent Submissions Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <Clock size={20} /> Recent Submissions History
        </h2>

        {recentSubmissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '0.9rem' }}>No code submissions recorded yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Problem</th>
                  <th>Language</th>
                  <th>Verdict</th>
                  <th style={{ textAlign: 'center' }}>Runtime</th>
                  <th style={{ textAlign: 'center' }}>Memory</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((sub) => (
                  <tr key={sub._id}>
                    <td>
                      {sub.problemId ? (
                        <Link 
                          to={`/problems/${sub.problemId._id}`} 
                          style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600 }}
                          className="nav-link"
                        >
                          {sub.problemId.title}
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Deleted Problem</span>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{sub.language}</td>
                    <td>
                      <span style={getVerdictStyle(sub.verdict)}>
                        {sub.verdict}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {sub.executionTime || 0} ms
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {sub.memoryUsed || 0} MB
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {formatDate(sub.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
