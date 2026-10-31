import { rolesData } from '../data/portfolioData';
import type { RoleId } from '../data/portfolioData';

type RolesSectionProps = {
  activeRole: RoleId | null;
  hoveredRole: RoleId | null;
  onRoleClick: (roleId: RoleId | null) => void;
  onRoleHover: (roleId: RoleId | null) => void;
};

export default function RolesSection({
  activeRole,
  hoveredRole,
  onRoleClick,
  onRoleHover,
}: RolesSectionProps) {
  return (
    <div className="v2-card" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <div>
        <div className="v2-section-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '4px', height: '14px', background: '#2563eb', borderRadius: '2px' }}></span>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f172a' }}>
              KEY ROLES &amp; SPECIALIZATIONS
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
            Click or hover to isolate stack
          </span>
        </div>

        <div className="v2-roles-grid">
          {rolesData.map((role) => {
            const isSelected = activeRole === role.id;
            const isHovered = hoveredRole === role.id;

            return (
              <button
                key={role.id}
                type="button"
                className={`v2-role-button${isSelected ? ' is-selected' : ''}${isHovered ? ' is-hovered' : ''}`}
                aria-pressed={isSelected}
                onClick={() => onRoleClick(role.id)}
                onMouseEnter={() => onRoleHover(role.id)}
                onMouseLeave={() => onRoleHover(null)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                    {role.num}
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

      <div className="v2-card-footer">
        <span style={{ fontSize: '11px', color: '#64748b' }}>
          {activeRole ? '✨ Showing connected technologies and systems' : '💡 Tip: Hover or click any role above to spotlight its related tech stack'}
        </span>
        {activeRole && (
          <button
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
    </div>
  );
}
