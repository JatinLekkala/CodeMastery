import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaderboard } from '../redux/slices/leaderboardSlice';
import LeaderboardTable from '../components/LeaderboardTable';
import { Trophy } from 'lucide-react';

const Leaderboard = () => {
  const dispatch = useDispatch();
  const { leaderboard, loading, error } = useSelector((state) => state.leaderboard);

  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center', 
          marginBottom: '3rem' 
        }}
      >
        <div 
          style={{ 
            background: 'var(--primary-glow)', 
            color: 'var(--primary)', 
            padding: '0.6rem', 
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            border: '1px solid rgba(59, 130, 246, 0.15)'
          }}
        >
          <Trophy size={32} />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '0.4rem' }}>
          Global Leaderboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.5 }}>
          Top coding performers ranked by total problems solved. Solve more Easy (+10), Medium (+20), and Hard (+30) problems to climbing the ladder!
        </p>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ textAlign: 'center', padding: '1.5rem' }}>
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              <h3>No users on the leaderboard yet</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Register accounts and submit correct solutions to appear here.</p>
            </div>
          ) : (
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <LeaderboardTable users={leaderboard} />
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default Leaderboard;
