import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import LessonImporter from './LessonImporter';
import LessonReader from './LessonReader';

type LessonStatus = 'not_started' | 'in_progress' | 'completed';

interface KnowledgeLesson {
  id: string;
  module_id: string;
  lesson_number: number;
  title: string;
  objectives: string;
  content_markdown: string;
  status: LessonStatus;
  completed_at: string | null;
}

interface LessonManagerProps {
  moduleId: string;
  moduleTitle: string;
  onBack: () => void;
}

const emptyForm = {
  lessonNumber: '1',
  title: '',
  objectives: '',
  content: '',
  status: 'not_started' as LessonStatus,
};

export default function LessonManager({
  moduleId,
  moduleTitle,
  onBack,
}: LessonManagerProps) {
  const [lessons, setLessons] = useState<KnowledgeLesson[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showImporter, setShowImporter] = useState(false);
  const [readingLesson, setReadingLesson] = useState<KnowledgeLesson | null>(null);

  useEffect(() => {
    let active = true;

    async function initialize() {
      const { data, error: loadError } = await supabase
        .from('knowledge_lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('lesson_number');

      if (!active) return;

      if (loadError) setError(loadError.message);
      else setLessons(data ?? []);

      setLoading(false);
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [moduleId]);

  async function refreshLessons() {
    const { data, error: loadError } = await supabase
      .from('knowledge_lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('lesson_number');

    if (loadError) setError(loadError.message);
    else setLessons(data ?? []);
  }

  async function updateLessonStatus(
  lessonId: string,
  newStatus: LessonStatus
) {
  const currentLesson = lessons.find(
    (lesson) => lesson.id === lessonId
  );

  if (!currentLesson || statusSaving) return;

  if (currentLesson.status === newStatus) return;

  setStatusSaving(true);
  setError('');
  setMessage('');

  const completedAt =
    newStatus === 'completed'
      ? currentLesson.completed_at ?? new Date().toISOString()
      : null;

  const { data, error: updateError } = await supabase
    .from('knowledge_lessons')
    .update({
      status: newStatus,
      completed_at: completedAt,
    })
    .eq('id', lessonId)
    .eq('module_id', moduleId)
    .select()
    .single();

  if (updateError) {
    setError(updateError.message);
    setStatusSaving(false);
    return;
  }

  const updatedLesson = data as KnowledgeLesson;

  setLessons((previousLessons) =>
    previousLessons.map((lesson) =>
      lesson.id === lessonId ? updatedLesson : lesson
    )
  );

  setReadingLesson((previousLesson) =>
    previousLesson?.id === lessonId
      ? updatedLesson
      : previousLesson
  );

  setMessage('Lesson progress saved.');
  setStatusSaving(false);
}

  function editLesson(lesson: KnowledgeLesson) {
    setEditingId(lesson.id);
    setForm({
      lessonNumber: String(lesson.lesson_number),
      title: lesson.title,
      objectives: lesson.objectives,
      content: lesson.content_markdown,
      status: lesson.status,
    });
    setError('');
    setMessage('');
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const lessonNumber = Number(form.lessonNumber);

    if (
      !form.title.trim() ||
      !Number.isInteger(lessonNumber) ||
      lessonNumber < 0
    ) {
      setError('Enter a valid lesson number and title.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    const previousLesson = lessons.find((lesson) => lesson.id === editingId);

    const completedAt =
      form.status === 'completed'
        ? previousLesson?.completed_at ?? new Date().toISOString()
        : null;

    const payload = {
      lesson_number: lessonNumber,
      display_order: lessonNumber,
      title: form.title.trim(),
      objectives: form.objectives.trim(),
      content_markdown: form.content,
      status: form.status,
      completed_at: completedAt,
    };

    const result = editingId
      ? await supabase
          .from('knowledge_lessons')
          .update(payload)
          .eq('id', editingId)
          .eq('module_id', moduleId)
      : await supabase.from('knowledge_lessons').insert({
          ...payload,
          module_id: moduleId,
          visibility: 'private',
        });

    if (result.error) {
      setError(result.error.message);
    } else {
      setMessage(editingId ? 'Lesson updated.' : 'Lesson created.');
      resetForm();
      await refreshLessons();
    }

    setSaving(false);
  }

  async function deleteLesson(lesson: KnowledgeLesson) {
    const confirmed = window.confirm(
      `Delete "${lesson.title}"? Its notes will also be deleted.`
    );

    if (!confirmed) return;

    const { error: deleteError } = await supabase
      .from('knowledge_lessons')
      .delete()
      .eq('id', lesson.id)
      .eq('module_id', moduleId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (editingId === lesson.id) resetForm();
    setMessage('Lesson deleted.');
    await refreshLessons();
  }

  const completedCount = lessons.filter(
    (lesson) => lesson.status === 'completed'
  ).length;

   if (readingLesson) {
    const currentIndex = lessons.findIndex(
      (lesson) => lesson.id === readingLesson.id
    );

    const previousLesson =
      currentIndex > 0 ? lessons[currentIndex - 1] : null;

    const nextLesson =
      currentIndex >= 0 && currentIndex < lessons.length - 1
        ? lessons[currentIndex + 1]
        : null;

    return (
      <LessonReader
        lesson={readingLesson}
        previousLesson={previousLesson}
        nextLesson={nextLesson}
        onNavigate={(lesson) => {
          const selectedLesson = lessons.find((item) => item.id === lesson.id);
          if (selectedLesson) setReadingLesson(selectedLesson);
        }}
        onBack={() => setReadingLesson(null)}
        onEdit={() => {
          editLesson(readingLesson);
          setReadingLesson(null);
        }}
        onStatusChange={updateLessonStatus}
        statusSaving={statusSaving}
      />
    );
  }

  return (
    <div className="rd-overview">
      <button className="rd-back-button" type="button" onClick={onBack}>
        ← Back to Modules
      </button>

      <div className="rd-welcome">
        <h2>{moduleTitle}</h2>
        <p>Manage lessons, learning content, and progress.</p>
      </div>

      <div className="rd-info-card">
        <h3>Learning Progress</h3>
        <p>
          {completedCount} of {lessons.length} lessons completed
        </p>
        <progress
          value={completedCount}
          max={Math.max(lessons.length, 1)}
          style={{ width: '100%' }}
        />
      </div>
      
      <div className="rd-knowledge-actions">
        <button
          type="button"
          onClick={() => setShowImporter((current) => !current)}
        >
          {showImporter ? 'Hide Importer' : 'Import Lessons'}
        </button>
      </div>

      {showImporter && (
        <LessonImporter
          moduleId={moduleId}
          onImported={refreshLessons}
          onClose={() => setShowImporter(false)}
        />
      )}

      {error && <p className="rd-knowledge-error" role="alert">{error}</p>}
      {message && <p className="rd-knowledge-success" role="status">{message}</p>}

      <div className="rd-info-card">
        <h3>{editingId ? 'Edit Lesson' : 'Create Lesson'}</h3>

        <form
          className="rd-knowledge-form"
          onSubmit={(event) => void saveLesson(event)}
        >
          <label>
            Lesson Number
            <input
              type="number"
              min="0"
              step="1"
              required
              value={form.lessonNumber}
              onChange={(event) =>
                setForm({ ...form, lessonNumber: event.target.value })
              }
            />
          </label>

          <label>
            Lesson Title
            <input
              required
              value={form.title}
              onChange={(event) =>
                setForm({ ...form, title: event.target.value })
              }
              placeholder="Introduction to RAG"
            />
          </label>

          <label>
            Learning Objectives
            <textarea
              rows={3}
              value={form.objectives}
              onChange={(event) =>
                setForm({ ...form, objectives: event.target.value })
              }
              placeholder="What should you understand after this lesson?"
            />
          </label>

          <label>
            Lesson Content (Markdown)
            <textarea
              rows={12}
              value={form.content}
              onChange={(event) =>
                setForm({ ...form, content: event.target.value })
              }
              placeholder="# Introduction&#10;&#10;Write your lesson here..."
            />
          </label>

          <label>
            Progress
            <select
              value={form.status}
              onChange={(event) =>
                setForm({
                  ...form,
                  status: event.target.value as LessonStatus,
                })
              }
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>

          <div className="rd-knowledge-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Lesson' : 'Create Lesson'}
            </button>

            {editingId && (
              <button type="button" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rd-info-card">
        <h3>Lessons ({lessons.length})</h3>

        {loading ? (
          <p>Loading lessons...</p>
        ) : lessons.length === 0 ? (
          <p>No lessons yet. Create your first lesson above.</p>
        ) : (
          <div className="rd-course-grid">
            {lessons.map((lesson) => (
              <article className="rd-course-card" key={lesson.id}>
                <div className="rd-course-card-header">
                  <h4>
                    Lesson {String(lesson.lesson_number).padStart(2, '0')}
                    {' — '}
                    {lesson.title}
                  </h4>
                  <span className="rd-course-visibility">
                    {lesson.status.replace('_', ' ')}
                  </span>
                </div>

                <p>{lesson.objectives}</p>

                <div className="rd-knowledge-actions">
                  <button
                    type="button"
                    onClick={() => setReadingLesson(lesson)}
                  >
                    Read Lesson →
                  </button>
                  <button type="button" onClick={() => editLesson(lesson)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteLesson(lesson)}
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
