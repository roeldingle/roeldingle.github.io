import { useState, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface ReaderLesson {
  id: string;
  lesson_number: number;
  title: string;
  objectives: string;
  content_markdown: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completed_at: string | null;
}

interface LessonReaderProps {
  lesson: ReaderLesson;
  previousLesson: ReaderLesson | null;
  nextLesson: ReaderLesson | null;
  onNavigate: (lesson: ReaderLesson) => void;
  onBack: () => void;
  onEdit: () => void;
  onStatusChange: (
  lessonId: string,
  status: 'not_started' | 'in_progress' | 'completed'
    ) => Promise<void>;
  statusSaving: boolean;
}

function extractText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const element = node as { props: { children?: ReactNode } };
    return extractText(element.props.children);
  }
  return '';
}

function CodeBlock({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(extractText(children).replace(/\n$/, ''));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rd-reader-code">
      <div className="rd-reader-code-toolbar">
        <span>Code Example</span>
        <button type="button" onClick={() => void copyCode()}>
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}

export default function LessonReader({
  lesson,
  previousLesson,
  nextLesson,
  onNavigate,
  onBack,
  onEdit,
  onStatusChange,
  statusSaving,
}: LessonReaderProps) {
  const statusLabel = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
  }[lesson.status];

  return (
    <div className="rd-overview">
      <button type="button" className="rd-back-button" onClick={onBack}>
        Back to Lessons
      </button>

      <article className="rd-lesson-reader">
        <header className="rd-lesson-reader-header">
          <div>
            <p className="rd-course-subtitle">Lesson {lesson.lesson_number}</p>
            <h2>{lesson.title}</h2>
          </div>
          <span className="rd-course-visibility">{statusLabel}</span>
        </header>

        {lesson.objectives && (
          <section className="rd-lesson-objectives">
            <h3>Learning Objectives</h3>
            <p>{lesson.objectives}</p>
          </section>
        )}

        <section className="rd-lesson-status-controls">
            <h3>Learning Progress</h3>

            <div className="rd-lesson-status-actions">
                {(
                [
                    ['not_started', 'Not Started'],
                    ['in_progress', 'In Progress'],
                    ['completed', 'Completed'],
                ] as const
                ).map(([status, label]) => (
                <button
                    key={status}
                    type="button"
                    disabled={statusSaving}
                    aria-pressed={lesson.status === status}
                    className={`rd-lesson-status-button ${
                    lesson.status === status ? 'active' : ''
                    }`}
                    onClick={() => void onStatusChange(lesson.id, status)}
                >
                    {label}
                </button>
                ))}
            </div>

            {statusSaving && <p role="status">Saving progress...</p>}
            </section>

        <div className="rd-lesson-markdown">
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
            }}
          >
            {lesson.content_markdown || '*No lesson content yet.*'}
          </Markdown>
        </div>

        <footer className="rd-lesson-reader-footer">
          <button
            type="button"
            className="rd-back-button"
            onClick={() => previousLesson && onNavigate(previousLesson)}
            disabled={!previousLesson}
          >
            Previous Lesson
          </button>
          <button type="button" className="rd-back-button" onClick={onEdit}>
            Edit Lesson
          </button>
          <button
            type="button"
            className="rd-back-button"
            onClick={() => nextLesson && onNavigate(nextLesson)}
            disabled={!nextLesson}
          >
            Next Lesson
          </button>
        </footer>
      </article>
    </div>
  );
}
