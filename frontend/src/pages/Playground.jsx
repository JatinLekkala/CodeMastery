import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { runSolution, clearCurrentSubmission, updateSubmissionVerdict } from '../redux/slices/submissionSlice';
import CodeEditor from '../components/CodeEditor';
import VerdictDisplay from '../components/VerdictDisplay';
import { AlertCircle, PlayCircle, Code, Info, Terminal, Settings } from 'lucide-react';
import socket from '../utils/socket';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

const Playground = ({ theme }) => {
  const dispatch = useDispatch();
  
  const { currentSubmission, submitting, error: submitError } = useSelector((state) => state.submissions);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [codes, setCodes] = useState({
    'C++': '',
    'Java': '',
    'Python': ''
  });
  const [language, setLanguage] = useState('C++');
  const [customInput, setCustomInput] = useState('');
  
  const activeSubmissionIdRef = useRef(null);
  const currentCode = codes[language];

  useEffect(() => {
    dispatch(clearCurrentSubmission());
    
    // Connect socket if user is authenticated and not connected
    if (isAuthenticated && user) {
      if (!socket.connected) {
        socket.connect();
        socket.emit('join', user.id || user._id);
      }
    }

    return () => {
      dispatch(clearCurrentSubmission());
    };
  }, [dispatch, isAuthenticated, user]);

  useEffect(() => {
    // Socket listener for real-time verdict updates
    const handleSubmissionVerdict = (payload) => {
      console.log('Received socket verdict for playground:', payload);
      if (activeSubmissionIdRef.current === payload.submissionId) {
        dispatch(updateSubmissionVerdict(payload));

        if (payload.verdict === 'Accepted') {
          confetti({
            particleCount: 100,
            spread: 60,
            origin: { y: 0.6 }
          });
          toast.success('Playground execution complete! Code run was successful. 🎉');
        } else if (payload.verdict === 'Compilation Error') {
          toast.error('Compilation failed! Click "Copy Log" to debug.');
        } else {
          toast.error(`Playground execution returned: ${payload.verdict || 'failed'}`);
        }
      }
    };

    socket.on('submission_verdict', handleSubmissionVerdict);

    return () => {
      socket.off('submission_verdict', handleSubmissionVerdict);
    };
  }, [dispatch]);

  const handleRun = async () => {
    if (!currentCode || submitting) return;

    dispatch(clearCurrentSubmission());
    toast.info('Sandbox run queued... streaming input data.');
    
    const payload = {
      problemId: null,
      code: currentCode,
      language,
      customInput: customInput || ''
    };

    const result = await dispatch(runSolution(payload));
    if (runSolution.fulfilled.match(result)) {
      console.log('Playground Run queued with ID:', result.payload._id);
      activeSubmissionIdRef.current = result.payload._id;
    } else {
      toast.error('Failed to queue playground execution.');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '8px' }}>
          <Code size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Code Playground</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>Write, run, and inspect standard input/output against an isolated sandbox container.</p>
        </div>
      </div>

      <div className="problem-grid" style={{ gridTemplateColumns: '1.10fr 0.90fr', marginTop: '1rem', height: 'auto', minHeight: '650px', padding: 0 }}>
        
        {/* Left Column: Monaco Code Editor + Actions & Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Editor Container */}
          <div style={{ minHeight: '460px', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <CodeEditor 
              code={currentCode} 
              onChange={(val) => setCodes(prev => ({ ...prev, [language]: val }))}
              language={language} 
              onLanguageChange={setLanguage}
              theme={theme}
            />
          </div>

          {/* Action inputs & Run triggers */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            {isAuthenticated ? (
              <div>
                {submitError && (
                  <div className="alert alert-danger" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                    <AlertCircle size={16} />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Custom Input Fields */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    Standard Input (Stdin)
                  </label>
                  <textarea
                    placeholder="Provide standard input lines for your code here..."
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      background: 'var(--pre-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      padding: '0.6rem',
                      fontSize: '0.85rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <button 
                  onClick={handleRun}
                  className="btn btn-primary"
                  style={{ 
                    width: '100%',
                    padding: '0.8rem', 
                    fontWeight: 700, 
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }}></div>
                      <span>Running execution...</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle size={16} />
                      <span>Run Playground Code</span>
                    </>
                  )}
                </button>

                <VerdictDisplay submission={currentSubmission} />
              </div>
            ) : (
              <div className="alert alert-danger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <AlertCircle size={18} />
                  <span style={{ fontWeight: 600 }}>Authentication Required</span>
                </div>
                <p style={{ fontSize: '0.85rem' }}>You must sign in to execute playground sandbox evaluations.</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Login</Link>
                  <Link to="/register" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Register</Link>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Execution Environments & Boilderplates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              <Settings size={18} /> Sandbox Specifications
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>C++ Environment</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>GCC Latest</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Java Environment</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>OpenJDK 11</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Python Environment</span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Python 3.9-slim</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Time Limit Watchdog</span>
                <span style={{ fontWeight: 600 }}>5000 ms</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Memory Limit ceiling</span>
                <span style={{ fontWeight: 600 }}>256 MB</span>
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', flexGrow: 1 }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              <Info size={18} /> Playground Guide
            </h2>
            
            <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p>
                The playground provides a scratchpad to write code and verify algorithms against arbitrary text input.
              </p>
              
              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>How Stdin is fed:</strong>
                Write your test input in the Standard Input block. The execution engine streams it directly to standard input (`stdin` / `sys.stdin` / `Scanner(System.in)`) during container launch.
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>No Stats recording:</strong>
                Playground runs are marked run-only and have **no problem context**. They will not alter rating counts, and will not show up in Dashboard history.
              </div>

              <div>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>Example Scanner/Reader:</strong>
                If writing in Java, ensure your public class name is exactly <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--pre-bg)', padding: '0.15rem 0.3rem', borderRadius: '4px' }}>Main</code>, as the JDK compiler compiles <code style={{ fontFamily: 'var(--font-mono)' }}>Main.java</code>.
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Playground;
