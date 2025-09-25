
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import StudentPage from './Student';
import TeacherForm from './TeacherForm';
import TeacherResults from './TeacherResults';
import PollHistory from './PollHistory';
import Kicked from './Kicked';
import ChatWidget from './ChatWidget';
import { socket } from './lib/socket';
import { useApp } from './store/app';

function RoleSelect() {
  const [selectedRole, setSelectedRole] = React.useState<'STUDENT' | 'TEACHER' | null>(null);
  const navigate = useNavigate();
  const setRole = useApp(s => s.setRole);
  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <button style={{ background: '#6C4DFF', color: '#fff', borderRadius: '16px', padding: '4px 16px', border: 'none', marginBottom: '24px', fontWeight: 500, fontSize: '12px' }}>✦ Intervue Poll</button>
      <h1 style={{ fontWeight: 400, fontSize: '2.5rem', marginBottom: '8px' }}>Welcome to the <span style={{ fontWeight: 700 }}>Live Polling System</span></h1>
      <div style={{ marginBottom: '40px', color: '#444', fontSize: '1rem', textAlign: 'center' }}>
        Please select the role that best describes you to begin using the live polling system
      </div>
      <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
        <div
          style={{ border: selectedRole === 'STUDENT' ? '2px solid #6C4DFF' : '2px solid #eee', borderRadius: '12px', padding: '24px', cursor: 'pointer', width: '200px', background: '#fafaff' }}
          onClick={() => setSelectedRole('STUDENT')}
        >
          <h2 style={{ fontWeight: 600, fontSize: '1.2rem' }}>I'm a Student</h2>
          <p style={{ fontSize: '0.95rem', color: '#666' }}>Submit answers, participate in live polls, and compare responses.</p>
        </div>
        <div
          style={{ border: selectedRole === 'TEACHER' ? '2px solid #6C4DFF' : '2px solid #eee', borderRadius: '12px', padding: '24px', cursor: 'pointer', width: '200px', background: '#fafaff' }}
          onClick={() => setSelectedRole('TEACHER')}
        >
          <h2 style={{ fontWeight: 600, fontSize: '1.2rem' }}>I'm a Teacher</h2>
          <p style={{ fontSize: '0.95rem', color: '#666' }}>Create polls, ask questions, and monitor responses.</p>
        </div>
      </div>
      <button
        style={{ background: '#6C4DFF', color: '#fff', borderRadius: '24px', padding: '10px 40px', border: 'none', fontWeight: 600, fontSize: '1.1rem', cursor: selectedRole ? 'pointer' : 'not-allowed', opacity: selectedRole ? 1 : 0.5 }}
        disabled={!selectedRole}
        onClick={() => {
          if (!selectedRole) return;
          setRole(selectedRole);
          navigate(selectedRole === 'STUDENT' ? '/student' : '/teacher');
        }}
      >
        Continue
      </button>
    </div>
  );
}

function App() {
  const role = useApp(s => s.role);
  const setChatEnabled = useApp(s => s.setChatEnabled!);
  const addPollToHistory = useApp(s => s.addPollToHistory);
  useEffect(() => {
    // ensure teacher presence when role is teacher
    if (role === 'TEACHER') {
      socket.emit('teacher:join', { name: 'Teacher' });
    }
  }, [role]);

  useEffect(() => {
    // enable chat as soon as app mounts
    setChatEnabled(true);
  }, [setChatEnabled]);

  useEffect(() => {
    // Global listeners to persist poll lifecycle for history even across route changes
    const onStarted = (p: any) => {
      try {
        localStorage.setItem('currentPoll', JSON.stringify(p));
        localStorage.removeItem('currentResults');
      } catch {}
    };
    const onResults = (payload: any) => {
      try {
        const r = payload?.results || [];
        localStorage.setItem('currentResults', JSON.stringify(r));
      } catch {}
    };
    const onEnded = () => {
      try {
        const latestPoll = JSON.parse(localStorage.getItem('currentPoll') || 'null');
        const latestResults = JSON.parse(localStorage.getItem('currentResults') || '[]');
        if (latestPoll) {
          const historyItem = {
            id: latestPoll.id,
            question: latestPoll.question,
            options: latestPoll.options,
            endedAt: Date.now(),
          } as any;
          addPollToHistory(historyItem);
          const sid = localStorage.getItem('sessionId');
          if (sid) {
            const key = `history:${sid}`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            const updated = [...existing, { ...historyItem, results: latestResults }];
            localStorage.setItem(key, JSON.stringify(updated));
          }
        }
      } catch {}
    };
    socket.on('poll:started', onStarted);
    socket.on('poll:results', onResults);
    socket.on('poll:ended', onEnded);
    return () => {
      socket.off('poll:started', onStarted);
      socket.off('poll:results', onResults);
      socket.off('poll:ended', onEnded);
    };
  }, [addPollToHistory]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/student/*" element={<StudentPage />} />
        <Route path="/student/kicked" element={<Kicked />} />
        <Route path="/teacher" element={<Navigate to="/teacher/forms" replace />} />
        <Route path="/teacher/forms" element={<TeacherForm />} />
        <Route path="/teacher/results" element={<TeacherResults />} />
        <Route path="/teacher/pollhistory" element={<PollHistory />} />
      </Routes>
      {role && <ChatWidget role={role === 'TEACHER' ? 'TEACHER' : 'STUDENT'} />}
    </Router>
  );
}

export default App;

