import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import LessonManager from './LessonManager';
import type { ResumeReadingTarget } from './resumeReadingTypes';

interface KnowledgeModule {
  id: string;
  course_id: string;
  title: string;
  description: string;
  module_number: number;
  display_order: number;
}

interface ModuleProgress {
  total: number;
  completed: number;
  inProgress: number;
}

interface ModuleManagerProps {
  courseId: string;
  courseTitle: string;
  onBack: () => void;
  resumeTarget?: ResumeReadingTarget | null;
  onResumeComplete?: () => void;
}

const emptyForm = {
  title: '',
  description: '',
  moduleNumber: '0',
};

export default function ModuleManager({
  courseId,
  courseTitle,
  onBack,
  resumeTarget = null,
  onResumeComplete,
}: ModuleManagerProps) {
  const [modules, setModules] = useState<KnowledgeModule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'number' | 'title-asc' | 'title-desc'>('number');
  const [progressFilter, setProgressFilter] = useState<'all' | 'not-started' | 'in-progress' | 'completed'>('all');
  const [moduleProgress, setModuleProgress] = useState<
  Record<string, ModuleProgress>
>({});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedModule, setSelectedModule] = useState<KnowledgeModule | null>(null);

  // Automatically select the module containing the saved lesson.
  useEffect(() => {
    if (!resumeTarget || resumeTarget.courseId !== courseId) return;

    const matchingModule = modules.find(
      (module) => module.id === resumeTarget.moduleId
    );

    if (matchingModule) {
      setSelectedModule(matchingModule);
    }
  }, [resumeTarget, courseId, modules]);

  async function loadModuleProgress(moduleIds: string[]) {
  if (moduleIds.length === 0) {
    setModuleProgress({});
    return;
  }

  const { data, error: loadError } = await supabase
    .from('knowledge_lessons')
    .select('module_id, status')
    .in('module_id', moduleIds);

  if (loadError) {
    setError(loadError.message);
    return;
  }

  const progress: Record<string, ModuleProgress> = {};

  for (const lesson of data ?? []) {
    progress[lesson.module_id] ??= {
      total: 0,
      completed: 0,
      inProgress: 0,
    };

    progress[lesson.module_id].total++;

    if (lesson.status === 'completed') {
      progress[lesson.module_id].completed++;
    }

    if (lesson.status === 'in_progress') {
      progress[lesson.module_id].inProgress++;
    }
  }

  setModuleProgress(progress);
}

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const { data, error: loadError } = await supabase
        .from('knowledge_modules')
        .select('id, course_id, title, description, module_number, display_order')
        .eq('course_id', courseId)
        .order('module_number', { ascending: true });

      if (!active) return;

      if (loadError) {
        setError(loadError.message);
      } else {
        const loadedModules = (data ?? []) as KnowledgeModule[];
        setModules(loadedModules);

        await loadModuleProgress(
          loadedModules.map((module) => module.id)
        );
      }

      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [courseId]);

  async function refreshModules() {
    const { data, error: loadError } = await supabase
      .from('knowledge_modules')
      .select('id, course_id, title, description, module_number, display_order')
      .eq('course_id', courseId)
      .order('module_number', { ascending: true });

    if (loadError) {
      setError(loadError.message);
    } else {
      setModules(data ?? []);
    }
  }

  function startEdit(module: KnowledgeModule) {
    setEditingId(module.id);
    setForm({
      title: module.title,
      description: module.description,
      moduleNumber: String(module.module_number),
    });
    setMessage('');
    setError('');
    setFormOpen(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function startCreate() {
    resetForm();
    setError('');
    setMessage('');
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    resetForm();
    setError('');
  }

  async function saveModule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const moduleNumber = Number(form.moduleNumber);

    if (
      !title ||
      !Number.isInteger(moduleNumber) ||
      moduleNumber < 0
    ) {
      setError('Enter a title and a valid non-negative module number.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      title,
      description: form.description.trim(),
      module_number: moduleNumber,
      display_order: moduleNumber,
    };

    const result = editingId
      ? await supabase
          .from('knowledge_modules')
          .update(payload)
          .eq('id', editingId)
          .eq('course_id', courseId)
      : await supabase.from('knowledge_modules').insert({
          ...payload,
          course_id: courseId,
          visibility: 'private',
        });

    if (result.error) {
      setError(result.error.message);
    } else {
      setMessage(editingId ? 'Module updated.' : 'Module created.');
      setFormOpen(false);
      resetForm();
      await refreshModules();
    }

    setSaving(false);
  }

  async function deleteModule(module: KnowledgeModule) {
    const confirmed = window.confirm(
      `Delete "${module.title}"? All lessons and notes in this module will also be deleted.`
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from('knowledge_modules')
      .delete()
      .eq('id', module.id)
      .eq('course_id', courseId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (editingId === module.id) closeForm();

    setMessage('Module deleted.');
    await refreshModules();
  }

  // Filter and sort the modules already loaded from Supabase.
  const filteredModules = modules
    .filter((module) => {
      const query = searchQuery.trim().toLocaleLowerCase();
      const matchesSearch = !query || [module.title, module.description, String(module.module_number)]
        .some((value) => value.toLocaleLowerCase().includes(query));
      const progress = moduleProgress[module.id];
      const total = progress?.total ?? 0;
      const completed = progress?.completed ?? 0;
      const inProgress = progress?.inProgress ?? 0;
      const matchesProgress = progressFilter === 'all' ||
        (progressFilter === 'not-started' && completed === 0 && inProgress === 0) ||
        (progressFilter === 'in-progress' && (inProgress > 0 || (completed > 0 && completed < total))) ||
        (progressFilter === 'completed' && total > 0 && completed === total);
      return matchesSearch && matchesProgress;
    })
    .sort((first, second) => {
      if (sortOrder === 'title-asc') return first.title.localeCompare(second.title);
      if (sortOrder === 'title-desc') return second.title.localeCompare(first.title);
      return first.module_number - second.module_number || first.display_order - second.display_order;
    });

  const filtersActive = Boolean(searchQuery.trim()) || sortOrder !== 'number' || progressFilter !== 'all';

  if (selectedModule) {
  return (
    <LessonManager
      moduleId={selectedModule.id}
      moduleTitle={`Module ${String(selectedModule.module_number).padStart(2, '0')} — ${selectedModule.title}`}
      resumeLessonId={resumeTarget?.moduleId === selectedModule.id ? resumeTarget.lessonId : null}
      onResumeComplete={onResumeComplete}
      onBack={() => {
        setSelectedModule(null);
        void loadModuleProgress(modules.map((module) => module.id));
      }}
    />
  );
}

  return (
    <div className="rd-overview">
      <button
        type="button"
        className="rd-back-button"
        onClick={onBack}
      >
        &larr; Back to Courses
      </button>

      <div className="rd-welcome">
        <h2>{courseTitle}</h2>
        <p>Manage course modules and their learning sequence.</p>
      </div>

      {error && <p role="alert" className="rd-knowledge-error">{error}</p>}
      {message && <p role="status" className="rd-knowledge-success">{message}</p>}

      {formOpen && (
        <div className="rd-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeForm();
        }}>
          <div className="rd-modal-panel" role="dialog" aria-modal="true" aria-labelledby="rd-module-modal-title">
            <div className="rd-modal-heading">
              <h3 id="rd-module-modal-title">{editingId ? 'Edit Module' : 'Create Module'}</h3>
              <button type="button" aria-label="Close form" onClick={closeForm} disabled={saving}>×</button>
            </div>
            {error && <p role="alert" className="rd-knowledge-error">{error}</p>}
<form className="rd-knowledge-form" onSubmit={(event) => void saveModule(event)}>
          <label>
            Module Number
            <input
              type="number"
              min="0"
              step="1"
              required
              value={form.moduleNumber}
              onChange={(event) =>
                setForm({ ...form, moduleNumber: event.target.value })
              }
            />
          </label>

          <label>
            Module Title
            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="LLM Fundamentals"
            />
          </label>

          <label>
            Description
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm({ ...form, description: event.target.value })
              }
              placeholder="Learning objectives and module overview"
            />
          </label>

          <div className="rd-knowledge-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Module' : 'Create Module'}
            </button>

            <button type="button" onClick={closeForm} disabled={saving}>Cancel</button>
          </div>
        </form>
          </div>
        </div>
      )}

      <div className="rd-info-card">
        <div className="rd-modal-heading">
          <h3>Modules ({modules.length})</h3>
          <button type="button" className="rd-knowledge-add-button" onClick={startCreate}>+ Add Module</button>
        </div>

        <div className="rd-module-toolbar" role="search" aria-label="Filter modules">
          <label>
            <span>Search modules</span>
            <input type="search" value={searchQuery} placeholder="Title, description, or number"
              onChange={(event) => setSearchQuery(event.target.value)} />
          </label>
          <label>
            <span>Progress</span>
            <select value={progressFilter} onChange={(event) => setProgressFilter(event.target.value as typeof progressFilter)}>
              <option value="all">All progress</option>
              <option value="not-started">Not started</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label>
            <span>Sort by</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as typeof sortOrder)}>
              <option value="number">Module number</option>
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
            </select>
          </label>
          <button type="button" disabled={!filtersActive} onClick={() => {
            setSearchQuery('');
            setProgressFilter('all');
            setSortOrder('number');
          }}>Clear filters</button>
        </div>
        {!loading && modules.length > 0 && (
          <p className="rd-module-result-count" role="status">
            Showing {filteredModules.length} of {modules.length} modules
          </p>
        )}

        {loading ? (
          <p>Loading modules...</p>
        ) : modules.length === 0 ? (
          <p>No modules yet. Select Add Module to create Module 00.</p>
        ) : filteredModules.length === 0 ? (
          <p>No modules match your filters.</p>
        ) : (
          <div className="rd-course-grid">
            {filteredModules.map((module) => (
              <article className="rd-course-card" key={module.id}>
                <div className="rd-course-card-header">
                  <h4>
                    Module {String(module.module_number).padStart(2, '0')}
                    {' — '}
                    {module.title}
                  </h4>
                  <span className="rd-course-visibility">Private</span>
                </div>

                <p>{module.description}</p>

                <div className="rd-course-progress">
                  <div className="rd-course-progress-header">
                    <strong>Module Progress</strong>
                    <span>
                      {moduleProgress[module.id]?.total
                        ? Math.round(
                            (moduleProgress[module.id].completed /
                              moduleProgress[module.id].total) * 100
                          )
                        : 0}%
                    </span>
                  </div>

                  <progress
                    value={moduleProgress[module.id]?.completed ?? 0}
                    max={moduleProgress[module.id]?.total || 1}
                  />

                  <p>
                    {moduleProgress[module.id]?.completed ?? 0} of{' '}
                    {moduleProgress[module.id]?.total ?? 0} lessons completed
                  </p>

                  <small>
                    {moduleProgress[module.id]?.inProgress ?? 0} in progress
                  </small>
                </div>

                <div className="rd-knowledge-actions">
                    <button type="button" onClick={() => setSelectedModule(module)}>
                      Manage Lessons &rarr;
                    </button>
                  <button type="button" onClick={() => startEdit(module)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteModule(module)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
