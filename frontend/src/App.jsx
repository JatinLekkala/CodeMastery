import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from './redux/slices/authSlice';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProblemList from './pages/ProblemList';
import ProblemDetail from './pages/ProblemDetail';
import Leaderboard from './pages/Leaderboard';
import Dashboard from './pages/Dashboard';
import Playground from './pages/Playground';
import socket from './utils/socket';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const dispatch = useDispatch();
  const [theme, setTheme] = useState(() => {
    // Default to dark theme
    return localStorage.getItem('codemastery-theme') || 'dark';
  });

  const { isAuthenticated, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Dispatch loadUser on app boot to recover session
    dispatch(loadUser()).then((result) => {
      if (loadUser.fulfilled.match(result)) {
        const loggedInUser = result.payload.user;
        // Connect to WebSocket room on successful boot session check
        socket.connect();
        socket.emit('join', loggedInUser.id || loggedInUser._id);
        console.log(`[Socket] Connected and joined room: ${loggedInUser.id || loggedInUser._id}`);
      }
    });
  }, [dispatch]);

  // Sync theme changes with body class
  useEffect(() => {
    const root = document.body;
    if (theme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
    localStorage.setItem('codemastery-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-dark)' }}>
      {/* Toast Notifications */}
      <ToastContainer theme={theme === 'dark' ? 'dark' : 'light'} position="top-right" autoClose={3000} />
      
      {/* Navigation Header */}
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      {/* Main Content Layout Router */}
      <main style={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/problems" element={<ProblemList />} />
          <Route path="/problems/:id" element={<ProblemDetail theme={theme} />} />
          <Route path="/playground" element={<Playground theme={theme} />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/:userId" element={<Dashboard />} />
          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Bottom Footer */}
      <footer 
        style={{ 
          height: '60px', 
          borderTop: '1px solid var(--border)', 
          background: 'rgba(18, 20, 30, 0.4)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '0.85rem', 
          color: 'var(--text-muted)' 
        }}
      >
        <span>&copy; {new Date().getFullYear()} Codemaster Platform. All Rights Reserved.</span>
      </footer>
    </div>
  );
}

export default App;
