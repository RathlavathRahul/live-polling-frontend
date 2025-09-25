import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { socket } from './lib/socket';
import { useApp } from './store/app';
import { ClipLoader
} from 'react-spinners';


const Loader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#fff' }}>
    <button style={{ background: '#6C4DFF', color: '#fff', borderRadius: '16px', padding: '4px 16px', border: 'none', marginBottom: '24px', fontWeight: 500, fontSize: '12px' }}>✦ Intervue Poll</button>
    <div style={{ marginBottom: '16px' }}>
      <ClipLoader
 color="#6C4DFF" />
    </div>
    <div style={{ fontWeight: 600, fontSize: '1.3rem', color: '#222' }}>Waiting for the teacher to ask questions…</div>
  </div>
);

const Lobby = ({ initialName, onContinue }: { initialName: string; onContinue: (name: string) => void }) => {
  const [name, setName] = useState(initialName || '');
  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <button style={{ background: '#6C4DFF', color: '#fff', borderRadius: '16px', padding: '4px 16px', border: 'none', marginBottom: '24px', fontWeight: 500, fontSize: '12px' }}>✦ Intervue Poll</button>
      <h1 style={{ fontWeight: 400, fontSize: '2.5rem', marginBottom: '8px' }}>Let’s <span style={{ fontWeight: 700 }}>Get Started</span></h1>
      <div style={{  borderRadius: '6px', padding: '8px 16px', marginBottom: '32px', color: '#444', maxWidth: '480px', textAlign: 'center', fontSize: '1rem' }}>
        If you’re a student, you’ll be able to <b>submit your answers</b>, participate in live polls, and see how your responses compare with your classmates
      </div>
      <div style={{ marginBottom: '8px', fontWeight: 500  }}>Enter your Name</div>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ marginBottom: '16px', background: '#F2F2F2', borderRadius: '6px', padding: '10px 16px', width: '320px', fontSize: '1rem', color: '#222', textAlign: 'left', border: 'none' }}
        placeholder="Enter your name"
      />
      <button style={{ background: '#6C4DFF', color: '#fff', borderRadius: '24px', padding: '10px 40px', border: 'none', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer', marginTop: '16px' }} onClick={() => onContinue(name)}>Continue</button>
    </div>
  );
};

const StudentPage: React.FC = () => {
  const location = useLocation();
  const setRole = useApp(s => s.setRole);
  const [name, setName] = useState(location.state?.name || '');
  const [showLobby, setShowLobby] = useState(true);
  const [joined, setJoined] = useState(false);
  const [poll, setPoll] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    if (!showLobby && name) {
      console.log('[Student] Emitting student:join', name);
      socket.emit('student:join', { name });
    }
    socket.on('student:joined', () => {
      console.log('[Student] Joined event received');
      setJoined(true);
    });
    socket.on('poll:started', (pollData) => {
      console.log('[Student] poll:started received', pollData);
      setPoll(pollData);
      setVoted(false);
    });
    socket.on('poll:results', (payload) => {
      console.log('[Student] poll:results received', payload);
      setResults(payload.results || []);
    });
    socket.on('poll:ended', () => {
      console.log('[Student] poll:ended received');
      setPoll(null);
      setResults([]);
      setVoted(false);
    });
    socket.on('user:kicked', () => {
      // show kicked screen
      localStorage.setItem('kicked', '1');
      window.location.href = '/student/kicked';
    });
    return () => {
      socket.off('student:joined');
      socket.off('poll:started');
      socket.off('poll:results');
      socket.off('poll:ended');
      socket.off('user:kicked');
    };
  }, [showLobby, name]);

  // Move hooks to top level
  const [timer, setTimer] = useState(15);
  useEffect(() => {
    if (!poll) return;
    setTimer(poll.timeLimit || 15); // Use poll.timeLimit from backend
    const interval = setInterval(() => {
      setTimer(t => t > 0 ? t - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [poll]);

  const [selected, setSelected] = useState<number | null>(null);

  // Logging for debugging
  if (showLobby) {
    console.log('[Student] Showing lobby');
    return <Lobby initialName={name} onContinue={n => { setName(n); setShowLobby(false); setRole('STUDENT'); }} />;
  }

  if (!joined || !poll) {
    console.log('[Student] Loader shown. joined:', joined, 'poll:', poll);
    return <Loader />;
  }

  console.log('[Student] Rendering poll', poll);
  // If student has voted, show live results
  if (voted) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', padding: '48px 0' }}>
        <div style={{ maxWidth: '540px', margin: '0 auto', background: '#fff', borderRadius: '12px', padding: '0' }}>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>Question 1</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
              <span style={{ fontSize: '1.2rem' }}>⏱️</span>
              <span style={{ color: '#E53E3E', fontWeight: 700, fontSize: '1.1rem' }}>00:{timer.toString().padStart(2, '0')}</span>
            </span>
          </div>
          <div style={{ background: 'linear-gradient(90deg, #444 60%, #888 100%)', color: '#fff', borderRadius: '8px 8px 0 0', padding: '16px', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0' }}>
            {poll.question}
          </div>
          <div style={{ background: '#fff', border: '2px solid #C3CFE2', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '18px 18px 0 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {poll.options.map((o: { id: string, text: string }, idx: number) => {
              const result = results.find(r => r.id === o.id);
              const percent = result ? result.percent : 0;
              return (
                <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6C4DFF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>{idx + 1}</div>
                  <div style={{ flex: 1, background: '#F6F7FB', borderRadius: '6px', padding: '12px', fontSize: '1.1rem', color: '#222', textAlign: 'left', fontWeight: 500, position: 'relative' }}>
                    {o.text}
                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${percent}%`, background: '#6C4DFF', opacity: 0.25, borderRadius: '6px', zIndex: 0 }}></div>
                    <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6C4DFF', fontWeight: 700, fontSize: '1.1rem', zIndex: 1 }}>{percent}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ textAlign: 'center', marginTop: '32px', color: '#444', fontWeight: 500, fontSize: '1.1rem' }}>
            Wait for the teacher to ask a new question..
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show poll and allow voting
  return (
    <div style={{ minHeight: '100vh', background: '#fff', padding: '48px 0' }}>
      <div style={{ maxWidth: '540px', margin: '0 auto', background: '#fff', borderRadius: '12px', padding: '0' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>Question 1</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
            <span style={{ fontSize: '1.2rem' }}>⏱️</span>
            <span style={{ color: '#E53E3E', fontWeight: 700, fontSize: '1.1rem' }}>00:{timer.toString().padStart(2, '0')}</span>
          </span>
        </div>
        <div style={{ background: 'linear-gradient(90deg, #444 60%, #888 100%)', color: '#fff', borderRadius: '8px 8px 0 0', padding: '16px', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0' }}>
          {poll.question}
        </div>
        <div style={{ background: '#fff', border: '2px solid #C3CFE2', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '18px 18px 0 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {poll.options.map((o: { id: string, text: string }, idx: number) => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: selected === idx ? '#6C4DFF' : '#E5E7EB', color: selected === idx ? '#fff' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>{idx + 1}</div>
              <button
                onClick={() => setSelected(idx)}
                style={{ flex: 1, background: selected === idx ? '#F6F2FF' : '#F6F7FB', border: selected === idx ? '2px solid #6C4DFF' : 'none', borderRadius: '6px', padding: '12px', fontSize: '1.1rem', color: '#222', textAlign: 'left', cursor: 'pointer', outline: 'none', fontWeight: selected === idx ? 600 : 500 }}
              >
                {o.text}
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', marginBottom: '8px' }}>
            <button
              style={{ background: '#6C4DFF', color: '#fff', borderRadius: '24px', padding: '12px 40px', border: 'none', fontWeight: 600, fontSize: '1.1rem', cursor: selected === null || voted ? 'not-allowed' : 'pointer', opacity: voted ? 0.6 : 1 }}
              disabled={selected === null || voted}
              onClick={() => {
                if (selected !== null && !voted) {
                  socket.emit('student:vote', { pollId: poll.id, optionId: poll.options[selected].id });
                  setVoted(true);
                }
              }}
            >
              {voted ? 'Submitted' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPage;
