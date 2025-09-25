
type OptionView = { id: string; text: string; percent: number };

export default function QuestionCard({ question, options, index }: { question: string; options: OptionView[]; index?: number }) {
  return (
    <div style={{ width: '100%', maxWidth: 820 }}>
      {typeof index === 'number' && (
        <div style={{ fontWeight: 600, fontSize: '1rem', margin: '0 0 10px 4px' }}>Question {index + 1}</div>
      )}
      <div style={{ border: '2px solid #E5E7EB', borderRadius: 10, overflow: 'hidden', background: '#fff', boxShadow: '0 6px 24px rgba(0,0,0,0.06)' }}>
        <div style={{ background: 'linear-gradient(90deg, #4B5563 0%, #9CA3AF 100%)', color: '#fff', padding: '14px 18px', fontWeight: 600, fontSize: '1rem' }}>
          {question}
        </div>
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {options.map((o, i) => {
            const clamped = Math.max(0, Math.min(100, Math.round(o.percent || 0)));
            return (
              <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 14, background: '#6C4DFF', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>{i + 1}</div>
                <div style={{ position: 'relative', flex: 1, background: '#F3F4F6', borderRadius: 8, height: 40, display: 'flex', alignItems: 'center', padding: '0 12px', color: '#111', fontWeight: 600 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${clamped}%`, background: '#6C4DFF', opacity: 0.9, borderRadius: 8, transition: 'width .3s ease' }} />
                  <span style={{ position: 'relative', zIndex: 1, color: clamped > 55 ? '#fff' : '#111' }}>{o.text}</span>
                  <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 1, color: '#6C4DFF', fontWeight: 700, fontSize: '0.95rem' }}>{clamped}%</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


