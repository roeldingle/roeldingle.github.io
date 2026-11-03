import { useEffect, useState } from 'react';
import type { Skill } from '../types/portfolio';
import { portfolio as fallbackPortfolio } from '../data/portfolio';
import { getPortfolio } from '../lib/portfolio-service';
import HeaderBioCard from './components/HeaderBioCard';
import RolesSection from './components/RolesSection';
import TechnicalExpertise from './components/TechnicalExpertise';
import ParallelFeaturedSystems from './components/ParallelFeaturedSystems';
import FloatingAiAssistant from './components/FloatingAiAssistant';
import './index.css';

// The shared portfolio model stores skills and roles independently. These
// presentation aliases preserve v3's role-to-stack highlighting until the
// portfolio service provides an explicit role/skill relationship. Values use
// the skill names stored in the portfolio, and are compared case-insensitively.
const relatedSkillNamesByRoleTitle: Record<string, string[]> = {
  'full stack developer': [
    'HTML', 'NodeJs', 'ReactJS', 'Typescript', 'NextJS', 'Laravel', 'PHP',
    'CSS', 'Javascript', 'C#', 'Github Actions', 'CI CD'
  ],
  'full stack web developer': [
    'HTML', 'NodeJs', 'ReactJS', 'Typescript', 'NextJS', 'Laravel', 'PHP',
    'CSS', 'Javascript',
  ],
  'automation test engineer': [
    'Selenium', 'Selenium Java', 'Playwright', 'Github Actions', 'Jenkins', 'CI CD', 'JAVA', 'Typescript', 'Javascript', 'Katalon',
  ],
  'automation tester': [
    'Selenium', 'Selenium Java', 'Playwright', 'Github Actions', 'Jenkins', 'CI CD', 'JAVA', 'Typescript', 'Javascript', 'Katalon',
  ],
  'devops & infrastructure': ['Github Actions', 'Jenkins', 'CI CD'],
  'ai & rag engineer': [
    'Prompt Engineering', 'Context Management', 'Embedding',
    'Vector Database', 'RAG', 'Ollama', 'Python', 'Github Actions', 'CI CD'
  ],
  'ai engineering practitioner': [
    'Prompt Engineering', 'Context Management', 'Embedding',
    'Vector Database', 'RAG', 'Ollama', 'Python', 'MCP', 'Typescript', 'Javascript', 'Github Actions', 'CI CD'
  ],
  'ai engineer': [
    'Prompt Engineering', 'Context Management', 'Embedding',
    'Vector Database', 'RAG', 'Python', 'MCP', 'Typescript', 'Javascript', 'Github Actions', 'CI CD'
  ],
  'dev team lead': ['ReactJS', 'Typescript', 'Github Actions', 'CI CD'],
  'dev team leader': [
    'HTML', 'NodeJs', 'ReactJS', 'Typescript', 'NextJS', 'Laravel', 'PHP',
    'CSS', 'Javascript', 'C#', 'Github Actions', 'CI CD'
  ],
  'marketing cloud developer': ['HTML', 'Javascript', 'Typescript', 'CSS'],
  'web security analyst': ['HTML', 'CSS', 'Javascript', 'Github Actions', 'CI CD', 'C#'],
  'php programmer': ['HTML', 'CSS', 'Javascript', 'PHP', 'Laravel', 'Github Actions'],
  'operations manager': ['Jenkins', 'Github Actions', 'CI CD'],
  'game dev (godot)': ['Godot Engine'],
};

type SkillCategory = {
  category: string;
  skills: Skill[];
};

/**
 * App is the v3 data boundary: it owns loading and selection state, derives
 * panel-ready collections, and passes those values to presentational panels.
 */
export default function App() {
  const [portfolio, setPortfolio] = useState(fallbackPortfolio);
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);
  const [hoveredRoleId, setHoveredRoleId] = useState<string | null>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiPromptTrigger, setAiPromptTrigger] = useState('');
  const [isLightTheme, setIsLightTheme] = useState(false);

  // Keep the dashboard usable immediately with local fallback content, then
  // replace it with the service result when the asynchronous request succeeds.
  useEffect(() => {
    let isComponentMounted = true;

    async function loadPortfolioData() {
      try {
        const latestPortfolio = await getPortfolio();

        if (isComponentMounted) {
          setPortfolio(latestPortfolio);
        }
      } catch (error) {
        console.error('Portfolio loading failed:', error);
      }
    }

    void loadPortfolioData();

    return () => {
      isComponentMounted = false;
    };
  }, []);

  // Keep theme synchronization separate from data loading so toggling the
  // theme never causes another portfolio request.
  useEffect(() => {
    document.documentElement.dataset.v3Theme = isLightTheme ? 'light' : 'dark';

    return () => {
      delete document.documentElement.dataset.v3Theme;
    };
  }, [isLightTheme]);

  // Each panel receives its own sorted or grouped view of the shared profile.
  const sortedRoles = [...portfolio.roles].sort(
    (firstRole, secondRole) => firstRole.displayOrder - secondRole.displayOrder
  );
  const sortedProjects = [...portfolio.projects].sort(
    (firstProject, secondProject) =>
      firstProject.displayOrder - secondProject.displayOrder
  );
  const featuredProjects = sortedProjects.slice(0, 2);

  const skillsByCategory = portfolio.skills.reduce<Record<string, Skill[]>>(
    (groups, skill) => {
      const currentCategorySkills = groups[skill.category] ?? [];
      groups[skill.category] = [...currentCategorySkills, skill];
      return groups;
    },
    {}
  );
  const skillCategories: SkillCategory[] = Object.entries(skillsByCategory).map(
    ([category, skills]) => ({ category, skills })
  );

  const selectedRoleId = activeRoleId ?? hoveredRoleId;
  const selectedRole = sortedRoles.find((role) => role.id === selectedRoleId);
  const selectedRoleTitle = selectedRole?.title.trim().toLowerCase() ?? '';
  const highlightedSkillNames =
    relatedSkillNamesByRoleTitle[selectedRoleTitle] ?? [];

  function handleRoleClick(roleId: string | null) {
    setActiveRoleId((currentActiveRoleId) =>
      currentActiveRoleId === roleId ? null : roleId
    );
  }

  function handleInspectInAi(projectTitle: string) {
    setAiPromptTrigger(projectTitle);
    setIsAiOpen(true);
  }

  return (
    <main className="bento-container">
      {/* Profile content comes directly from the shared portfolio record. */}
      <div className="v3-profile">
        <HeaderBioCard
          portfolio={portfolio}
          isLightTheme={isLightTheme}
          onToggleTheme={() => setIsLightTheme((currentTheme) => !currentTheme)}
        />
      </div>

      {/* Role cards are sorted here so their order is consistent with the CMS. */}
      <div className="v3-roles">
        <RolesSection
          roles={sortedRoles}
          activeRoleId={activeRoleId}
          hoveredRoleId={hoveredRoleId}
          onRoleClick={handleRoleClick}
          onRoleHover={setHoveredRoleId}
        />
      </div>

      {/* Skill groups and role highlights are derived from the same profile. */}
      <div className="v3-expertise">
        <TechnicalExpertise
          skillCategories={skillCategories}
          highlightedSkillNames={highlightedSkillNames}
        />
      </div>

      {/* The compact dashboard intentionally showcases the first two projects. */}
      <div className="v3-projects">
        <ParallelFeaturedSystems
          projects={featuredProjects}
          highlightedSkillNames={highlightedSkillNames}
          onInspectInAi={handleInspectInAi}
        />
      </div>

      <FloatingAiAssistant
        isOpen={isAiOpen}
        setIsOpen={setIsAiOpen}
        triggerPrompt={aiPromptTrigger}
        portfolio={portfolio}
      />
    </main>
  );
}
