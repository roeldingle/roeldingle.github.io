import { useState } from 'react';
import { skillCategories, rolesData } from '../data/portfolioData';
import type { RoleId } from '../data/portfolioData';

type TechnicalExpertiseProps = {
  activeRole: RoleId | null;
  hoveredRole: RoleId | null;
};

export default function TechnicalExpertise({
  activeRole,
  hoveredRole,
}: TechnicalExpertiseProps) {
  const currentRoleId = activeRole || hoveredRole;
  const currentRole = rolesData.find((r) => r.id === currentRoleId);
  const activeTechTags: readonly string[] = currentRole?.techTags ?? [];
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  return (
    <section id="v2-technical-expertise" className="v2-card" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <div>
        <div className="v2-section-heading" style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '4px', height: '14px', background: '#0284c7', borderRadius: '2px' }}></span>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f172a' }}>
              TECHNICAL EXPERTISE
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
            20+ Technologies
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {skillCategories.map((group) => (
            <div key={group.category}>
              <div style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#94a3b8',
                letterSpacing: '0.08em',
                marginBottom: '8px'
              }}>
                {group.category}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {group.skills.map((skill) => {
                  const isHighlighted =
                    activeTechTags.includes(skill.id) || selectedSkill === skill.id;
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      className={`v2-skill-chip${isHighlighted ? ' is-highlighted' : ''}`}
                      aria-pressed={isHighlighted}
                      onClick={() => setSelectedSkill((previous) =>
                        previous === skill.id ? null : skill.id
                      )}
                    >
                      {skill.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="v2-card-footer" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f8fafc' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Architectures &amp; Toolchains</span>
        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Ready for Production</span>
      </div>
    </section>
  );
}
