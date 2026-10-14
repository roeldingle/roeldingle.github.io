
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ProjectStatus = 'completed' | 'in-progress' | 'planned';

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

type ProjectForm = Omit<Project, 'id' | 'technologies'> & {
  technologiesText: string;
};

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function loadProjects() {
    const { data, error } = await supabase
      .from('portfolio_projects')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      setMessage(`Load failed: ${error.message}`);
    } else {
      setProjects((data ?? []) as Project[]);
    }

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

      if (error) {
        setMessage(`Load failed: ${error.message}`);
      } else {
        setProjects((data ?? []) as Project[]);
      }

      setLoading(false);
    }

    void initializeProjects();

    return () => {
      active = false;
    };
  }, []);

  function startEditing(project: Project) {
    setEditingId(project.id);
    setForm({
      title: project.title,
      description: project.description,
      technologiesText: project.technologies.join(', '),
      github_url: project.github_url ?? '',
      demo_url: project.demo_url ?? '',
      status: project.status,
      is_published: project.is_published,
      display_order: project.display_order,
    });
    setMessage('');
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyProject);
  }

  async function saveProject(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      technologies: form.technologiesText
        .split(',')
        .map((technology) => technology.trim())
        .filter(Boolean),
      github_url: form.github_url?.trim() || null,
      demo_url: form.demo_url?.trim() || null,
      status: form.status,
      is_published: form.is_published,
      display_order: form.display_order,
    };

    const result = editingId
      ? await supabase
          .from('portfolio_projects')
          .update(payload)
          .eq('id', editingId)
      : await supabase
          .from('portfolio_projects')
          .insert(payload);

    if (result.error) {
      setMessage(`Save failed: ${result.error.message}`);
    } else {
      resetForm();
      await loadProjects();
      setMessage('Project saved successfully.');
    }

    setSaving(false);
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Delete "${project.title}" permanently?`)) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('portfolio_projects')
      .delete()
      .eq('id', project.id);

    if (error) {
      setMessage(`Delete failed: ${error.message}`);
    } else {
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

    if (error) {
      setMessage(`Publish update failed: ${error.message}`);
    } else {
      await loadProjects();
      setMessage(
        project.is_published
          ? 'Project moved to drafts.'
          : 'Project published.'
      );
    }

    setSaving(false);
  }

  if (loading) return <p>Loading projects...</p>;

  return (
    <section className="admin-editor">
      <h2>Portfolio Projects</h2>
      <p>Create, edit, and publish your portfolio projects.</p>

      <form className="admin-profile-form" onSubmit={saveProject}>
        <h3>{editingId ? 'Edit Project' : 'Add New Project'}</h3>

        <label htmlFor="project-title">Project Title</label>
        <input
          id="project-title"
          value={form.title}
          onChange={(event) =>
            setForm({ ...form, title: event.target.value })
          }
          required
        />

        <label htmlFor="project-description">Description</label>
        <textarea
          id="project-description"
          rows={4}
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
        />

        <label htmlFor="project-technologies">
          Technologies (comma-separated)
        </label>
        <input
          id="project-technologies"
          value={form.technologiesText}
          placeholder="React, TypeScript, Supabase"
          onChange={(event) =>
            setForm({ ...form, technologiesText: event.target.value })
          }
        />

        <label htmlFor="project-github">GitHub URL</label>
        <input
          id="project-github"
          type="url"
          value={form.github_url ?? ''}
          onChange={(event) =>
            setForm({ ...form, github_url: event.target.value })
          }
        />

        <label htmlFor="project-demo">Live Demo URL</label>
        <input
          id="project-demo"
          type="url"
          value={form.demo_url ?? ''}
          onChange={(event) =>
            setForm({ ...form, demo_url: event.target.value })
          }
        />

        <label htmlFor="project-status">Status</label>
        <select
          id="project-status"
          value={form.status}
          onChange={(event) =>
            setForm({
              ...form,
              status: event.target.value as ProjectStatus,
            })
          }
        >
          <option value="planned">Planned</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <label htmlFor="project-order">Display Order</label>
        <input
          id="project-order"
          type="number"
          value={form.display_order}
          onChange={(event) =>
            setForm({
              ...form,
              display_order: Number(event.target.value),
            })
          }
        />

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={form.is_published}
            onChange={(event) =>
              setForm({
                ...form,
                is_published: event.target.checked,
              })
            }
          />
          Publish this project
        </label>

        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : editingId ? 'Update Project' : 'Add Project'}
        </button>

        {editingId && (
          <button type="button" onClick={resetForm} disabled={saving}>
            Cancel Editing
          </button>
        )}
      </form>

      <div className="admin-items">
        <h3>Existing Projects ({projects.length})</h3>

        {projects.length === 0 && <p>No projects yet.</p>}

        {projects.map((project) => (
          <article className="admin-item" key={project.id}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <p>
              Status: {project.status} |{' '}
              {project.is_published ? 'Published' : 'Draft'}
            </p>

            <div className="admin-item-actions">
              <button
                type="button"
                disabled={saving}
                onClick={() => startEditing(project)}
              >
                Edit
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void togglePublished(project)}
              >
                {project.is_published ? 'Unpublish' : 'Publish'}
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void deleteProject(project)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      {message && <p role="status">{message}</p>}
    </section>
  );
}
