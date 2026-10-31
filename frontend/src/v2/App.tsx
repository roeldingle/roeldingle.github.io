import { useState } from 'react';
import HeaderBioCard from './components/HeaderBioCard';
import RolesSection from './components/RolesSection';
import TechnicalExpertise from './components/TechnicalExpertise';
import ParallelFeaturedSystems from './components/ParallelFeaturedSystems';
import FloatingAiAssistant from './components/FloatingAiAssistant';
import type { RoleId } from './data/portfolioData';
import './index.css';

export default function App() {
  const [activeRole, setActiveRole] = useState<RoleId | null>(null);
  const [hoveredRole, setHoveredRole] = useState<RoleId | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPromptTrigger, setAiPromptTrigger] = useState('');

  const handleRoleClick = (roleId: RoleId | null) => {
    setActiveRole((prev) => (prev === roleId ? null : roleId));

    if (window.matchMedia('(max-width: 640px)').matches) {
      document.getElementById('v2-technical-expertise')?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
        block: 'start',
      });
    }
  };

  const handleInspectInAi = (projectTitle: string) => {
    setAiPromptTrigger(projectTitle);
    setIsAiOpen(true);
  };

  return (
    <main className="v2-dashboard">
      {/* Top Left: Bio & Identity */}
      <div className="v2-bio">
        <HeaderBioCard />
      </div>

      {/* Top Right: Pop-out Key Roles */}
      <div className="v2-roles">
        <RolesSection
          activeRole={activeRole}
          hoveredRole={hoveredRole}
          onRoleClick={handleRoleClick}
          onRoleHover={setHoveredRole}
        />
      </div>

      {/* Bottom Left: Featured Systems (Parallel Dual Showcase) */}
      <div className="v2-projects">
        <ParallelFeaturedSystems
          activeRole={activeRole}
          hoveredRole={hoveredRole}
          onInspectInAi={handleInspectInAi}
        />
      </div>

      {/* Bottom Right: Technical Expertise Badges */}
      <div className="v2-expertise">
        <TechnicalExpertise
          activeRole={activeRole}
          hoveredRole={hoveredRole}
        />
      </div>

      {/* Floating AI Assistant Chat Application */}
      <FloatingAiAssistant
        isOpen={isAiOpen}
        setIsOpen={setIsAiOpen}
        triggerPrompt={aiPromptTrigger}
      />
    </main>
  );
}
