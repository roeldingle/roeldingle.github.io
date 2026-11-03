import type { Skill } from '../../types/portfolio';

type SkillCategory = {
  category: string;
  skills: Skill[];
};

type TechnicalExpertiseProps = {
  skillCategories: SkillCategory[];
  highlightedSkillNames: string[];
};

export default function TechnicalExpertise({
  skillCategories,
  highlightedSkillNames,
}: TechnicalExpertiseProps) {
  const highlightedSkillNameSet = new Set(
    highlightedSkillNames.map((skillName) => skillName.toLowerCase())
  );
  const totalSkillCount = skillCategories.reduce(
    (skillCount, category) => skillCount + category.skills.length,
    0
  );

  return (
    <section className="v3-card v3-expertise-card" style={{
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="v3-heading-mark" style={{ width: '4px', height: '14px', background: '#0284c7', borderRadius: '2px' }}></span>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f172a' }}>
              TECHNICAL EXPERTISE
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }}>
            {totalSkillCount} Technologies
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
                  const isHighlighted = highlightedSkillNameSet.has(
                    skill.name.toLowerCase()
                  );
                  return (
                    <span
                      key={skill.id}
                      className={`v3-skill-chip${isHighlighted ? ' is-highlighted' : ''}`}
                    >
                      {skill.name}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f8fafc' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Architectures &amp; Toolchains</span>
        <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>Ready for Production</span>
      </div>
    </section>
  );
}
