import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { logAdminActivity } from '../lib/adminActivity';
import { supabase } from '../lib/supabase';

type PublicationFilter = 'all' | 'published' | 'draft';
type SortOption = 'display_order' | 'title_asc' | 'title_desc';

function getCodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getCodeText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const element = node as { props: { children?: ReactNode } };
    return getCodeText(element.props.children);
  }
  return '';
}

function NotesCodeBlock({ children }: { children: ReactNode }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(getCodeText(children).replace(/\n$/, ''));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  return (
    <div className="rd-notes-code">
      <div className="rd-notes-code-toolbar">
        <span>Code example</span>
        <button type="button" onClick={() => void copyCode()}>
          {copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Copy failed' : 'Copy code'}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  );
}

interface Notes {
  id: string;
  title: string;
  description: string;
  content_markdown: string;
  technologies: string[];
  is_published: boolean;
  display_order: number;
}

type NotesForm = Omit<Notes, 'id' | 'technologies'> & { technologiesText: string };

const emptyNotes: NotesForm = {
  title: '',
  description: '',
  content_markdown: '',
  technologiesText: '',
  is_published: false,
  display_order: 0,
};

export default function NotesEditor() {
  const [notes, setNotes] = useState<Notes[]>([]);
  const [form, setForm] = useState<NotesForm>(emptyNotes);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [readingNote, setReadingNote] = useState<Notes | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [publicationFilter, setPublicationFilter] = useState<PublicationFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('display_order');

  const filteredNotes = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    const matches = notes.filter((note) => {
      const searchableText = [
        note.title,
        note.description,
        note.content_markdown,
        ...(note.technologies ?? []),
      ]
        .join(' ')
        .toLocaleLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const matchesPublication = publicationFilter === 'all' ||
        (publicationFilter === 'published' ? note.is_published : !note.is_published);
      return matchesSearch && matchesPublication;
    });

    return matches.sort((first, second) => {
      if (sortOption === 'title_asc') return first.title.localeCompare(second.title);
      if (sortOption === 'title_desc') return second.title.localeCompare(first.title);
      return first.display_order - second.display_order || first.title.localeCompare(second.title);
    });
  }, [notes, searchTerm, publicationFilter, sortOption]);

  const filtersActive = Boolean(searchTerm.trim()) || publicationFilter !== 'all' ||
    sortOption !== 'display_order';

  async function loadNotes() {
    const { data, error } = await supabase
      .from('portfolio_notes')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) setMessage(`Load failed: ${error.message}`);
    else setNotes((data ?? []) as Notes[]);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function initializeNotes() {
      const { data, error } = await supabase
        .from('portfolio_notes')
        .select('*')
        .order('display_order', { ascending: true });

      if (!active) return;
      if (error) setMessage(`Load failed: ${error.message}`);
      else setNotes((data ?? []) as Notes[]);
      setLoading(false);
    }

    void initializeNotes();
    return () => { active = false; };
  }, []);

  function clearFilters() {
    setSearchTerm('');
    setPublicationFilter('all');
    setSortOption('display_order');
  }

  function startCreating() {
    setEditingId(null);
    setForm({ ...emptyNotes, display_order: Math.max(-1, ...notes.map((note) => note.display_order)) + 1 });
    setMessage('');
    setFormError('');
    setFormOpen(true);
  }

  function startEditing(note: Notes) {
    setEditingId(note.id);
    setForm({
      title: note.title,
      description: note.description,
      content_markdown: note.content_markdown ?? '',
      technologiesText: (note.technologies ?? []).join(', '),
      is_published: note.is_published,
      display_order: note.display_order,
    });
    setMessage('');
    setFormError('');
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditingId(null);
    setForm({ ...emptyNotes });
    setFormError('');
  }

  async function saveNotes(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      content_markdown: form.content_markdown.trim(),
      technologies: form.technologiesText.split(',').map((technology) => technology.trim()).filter(Boolean),
      is_published: form.is_published,
      display_order: form.display_order,
    };

    const result = editingId
      ? await supabase.from('portfolio_notes').update(payload).eq('id', editingId)
      : await supabase.from('portfolio_notes').insert(payload);

    if (result.error) {
      setFormError(`Save failed: ${result.error.message}`);
    } else {
      await logAdminActivity(editingId ? 'updated' : 'created', 'note', payload.title);
      setFormOpen(false);
      setEditingId(null);
      setForm({ ...emptyNotes });
      await loadNotes();
      setMessage('Note saved successfully.');
    }
    setSaving(false);
  }

  async function deleteNote(note: Notes) {
    if (!window.confirm(`Delete "${note.title}" permanently?`)) return;
    setSaving(true);
    setMessage('');

    const { error } = await supabase.from('portfolio_notes').delete().eq('id', note.id);
    if (error) setMessage(`Delete failed: ${error.message}`);
    else {
      await logAdminActivity('deleted', 'note', note.title);
      await loadNotes();
      setMessage('Note deleted.');
    }
    setSaving(false);
  }

  async function togglePublished(note: Notes) {
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('portfolio_notes')
      .update({ is_published: !note.is_published })
      .eq('id', note.id);

    if (error) setMessage(`Publish update failed: ${error.message}`);
    else {
      await logAdminActivity(note.is_published ? 'unpublished' : 'published', 'note', note.title);
      await loadNotes();
      setMessage(note.is_published ? 'Note moved to drafts.' : 'Note published.');
    }
    setSaving(false);
  }

  if (loading) return <p>Loading notes...</p>;

  if (readingNote) {
    return (
      <article className="rd-lesson-reader rd-notes-reader">
        <button type="button" className="rd-back-button" onClick={() => setReadingNote(null)}>
          ← Back to notes
        </button>
        <h2>{readingNote.title}</h2>
        {readingNote.description && <p className="rd-notes-reader-description">{readingNote.description}</p>}
        {readingNote.technologies.length > 0 && (
          <p className="rd-notes-reader-tags">{readingNote.technologies.join(' · ')}</p>
        )}
        <div className="rd-lesson-markdown">
          <Markdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              pre: ({ children }) => <NotesCodeBlock>{children}</NotesCodeBlock>,
              table: ({ children }) => (
                <div className="rd-markdown-table-scroll" role="region" aria-label="Scrollable table" tabIndex={0}>
                  <table>{children}</table>
                </div>
              ),
            }}
          >
            {readingNote.content_markdown || '*No note content yet.*'}
          </Markdown>
        </div>
        <div className="admin-item-actions">
          <button type="button" onClick={() => { startEditing(readingNote); setReadingNote(null); }}>Edit note</button>
        </div>
      </article>
    );
  }

  return (
    <section className="admin-editor">
      <div className="rd-modal-heading">
        <div>
          <h3>Notes ({notes.length})</h3>
          {notes.length === 0 && <p>No notes yet. Select Add Note to get started.</p>}
        </div>
        <button type="button" className="rd-knowledge-add-button" onClick={startCreating} disabled={saving}>
          + Add note
        </button>
      </div>

      {message && <p role="status">{message}</p>}

      {notes.length > 0 && (
        <div className="rd-notes-toolbar" role="search" aria-label="Notes search and filters">
          <div className="rd-notes-search">
            <label htmlFor="rd-notes-search">Search notes</label>
            <input
              id="rd-notes-search"
              type="search"
              placeholder="Search title, description, content, technology..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="rd-notes-filter">
            <label htmlFor="rd-notes-publication">Publication</label>
            <select id="rd-notes-publication" value={publicationFilter} onChange={(event) => setPublicationFilter(event.target.value as PublicationFilter)}>
              <option value="all">All publications</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="rd-notes-filter">
            <label htmlFor="rd-notes-sort">Sort by</label>
            <select id="rd-notes-sort" value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)}>
              <option value="display_order">Display order</option>
              <option value="title_asc">Title A–Z</option>
              <option value="title_desc">Title Z–A</option>
            </select>
          </div>
          <div className="rd-notes-filter-summary">
            <span>Showing {filteredNotes.length} of {notes.length} notes</span>
            {filtersActive && <button type="button" onClick={clearFilters}>Clear filters</button>}
          </div>
        </div>
      )}

      <div className="admin-items rd-notes-grid">
        {filteredNotes.map((note) => (
          <article className="admin-item" key={note.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: 'var(--v3-text)' }}>{note.title}</h3>
                <p style={{ margin: '0 0 10px', fontSize: '13.5px', color: 'var(--v3-muted)', lineHeight: 1.5 }}>{note.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', fontFamily: 'var(--v3-mono)' }}>
                  <span style={{ color: note.is_published ? 'var(--v3-accent)' : 'var(--v3-subtle)' }}>
                    {note.is_published ? '● Published' : '○ Draft'}
                  </span>
                </div>
              </div>
            </div>


            <div className="admin-item-actions">
              <button type="button" disabled={saving} onClick={() => setReadingNote(note)}>Read</button>
              <button type="button" disabled={saving} onClick={() => startEditing(note)}>Edit</button>
              <button type="button" disabled={saving} onClick={() => void togglePublished(note)}>
                {note.is_published ? 'Unpublish' : 'Publish'}
              </button>
              <button type="button" disabled={saving} onClick={() => void deleteNote(note)}>Delete</button>
            </div>
          </article>
        ))}
        {notes.length > 0 && filteredNotes.length === 0 && (
          <div className="rd-notes-empty">
            <p>No notes match your search or filters.</p>
            <button type="button" onClick={clearFilters}>Clear filters</button>
          </div>
        )}
      </div>

      {formOpen && (
        <div className="rd-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeForm();
        }}>
          <div className="rd-modal-panel rd-notes-modal-panel" role="dialog" aria-modal="true" aria-labelledby="rd-notes-modal-title">
            <div className="rd-modal-heading">
              <h3 id="rd-notes-modal-title">{editingId ? 'Edit note' : 'Add new note'}</h3>
              <button type="button" aria-label="Close note editor" onClick={closeForm} disabled={saving}>&times;</button>
            </div>
            {formError && <p role="alert" className="rd-knowledge-error">{formError}</p>}
            <form className="admin-profile-form" onSubmit={saveNotes}>
              <label htmlFor="notes-title">Note title</label>
              <input id="notes-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
              <label htmlFor="notes-description">Short description</label>
              <textarea id="notes-description" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              <label htmlFor="notes-content">Note content</label>
              <textarea
                id="notes-content"
                className="rd-notes-content-input"
                rows={14}
                value={form.content_markdown}
                onChange={(event) => setForm({ ...form, content_markdown: event.target.value })}
                placeholder={'## Step 1: Create a project\nDescribe the step here.\n\n## Step 2: Run the app\nExplain what to do next.\n\n```python\nprint("Add a code example")\n```'}
              />
              <p className="rd-notes-editor-help">
                Use Markdown for headings, numbered steps, and code. Wrap code in triple backticks and add its language, like ```python.
              </p>
              <label htmlFor="notes-technologies">Topics or technologies (comma-separated)</label>
              <input id="notes-technologies" value={form.technologiesText} placeholder="Python, Automation Testing" onChange={(event) => setForm({ ...form, technologiesText: event.target.value })} />
              <label htmlFor="notes-order">Display order</label>
              <input id="notes-order" type="number" value={form.display_order} onChange={(event) => setForm({ ...form, display_order: Number(event.target.value) })} />
              <label className="admin-checkbox">
                <input type="checkbox" checked={form.is_published} onChange={(event) => setForm({ ...form, is_published: event.target.checked })} />
                Publish this note
              </label>
              <div className="rd-knowledge-actions">
                <button type="submit" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update note' : 'Add note'}</button>
                <button type="button" onClick={closeForm} disabled={saving}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
