import React from 'react';

type OptionView = { id: string; text: string; percent: number };

export default function QuestionCard({ question, options, index }: { question: string; options: OptionView[]; index?: number }) {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      {typeof index === 'number' && (
        <div style={{ fontWeight: 600, fontSize: '1rem', margin: '0 0 10px 4px' }}>Question {index + 1}</div>
      )}
      <div style={{ border: '2px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
        <div style={{ background: 'linear-gradient(90deg, #4B5563 0%, #9CA3AF 100%)', color: '#fff', padding: '12px 16px', fontWeight: 600, fontSize: '0.95rem' }}>
          {question}
        </div>
        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {options.map((o, i) => {
            const clamped = Math.max(0, Math.min(100, Math.round(o.percent || 0)));
            return (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 26, height: 26, borderRadius: 13, background: '#6C4DFF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>{i + 1}</div>
                <div style={{ position: 'relative', flex: 1, background: '#F3F4F6', borderRadius: 8, height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', color: '#111', fontWeight: 600 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${clamped}%`, background: '#6C4DFF', opacity: 0.85, borderRadius: 8, transition: 'width .3s ease' }} />
                  <span style={{ position: 'relative', zIndex: 1, color: clamped > 50 ? '#fff' : '#111' }}>{o.text}</span>
                  <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 1, color: '#6C4DFF', fontWeight: 700, fontSize: '0.95rem' }}>{clamped}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


