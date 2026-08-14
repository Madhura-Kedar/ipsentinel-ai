import { useState } from 'react';

function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError('Could not reach the backend. Is it running?');
    }
    setLoading(false);
  };

  const riskStyle = (level) => {
    if (level === 'High') return { bg: 'rgba(220, 38, 38, 0.15)', border: '#ef4444', text: '#fca5a5' };
    if (level === 'Medium') return { bg: 'rgba(217, 119, 6, 0.15)', border: '#f59e0b', text: '#fcd34d' };
    return { bg: 'rgba(22, 163, 74, 0.15)', border: '#22c55e', text: '#86efac' };
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow} />
      <div style={styles.container}>

        <div style={styles.header}>
          <div style={styles.logoRow}>
            <span style={styles.logoIcon}>💡</span>
            <h1 style={styles.title}>IPSentinel <span style={{ color: '#60a5fa' }}>AI</span></h1>
          </div>
          <p style={styles.subtitle}>Track. Detect. Protect Intellectual Property.</p>
        </div>

        <div style={styles.card}>
          <label style={styles.label}>Describe your invention</label>
          <textarea
            style={styles.textarea}
            placeholder="e.g. An AI-powered IoT-based smart monitoring system that processes sensor data using neural networks and provides real-time alerts..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={analyze}
            disabled={loading}
            style={{ ...styles.button, opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <span style={styles.buttonContent}>
                <span style={styles.spinner} />
                Analyzing...
              </span>
            ) : (
              '🔍 Analyze Invention'
            )}
          </button>
          {error && <p style={styles.error}>⚠ {error}</p>}
        </div>

        {result && (
          <div style={styles.results}>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}><span style={styles.sectionIcon}>🧠</span> AI Extraction</h2>
              <div style={styles.sectionCard}>
                <p style={styles.concept}>{result.extraction.concept}</p>
                <div style={styles.tagRow}>
                  {result.extraction.features?.map((f, i) => (
                    <span key={i} style={styles.tag}>{f}</span>
                  ))}
                </div>
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}><span style={styles.sectionIcon}>⚠️</span> Risk Heatmap</h2>
              {result.risk_analysis.risks?.map((r, i) => {
                const s = riskStyle(r.level);
                return (
                  <div key={i} style={{ ...styles.riskCard, background: s.bg, borderLeft: `4px solid ${s.border}` }}>
                    <div style={styles.riskHeader}>
                      <span style={styles.riskTitle}>{r.title}</span>
                      <span style={{ ...styles.riskBadge, color: s.text, border: `1px solid ${s.border}` }}>{r.level}</span>
                    </div>
                    <p style={styles.riskReason}>{r.reason}</p>
                  </div>
                );
              })}
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}><span style={styles.sectionIcon}>✨</span> Innovation Mentor</h2>
              <div style={styles.sectionCard}>
                {result.risk_analysis.suggestions?.map((sugg, i) => (
                  <div key={i} style={styles.suggestionRow}>
                    <span style={styles.suggestionNum}>{i + 1}</span>
                    <p style={styles.suggestionText}>{sugg}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.section}>
              <h2 style={styles.sectionTitle}><span style={styles.sectionIcon}>📄</span> Similar Patents Found</h2>
              {result.matches.map((m, i) => (
                <div key={i} style={styles.matchCard}>
                  <div style={styles.matchHeader}>
                    <span style={styles.matchTitle}>{m.title}</span>
                    <span style={styles.matchScore}>{Math.round(m.similarity * 100)}% match</span>
                  </div>
                  <p style={styles.matchAbstract}>{m.abstract}...</p>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        ::placeholder { color: #64748b; }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e293b 100%)',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    position: 'relative',
    overflow: 'hidden',
    padding: '3rem 1.5rem',
  },
  bgGlow: {
    position: 'absolute',
    top: '-10%',
    right: '10%',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  container: {
    maxWidth: '760px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
  },
  header: {
    textAlign: 'center',
    marginBottom: '2.5rem',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
  },
  logoIcon: { fontSize: '2rem' },
  title: {
    fontSize: '2.4rem',
    fontWeight: 800,
    color: '#f1f5f9',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    color: '#93c5fd',
    fontSize: '1rem',
    marginTop: '0.5rem',
    fontWeight: 500,
  },
  card: {
    background: 'rgba(30, 41, 59, 0.6)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    borderRadius: '16px',
    padding: '1.75rem',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  },
  label: {
    display: 'block',
    color: '#cbd5e1',
    fontSize: '0.85rem',
    fontWeight: 600,
    marginBottom: '0.6rem',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  textarea: {
    width: '100%',
    height: '110px',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    background: 'rgba(15, 23, 42, 0.6)',
    color: '#e2e8f0',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    marginTop: '14px',
    width: '100%',
    padding: '13px 24px',
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  buttonContent: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.4)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.7s linear infinite',
  },
  error: {
    color: '#fca5a5',
    marginTop: '10px',
    fontSize: '0.9rem',
  },
  results: {
    marginTop: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
  },
  section: {},
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#f1f5f9',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sectionIcon: { fontSize: '1.2rem' },
  sectionCard: {
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    borderRadius: '12px',
    padding: '1.25rem',
  },
  concept: {
    color: '#e2e8f0',
    fontSize: '0.95rem',
    lineHeight: 1.6,
    marginTop: 0,
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '0.75rem',
  },
  tag: {
    background: 'rgba(96, 165, 250, 0.15)',
    color: '#93c5fd',
    padding: '5px 12px',
    borderRadius: '999px',
    fontSize: '0.8rem',
    border: '1px solid rgba(96, 165, 250, 0.3)',
  },
  riskCard: {
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '10px',
  },
  riskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  riskTitle: {
    color: '#f1f5f9',
    fontWeight: 600,
    fontSize: '0.92rem',
  },
  riskBadge: {
    fontSize: '0.72rem',
    fontWeight: 700,
    padding: '2px 10px',
    borderRadius: '999px',
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
  },
  riskReason: {
    color: '#cbd5e1',
    fontSize: '0.88rem',
    margin: 0,
    lineHeight: 1.5,
  },
  suggestionRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px',
    alignItems: 'flex-start',
  },
  suggestionNum: {
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    color: 'white',
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 700,
    flexShrink: 0,
    marginTop: '2px',
  },
  suggestionText: {
    color: '#e2e8f0',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    margin: 0,
  },
  matchCard: {
    background: 'rgba(30, 41, 59, 0.5)',
    border: '1px solid rgba(148, 163, 184, 0.15)',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '10px',
  },
  matchHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
    gap: '10px',
  },
  matchTitle: {
    color: '#f1f5f9',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  matchScore: {
    color: '#c4b5fd',
    fontSize: '0.78rem',
    fontWeight: 700,
    background: 'rgba(139, 92, 246, 0.15)',
    padding: '2px 10px',
    borderRadius: '999px',
    whiteSpace: 'nowrap',
  },
  matchAbstract: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    margin: 0,
    lineHeight: 1.5,
  },
};

export default App;