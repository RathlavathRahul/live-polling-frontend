import React, { useState, useEffect } from 'react';
import { socket } from './lib/socket';
import { useNavigate } from 'react-router-dom';
import { IoEye } from "react-icons/io5";

const TeacherPage: React.FC = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correct, setCorrect] = useState<(boolean | null)[]>([null, null]);
  const [timer, setTimer] = useState(60);
  const [asking, setAsking] = useState(false);
  const [poll, setPoll] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

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
  const askQuestion = () => {
    setAsking(true);
    try {
      socket.emit('teacher:createPoll', {
        question,
        options: options.filter(opt => opt.trim()),
        timeLimit: timer, // send as timeLimit for backend
        correct,
        sessionId,
      });
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // Create session for teacher on mount
    const teacherName = 'Teacher'; // You can make this dynamic if needed
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacherName }),
    })
      .then(res => res.json())
      .then(data => setSessionId(data.session.id));

    socket.on('poll:started', (pollData) => {
      setPoll(pollData);
      setResults([]);
      setAsking(false);
    });
    socket.on('poll:results', (payload) => {
      setResults(payload.results || []);
    });
    socket.on('poll:ended', () => {
      setPoll(null);
      setResults([]);
    });
    return () => {
      socket.off('poll:started');
      socket.off('poll:results');
      socket.off('poll:ended');
    };
  }, []);

  if (!poll) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', paddingTop: '40px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', background: '#fff', borderRadius: '0', padding: '0 0 0 0' }}>
          <button style={{ background: '#6C4DFF', color: '#fff', borderRadius: '16px', padding: '4px 16px', border: 'none', marginBottom: '24px', fontWeight: 500, fontSize: '12px' }}>✦ Intervue Poll</button>
          <button
            style={{ float: 'right', background: '#6C4DFF', color: '#fff', borderRadius: '16px', padding: '8px 24px', border: 'none', marginBottom: '24px', fontWeight: 500, fontSize: '1rem', cursor: 'pointer' }}
            onClick={() => sessionId && navigate('/teacher/history', { state: { sessionId } })}
          >

<IoEye />
View Poll History11
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
              disabled={asking || !question.trim() || options.filter(opt => opt.trim()).length < 2}
              style={{ background: '#6C4DFF', color: '#fff', borderRadius: '24px', padding: '12px 40px', border: 'none', fontWeight: 600, fontSize: '1.1rem', cursor: asking ? 'not-allowed' : 'pointer' }}>
              Ask Question
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show live results after posting question
  return (
    <div style={{ minHeight: '100vh', background: '#fff', paddingTop: '40px' }}>
      <div style={{ maxWidth: '540px', margin: '0 auto', background: '#fff', borderRadius: '12px', padding: '0' }}>
        <button
          style={{ float: 'right', background: '#6C4DFF', color: '#fff', borderRadius: '16px', padding: '8px 24px', border: 'none', marginBottom: '24px', fontWeight: 500, fontSize: '1rem', cursor: 'pointer' }}
          onClick={() => sessionId && navigate('/teacher/history', { state: { sessionId } })}
        >
          <IoEye size={20}/>
          View Poll History11
        </button>
        <div style={{ marginBottom: '24px', fontWeight: 700, fontSize: '1.2rem' }}>Question</div>
        <div style={{ background: 'linear-gradient(90deg, #444 60%, #888 100%)', color: '#fff', borderRadius: '8px 8px 0 0', padding: '16px', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0' }}>
          {poll.question}
        </div>
        <div style={{ background: '#fff', border: '2px solid #C3CFE2', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '18px 18px 0 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {poll.options.map((o: any, idx: number) => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#6C4DFF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>{idx + 1}</div>
              <div style={{ flex: 1, background: '#F6F7FB', borderRadius: '6px', padding: '12px', fontSize: '1.1rem', color: '#222', textAlign: 'left', fontWeight: 500, position: 'relative' }}>
                {o.text}
                {results.length > 0 && (
                  <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6C4DFF', fontWeight: 700, fontSize: '1.1rem' }}>{results.find(r => r.id === o.id)?.percent ?? 0}%</div>
                )}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', marginBottom: '8px', gap: '12px' }}>
            <button style={{ background: '#E53E3E', color: '#fff', borderRadius: '24px', padding: '12px 32px', border: 'none', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => socket.emit('teacher:endPoll')}>End Poll</button>
            <button style={{ background: '#6C4DFF', color: '#fff', borderRadius: '24px', padding: '12px 32px', border: 'none', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer' }} onClick={() => window.location.reload()}>+ Ask a new question</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherPage;
