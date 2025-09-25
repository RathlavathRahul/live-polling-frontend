import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from './store/app';
import QuestionCard from './QuestionCard';
import { PulseLoader } from 'react-spinners';
import { FiArrowLeft } from "react-icons/fi";
const PollHistory: React.FC = () => {
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const sessionId = typeof window !== 'undefined' ? localStorage.getItem('sessionId') : null;
  const inMemoryHistory = useApp(s => s.pollHistory);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) {
      setPolls([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const key = `history:${sessionId}`;
        const persisted = JSON.parse(localStorage.getItem(key) || '[]');
        const mergedLocal = [...persisted, ...inMemoryHistory];
        // Try backend as authoritative fallback
        let backend: any[] = [];
        try {
          const res = await fetch(`/api/session/${sessionId}/polls`);
          if (res.ok) {
            backend = await res.json();
          }
        } catch (e) {
          // ignore network errors; fallback to local history
        }
        const merged = [...mergedLocal, ...backend];
        const seen: Record<string, boolean> = {};
        const unique = merged.filter((p) => {
          if (!p?.id) return false;
          if (seen[p.id]) return false;
          seen[p.id] = true;
          return true;
        });
        setPolls(unique);
      } catch (e: any) {
        setError(e?.message || 'Failed to load history');
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId, inMemoryHistory]);

  return (
    <div style={{ minHeight: '100vh', background: '#fff', padding: '40px' }}>
      <button
        onClick={() => navigate("/teacher/results")}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
          <FiArrowLeft size={24} color="#6C4DFF" />
        <span style={{ marginLeft: "8px", color: "#6C4DFF", fontWeight: 600 }}>
          Back
        </span>
      </button>
      <h1 style={{ fontWeight: 400, fontSize: '2.5rem', marginBottom: '24px' }}>

        View <span style={{ fontWeight: 700 }}>Poll History</span>
      </h1>
      <div className="scroll-hide" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6C4DFF', fontWeight: 600, marginTop: '12px' }}>
            <PulseLoader color="#6C4DFF" size={8} />
            <span>Loading…</span>
          </div>
        )}
        {error && <div style={{ color: '#E53E3E', fontWeight: 600, marginTop: '12px' }}>{error}</div>}
        {polls.map((poll, idx) => (
          <div key={poll.id} style={{ marginBottom: '24px' }}>
            <QuestionCard
              index={idx}
              question={poll.question}
              options={poll.options.map((o: any) => ({
                id: o.id,
                text: o.text,
                percent: Array.isArray(poll.results)
                  ? (poll.results.find((r: any) => r.id === o.id)?.percent ?? 0)
                  : (() => {
                      const optionVotes = poll.votes?.filter((v: any) => v.optionId === o.id).length || 0;
                      const totalVotes = poll.votes?.length || 0;
                      return totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
                    })(),
              }))}
            />
          </div>
        ))}
        {polls.length === 0 && <div style={{ color: '#888', fontSize: '1.2rem', marginTop: '32px' }}>No polls conducted in this session yet.</div>}
      </div>
    </div>
  );
};

export default PollHistory;
