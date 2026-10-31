import { featuredProjects } from '../data/portfolioData';
import type { RoleId } from '../data/portfolioData';

type ParallelFeaturedSystemsProps = {
  activeRole: RoleId | null;
  hoveredRole: RoleId | null;
  onInspectInAi: (projectTitle: string) => void;
};

export default function ParallelFeaturedSystems({
  activeRole,
  hoveredRole,
  onInspectInAi,
}: ParallelFeaturedSystemsProps) {
  const currentRoleId = activeRole || hoveredRole;

  return (
    <div className="v2-card" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <div>
        <div className="v2-section-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '4px', height: '14px', background: '#0f172a', borderRadius: '2px' }}></span>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f172a' }}>
              FEATURED SYSTEMS &amp; ARCHITECTURES
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
            Parallel View // Dual Showcase
          </span>
        </div>

        {/* Parallel Side-by-Side Cards */}
        <div className="v2-project-grid">
          {featuredProjects.map((project) => {
            const isMatch = currentRoleId === project.linkedRole;
            const badgeBg = project.badgeType === 'amber' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)';
            const badgeColor = project.badgeType === 'amber' ? '#d97706' : '#059669';
            const badgeBorder = project.badgeType === 'amber' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)';

            return (
              <div
                key={project.id}
                style={{
                  background: isMatch ? 'linear-gradient(145deg, #f0f7ff 0%, #ffffff 100%)' : '#f8fafc',
                  border: isMatch ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isMatch ? '0 12px 24px -4px rgba(37, 99, 235, 0.14)' : 'none',
                  minHeight: '190px'
                }}
              >
                <div>
                  <div className="v2-project-heading">
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                      {project.title}
                    </h3>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: badgeBg,
                      color: badgeColor,
                      border: `1px solid ${badgeBorder}`,
                      letterSpacing: '0.04em'
                    }}>
                      {project.badge}
                    </span>
                  </div>

                  <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.6, marginBottom: '14px' }}>
                    {project.description}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                    {project.techs.map((tech) => (
                      <span
                        key={tech}
                        style={{
                          fontSize: '11px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          fontWeight: 500
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => onInspectInAi(project.title)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: '#2563eb',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Query AI about this build →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="v2-card-footer">
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Production &amp; Research Repositories</span>
        <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>Dockerized / CI Configured</span>
      </div>
    </div>
  );
}
