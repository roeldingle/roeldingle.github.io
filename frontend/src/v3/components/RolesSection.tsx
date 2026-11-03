import type { Role } from '../../types/portfolio';

type RolesSectionProps = {
  roles: Role[];
  activeRoleId: string | null;
  hoveredRoleId: string | null;
  onRoleClick: (roleId: string | null) => void;
  onRoleHover: (roleId: string | null) => void;
};

export default function RolesSection({
  roles,
  activeRoleId,
  hoveredRoleId,
  onRoleClick,
  onRoleHover,
}: RolesSectionProps) {
  return (
    <section className="v3-card v3-roles-card" style={{
      background: '#ffffff',
      borderRadius: '20px',
      border: '1px solid rgba(226, 232, 240, 0.9)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="v3-heading-mark" style={{ width: '4px', height: '14px', background: '#2563eb', borderRadius: '2px' }}></span>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f172a' }}>
              KEY ROLES &amp; SPECIALIZATIONS
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
            Click or hover to isolate stack
          </span>
        </div>

        <div className="roles-grid">
          {roles.map((role, index) => {
            const isSelected = activeRoleId === role.id;
            const isHovered = hoveredRoleId === role.id;

            return (
              <button
                key={role.id}
                type="button"
                className={`v3-role-button${isSelected ? ' is-selected' : ''}${isHovered ? ' is-hovered' : ''}`}
                aria-pressed={isSelected}
                onClick={() => onRoleClick(role.id)}
                onMouseEnter={() => onRoleHover(role.id)}
                onMouseLeave={() => onRoleHover(null)}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    transform: 'rotate(45deg)',
                    background: (isSelected || isHovered) ? '#2563eb' : '#94a3b8',
                    transition: 'background 0.2s ease'
                  }}></span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    color: isSelected ? '#1d4ed8' : '#94a3b8',
                    fontWeight: 600
                  }}>
                    {index + 1}
                  </span>
                </div>

                <div style={{
                  fontSize: '12.5px',
                  fontWeight: (isSelected || isHovered) ? 700 : 600,
                  color: isSelected ? '#1e40af' : '#1e293b',
                  lineHeight: '1.3',
                  marginTop: '8px'
                }}>
                  {role.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          {activeRoleId ? '✨ Showing connected technologies and systems' : '💡 Tip: Hover or click any role above to spotlight its related tech stack'}
        </span>
        {activeRoleId && (
          <button
            type="button"
            onClick={() => onRoleClick(null)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '11px',
              color: '#ef4444',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Reset Filter ✕
          </button>
        )}
      </div>
    </section>
  );
}
