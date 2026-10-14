
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Role {
  id: string;
  title: string;
  display_order: number;
}

export default function RolesEditor() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function loadRoles() {
    const { data, error } = await supabase
      .from('portfolio_roles')
      .select('id, title, display_order')
      .order('display_order');

    if (error) {
      setMessage(`Load failed: ${error.message}`);
    } else {
      setRoles(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function initializeRoles() {
        const { data, error } = await supabase
        .from('portfolio_roles')
        .select('id, title, display_order')
        .order('display_order');

        if (!active) return;

        if (error) {
        setMessage(`Load failed: ${error.message}`);
        } else {
        setRoles(data ?? []);
        }

        setLoading(false);
    }

    void initializeRoles();

    return () => {
        active = false;
    };
    }, []);

  async function addRole(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim()) return;

    setSaving(true);
    setMessage('');

    const nextOrder = Math.max(
      0,
      ...roles.map((role) => role.display_order)
    ) + 1;

    const { error } = await supabase.from('portfolio_roles').insert({
      title: newTitle.trim(),
      display_order: nextOrder,
    });

    if (error) {
      setMessage(`Add failed: ${error.message}`);
    } else {
      setNewTitle('');
      await loadRoles();
      setMessage('Role added successfully.');
    }

    setSaving(false);
  }

  async function updateRole(role: Role) {
    const title = role.title.trim();

    if (!title) {
      setMessage('Role title cannot be empty.');
      return;
    }

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('portfolio_roles')
      .update({ title })
      .eq('id', role.id);

    setMessage(error ? `Update failed: ${error.message}` : 'Role updated.');
    setSaving(false);
  }

  async function deleteRole(role: Role) {
    if (!window.confirm(`Delete "${role.title}"?`)) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('portfolio_roles')
      .delete()
      .eq('id', role.id);

    if (error) {
      setMessage(`Delete failed: ${error.message}`);
    } else {
      await loadRoles();
      setMessage('Role deleted.');
    }

    setSaving(false);
  }

  async function moveRole(index: number, direction: -1 | 1) {
    const otherIndex = index + direction;
    if (otherIndex < 0 || otherIndex >= roles.length) return;

    setSaving(true);
    setMessage('');

    const current = roles[index];
    const other = roles[otherIndex];

    const first = await supabase
      .from('portfolio_roles')
      .update({ display_order: other.display_order })
      .eq('id', current.id);

    if (first.error) {
      setMessage(`Reorder failed: ${first.error.message}`);
      setSaving(false);
      return;
    }

    const second = await supabase
      .from('portfolio_roles')
      .update({ display_order: current.display_order })
      .eq('id', other.id);

    if (second.error) {
      setMessage(`Reorder failed: ${second.error.message}`);
    } else {
      await loadRoles();
      setMessage('Roles reordered.');
    }

    setSaving(false);
  }

  if (loading) return <p>Loading roles...</p>;

  return (
    <section className="admin-editor">
      <h2>Professional Roles</h2>
      <p>Manage the titles displayed on your portfolio.</p>

      <form onSubmit={addRole} className="admin-inline-form">
        <input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="New professional role"
          aria-label="New professional role"
          required
        />
        <button type="submit" disabled={saving}>Add Role</button>
      </form>

      {roles.length === 0 && (
        <p>No roles yet. Add your first professional role above.</p>
      )}

      <div className="admin-items">
        {roles.map((role, index) => (
          <div className="admin-item" key={role.id}>
            <input
              value={role.title}
              aria-label="Role title"
              onChange={(event) => {
                setRoles((current) =>
                  current.map((item) =>
                    item.id === role.id
                      ? { ...item, title: event.target.value }
                      : item
                  )
                );
              }}
            />

            <div className="admin-item-actions">
              <button
                type="button"
                disabled={saving || index === 0}
                onClick={() => void moveRole(index, -1)}
                aria-label={`Move ${role.title} up`}
              >
                ↑
              </button>

              <button
                type="button"
                disabled={saving || index === roles.length - 1}
                onClick={() => void moveRole(index, 1)}
                aria-label={`Move ${role.title} down`}
              >
                ↓
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void updateRole(role)}
              >
                Save
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={() => void deleteRole(role)}
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
