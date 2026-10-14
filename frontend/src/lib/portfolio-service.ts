
import { portfolio } from '../data/portfolio';
import { supabase } from './supabase';
import type { PortfolioProfile } from '../types/portfolio';

export async function getPortfolio(): Promise<PortfolioProfile> {
  const [profileResult, rolesResult, skillsResult, projectsResult] =
    await Promise.all([
      supabase
        .from('portfolio_profile')
        .select('name, headline, biography')
        .eq('id', 1)
        .maybeSingle(),

      supabase
        .from('portfolio_roles')
        .select('id, title, display_order')
        .order('display_order', { ascending: true }),

      supabase
        .from('portfolio_skills')
        .select('id, name, category, display_order')
        .order('display_order', { ascending: true }),

      supabase
        .from('portfolio_projects')
        .select(
          'id, title, description, technologies, github_url, demo_url, status, display_order'
        )
        .eq('is_published', true)
        .order('display_order', { ascending: true }),
    ]);

  if (profileResult.error) {
    console.error('Profile load failed:', profileResult.error.message);
  }

  if (rolesResult.error) {
    console.error('Roles load failed:', rolesResult.error.message);
  }

  if (skillsResult.error) {
    console.error('Skills load failed:', skillsResult.error.message);
  }

  if (projectsResult.error) {
    console.error('Projects load failed:', projectsResult.error.message);
  }

  const profile = profileResult.data;

  const roles = rolesResult.error
    ? portfolio.roles
    : (rolesResult.data ?? []).map((role) => ({
        id: role.id,
        title: role.title,
        displayOrder: role.display_order,
      }));

  const skills = skillsResult.error
    ? portfolio.skills
    : (skillsResult.data ?? []).map((skill) => ({
        id: skill.id,
        name: skill.name,
        category: skill.category,
      }));

  const projects = projectsResult.error
    ? []
    : (projectsResult.data ?? []).map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description,
        technologies: project.technologies,
        githubUrl: project.github_url ?? undefined,
        demoUrl: project.demo_url ?? undefined,
        status: project.status as 'completed' | 'in-progress' | 'planned',
        displayOrder: project.display_order,
      }));

  return {
    ...portfolio,
    name: profile?.name ?? portfolio.name,
    headline: profile?.headline ?? portfolio.headline,
    biography: profile?.biography ?? portfolio.biography,
    roles,
    skills,
    projects,
  };
}
