export const rolesData = [
  { id: 'fullstack', num: '01', title: 'Full Stack Developer', techTags: ['html-css', 'nodejs', 'reactjs', 'typescript', 'nextjs', 'laravel-php'] },
  { id: 'automation', num: '02', title: 'Automation Test Engineer', techTags: ['selenium', 'playwright', 'github-actions', 'jenkins'] },
  { id: 'devops', num: '03', title: 'DevOps & Infrastructure', techTags: ['github-actions', 'jenkins', 'cicd'] },
  { id: 'ai-eng', num: '04', title: 'AI & RAG Engineer', techTags: ['prompt-eng', 'context-mgmt', 'vector-embed', 'rag', 'ollama', 'python'] },
  { id: 'team-lead', num: '05', title: 'Development Team Lead', techTags: ['reactjs', 'typescript', 'cicd', 'github-actions'] },
  { id: 'security', num: '06', title: 'Web Security Analyst', techTags: ['typescript', 'cicd', 'jenkins'] },
  { id: 'operations', num: '07', title: 'Operations Manager', techTags: ['cicd', 'jenkins'] },
  { id: 'godot', num: '08', title: 'Game Dev (Godot)', techTags: ['godot'] },
] as const;

export const skillCategories = [
  {
    category: 'WEB DEVELOPMENT',
    skills: [
      { id: 'html-css', label: 'HTML5/CSS' },
      { id: 'nodejs', label: 'NodeJS' },
      { id: 'reactjs', label: 'ReactJS' },
      { id: 'typescript', label: 'TypeScript' },
      { id: 'nextjs', label: 'NextJS' },
      { id: 'laravel-php', label: 'Laravel/PHP' },
    ],
  },
  {
    category: 'AI ENGINEERING',
    skills: [
      { id: 'prompt-eng', label: 'Prompt Engineering' },
      { id: 'context-mgmt', label: 'Context Management' },
      { id: 'vector-embed', label: 'Vector Embeddings' },
      { id: 'rag', label: 'RAG Architectures' },
      { id: 'ollama', label: 'Ollama / Local LLMs' },
      { id: 'python', label: 'Python 3.12' },
    ],
  },
  {
    category: 'TESTING & DEVOPS',
    skills: [
      { id: 'selenium', label: 'Selenium Java' },
      { id: 'playwright', label: 'Playwright' },
      { id: 'github-actions', label: 'GitHub Actions' },
      { id: 'jenkins', label: 'Jenkins CI/CD' },
      { id: 'cicd', label: 'CI/CD Pipelines' },
      { id: 'godot', label: 'Godot Engine' },
    ],
  },
] as const;

export const featuredProjects = [
  {
    id: 'study-tracker',
    title: 'Study Tracker AI',
    badge: 'IN PROGRESS',
    badgeType: 'amber',
    description: 'Autonomous mastery command center built for engineering upskilling, automated RAG synthesis, and local Ollama model orchestration.',
    techs: ['Python', 'Streamlit', 'RAG', 'Ollama', 'Gemini API'],
    linkedRole: 'ai-eng',
  },
  {
    id: 'test-matrix',
    title: 'Enterprise Test Matrix',
    badge: 'PRODUCTION READY',
    badgeType: 'emerald',
    description: 'High-speed automated testing framework leveraging Playwright TypeScript, custom fixtures, Page Object Models, and parallel CI workflows.',
    techs: ['TypeScript', 'Playwright', 'GitHub Actions', 'Docker'],
    linkedRole: 'automation',
  },
] as const;

export type RoleId = (typeof rolesData)[number]['id'];

export const aiKnowledgeBase = {
  about: "Roel Dingle is a Web Technology Leader and AI Engineer with over 16 years of expertise delivering high-velocity software engineering, automated testing architectures, resilient DevOps pipelines, and intelligent enterprise AI solutions.",
  stack: "Roel's core tech stack spans TypeScript, React, Next.js, Node.js, Python 3.12, Playwright, Docker, CI/CD with GitHub Actions, Ollama local inference, vector stores, and custom RAG agents.",
  ai: "Roel specializes in pragmatic AI engineering: context management, Retrieval-Augmented Generation (RAG), tool calling with Hugging Face smolagents/LangGraph, local model workflows using Ollama, and LLM telemetry.",
  testing: "Roel has extensive experience in automated end-to-end testing, building scalable test suites using Playwright, Selenium Java, custom Page Object Models, and automated CI pipelines.",
  contact: "Roel is available for strategic technology leadership, AI engineering architecture, and consulting engagements.",
} as const;
