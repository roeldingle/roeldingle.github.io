import type { PortfolioProfile } from '../../types/portfolio';

type HeaderBioCardProps = {
  isLightTheme: boolean;
  onToggleTheme: () => void;
  portfolio: Pick<
    PortfolioProfile,
    'name' | 'headline' | 'biography' | 'socialLinks'
  >;
};

export default function HeaderBioCard({
  isLightTheme,
  onToggleTheme,
  portfolio,
}: HeaderBioCardProps) {
  return (
    <section className="v3-card v3-profile-card" style={{
      background: '#ffffff',
      borderRadius: '20px',
      border: '1px solid rgba(226, 232, 240, 0.9)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div>
        {/* <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}> */}
          {/* <div style={{
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
          </div> */}
          <div className="v3-profile-tools flex items-center justify-between">
            <button
              className="v3-theme-toggle inline-flex items-center"
              type="button"
              onClick={onToggleTheme}
              aria-label={`Switch to ${isLightTheme ? 'dark' : 'light'} theme`}
              aria-pressed={isLightTheme}
              title={`Switch to ${isLightTheme ? 'dark' : 'light'} theme`}
            >
              <span className="v3-theme-icon" aria-hidden="true">
                {isLightTheme ? '☾' : '☼'}
              </span>
              {isLightTheme ? 'LET THERE BE LIGHT \u{2600}' : 'THE DARK RISES \u{1F319}'}
            </button>
            <span style={{ marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#94a3b8' }}>
              V2.4 // 2026
            </span>
          </div>
        {/* </div> */}

        <div className="v3-eyebrow" style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#64748b', fontWeight: 700, marginBottom: '6px' }}>
          PORTFOLIO
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 38px)',
          fontWeight: 800,
          color: '#0f172a',
          letterSpacing: '-0.03em',
          lineHeight: 1.1,
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {portfolio.name}
        </h1>

        <div className="v3-role-title" style={{
          fontSize: 'clamp(14px, 2vw, 16px)',
          fontWeight: 600,
          color: '#2563eb',
          letterSpacing: '-0.01em',
          marginBottom: '14px'
        }}>
          {portfolio.headline}
        </div>

        <p style={{
          fontSize: '13px',
          color: '#475569',
          lineHeight: '1.65',
        }}>
          {portfolio.biography}
        </p>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '16px',
        borderTop: '1px solid #f1f5f9',
        marginTop: '16px',
        fontSize: '12px',
        color: '#64748b',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', gap: '16px', fontWeight: 600 }}>
          {portfolio.socialLinks.map((link) => (
            <a key={link.platform} href={link.url} target="_blank" rel="noreferrer" style={{ color: '#0f172a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>{link.platform}</span> ↗
            </a>
          ))}
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#94a3b8' }}>
          Binangonan, PH
        </span>
      </div>
    </section>
  );
}
