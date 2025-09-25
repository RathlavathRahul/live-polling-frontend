
export default function Kicked() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', flexDirection: 'column' }}>
      <button style={{ background: '#6C4DFF', color: '#fff', borderRadius: '16px', padding: '4px 16px', border: 'none', marginBottom: '24px', fontWeight: 500, fontSize: '12px' }}>✦ Intervue Poll</button>
      <h1 style={{ fontWeight: 700, fontSize: '2rem', marginBottom: 8 }}>You’ve been Kicked out!</h1>
      <div style={{ color: '#666' }}>Looks like the teacher had removed you from the poll system. Please try again sometime.</div>
    </div>
  );
}


