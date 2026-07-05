import React from 'react';
import { Trophy, Award, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const LeaderboardTable = ({ users }) => {
  const getRankBadge = (rank) => {
    if (rank === 1) return <Trophy size={18} color="#ffd700" style={{ filter: 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.4))' }} />;
    if (rank === 2) return <Award size={18} color="#c0c0c0" />;
    if (rank === 3) return <Award size={18} color="#cd7f32" />;
    return <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>{rank}</span>;
  };

  const getRowHighlight = (rank) => {
    if (rank === 1) return { background: 'rgba(255, 215, 0, 0.03)', borderLeft: '3px solid #ffd700' };
    if (rank === 2) return { background: 'rgba(192, 192, 192, 0.02)', borderLeft: '3px solid #c0c0c0' };
    if (rank === 3) return { background: 'rgba(205, 127, 50, 0.01)', borderLeft: '3px solid #cd7f32' };
    return { borderLeft: '3px solid transparent' };
  };

  return (
    <div className="table-container glass-panel">
      <table className="custom-table">
        <thead>
          <tr>
            <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
            <th>Name</th>
            <th style={{ textAlign: 'center' }}>Solved</th>
            <th style={{ textAlign: 'center' }}>Attempted</th>
            <th style={{ textAlign: 'center' }}>Rating</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, index) => {
            const rank = index + 1;
            const solved = u.totalProblemsSolved || 0;
            const attempted = u.totalProblemsAttempted || 0;
            
            return (
              <tr key={u._id || u.id} style={getRowHighlight(rank)}>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {getRankBadge(rank)}
                  </div>
                </td>
                <td>
                  <Link 
                    to={`/profile/${u._id || u.id}`} 
                    style={{ textDecoration: 'none', color: 'inherit', fontWeight: 600, display: 'flex', flexDirection: 'column' }}
                    className="nav-link"
                  >
                    <span>{u.fullName}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>{u.email}</span>
                  </Link>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--success)' }}>{solved}</td>
                <td style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>{attempted}</td>
                <td style={{ textAlign: 'center' }}>
                  <span 
                    style={{ 
                      background: 'var(--primary-glow)', 
                      color: 'var(--primary)', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      border: '1px solid rgba(59, 130, 246, 0.15)'
                    }}
                  >
                    {u.rating || 1200}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
