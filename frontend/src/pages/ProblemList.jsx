import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProblems, setFilters } from '../redux/slices/problemSlice';
import ProblemCard from '../components/ProblemCard';
import { Search, SlidersHorizontal, ArrowLeft, ArrowRight } from 'lucide-react';

const ProblemList = () => {
  const dispatch = useDispatch();
  const { problems, filters, pagination, loading, error } = useSelector((state) => state.problems);
  const [searchTerm, setSearchTerm] = useState(filters.search);

  useEffect(() => {
    dispatch(fetchProblems({ ...filters, page: pagination.currentPage }));
  }, [dispatch, filters, pagination.currentPage]);

  const handleDifficultyChange = (e) => {
    dispatch(setFilters({ difficulty: e.target.value }));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchTerm }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      dispatch(fetchProblems({ ...filters, page: newPage }));
    }
  };

  // Predefined popular tags for quick selection
  const tagsList = ['Arrays', 'Strings', 'DP', 'Searching', 'Sorting', 'Backtracking', 'Graphs'];

  const handleTagToggle = (tag) => {
    // If tag is already selected, clear it. Otherwise, set it.
    const newTagFilter = filters.tags === tag ? '' : tag;
    dispatch(setFilters({ tags: newTagFilter }));
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '5rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '0.4rem' }}>Coding Challenges</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Pick a problem, compile your solution, and verify accuracy.</p>
        </div>
      </div>

      {/* Filters & Search Header */}
      <div 
        className="glass-panel" 
        style={{ 
          padding: '1.5rem', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.25rem', 
          marginBottom: '2rem' 
        }}
      >
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} style={{ flexGrow: 1, minWidth: '260px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search problems by name or keyword..." 
              className="form-input"
              style={{ paddingLeft: '38px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          {/* Difficulty Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: '180px' }}>
            <SlidersHorizontal size={16} style={{ color: 'var(--text-muted)' }} />
            <select 
              value={filters.difficulty} 
              onChange={handleDifficultyChange}
              className="form-select"
              style={{ fontSize: '0.9rem', padding: '0.6rem 0.8rem' }}
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Tag Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '0.5rem' }}>Popular Tags:</span>
          {tagsList.map((tag) => {
            const isSelected = filters.tags === tag;
            return (
              <button 
                key={tag}
                onClick={() => handleTagToggle(tag)}
                className="btn"
                style={{ 
                  padding: '0.25rem 0.75rem', 
                  fontSize: '0.8rem', 
                  borderRadius: '15px',
                  background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSelected ? '#fff' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ textAlign: 'center', padding: '2rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Problem Cards Grid */}
      {!loading && !error && (
        <>
          {problems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
              <h3>No problems found</h3>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Try relaxing your search terms or filters.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
              {problems.map((prob) => (
                <ProblemCard key={prob._id} problem={prob} />
              ))}
            </div>
          )}

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '1.5rem', 
                marginTop: '3.5rem',
                borderTop: '1px solid var(--border)',
                paddingTop: '2rem'
              }}
            >
              <button 
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                className="btn btn-secondary"
                disabled={pagination.currentPage === 1}
                style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
              >
                <ArrowLeft size={14} />
                <span>Prev</span>
              </button>
              
              <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button 
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                className="btn btn-secondary"
                disabled={pagination.currentPage === pagination.totalPages}
                style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}
              >
                <span>Next</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default ProblemList;
