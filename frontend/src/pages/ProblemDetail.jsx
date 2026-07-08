import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProblemById, clearCurrentProblem } from '../redux/slices/problemSlice';
import { submitSolution, runSolution, clearCurrentSubmission, updateSubmissionVerdict } from '../redux/slices/submissionSlice';
import CodeEditor from '../components/CodeEditor';
import VerdictDisplay from '../components/VerdictDisplay';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { ArrowLeft, Play, AlertCircle, FileCode2, Info, Code, PlayCircle } from 'lucide-react';
import socket from '../utils/socket';
import api from '../utils/api';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

const ProblemDetail = ({ theme }) => {
  const { id } = useParams();
  const dispatch = useDispatch();
  
  const { currentProblem, loading: problemLoading, error: problemError } = useSelector((state) => state.problems);
  const { currentSubmission, submitting, error: submitError } = useSelector((state) => state.submissions);
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [codes, setCodes] = useState({
    'C++': '',
    'Java': '',
    'Python': ''
  });
  const [language, setLanguage] = useState('C++');
  const [enableCustomInput, setEnableCustomInput] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [actionType, setActionType] = useState(null); // 'run' or 'submit'
  
  const [rightTab, setRightTab] = useState('problem'); // 'problem' or 'ai'
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiError, setAiError] = useState('');

  // Ref to track active submission for socket hook
  const activeSubmissionIdRef = useRef(null);

  const currentCode = codes[language];

  useEffect(() => {
    dispatch(fetchProblemById(id));
    dispatch(clearCurrentSubmission());
    setActionType(null);

    const storedDraft = localStorage.getItem(`codemastery-draft:${id}`);
    if (storedDraft) {
      try {
        setCodes(JSON.parse(storedDraft));
      } catch (e) {
        setCodes({
          'C++': '',
          'Java': '',
          'Python': ''
        });
      }
    } else {
      setCodes({
        'C++': '',
        'Java': '',
        'Python': ''
      });
    }

    // Connect socket if user is authenticated and not connected
    if (isAuthenticated && user) {
      if (!socket.connected) {
        socket.connect();
        socket.emit('join', user.id || user._id);
      }
    }

    return () => {
      dispatch(clearCurrentProblem());
      dispatch(clearCurrentSubmission());
    };
  }, [id, dispatch, isAuthenticated, user]);

  // Debounced auto-save of draft code to localStorage keyed by problem ID
  useEffect(() => {
    // Avoid saving empty templates on initial load
    if (!codes['C++'] && !codes['Java'] && !codes['Python']) return;

    const delayDebounceFn = setTimeout(() => {
      localStorage.setItem(`codemastery-draft:${id}`, JSON.stringify(codes));
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [codes, id]);

  useEffect(() => {
    // Socket listener for real-time verdict updates
    const handleSubmissionVerdict = (payload) => {
      console.log('Received socket verdict:', payload);
      if (activeSubmissionIdRef.current === payload.submissionId) {
        dispatch(updateSubmissionVerdict(payload));
        setActionType(null);

        // Toastify alerts & confetti triggers
        if (payload.verdict === 'Accepted') {
          if (!payload.isRunOnly) {
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 }
            });
            toast.success('Accepted! All 25 test cases passed successfully! 🎉');
            if (payload.ratingDelta > 0) {
              toast.success(`+${payload.ratingDelta} rating points added! 📈`);
            }
          } else {
            toast.success('Accepted! Sample test cases passed.');
          }
        } else if (payload.verdict === 'Compilation Error') {
          toast.error('Compilation Error! Click "Copy Log" to debug.');
        } else {
          if (!payload.isRunOnly) {
            toast.error(`${payload.verdict || 'Evaluation failed'} on test cases. Rating -1. 📉`);
          } else {
            toast.error(`${payload.verdict || 'Evaluation failed'} on custom run.`);
          }
        }
      }
    };

    socket.on('submission_verdict', handleSubmissionVerdict);

    return () => {
      socket.off('submission_verdict', handleSubmissionVerdict);
  }, [dispatch]);

  const handleAICompletion = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.post('/ai/complete', {
        code: currentCode,
        language,
        problemId: id
      });
      if (res.data && res.data.completedCode) {
        setCodes(prev => ({
          ...prev,
          [language]: res.data.completedCode
        }));
        toast.success('AI Code Completion applied! 🎉');
      }
    } catch (err) {
      setAiError(err.response?.data?.message || 'Failed to complete code.');
      toast.error('AI Completion failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAICodeReview = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiError('');
    setAiResponse('');
    try {
      const res = await api.post('/ai/review', {
        code: currentCode,
        language,
        problemId: id
      });
      if (res.data && res.data.reviewMarkdown) {
        setAiResponse(res.data.reviewMarkdown);
        toast.success('Code Review analysis complete! 🔍');
      }
    } catch (err) {
      setAiError(err.response?.data?.message || 'Failed to analyze code.');
      toast.error('AI Code Review failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleRun = async () => {
    if (!currentCode || submitting) return;

    dispatch(clearCurrentSubmission());
    setActionType('run');
    toast.info('Run initiated... executing in isolated sandbox.');

    const payload = {
      problemId: id,
      code: currentCode,
      language,
      customInput: enableCustomInput ? customInput : null
    };

    const result = await dispatch(runSolution(payload));
    setActionType(null);
    if (runSolution.fulfilled.match(result)) {
      const finalPayload = result.payload;
      if (finalPayload.verdict === 'Accepted') {
        toast.success('Accepted! Sample test cases passed.');
      } else if (finalPayload.verdict === 'Compilation Error') {
        toast.error('Compilation Error! Click "Copy Log" to debug.');
      } else {
        toast.error(`${finalPayload.verdict || 'Evaluation failed'} on custom run.`);
      }
    } else {
      toast.error('Failed to execute code run.');
    }
  };

  const handleSubmit = async () => {
    if (!currentCode || submitting) return;

    dispatch(clearCurrentSubmission());
    setActionType('submit');
    toast.info('Submission queued... executing 25 test cases.');

    const payload = {
      problemId: id,
      code: currentCode,
      language
    };

    const result = await dispatch(submitSolution(payload));
    if (submitSolution.fulfilled.match(result)) {
      console.log('Submission queued with ID:', result.payload._id);
      activeSubmissionIdRef.current = result.payload._id;
    } else {
      setActionType(null);
      toast.error('Failed to dispatch code submission action.');
    }
  };

  if (problemLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (problemError || !currentProblem) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <div className="alert alert-danger" style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={20} />
          <span>{problemError || 'Problem details could not be found.'}</span>
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <Link to="/problems" className="btn btn-secondary">
            <ArrowLeft size={16} /> Back to Problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="problem-grid">
      
      {/* Left panel: Code Editor, Custom Input, Action Buttons, and Verdict Console */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', gap: '1rem', paddingRight: '0.25rem' }}>
        
        {/* Monaco Editor Container */}
        <div style={{ flexGrow: 1, minHeight: '460px', display: 'flex', flexDirection: 'column' }}>
          <CodeEditor 
            code={currentCode} 
            onChange={(val) => setCodes(prev => ({ ...prev, [language]: val }))}
            language={language} 
            onLanguageChange={setLanguage}
            theme={theme}
          />
        </div>

        {/* Actions & Verdict Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          {isAuthenticated ? (
            <div>
              {submitError && (
                <div className="alert alert-danger" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <AlertCircle size={16} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Custom Input Checkbox & Fields */}
              <div style={{ marginBottom: '1.25rem', background: 'var(--run-case-bg)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500 }}>
                  <input 
                    type="checkbox" 
                    checked={enableCustomInput} 
                    onChange={(e) => setEnableCustomInput(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Test with custom input</span>
                </label>
                
                {enableCustomInput && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <textarea
                      placeholder="Enter custom input data here..."
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '80px',
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
                )}
              </div>

              {/* Run Code / Submit Solution Buttons */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={handleRun}
                  className="btn btn-secondary"
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem', 
                    fontWeight: 700, 
                    fontSize: '0.95rem',
                    border: '1.5px solid var(--primary)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                  disabled={submitting}
                >
                  {submitting && actionType === 'run' ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'var(--primary)' }}></div>
                      <span>Running...</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle size={16} />
                      <span>Run Code</span>
                    </>
                  )}
                </button>

                <button 
                  onClick={handleSubmit} 
                  className="btn btn-success" 
                  style={{ 
                    flex: 1, 
                    padding: '0.75rem', 
                    fontWeight: 700, 
                    fontSize: '0.95rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                  disabled={submitting}
                >
                  {submitting && actionType === 'submit' ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px', borderTopColor: '#fff' }}></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="white" />
                      <span>Submit Solution</span>
                    </>
                  )}
                </button>
              </div>

              <VerdictDisplay submission={currentSubmission} />
            </div>
          ) : (
            <div className="alert alert-danger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AlertCircle size={18} />
                <span style={{ fontWeight: 600 }}>Authentication Required</span>
              </div>
              <p style={{ fontSize: '0.85rem' }}>You must sign in to submit code solutions and view live evaluation metrics.</p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <Link to="/login" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Login</Link>
                <Link to="/register" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Register</Link>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Right panel: Description, Constraints, Samples OR AI Assistant */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
        
        {/* Right Panel Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', gap: '1rem' }}>
          <button 
            onClick={() => setRightTab('problem')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              borderBottom: rightTab === 'problem' ? '2px solid var(--primary)' : '2px solid transparent',
              color: rightTab === 'problem' ? 'var(--text-primary)' : 'var(--text-secondary)',
              paddingBottom: '0.5rem', 
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            Problem Statement
          </button>
          <button 
            onClick={() => setRightTab('ai')} 
            style={{ 
              background: 'none', 
              border: 'none', 
              borderBottom: rightTab === 'ai' ? '2px solid var(--primary)' : '2px solid transparent',
              color: rightTab === 'ai' ? 'var(--text-primary)' : 'var(--text-secondary)',
              paddingBottom: '0.5rem', 
              fontWeight: 600,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Code size={16} color="var(--primary)" />
            <span>AI Assistant</span>
          </button>
        </div>

        {rightTab === 'ai' ? (
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <span>Gemini AI Assistant</span>
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Get code completion recommendations or full best practices audits.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleAICompletion}
                disabled={aiLoading || !currentCode}
                className="btn btn-secondary"
                style={{
                  flex: 1,
                  padding: '0.6rem 0.8rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>✨ Complete Code</span>
              </button>

              <button
                onClick={handleAICodeReview}
                disabled={aiLoading || !currentCode}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  padding: '0.6rem 0.8rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <span>🔍 Code Review</span>
              </button>
            </div>

            {aiLoading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '2rem 0' }}>
                <div className="spinner" style={{ width: '28px', height: '28px' }}></div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gemini is thinking...</span>
              </div>
            )}

            {aiError && (
              <div className="alert alert-danger" style={{ fontSize: '0.85rem', padding: '0.75rem' }}>
                {aiError}
              </div>
            )}

            {aiResponse && !aiLoading && (
              <div 
                className="glass-panel" 
                style={{ 
                  flexGrow: 1, 
                  overflowY: 'auto', 
                  maxHeight: '400px', 
                  padding: '1rem', 
                  background: 'var(--run-case-bg)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-sm)' 
                }}
              >
                <MarkdownRenderer markdown={aiResponse} />
              </div>
            )}
          </div>
        ) : (
          <div style={{ flexGrow: 1 }}>
            <Link 
              to="/problems" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.25rem', 
                textDecoration: 'none', 
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 500,
                marginBottom: '1.5rem'
              }}
              className="nav-link"
            >
              <ArrowLeft size={14} />
              <span>Back to Problems</span>
            </Link>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>{currentProblem.title}</h1>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', alignItems: 'center' }}>
              <span className={`badge ${currentProblem.difficulty === 'Easy' ? 'diff-easy' : currentProblem.difficulty === 'Medium' ? 'diff-medium' : 'diff-hard'}`}>
                {currentProblem.difficulty}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                Time Limit: {currentProblem.timeLimit / 1000}s
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                Memory Limit: {currentProblem.memoryLimit}MB
              </span>
            </div>

            {/* Problem Statement */}
            <div style={{ marginBottom: '2rem', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {currentProblem.statement}
            </div>

            {currentProblem.constraints && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  <Info size={16} /> Constraints
                </h3>
                <pre 
                  style={{ 
                    background: 'var(--pre-bg)', 
                    padding: '0.75rem 1rem', 
                    borderRadius: 'var(--radius-sm)', 
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-mono)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {currentProblem.constraints}
                </pre>
              </div>
            )}

            {currentProblem.sampleInput && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Sample Input</h3>
                <pre 
                  style={{ 
                    background: 'var(--pre-bg)', 
                    padding: '0.8rem 1rem', 
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-mono)',
                    overflowX: 'auto',
                    border: '1px solid var(--border)'
                  }}
                >
                  {currentProblem.sampleInput}
                </pre>
              </div>
            )}

            {currentProblem.sampleOutput && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Sample Output</h3>
                <pre 
                  style={{ 
                    background: 'var(--pre-bg)', 
                    padding: '0.8rem 1rem', 
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-mono)',
                    overflowX: 'auto',
                    border: '1px solid var(--border)'
                  }}
                >
                  {currentProblem.sampleOutput}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default ProblemDetail;
