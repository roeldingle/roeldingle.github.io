import type { PortfolioProfile } from '../types/portfolio';

export const portfolio: PortfolioProfile = {
  name: 'Roel Dingle',
  headline: 'DevOps Automation Engineer | Full Stack Developer | AI Engineering',
  biography:
    'Technology professional with over 16 years of experience in web development, automation, and team leadership.',

  roles: [
    { id: '1', title: 'Senior DevOps Automation Engineer', displayOrder: 1 },
    { id: '2', title: 'Full Stack Web Developer', displayOrder: 2 },
    { id: '3', title: 'AI Engineering Practitioner', displayOrder: 3 },
  ],

  skills: [
    { id: '1', name: 'Python', category: 'Programming' },
    { id: '2', name: 'TypeScript', category: 'Programming' },
    { id: '3', name: 'Playwright', category: 'Test Automation' },
    { id: '4', name: 'Selenium', category: 'Test Automation' },
    { id: '5', name: 'Jenkins', category: 'DevOps' },
    { id: '6', name: 'GitHub Actions', category: 'DevOps' },
    { id: '7', name: 'RAG', category: 'AI Engineering' },
    { id: '8', name: 'Vector Databases', category: 'AI Engineering' },
  ],

  socialLinks: [
    { platform: 'GitHub', url: 'https://github.com/roeldingle' },
    { platform: 'LinkedIn', url: 'https://www.linkedin.com/in/roeldingle/' },
  ],

  projects: [
  {
    id: 'playwright-framework',
    title: 'Playwright Automation Framework',
    description:
      'A scalable end-to-end automation framework using Playwright, TypeScript, Page Object Model, API testing, and GitHub Actions CI.',
    technologies: ['Playwright', 'TypeScript', 'GitHub Actions'],
    status: 'completed',
    displayOrder: 1,
  },
  {
    id: 'riunoa-labs',
    title: 'Riunoa Labs — AI Software Company',
    description:
      'An AI-native software engineering platform exploring autonomous product planning, development, testing, and governance.',
    technologies: ['TypeScript', 'Node.js', 'AI Agents', 'React'],
    status: 'in-progress',
    displayOrder: 2,
  },
  {
    id: 'studyquest-ai',
    title: 'StudyQuest AI',
    description:
      'A gamified AI learning companion designed to transform educational materials into interactive learning experiences.',
    technologies: ['Python', 'Streamlit', 'RAG', 'LLMs'],
    status: 'in-progress',
    displayOrder: 3,
  },
  {
    id: 'portfolio-cms',
    title: 'AI-Powered Portfolio CMS',
    description:
      'A modern developer portfolio with plans for AI-powered assistance and content administration.',
    technologies: ['React', 'TypeScript', 'Vite', 'GitHub Pages'],
    status: 'in-progress',
    displayOrder: 4,
  },
],

  sections: [
    {
      id: 'about',
      title: 'About Me',
      type: 'text',
      content: 'I enjoy building reliable applications, automation frameworks, and AI-powered solutions.',
      isPublished: true,
      displayOrder: 1,
    },
  ],
};