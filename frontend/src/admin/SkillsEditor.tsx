
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Skill {
  id: string;
  name: string;
  category: string;
  display_order: number;
}

export default function SkillsEditor() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function loadSkills() {
    const { data, error } = await supabase
      .from('portfolio_skills')
      .select('id, name, category, display_order')
      .order('display_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      setMessage(`Load failed: ${error.message}`);
    } else {
      setSkills(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function initializeSkills() {
      const { data, error } = await supabase
        .from('portfolio_skills')
        .select('id, name, category, display_order')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (!active) return;

      if (error) {
        setMessage(`Load failed: ${error.message}`);
      } else {
        setSkills(data ?? []);
      }

      setLoading(false);
    }

    void initializeSkills();

    return () => {
      active = false;
    };
  }, []);

  async function addSkill(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = newName.trim();
    const category = newCategory.trim();

    if (!name || !category) return;

    setSaving(true);
    setMessage('');

    const nextOrder = Math.max(
      0,
      ...skills.map((skill) => skill.display_order)
    ) + 1;

    const { error } = await supabase.from('portfolio_skills').insert({
      name,
      category,
      display_order: nextOrder,
    });

    if (error) {
      setMessage(`Add failed: ${error.message}`);
    } else {
      setNewName('');
      await loadSkills();
      setMessage('Skill added successfully.');
    }

    setSaving(false);
  }

  async function updateSkill(skill: Skill) {
    const name = skill.name.trim();
    const category = skill.category.trim();

    if (!name || !category) {
      setMessage('Skill name and category are required.');
      return;
    }

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('portfolio_skills')
      .update({ name, category })
      .eq('id', skill.id);

    setMessage(error ? `Update failed: ${error.message}` : 'Skill updated.');
    setSaving(false);
  }

  async function deleteSkill(skill: Skill) {
    if (!window.confirm(`Delete "${skill.name}"?`)) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('portfolio_skills')
      .delete()
      .eq('id', skill.id);

    if (error) {
      setMessage(`Delete failed: ${error.message}`);
    } else {
      await loadSkills();
      setMessage('Skill deleted.');
    }

    setSaving(false);
  }

  async function moveSkill(index: number, direction: -1 | 1) {
    const otherIndex = index + direction;
    if (otherIndex < 0 || otherIndex >= skills.length) return;

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
      setMessage(`Reorder failed: ${second.error.message}`);
    } else {
      await loadSkills();
      setMessage('Skills reordered.');
    }

    setSaving(false);
  }

  if (loading) return <p>Loading skills...</p>;

  return (
    <section className="admin-editor">
      <h2>Technical Skills</h2>
      <p>Manage the skills and categories displayed on your portfolio.</p>

      <form className="admin-inline-form" onSubmit={addSkill}>
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          placeholder="Skill name (e.g. Playwright)"
          aria-label="New skill name"
          required
        />

        <input
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
          placeholder="Category (e.g. Test Automation)"
          aria-label="New skill category"
          required
        />

        <button type="submit" disabled={saving}>
          Add Skill
        </button>
      </form>

      {skills.length === 0 && (
        <p>No skills yet. Add your first technical skill above.</p>
      )}

      <div className="admin-items">
        {skills.map((skill, index) => (
          <div className="admin-item" key={skill.id}>
            <input
              value={skill.name}
              aria-label="Skill name"
              onChange={(event) =>
                setSkills((current) =>
                  current.map((item) =>
                    item.id === skill.id
                      ? { ...item, name: event.target.value }
                      : item
                  )
                )
              }
            />

            <input
              value={skill.category}
              aria-label="Skill category"
              onChange={(event) =>
                setSkills((current) =>
                  current.map((item) =>
                    item.id === skill.id
                      ? { ...item, category: event.target.value }
                      : item
                  )
                )
              }
            />

            <div className="admin-item-actions">
              <button
                type="button"
                disabled={saving || index === 0}
                onClick={() => void moveSkill(index, -1)}
              >
                ↑
              </button>

              <button
                type="button"
                disabled={saving || index === skills.length - 1}
                onClick={() => void moveSkill(index, 1)}
              >
                ↓
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void updateSkill(skill)}
              >
                Save
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void deleteSkill(skill)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {message && <p role="status">{message}</p>}
    </section>
  );
}
