import type { Project } from '../../types/portfolio';

type ProjectStatusPresentation = {
  label: string;
  background: string;
  color: string;
  border: string;
};

type ParallelFeaturedSystemsProps = {
  projects: Project[];
  highlightedSkillNames: string[];
  onInspectInAi: (projectTitle: string) => void;
};

const projectStatusPresentation: Record<
  Project['status'],
  ProjectStatusPresentation
> = {
  completed: {
    label: 'PRODUCTION READY',
    background: 'rgba(16, 185, 129, 0.1)',
    color: '#059669',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  'in-progress': {
    label: 'IN PROGRESS',
    background: 'rgba(245, 158, 11, 0.1)',
    color: '#d97706',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  planned: {
    label: 'PLANNED',
    background: 'rgba(148, 163, 184, 0.12)',
    color: '#64748b',
    border: 'rgba(148, 163, 184, 0.35)',
  },
};

export default function ParallelFeaturedSystems({
  projects,
  highlightedSkillNames,
  onInspectInAi,
}: ParallelFeaturedSystemsProps) {
  const highlightedSkillNameSet = new Set(
    highlightedSkillNames.map((skillName) => skillName.toLowerCase())
  );

  return (
    <section className="v3-card v3-projects-card" style={{
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
            <span className="v3-heading-mark" style={{ width: '4px', height: '14px', background: '#0f172a', borderRadius: '2px' }}></span>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f172a' }}>
              FEATURED SYSTEMS &amp; ARCHITECTURES
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
            Parallel View // Dual Showcase
          </span>
        </div>

        {/* Parallel Side-by-Side Responsive Cards */}
        <div className="featured-systems-grid">
          {projects.map((project) => {
            const isMatch = project.technologies.some((technology) =>
              highlightedSkillNameSet.has(technology.toLowerCase())
            );
            const badge = projectStatusPresentation[project.status];

            return (
              <article
                key={project.id}
                className={`v3-project-card${isMatch ? ' is-matched' : ''}`}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      {project.title}
                    </h3>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: badge.background,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      letterSpacing: '0.04em'
                    }}>
                        {badge.label}
                    </span>
                  </div>

                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.55, marginBottom: '14px' }}>
                    {project.description}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                    {project.technologies.map((technology) => (
                      <span
                        key={technology}
                        style={{
                          fontSize: '10.5px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          color: '#334155',
                          fontWeight: 500
                        }}
                      >
                        {technology}
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
              </article>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Production &amp; Research Repositories</span>
        <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600 }}>Dockerized / CI Configured</span>
      </div>
    </section>
  );
}
