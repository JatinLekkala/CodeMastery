import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronRight, Hash } from 'lucide-react';

const ProblemCard = ({ problem }) => {
  const { _id, title, difficulty, tags, solutionsCount, attemptsCount } = problem;

  // Calculate Acceptance Rate
  const acceptanceRate = attemptsCount > 0 
    ? Math.round((solutionsCount / attemptsCount) * 100) 
    : 0;

  const getDifficultyClass = (diff) => {
    if (diff === 'Easy') return 'diff-easy';
    if (diff === 'Medium') return 'diff-medium';
    return 'diff-hard';
  };

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
        <span className={`badge ${getDifficultyClass(difficulty)}`}>
          {difficulty}
        </span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          AC Rate: {acceptanceRate}% ({solutionsCount}/{attemptsCount})
        </span>
      </div>

      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {title}
      </h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem', flexGrow: 1 }}>
        {tags.map((tag, idx) => (
          <span 
            key={idx} 
            style={{ 
              fontSize: '0.75rem', 
              background: 'rgba(255, 255, 255, 0.04)', 
              padding: '0.15rem 0.4rem', 
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.15rem',
              border: '1px solid rgba(255, 255, 255, 0.03)'
            }}
          >
            <Hash size={10} />
            {tag}
          </span>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
        <Link 
          to={`/problems/${_id}`} 
          className="btn btn-primary"
          style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
        >
          <span>Solve Challenge</span>
          <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
};

export default ProblemCard;
