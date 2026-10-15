import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Skill {
  id: string;
  name: string;
  category: string;
  display_order: number;
}

type SkillForm = { name: string; category: string };

export default function SkillsEditor() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SkillForm>({ name: '', category: '' });

  async function loadSkills() {
    const { data, error } = await supabase
      .from('portfolio_skills')
      .select('id, name, category, display_order')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) setMessage(`Load failed: ${error.message}`);
    else setSkills(data ?? []);
  }

  useEffect(() => {
    let active = true;

    async function initialize() {
      const { data, error } = await supabase
        .from('portfolio_skills')
        .select('id, name, category, display_order')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (!active) return;
      if (error) setMessage(`Load failed: ${error.message}`);
      else setSkills(data ?? []);
      setLoading(false);
    }

    void initialize();
    return () => { active = false; };
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm({ name: '', category: '' });
    setMessage('');
    setModalOpen(true);
  }

  function openEdit(skill: Skill) {
    setEditingId(skill.id);
    setForm({ name: skill.name, category: skill.category });
    setMessage('');
    setModalOpen(true);
  }

  function closeModal() {
    if (!saving) setModalOpen(false);
  }

  async function saveSkill(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    const category = form.category.trim();
    if (!name || !category || saving) return;

    setSaving(true);
    setMessage('');

    const { error } = editingId
      ? await supabase.from('portfolio_skills').update({ name, category }).eq('id', editingId)
      : await supabase.from('portfolio_skills').insert({
          name,
          category,
          display_order: Math.max(0, ...skills.map((skill) => skill.display_order)) + 1,
        });

    if (error) {
      setMessage(`Save failed: ${error.message}`);
    } else {
      setModalOpen(false);
      await loadSkills();
      setMessage(editingId ? 'Skill updated.' : 'Skill added successfully.');
    }
    setSaving(false);
  }

  async function deleteSkill(skill: Skill) {
    if (saving || !window.confirm(`Delete "${skill.name}"?`)) return;

    setSaving(true);
    setMessage('');
    const { error } = await supabase.from('portfolio_skills').delete().eq('id', skill.id);
    if (error) setMessage(`Delete failed: ${error.message}`);
    else {
      await loadSkills();
      setMessage('Skill deleted.');
    }
    setSaving(false);
  }

  async function moveSkill(index: number, direction: -1 | 1) {
    const otherIndex = index + direction;
    if (saving || otherIndex < 0 || otherIndex >= skills.length) return;

    setSaving(true);
    setMessage('');
    const current = skills[index];
    const other = skills[otherIndex];

    const first = await supabase
      .from('portfolio_skills')
      .update({ display_order: other.display_order })
      .eq('id', current.id);

    if (first.error) {
      setMessage(`Reorder failed: ${first.error.message}`);
      setSaving(false);
      return;
    }

    const second = await supabase
      .from('portfolio_skills')
      .update({ display_order: current.display_order })
      .eq('id', other.id);

    if (second.error) {
      const rollback = await supabase
        .from('portfolio_skills')
        .update({ display_order: current.display_order })
        .eq('id', current.id);
      setMessage(rollback.error
        ? `Reorder failed; automatic rollback also failed: ${rollback.error.message}. Refresh and check ordering.`
        : `Reorder failed: ${second.error.message}`);
    } else {
      setMessage('Skills reordered.');
    }
    await loadSkills();
    setSaving(false);
  }

  if (loading) return <p>Loading skills...</p>;

  return (
    <section className="admin-editor rd-skills-editor">
      <div className="rd-skills-heading">
        <div>
          <h2>Technical Skills</h2>
          <p>Manage the skills and categories displayed on your portfolio.</p>
        </div>
        <button type="button" onClick={openAdd} disabled={saving}>+ Add Skill</button>
      </div>

      {skills.length === 0 && <p>No skills yet. Add your first technical skill.</p>}

      <div className="rd-skills-list">
        {skills.map((skill, index) => (
          <div className="rd-skills-row" key={skill.id}>
            <div className="rd-skills-details">
              <strong>{skill.name}</strong>
              <span>{skill.category}</span>
            </div>
            <div className="rd-skills-actions">
              <button type="button" disabled={saving || index === 0} onClick={() => void moveSkill(index, -1)} aria-label={`Move ${skill.name} up`} title="Move up">↑</button>
              <button type="button" disabled={saving || index === skills.length - 1} onClick={() => void moveSkill(index, 1)} aria-label={`Move ${skill.name} down`} title="Move down">↓</button>
              <button type="button" disabled={saving} onClick={() => openEdit(skill)}>Edit</button>
              <button type="button" disabled={saving} onClick={() => void deleteSkill(skill)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {message && <p role="status" className="rd-skills-message">{message}</p>}

      {modalOpen && (
        <div className="rd-skills-overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}>
          <div className="rd-skills-modal" role="dialog" aria-modal="true" aria-labelledby="rd-skill-modal-title">
            <div className="rd-skills-modal-header">
              <h2 id="rd-skill-modal-title">{editingId ? 'Edit Skill' : 'Add Skill'}</h2>
              <button type="button" aria-label="Close skill form" onClick={closeModal} disabled={saving}>×</button>
            </div>
            <form onSubmit={(event) => void saveSkill(event)}>
              <label htmlFor="rd-skill-name">Skill Name</label>
              <input id="rd-skill-name" autoFocus required maxLength={150} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. Playwright" />
              <label htmlFor="rd-skill-category">Category</label>
              <input id="rd-skill-category" required maxLength={150} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="e.g. Test Automation" />
              {message && <p role="alert">{message}</p>}
              <div className="rd-skills-modal-actions">
                <button type="button" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" disabled={saving || !form.name.trim() || !form.category.trim()}>{saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Skill'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
