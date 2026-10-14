export interface Skill {
  id: string;
  name: string;
  category: string;
}

export interface Role {
  id: string;
  title: string;
  displayOrder: number;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  githubUrl?: string;
  demoUrl?: string;
  status: 'completed' | 'in-progress' | 'planned';
  displayOrder: number;
}

export interface PortfolioSection {
  id: string;
  title: string;
  type: 'text' | 'projects' | 'skills' | 'custom';
  content: string;
  isPublished: boolean;
  displayOrder: number;
}

export interface PortfolioProfile {
  name: string;
  headline: string;
  biography: string;
  roles: Role[];
  skills: Skill[];
  socialLinks: SocialLink[];
  projects: Project[];
  sections: PortfolioSection[];
}