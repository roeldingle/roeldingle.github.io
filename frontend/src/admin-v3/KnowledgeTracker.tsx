import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import ModuleManager from './ModuleManager';
import { getResumeReadingLocation } from '../services/readingProgress';
import type { ResumeReadingTarget } from './resumeReadingTypes';


interface KnowledgeCourse {
  id: string;
  title: string;
  description: string;
  slug: string;
  display_order: number;
  visibility: 'private' | 'published';
}

interface CourseProgress {
  total: number;
  completed: number;
  inProgress: number;
}

interface KnowledgeTrackerProps {
  selectedCourseId?: string | null;
  onBackToCourses?: () => void;
}

const emptyForm = {
  title: '',
  description: '',
  slug: '',
};

export default function KnowledgeTracker({
  selectedCourseId = null,
  onBackToCourses,
}: KnowledgeTrackerProps) {
  const [courses, setCourses] = useState<KnowledgeCourse[]>([]);
  const [courseProgress, setCourseProgress] = useState<
    Record<string, CourseProgress>
  >({});
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<KnowledgeCourse | null>(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [courseSort, setCourseSort] = useState<'order' | 'title-asc' | 'title-desc'>('order');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'private' | 'published'>('all');
  const activeCourse = selectedCourseId
  ? courses.find((course) => course.id === selectedCourseId) ?? null
  : selectedCourse;

  const filteredCourses = courses
    .filter((course) => {
      const search = courseSearch.trim().toLocaleLowerCase();
      const matchesSearch = !search || [course.title, course.description, course.slug]
        .some((value) => value.toLocaleLowerCase().includes(search));
      const matchesVisibility = visibilityFilter === 'all' || course.visibility === visibilityFilter;
      return matchesSearch && matchesVisibility;
    })
    .sort((first, second) => {
      if (courseSort === 'title-asc') return first.title.localeCompare(second.title);
      if (courseSort === 'title-desc') return second.title.localeCompare(first.title);
      return first.display_order - second.display_order;
    });

  
  const [resumeTarget, setResumeTarget] = useState<ResumeReadingTarget | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const clearResumeTarget = useCallback(() => setResumeTarget(null), []);

  async function resumeReading() {
    setResumeLoading(true);
    setError('');

    try {
      const location = await getResumeReadingLocation();

      if (!location) {
        setError('No saved lesson found. Open a lesson first.');
        return;
      }

      setResumeTarget({
        courseId: location.courseId,
        moduleId: location.moduleId,
        lessonId: location.lessonId,
      });

      // Course selection is handled by the existing course state.
      const matchingCourse = courses.find(
        (course) => course.id === location.courseId
      );

      if (matchingCourse) {
        setSelectedCourse(matchingCourse);
      } else {
        setError('The saved course could not be found.');
        setResumeTarget(null);
      }
    } catch (error) {
      console.error('Failed to resume reading:', error);
      setError('Unable to load your saved lesson.');
    } finally {
      setResumeLoading(false);
    }
  }


  async function loadCourseProgress() {
  const { data: modules, error: moduleError } = await supabase
    .from('knowledge_modules')
    .select('id, course_id');

  if (moduleError) {
    setError(moduleError.message);
    return;
  }

  const { data: lessons, error: lessonError } = await supabase
    .from('knowledge_lessons')
    .select('module_id, status');

  if (lessonError) {
    setError(lessonError.message);
    return;
  }

  const progress: Record<string, CourseProgress> = {};
  const moduleToCourse = new Map(
    (modules ?? []).map((module) => [module.id, module.course_id])
  );

  for (const lesson of lessons ?? []) {
    const courseId = moduleToCourse.get(lesson.module_id);

    if (!courseId) continue;

    progress[courseId] ??= {
      total: 0,
      completed: 0,
      inProgress: 0,
    };

    progress[courseId].total++;

    if (lesson.status === 'completed') {
      progress[courseId].completed++;
    }

    if (lesson.status === 'in_progress') {
      progress[courseId].inProgress++;
    }
  }

  setCourseProgress(progress);
}

  async function loadCourses() {
    setLoading(true);

    const { data, error: loadError } = await supabase
      .from('knowledge_courses')
      .select('id, title, description, slug, display_order, visibility')
      .order('display_order', { ascending: true });

    if (loadError) {
      setError(loadError.message);
    } else {
      setCourses((data ?? []) as KnowledgeCourse[]);
      setError('');
    }

    await loadCourseProgress();

    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      const { data, error: loadError } = await supabase
        .from('knowledge_courses')
        .select('id, title, description, slug, display_order, visibility')
        .order('display_order', { ascending: true });

      if (!active) return;

      if (loadError) {
        setError(loadError.message);
      } else {
        setCourses((data ?? []) as KnowledgeCourse[]);
      }

      await loadCourseProgress();

      setLoading(false);
    }

    void initialize();

    return () => {
      active = false;
    };
  }, []);

  function startCreate() {
    resetForm();
    setError('');
    setMessage('');
    setFormOpen(true);
  }

  function startEdit(course: KnowledgeCourse) {
    setEditingId(course.id);
    setForm({
      title: course.title,
      description: course.description,
      slug: course.slug,
    });
    setError('');
    setMessage('');
    setFormOpen(true);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    resetForm();
    setError('');
  }

  async function saveCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const slug = form.slug.trim().toLowerCase();

    if (!title || !slug) {
      setError('Course title and slug are required.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    const payload = {
      title,
      slug,
      description: form.description.trim(),
    };

    const result = editingId
      ? await supabase.from('knowledge_courses').update(payload).eq('id', editingId)
      : await supabase.from('knowledge_courses').insert({
          ...payload,
          visibility: 'private',
          display_order: courses.length,
        });

    if (result.error) {
      setError(result.error.message);
    } else {
      setMessage(editingId ? 'Course updated successfully.' : 'Course created successfully.');
      resetForm();
      setFormOpen(false);
      await loadCourses();
    }

    setSaving(false);
  }

  async function deleteCourse(course: KnowledgeCourse) {
    const confirmed = window.confirm(
      `Delete "${course.title}"? All its modules, lessons, and notes will also be deleted.`
    );

    if (!confirmed) return;

    setError('');
    setMessage('');

    const { error: deleteError } = await supabase
      .from('knowledge_courses')
      .delete()
      .eq('id', course.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setMessage('Course deleted.');
    if (editingId === course.id) resetForm();
    await loadCourses();
  }

  if (activeCourse) {
  return (
    <ModuleManager
      courseId={activeCourse.id}
      courseTitle={activeCourse.title}
      onBack={() => {
        setSelectedCourse(null);
        void loadCourseProgress();
        onBackToCourses?.();
        }}
      resumeTarget={resumeTarget}
      onResumeComplete={clearResumeTarget}
    />
  );
}

  return (
    <div className="rd-overview">
      <div className="rd-welcome">
        <p>
          Organize your private courses, modules, lessons, and learning progress.
        </p>
      </div>

      <div className="rd-knowledge-actions">
        <button
          type="button"
          onClick={() => void resumeReading()}
          disabled={resumeLoading}
        >
          {resumeLoading ? 'Loading...' : '▶ Resume Reading'}
        </button>
      </div>

      {error && <p role="alert" className="rd-knowledge-error">{error}</p>}
      {message && <p role="status" className="rd-knowledge-success">{message}</p>}

      {formOpen && (
        <div className="rd-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <div className="rd-modal-panel" role="dialog" aria-modal="true" aria-labelledby="rd-course-modal-title">
            <div className="rd-modal-heading">
              <h3 id="rd-course-modal-title">{editingId ? 'Edit Course' : 'Create Course'}</h3>
              <button type="button" aria-label="Close form" onClick={closeForm} disabled={saving}>&times;</button>
            </div>
            {error && <p role="alert" className="rd-knowledge-error">{error}</p>}

        <form className="rd-knowledge-form" onSubmit={(event) => void saveCourse(event)}>
          <label>
            Course title
            <input
              required
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="AI Engineering Academy"
            />
          </label>

          <label>
            Slug
            <input
              required
              value={form.slug}
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="ai-engineering-academy"
            />
          </label>

          <label>
            Description
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Practical AI engineering from fundamentals to production."
            />
          </label>

          <div className="rd-knowledge-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Course' : 'Create Course'}
            </button>

            <button type="button" onClick={closeForm} disabled={saving}>Cancel</button>
          </div>
            </form>
          </div>
        </div>
      )
    }


      <div className="rd-info-card">
        <div className="rd-modal-heading">
          <h3>My Courses</h3>
          <button type="button" className="rd-knowledge-add-button" onClick={startCreate}>+ Add Course</button>
        </div>

        <div className="rd-course-toolbar">
          <label>
            <span>Search courses</span>
            <input
              type="search"
              value={courseSearch}
              onChange={(event) => setCourseSearch(event.target.value)}
              placeholder="Search title, description, or slug"
            />
          </label>
          <label>
            <span>Visibility</span>
            <select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value as typeof visibilityFilter)}>
              <option value="all">All courses</option>
              <option value="private">Private</option>
              <option value="published">Published</option>
            </select>
          </label>
          <label>
            <span>Sort by</span>
            <select value={courseSort} onChange={(event) => setCourseSort(event.target.value as typeof courseSort)}>
              <option value="order">Display order</option>
              <option value="title-asc">Title A–Z</option>
              <option value="title-desc">Title Z–A</option>
            </select>
          </label>
          <button type="button" onClick={() => { setCourseSearch(''); setVisibilityFilter('all'); setCourseSort('order'); }}>
            Clear filters
          </button>
        </div>
        {!loading && <p className="rd-course-results" role="status">Showing {filteredCourses.length} of {courses.length} courses</p>}

        {loading ? (
          <p>Loading courses...</p>
        ) : courses.length === 0 ? (
          <p>No courses yet. Select Add Course to create one.</p>
        ) : filteredCourses.length === 0 ? (
          <p>No courses match your search or filters.</p>
        ) : (
          <div className="rd-course-grid">
            {filteredCourses.map((course) => (
              <article className="rd-course-card" key={course.id}>
                <div className="rd-course-card-header">
                  <h4>{course.title}</h4>
                  <span className="rd-course-visibility">
                    {course.visibility}
                  </span>
                </div>

                <p>{course.description}</p>
                <small>{course.slug}</small>

                <div className="rd-course-progress">
                <div className="rd-course-progress-header">
                  <strong>Learning Progress</strong>
                  <span>
                    {courseProgress[course.id]?.total
                      ? Math.round(
                          (courseProgress[course.id].completed /
                            courseProgress[course.id].total) * 100
                        )
                      : 0}%
                  </span>
                </div>

                <progress
                  value={courseProgress[course.id]?.completed ?? 0}
                  max={courseProgress[course.id]?.total || 1}
                />

                <p>
                  {courseProgress[course.id]?.completed ?? 0} of{' '}
                  {courseProgress[course.id]?.total ?? 0} lessons completed
                </p>

                <small>
                  {courseProgress[course.id]?.inProgress ?? 0} in progress
                </small>
              </div>

                <div className="rd-knowledge-actions">
                  <button type="button" onClick={() => setSelectedCourse(course)}>
                    Manage Modules &rarr;
                    </button>
                  <button type="button" onClick={() => startEdit(course)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => void deleteCourse(course)}>
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