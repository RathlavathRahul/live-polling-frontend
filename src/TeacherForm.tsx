import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from './lib/socket';
import { PulseLoader } from 'react-spinners';

const TeacherForm: React.FC = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correct, setCorrect] = useState<(boolean | null)[]>([null, null]);
  const [timer, setTimer] = useState(60);
  const [creatingSession, setCreatingSession] = useState<boolean>(false);
  const [asking, setAsking] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [viewHistoryLoading, setViewHistoryLoading] = useState<boolean>(false);

  const handleOptionChange = (i: number, value: string) => {
    setOptions(options.map((opt, idx) => (idx === i ? value : opt)));
  };
  const handleCorrectChange = (i: number, value: boolean) => {
    setCorrect(correct.map((c, idx) => (idx === i ? value : c)));
  };
  const addOption = () => {
    setOptions([...options, '']);
    setCorrect([...correct, null]);
  };

  useEffect(() => {
    // identify teacher in participants list
    socket.emit('teacher:join', { name: 'Teacher' });
    // restore existing session if available
    const saved = localStorage.getItem('sessionId');
    if (saved) {
      setSessionId(saved);
    } else {
      // create session on first visit
      setCreatingSession(true);
      const teacherName = 'Teacher';
      fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherName }),
      })
        .then(res => res.json())
        .then(data => {
          const id = data.session.id as string;
          setSessionId(id);
          localStorage.setItem('sessionId', id);
        })
        .finally(() => setCreatingSession(false));
    }

    // When poll actually starts, move to results page
    socket.on('poll:started', () => {
      setAsking(false);
      navigate('/teacher/results');
    });
    return () => {
      socket.off('poll:started');
    };
  }, [navigate]);

  const askQuestion = () => {
    setAsking(true);
    try {
      socket.emit('teacher:createPoll', {
        question,
        options: options.filter(opt => opt.trim()),
        timeLimit: timer,
        correct,
        sessionId,
      });
      // Navigate immediately to results; page will show waiting state until poll starts
      navigate('/teacher/results');
    } catch (error) {
      setAsking(false);
      // eslint-disable-next-line no-console
      console.log(error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingTop: '40px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', background: '#fff', borderRadius: '0', padding: '0 0 0 0' }}>
        <button style={{ background: '#6C4DFF', color: '#fff', borderRadius: '16px', padding: '4px 16px', border: 'none', marginBottom: '24px', fontWeight: 500, fontSize: '12px' }}>✦ Intervue Poll</button>
        <button
          style={{ float: 'right', background: '#6C4DFF', color: '#fff', borderRadius: '16px', padding: '8px 24px', border: 'none', marginBottom: '24px', fontWeight: 500, fontSize: '1rem', cursor: viewHistoryLoading ? 'not-allowed' : 'pointer', opacity: viewHistoryLoading ? 0.6 : 1 }}
          disabled={viewHistoryLoading}
          onClick={() => {
            setViewHistoryLoading(true);
            navigate('/teacher/pollhistory');
          }}
        >
          {viewHistoryLoading ? 'Loading…' : 'View Poll History'}
        </button>
        <h1 style={{ fontWeight: 400, fontSize: '2.5rem', marginBottom: '8px' }}>Let’s <span style={{ fontWeight: 700 }}>Get Started</span></h1>
        <div style={{ color: '#444', fontSize: '1rem', marginBottom: '32px' }}>
          you’ll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', justifyContent: 'space-between', width: '100%' }}>
          <label style={{ fontWeight: 600, fontSize: '1.1rem' }}>Enter your question</label>
          <select value={timer} onChange={e => setTimer(Number(e.target.value))} style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #C3CFE2', fontWeight: 500, fontSize: '1rem', marginLeft: 'auto' }}>
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds</option>
            <option value={90}>90 seconds</option>
          </select>
        </div>
        {creatingSession && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6C4DFF', fontWeight: 600, marginBottom: '12px' }}>
            <PulseLoader color="#6C4DFF" size={8} />
            <span>Creating session…</span>
          </div>
        )}
        <div style={{ position: 'relative', marginBottom: '16px', width: '100%' }}>
          <textarea value={question} onChange={e => setQuestion(e.target.value)} style={{ width: '100%', minHeight: '100px', borderRadius: '8px', padding: '18px', fontSize: '1.1rem', background: '#F2F2F2', color: '#222', resize: 'none', boxSizing: 'border-box' }} maxLength={100} />
          <div style={{ position: 'absolute', right: '18px', bottom: '8px', color: '#888', fontSize: '0.95rem' }}>{question.length}/100</div>
        </div>
        <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>Edit Options</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontWeight: 600, color: '#6C4DFF', fontSize: '1.1rem', width: '24px', textAlign: 'center' }}>{i + 1}</span>
              <input value={opt} onChange={e => handleOptionChange(i, e.target.value)} style={{ flex: 1, borderRadius: '8px', padding: '10px', fontSize: '1rem', background: '#F2F2F2' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 500 }}>Is it Correct?</span>
                <label style={{ marginLeft: '8px' }}>
                  <input type="radio" name={`correct${i}`} checked={correct[i] === true} onChange={() => handleCorrectChange(i, true)} /> Yes
                </label>
                <label style={{ marginLeft: '8px' }}>
                  <input type="radio" name={`correct${i}`} checked={correct[i] === false} onChange={() => handleCorrectChange(i, false)} /> No
                </label>
              </div>
            </div>
          ))}
        </div>
        <button onClick={addOption} style={{ color: '#6C4DFF', background: 'none', border: '1px solid #C3CFE2', borderRadius: '8px', padding: '8px 16px', fontWeight: 500, fontSize: '1rem', marginBottom: '32px', cursor: 'pointer' }}>+ Add More option</button>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={askQuestion}
            disabled={asking || creatingSession || !question.trim() || options.filter(opt => opt.trim()).length < 2}
            style={{ background: '#6C4DFF', color: '#fff', borderRadius: '24px', padding: '12px 40px', border: 'none', fontWeight: 600, fontSize: '1.1rem', cursor: asking || creatingSession ? 'not-allowed' : 'pointer', opacity: asking || creatingSession ? 0.7 : 1 }}>
            {asking ? 'Asking…' : 'Ask Question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherForm;


