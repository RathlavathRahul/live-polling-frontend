import React, { useEffect, useMemo, useRef, useState } from 'react';
import { socket } from './lib/socket';
import { BsChatRight } from "react-icons/bs";

type Participant = { socketId: string; name: string; role?: string };

export default function ChatWidget({ role }: { role: 'TEACHER' | 'STUDENT' }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'chat' | 'participants'>('chat');
  const [messages, setMessages] = useState<Array<{ id: string; name: string; message: string; at: number }>>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // hydrate messages for current session
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem('sessionId') : null;
    if (sessionId) {
      try {
        const saved = JSON.parse(localStorage.getItem(`chat:${sessionId}`) || '[]');
        if (Array.isArray(saved)) setMessages(saved);
      } catch {}
    }
    const onMsg = (m: any) => setMessages(prev => {
      const next = [...prev, m];
      const sid = typeof window !== 'undefined' ? localStorage.getItem('sessionId') : null;
      if (sid) localStorage.setItem(`chat:${sid}`, JSON.stringify(next));
      return next;
    });
    const onParticipants = (list: Participant[]) => setParticipants(list);
    socket.on('chat:message', onMsg);
    socket.on('participants:update', onParticipants);
    return () => {
      socket.off('chat:message', onMsg);
      socket.off('participants:update', onParticipants);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sortedParticipants = useMemo(() => {
    const teachers = participants.filter(p => p.role === 'TEACHER');
    const students = participants.filter(p => p.role !== 'TEACHER');
    return [...teachers, ...students];
  }, [participants]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ position: 'fixed', right: 24, bottom: 24, width: 48, height: 48, borderRadius: 24, background: '#6C4DFF', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.2)' }}
        aria-label="Open chat"
      >
        <BsChatRight size={22} 
  style={{ 
    fontWeight: "bold", // not always effective, but safe
    marginLeft: "12px"  // moves it a bit left
  }} />

      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', right: 24, bottom: 24, width: 340, background: '#fff', borderRadius: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.15)', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#fafafa', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => setTab('chat')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: tab === 'chat' ? 700 : 500, color: tab === 'chat' ? '#6C4DFF' : '#444' }}>Chat</button>
          <button onClick={() => setTab('participants')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: tab === 'participants' ? 700 : 500, color: tab === 'participants' ? '#6C4DFF' : '#444' }}>Participants</button>
        </div>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
      </div>

      {tab === 'chat' ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: 380 }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
            {messages.map((m, idx) => (
              <div key={idx} style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', alignItems: m.id === socket.id ? 'flex-end' : 'flex-start' }}>
                <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: 4 }}>{m.name}</div>
                <div style={{ background: m.id === socket.id ? '#6C4DFF' : '#F3F4F6', color: m.id === socket.id ? '#fff' : '#111', padding: '8px 12px', borderRadius: 10, maxWidth: 260 }}>
                  {m.message}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const msg = input.trim();
              if (!msg) return;
              socket.emit('chat:message', { message: msg });
              setInput('');
            }}
            style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #eee' }}
          >
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message" style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px' }} />
            <button type="submit" style={{ background: '#6C4DFF', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' }}>Send</button>
          </form>
        </div>
      ) : (
        <div style={{ maxHeight: 430, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: '0.85rem', color: '#666' }}>
                <th style={{ padding: '10px 12px' }}>Name</th>
                <th style={{ padding: '10px 12px', width: 90 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedParticipants.map((p) => (
                <tr key={p.socketId}>
                  <td style={{ padding: '8px 12px' }}>{p.name}</td>
                  <td style={{ padding: '8px 12px' }}>
                    {role === 'TEACHER' && p.role !== 'TEACHER' ? (
                      <button onClick={() => socket.emit('teacher:kickStudent', { socketId: p.socketId })} style={{ background: 'none', border: 'none', color: '#6C4DFF', cursor: 'pointer' }}>Kick out</button>
                    ) : (
                      <span style={{ color: '#aaa' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


