import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from './lib/socket';
import { useApp } from './store/app';
import QuestionCard from './QuestionCard';

const TeacherResults: React.FC = () => {
  const navigate = useNavigate();
  const [poll, setPoll] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [viewHistoryLoading, setViewHistoryLoading] = useState<boolean>(false);

  const addPollToHistory = useApp(s => s.addPollToHistory);

  useEffect(() => {
    const saved = localStorage.getItem('sessionId');
    if (saved) setSessionId(saved);

    // Restore last known poll/results so refresh doesn't blank the screen
    const savedPoll = localStorage.getItem('currentPoll');
    if (savedPoll) setPoll(JSON.parse(savedPoll));
    const savedResults = localStorage.getItem('currentResults');
    if (savedResults) setResults(JSON.parse(savedResults));

    socket.on('poll:started', (p) => {
      setPoll(p);
      setResults([]);
      localStorage.setItem('currentPoll', JSON.stringify(p));
      localStorage.removeItem('currentResults');
    });
    socket.on('poll:results', (payload) => {
      const r = payload.results || [];
      setResults(r);
      localStorage.setItem('currentResults', JSON.stringify(r));
    });
    socket.on('poll:ended', () => {
      // Append finished poll to in-memory history and persist by session
      try {
        const latestPoll = JSON.parse(localStorage.getItem('currentPoll') || 'null');
        const latestResults = JSON.parse(localStorage.getItem('currentResults') || '[]');
        if (latestPoll) {
          const historyItem = {
            id: latestPoll.id,
            question: latestPoll.question,
            options: latestPoll.options,
            votes: undefined,
            endedAt: Date.now(),
          };
          addPollToHistory(historyItem);
          // persist per session
          const sid = localStorage.getItem('sessionId');
          if (sid) {
            const key = `history:${sid}`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            const updated = [...existing, { ...historyItem, results: latestResults }];
            localStorage.setItem(key, JSON.stringify(updated));
          }
        }
      } catch {}
      // Keep showing last results instead of clearing
    });
    return () => {
      socket.off('poll:started');
      socket.off('poll:results');
      socket.off('poll:ended');
    };
  }, []);

  if (!poll) {
    return (
      <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <button
          style={{ position: 'fixed', top: 24, right: 24, background: '#6C4DFF', color: '#fff', borderRadius: '16px', padding: '8px 24px', border: 'none', fontWeight: 500, fontSize: '1rem', cursor: !sessionId || viewHistoryLoading ? 'not-allowed' : 'pointer', opacity: !sessionId || viewHistoryLoading ? 0.6 : 1 }}
          disabled={!sessionId || viewHistoryLoading}
          onClick={() => {
            if (!sessionId) return;
            setViewHistoryLoading(true);
            navigate('/teacher/pollhistory');
          }}
        >
          {viewHistoryLoading ? 'Loading…' : 'View Poll History'}
        </button>
        <div style={{ width: '100%', maxWidth: 820, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ marginBottom: '12px', fontWeight: 700, fontSize: '1.25rem', color: '#111' }}>Waiting for question…</div>
          <div style={{ color: '#6C4DFF', fontWeight: 600 }}>Publish a question from the form to start.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <button
        style={{ position: 'fixed', top: 24, right: 24, background: '#6C4DFF', color: '#fff', borderRadius: '16px', padding: '8px 24px', border: 'none', fontWeight: 500, fontSize: '1rem', cursor: viewHistoryLoading ? 'not-allowed' : 'pointer', opacity: viewHistoryLoading ? 0.6 : 1 }}
        disabled={viewHistoryLoading}
        onClick={() => {
          setViewHistoryLoading(true);
          navigate('/teacher/pollhistory');
        }}
      >
        {viewHistoryLoading ? 'Loading…' : 'View Poll History'}
      </button>
      <div style={{ width: '100%', maxWidth: 820, margin: '0 auto' }}>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1F2937', margin: '0 0 10px 4px' }}>Question</div>
        <div style={{ marginBottom: 16 }}>
          <QuestionCard
            question={poll.question}
            options={poll.options.map((o: any) => ({
              id: o.id,
              text: o.text,
              percent: (results.find((r: any) => r.id === o.id)?.percent ?? 0),
            }))}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <button style={{ background: '#6C4DFF', color: '#fff', borderRadius: '24px', padding: '12px 32px', border: 'none', fontWeight: 600, fontSize: '1.1rem' }} onClick={() => navigate('/teacher/forms')}>+ Ask a new question</button>
        </div>
      </div>
    </div>
  );
};

export default TeacherResults;


