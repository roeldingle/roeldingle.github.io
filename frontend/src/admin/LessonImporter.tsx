
import { useState } from 'react';
import { supabase } from '../lib/supabase';

type LessonStatus = 'not_started' | 'in_progress' | 'completed';

interface ImportLesson {
  lesson_number: number;
  title: string;
  objectives: string;
  content_markdown: string;
  status: LessonStatus;
}

interface LessonImporterProps {
  moduleId: string;
  onImported: () => Promise<void>;
  onClose: () => void;
}

const exampleJson = JSON.stringify([
  {
    lesson_number: 2,
    title: 'Working with Git',
    objectives: 'Understand Git repositories, commits, and version control.',
    content_markdown: '# Working with Git\n\nLearn how to track changes using Git.',
    status: 'not_started',
  },
], null, 2);

export default function LessonImporter({
  moduleId,
  onImported,
  onClose,
}: LessonImporterProps) {
  const [input, setInput] = useState(exampleJson);
  const [preview, setPreview] = useState<ImportLesson[]>([]);
  const [duplicates, setDuplicates] = useState<number[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  function isValidLesson(value: unknown): value is ImportLesson {
    if (!value || typeof value !== 'object') return false;

    const lesson = value as Record<string, unknown>;

    return (
      Number.isInteger(lesson.lesson_number) &&
      Number(lesson.lesson_number) >= 0 &&
      typeof lesson.title === 'string' &&
      lesson.title.trim().length > 0 &&
      typeof lesson.objectives === 'string' &&
      typeof lesson.content_markdown === 'string' &&
      ['not_started', 'in_progress', 'completed'].includes(String(lesson.status))
    );
  }

  async function validateImport() {
    setBusy(true);
    setError('');
    setMessage('');
    setPreview([]);
    setDuplicates([]);

    try {
      const parsed: unknown = JSON.parse(input);

      if (!Array.isArray(parsed) || !parsed.every(isValidLesson)) {
        throw new Error('Invalid lesson JSON format.');
      }

      const lessons = parsed as ImportLesson[];
      if (lessons.length === 0) throw new Error('No lessons found.');

      const numbers = lessons.map((lesson) => lesson.lesson_number);

      if (new Set(numbers).size !== numbers.length) {
        throw new Error('Duplicate lesson numbers in import.');
      }

      const { data, error: loadError } = await supabase
        .from('knowledge_lessons')
        .select('lesson_number')
        .eq('module_id', moduleId);

      if (loadError) throw loadError;

      const existingNumbers = new Set(
        (data ?? []).map((lesson) => lesson.lesson_number)
      );

      setDuplicates(numbers.filter((number) => existingNumbers.has(number)));
      setPreview(lessons);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Validation failed.');
    } finally {
      setBusy(false);
    }
  }

  async function importLessons() {
    if (preview.length === 0 || busy) return;

    setBusy(true);
    setError('');
    setMessage('');

    try {
      // Recheck duplicates immediately before insertion.
      const { data, error: loadError } = await supabase
        .from('knowledge_lessons')
        .select('lesson_number')
        .eq('module_id', moduleId);

      if (loadError) throw loadError;

      const existingNumbers = new Set(
        (data ?? []).map((lesson) => lesson.lesson_number)
      );

      const newLessons = preview
        .filter((lesson) => !existingNumbers.has(lesson.lesson_number))
        .map((lesson) => ({
          ...lesson,
          module_id: moduleId,
          display_order: lesson.lesson_number,
          visibility: 'private',
          completed_at: null,
        }));

      // Imported lessons are not automatically marked completed.
      // Completion should be verified against historical evidence.
      const safeLessons = newLessons.map((lesson) => ({
        ...lesson,
        status: lesson.status === 'completed' ? 'in_progress' : lesson.status,
      }));

      if (safeLessons.length === 0) {
        setMessage('All lessons already exist. Nothing to import.');
        setPreview([]);
        return;
      }

      const { error: insertError } = await supabase
        .from('knowledge_lessons')
        .upsert(safeLessons, {
          onConflict: 'module_id,lesson_number',
          ignoreDuplicates: true,
        });

      if (insertError) throw insertError;

      await onImported();

      setMessage('Import completed. Existing lessons were preserved.');
      setPreview([]);
      setDuplicates([]);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Import failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rd-info-card">
      <div className="rd-course-card-header">
        <h3>Bulk Lesson Importer</h3>
        <button
        type="button"
        className="rd-import-close"
        onClick={onClose}
        >
        ✕ Close
        </button>
      </div>

      <p>Paste JSON lesson data for this module.</p>

      {error && <p className="rd-knowledge-error" role="alert">{error}</p>}
      {message && <p className="rd-knowledge-success" role="status">{message}</p>}

      <textarea
        className="rd-import-textarea"
        rows={14}
        spellCheck={false}
        value={input}
        onChange={(event) => {
          setInput(event.target.value);
          setPreview([]);
          setDuplicates([]);
        }}
      />

      <div className="rd-knowledge-actions">
        <button type="button" disabled={busy} onClick={() => void validateImport()}>
          {busy ? 'Processing...' : 'Validate & Preview'}
        </button>
      </div>

      {preview.length > 0 && (
        <div className="rd-import-preview">
          <h4>Import Preview</h4>

          {preview.map((lesson) => (
            <div className="rd-import-preview-item" key={lesson.lesson_number}>
              <strong>
                Lesson {String(lesson.lesson_number).padStart(2, '0')}
                {' — '}
                {lesson.title}
              </strong>

              <span className={
                duplicates.includes(lesson.lesson_number)
                  ? 'rd-import-skip'
                  : 'rd-import-ready'
              }>
                {duplicates.includes(lesson.lesson_number)
                  ? 'Already exists — Skip'
                  : 'Ready to import'}
              </span>
            </div>
          ))}

          <div className="rd-knowledge-actions">
            <button
              type="button"
              disabled={busy || preview.every(
                (lesson) => duplicates.includes(lesson.lesson_number)
              )}
              onClick={() => void importLessons()}
            >
              Confirm Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
