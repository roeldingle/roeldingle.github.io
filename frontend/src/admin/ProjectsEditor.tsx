import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type ProjectStatus = 'completed' | 'in-progress' | 'planned';
type PublicationFilter = 'all' | 'published' | 'draft';
type StatusFilter = 'all' | ProjectStatus;
type SortOption = 'display_order' | 'title_asc' | 'title_desc';

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  github_url: string | null;
  demo_url: string | null;
  status: ProjectStatus;
  is_published: boolean;
  display_order: number;
}

type ProjectForm = Omit<Project, 'id' | 'technologies'> & { technologiesText: string };

const emptyProject: ProjectForm = {
  title: '',
  description: '',
  technologiesText: '',
  github_url: '',
  demo_url: '',
  status: 'planned',
  is_published: false,
  display_order: 0,
};

export default function ProjectsEditor() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState<ProjectForm>(emptyProject);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [publicationFilter, setPublicationFilter] = useState<PublicationFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('display_order');

  const filteredProjects = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    const matches = projects.filter((project) => {
      const searchableText = [project.title, project.description, ...(project.technologies ?? [])]
        .join(' ')
        .toLocaleLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const matchesPublication = publicationFilter === 'all' ||
        (publicationFilter === 'published' ? project.is_published : !project.is_published);
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesPublication && matchesStatus;
    });

    return matches.sort((first, second) => {
      if (sortOption === 'title_asc') return first.title.localeCompare(second.title);
      if (sortOption === 'title_desc') return second.title.localeCompare(first.title);
      return first.display_order - second.display_order || first.title.localeCompare(second.title);
    });
  }, [projects, searchTerm, publicationFilter, statusFilter, sortOption]);

  const filtersActive = Boolean(searchTerm.trim()) || publicationFilter !== 'all' ||
    statusFilter !== 'all' || sortOption !== 'display_order';

  async function loadProjects() {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) setMessage(`Load failed: ${error.message}`);
    else setProjects((data ?? []) as Project[]);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function initializeProjects() {
      const { data, error } = await supabase
        .from('portfolio_projects')
        .select('*')
        .order('display_order', { ascending: true });

      if (!active) return;
      if (error) setMessage(`Load failed: ${error.message}`);
      else setProjects((data ?? []) as Project[]);
      setLoading(false);
    }

    void initializeProjects();
    return () => { active = false; };
  }, []);

  function clearFilters() {
    setSearchTerm('');
    setPublicationFilter('all');
    setStatusFilter('all');
    setSortOption('display_order');
  }

  function startCreating() {
    setEditingId(null);
    setForm({ ...emptyProject, display_order: Math.max(-1, ...projects.map((project) => project.display_order)) + 1 });
    setMessage('');
    setFormError('');
    setFormOpen(true);
  }

  function startEditing(project: Project) {
    setEditingId(project.id);
    setForm({
      title: project.title,
      description: project.description,
      technologiesText: (project.technologies ?? []).join(', '),
      github_url: project.github_url ?? '',
      demo_url: project.demo_url ?? '',
      status: project.status,
      is_published: project.is_published,
      display_order: project.display_order,
    });
    setMessage('');
    setFormError('');
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyProject });
    setFormError('');
  }

  async function saveProject(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      technologies: form.technologiesText.split(',').map((technology) => technology.trim()).filter(Boolean),
      github_url: form.github_url?.trim() || null,
      demo_url: form.demo_url?.trim() || null,
      status: form.status,
      is_published: form.is_published,
      display_order: form.display_order,
    };

    const result = editingId
      ? await supabase.from('portfolio_projects').update(payload).eq('id', editingId)
      : await supabase.from('portfolio_projects').insert(payload);

    if (result.error) {
      setFormError(`Save failed: ${result.error.message}`);
    } else {
      setFormOpen(false);
      setEditingId(null);
      setForm({ ...emptyProject });
      await loadProjects();
      setMessage('Project saved successfully.');
    }
    setSaving(false);
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Delete "${project.title}" permanently?`)) return;
    setSaving(true);
    setMessage('');

    const { error } = await supabase.from('portfolio_projects').delete().eq('id', project.id);
    if (error) setMessage(`Delete failed: ${error.message}`);
    else {
      await loadProjects();
      setMessage('Project deleted.');
    }
    setSaving(false);
  }

  async function togglePublished(project: Project) {
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('portfolio_projects')
      .update({ is_published: !project.is_published })
      .eq('id', project.id);

    if (error) setMessage(`Publish update failed: ${error.message}`);
    else {
      await loadProjects();
      setMessage(project.is_published ? 'Project moved to drafts.' : 'Project published.');
    }
    setSaving(false);
  }

  if (loading) return <p>Loading projects...</p>;

  return (
    <section className="admin-editor">
      <div className="rd-modal-heading">
        <div>
          <h3>Existing Projects ({projects.length})</h3>
          {projects.length === 0 && <p>No projects yet. Select Add Project to get started.</p>}
        </div>
        <button type="button" className="rd-knowledge-add-button" onClick={startCreating} disabled={saving}>
          + Add Project
        </button>
      </div>

      {message && <p role="status">{message}</p>}

      {projects.length > 0 && (
        <div className="rd-project-toolbar" role="search" aria-label="Project search and filters">
          <div className="rd-project-search">
            <label htmlFor="rd-project-search">Search projects</label>
            <input
              id="rd-project-search"
              type="search"
              placeholder="Search title, description, technology..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="rd-project-filter">
            <label htmlFor="rd-project-publication">Publication</label>
            <select id="rd-project-publication" value={publicationFilter} onChange={(event) => setPublicationFilter(event.target.value as PublicationFilter)}>
              <option value="all">All publications</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="rd-project-filter">
            <label htmlFor="rd-project-status">Status</label>
            <select id="rd-project-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="all">All statuses</option>
              <option value="planned">Planned</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="rd-project-filter">
            <label htmlFor="rd-project-sort">Sort by</label>
            <select id="rd-project-sort" value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)}>
              <option value="display_order">Display order</option>
              <option value="title_asc">Title A–Z</option>
              <option value="title_desc">Title Z–A</option>
            </select>
          </div>
          <div className="rd-project-filter-summary">
            <span>Showing {filteredProjects.length} of {projects.length} projects</span>
            {filtersActive && <button type="button" onClick={clearFilters}>Clear filters</button>}
          </div>
        </div>
      )}

      <div className="admin-items">
        {filteredProjects.map((project) => (
          <article className="admin-item" key={project.id}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <p>Status: {project.status} | {project.is_published ? 'Published' : 'Draft'}</p>
            <div className="admin-item-actions">
              <button type="button" disabled={saving} onClick={() => startEditing(project)}>Edit</button>
              <button type="button" disabled={saving} onClick={() => void togglePublished(project)}>
                {project.is_published ? 'Unpublish' : 'Publish'}
              </button>
              <button type="button" disabled={saving} onClick={() => void deleteProject(project)}>Delete</button>
            </div>
          </article>
        ))}
        {projects.length > 0 && filteredProjects.length === 0 && (
          <div className="rd-project-empty">
            <p>No projects match your search or filters.</p>
            <button type="button" onClick={clearFilters}>Clear filters</button>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="rd-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeForm();
        }}>
          <div className="rd-modal-panel rd-project-modal-panel" role="dialog" aria-modal="true" aria-labelledby="rd-project-modal-title">
            <div className="rd-modal-heading">
              <h3 id="rd-project-modal-title">{editingId ? 'Edit Project' : 'Add New Project'}</h3>
              <button type="button" aria-label="Close project editor" onClick={closeForm} disabled={saving}>&times;</button>
            </div>
            {formError && <p role="alert" className="rd-knowledge-error">{formError}</p>}
            <form className="admin-profile-form" onSubmit={saveProject}>
              <label htmlFor="project-title">Project Title</label>
              <input id="project-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
              <label htmlFor="project-description">Description</label>
              <textarea id="project-description" rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              <label htmlFor="project-technologies">Technologies (comma-separated)</label>
              <input id="project-technologies" value={form.technologiesText} placeholder="React, TypeScript, Supabase" onChange={(event) => setForm({ ...form, technologiesText: event.target.value })} />
              <label htmlFor="project-github">GitHub URL</label>
              <input id="project-github" type="url" value={form.github_url ?? ''} onChange={(event) => setForm({ ...form, github_url: event.target.value })} />
              <label htmlFor="project-demo">Live Demo URL</label>
              <input id="project-demo" type="url" value={form.demo_url ?? ''} onChange={(event) => setForm({ ...form, demo_url: event.target.value })} />
              <label htmlFor="project-status">Status</label>
              <select id="project-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ProjectStatus })}>
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <label htmlFor="project-order">Display Order</label>
              <input id="project-order" type="number" value={form.display_order} onChange={(event) => setForm({ ...form, display_order: Number(event.target.value) })} />
              <label className="admin-checkbox">
                <input type="checkbox" checked={form.is_published} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} />
                Publish this project
              </label>
              <div className="rd-knowledge-actions">
                <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update Project' : 'Add Project'}</button>
                <button type="button" onClick={closeForm} disabled={saving}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
