export default function HeaderBioCard() {
  return (
    <div className="v2-card" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div>
        <div className="v2-section-heading v2-bio-heading">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#059669',
            letterSpacing: '0.02em'
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} className="pulsing-dot"></span>
            Available for Leadership & AI Architecture
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#94a3b8' }}>
            V2.4 // 2026
          </span>
        </div>

        <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>
          PORTFOLIO
        </div>

        <h1 style={{
          fontSize: '38px',
          fontWeight: 800,
          color: '#0f172a',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Roel Dingle
        </h1>

        <div style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#2563eb',
          letterSpacing: '-0.01em',
          marginBottom: '14px'
        }}>
          Web Technology Leader &amp; AI Engineer
        </div>

        <p style={{
          fontSize: '13px',
          color: '#475569',
          lineHeight: '1.65',
          maxWidth: '92%'
        }}>
          Over 16 years of expertise spanning full-stack web platforms, automated testing frameworks, DevOps orchestration, and enterprise AI engineering. Delivering resilient software architectures while empowering collaborative, high-velocity engineering teams.
        </p>
      </div>

      <div className="v2-card-footer" style={{
        paddingTop: '16px',
        borderTop: '1px solid #f1f5f9',
        marginTop: '16px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', gap: '16px', fontWeight: 600 }}>
          <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: '#0f172a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>GitHub</span> ↗
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" style={{ color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>LinkedIn</span> ↗
          </a>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#94a3b8' }}>
          Binangonan, PH
        </span>
      </div>
    </div>
  );
}
