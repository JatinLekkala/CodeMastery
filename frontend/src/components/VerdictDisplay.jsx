import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Clock, HardDrive, Terminal, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

const VerdictDisplay = ({ submission }) => {
  const [showErrorLog, setShowErrorLog] = useState(false);
  const [copiedError, setCopiedError] = useState(false);

  if (!submission) return null;

  const { verdict, testCasesPassedCount, executionTime, memoryUsed, compileError, isRunOnly, runOutputs } = submission;

  const handleCopyError = () => {
    if (compileError) {
      navigator.clipboard.writeText(compileError);
      setCopiedError(true);
      setTimeout(() => setCopiedError(false), 2000);
    }
  };

  const getVerdictDetails = () => {
    switch (verdict) {
      case 'Pending':
        return {
          icon: <div className="spinner verdict-pulse" style={{ width: '28px', height: '28px' }}></div>,
          color: 'var(--warning)',
          title: isRunOnly ? 'Running Code...' : 'Evaluating Submission...',
          desc: isRunOnly 
            ? 'Compiling and executing against sample test cases in isolated container...' 
            : 'Your solution is in the queue. Results will refresh live.'
        };
      case 'Accepted':
        return {
          icon: <CheckCircle2 size={36} color="var(--success)" className="verdict-pulse" />,
          color: 'var(--success)',
          title: isRunOnly ? 'Run Code Success' : 'Accepted',
          desc: isRunOnly 
            ? 'Success! Your program compiled and finished executing successfully.' 
            : 'Congratulations! Your solution passed all 25 test cases.'
        };
      case 'Wrong Answer':
        return {
          icon: <XCircle size={36} color="var(--danger)" />,
          color: 'var(--danger)',
          title: 'Wrong Answer',
          desc: isRunOnly 
            ? 'Your program output mismatched for one of the sample test cases.' 
            : 'Your program output mismatched at one of the test cases.'
        };
      case 'TLE':
        return {
          icon: <Clock size={36} color="var(--danger)" />,
          color: 'var(--danger)',
          title: 'Time Limit Exceeded (TLE)',
          desc: `The execution time exceeded the problem's time limit.`
        };
      case 'Runtime Error':
        return {
          icon: <AlertTriangle size={36} color="var(--danger)" />,
          color: 'var(--danger)',
          title: 'Runtime Error (RE)',
          desc: `Your code crashed or encountered a runtime memory exception.`
        };
      case 'Compilation Error':
        return {
          icon: <Terminal size={36} color="var(--warning)" />,
          color: 'var(--warning)',
          title: 'Compilation Error',
          desc: `The compiler failed to compile your source code.`
        };
      default:
        return {
          icon: <AlertTriangle size={36} color="var(--text-muted)" />,
          color: 'var(--text-muted)',
          title: verdict,
          desc: 'Unknown submission status.'
        };
    }
  };

  const details = getVerdictDetails();

  return (
    <div 
      className="verdict-box" 
      style={{ 
        borderLeft: `5px solid ${details.color}`, 
        background: 'rgba(18, 20, 30, 0.55)',
        marginTop: '1.5rem',
        animation: 'pulse 1.5s ease-out 1'
      }}
    >
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
        {details.icon}
        <div style={{ flexGrow: 1 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: details.color, marginBottom: '0.2rem' }}>
            {details.title}
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {details.desc}
          </p>
        </div>
      </div>

      {verdict !== 'Pending' && verdict !== 'Compilation Error' && !isRunOnly && (
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '1rem', 
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)',
            textAlign: 'center'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Test Cases Passed</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {testCasesPassedCount !== undefined ? testCasesPassedCount : '0'} / 25
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <Clock size={12} /> Time
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {executionTime || 0} ms
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
              <HardDrive size={12} /> Memory
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              {memoryUsed || 0} MB
            </span>
          </div>
        </div>
      )}

      {/* RENDER FAILED TESTCASE DETAILS FOR STANDARD SUBMISSIONS */}
      {verdict !== 'Pending' && verdict !== 'Compilation Error' && verdict !== 'Accepted' && !isRunOnly && runOutputs && runOutputs.length > 0 && (
        <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--danger)' }}>
            Failed Test Case Details (Case {testCasesPassedCount + 1}):
          </h4>
          <div 
            style={{ 
              background: 'rgba(0, 0, 0, 0.25)', 
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              fontSize: '0.9rem'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Input:</span>
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>{runOutputs[0].input}</pre>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Expected Output:</span>
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>{runOutputs[0].expectedOutput}</pre>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Your Output:</span>
                <pre style={{ 
                  background: 'rgba(0,0,0,0.3)', 
                  padding: '0.4rem 0.6rem', 
                  borderRadius: '4px', 
                  border: '1px solid var(--border)', 
                  overflowX: 'auto', 
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  color: 'var(--danger)'
                }}>{runOutputs[0].userOutput}</pre>
              </div>
              {runOutputs[0].error && (
                <div>
                  <span style={{ color: 'var(--danger)', display: 'block', marginBottom: '0.2rem' }}>Stderr Diagnostics:</span>
                  <pre style={{ background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>{runOutputs[0].error}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {verdict !== 'Pending' && verdict !== 'Compilation Error' && isRunOnly && runOutputs && runOutputs.length > 0 && (
        <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Execution Details:
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {runOutputs.map((out, index) => {
              const isOK = out.verdict === 'Accepted' || out.verdict === 'Success';
              return (
                <div 
                  key={index} 
                  style={{ 
                    background: 'rgba(0, 0, 0, 0.25)', 
                    border: `1px solid ${isOK ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem 1rem',
                    fontSize: '0.9rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {submission.customInput !== null ? 'Custom Input Evaluation' : `Sample Case ${index + 1}`}
                    </span>
                    <span 
                      className={`badge ${isOK ? 'diff-easy' : 'diff-hard'}`}
                      style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px' }}
                    >
                      {out.verdict}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Input:</span>
                      <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>{out.input}</pre>
                    </div>
                    {submission.customInput === null && (
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Expected Output:</span>
                        <pre style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border)', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>{out.expectedOutput}</pre>
                      </div>
                    )}
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Your Output:</span>
                      <pre style={{ 
                        background: 'rgba(0,0,0,0.3)', 
                        padding: '0.4rem 0.6rem', 
                        borderRadius: '4px', 
                        border: '1px solid var(--border)', 
                        overflowX: 'auto', 
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        color: isOK ? 'var(--success)' : 'var(--danger)'
                      }}>{out.userOutput}</pre>
                    </div>
                    {out.error && (
                      <div>
                        <span style={{ color: 'var(--danger)', display: 'block', marginBottom: '0.2rem' }}>Stderr Diagnostics:</span>
                        <pre style={{ background: 'rgba(239, 68, 68, 0.05)', color: 'var(--danger)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.2)', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap' }}>{out.error}</pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
            <span>Max Time: {executionTime || 0} ms</span>
            <span>Memory Used: {memoryUsed || 0} MB</span>
          </div>
        </div>
      )}

      {verdict === 'Compilation Error' && compileError && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <button 
              onClick={() => setShowErrorLog(!showErrorLog)}
              className="btn btn-secondary"
              style={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
            >
              <span>{showErrorLog ? 'Hide Compilation Log' : 'Show Compilation Log'}</span>
              {showErrorLog ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            <button 
              onClick={handleCopyError}
              className="btn btn-secondary"
              style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }}
              title="Copy Compilation Log"
            >
              {copiedError ? (
                <>
                  <Check size={14} color="var(--success)" />
                  <span style={{ color: 'var(--success)' }}>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy Log</span>
                </>
              )}
            </button>
          </div>
          
          {showErrorLog && (
            <pre 
              style={{ 
                marginTop: '0.75rem', 
                background: '#040406', 
                color: '#f8f8f2', 
                padding: '1rem', 
                borderRadius: 'var(--radius-sm)',
                overflowX: 'auto',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-mono)',
                whiteSpace: 'pre-wrap',
                border: '1px solid rgba(239, 68, 68, 0.15)'
              }}
            >
              {compileError}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default VerdictDisplay;
