import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Role {
  id: string;
  title: string;
  display_order: number;
}

export default function RolesEditor() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');

  async function loadRoles() {
    const { data, error } = await supabase
      .from('portfolio_roles')
      .select('id, title, display_order')
      .order('display_order');

    if (error) setMessage(`Load failed: ${error.message}`);
    else setRoles(data ?? []);
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
      if (error) setMessage(`Load failed: ${error.message}`);
      else setRoles(data ?? []);
      setLoading(false);
    }
    void initializeRoles();
    return () => { active = false; };
  }, []);

  function openAddModal() {
    setEditingRole(null);
    setTitle('');
    setMessage('');
    setModalOpen(true);
  }

  function openEditModal(role: Role) {
    setEditingRole(role);
    setTitle(role.title);
    setMessage('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingRole(null);
    setTitle('');
  }

  async function saveRole(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle || saving) return;

    setSaving(true);
    setMessage('');
    const { error } = editingRole
      ? await supabase.from('portfolio_roles').update({ title: cleanTitle }).eq('id', editingRole.id)
      : await supabase.from('portfolio_roles').insert({
          title: cleanTitle,
          display_order: Math.max(0, ...roles.map((role) => role.display_order)) + 1,
        });

    if (error) {
      setMessage(`${editingRole ? 'Update' : 'Add'} failed: ${error.message}`);
    } else {
      setModalOpen(false);
      setEditingRole(null);
      setTitle('');
      await loadRoles();
      setMessage(editingRole ? 'Role updated.' : 'Role added successfully.');
    }
    setSaving(false);
  }

  async function deleteRole(role: Role) {
    if (saving || !window.confirm(`Delete "${role.title}"?`)) return;
    setSaving(true);
    setMessage('');
    const { error } = await supabase.from('portfolio_roles').delete().eq('id', role.id);
    if (error) setMessage(`Delete failed: ${error.message}`);
    else {
      await loadRoles();
      setMessage('Role deleted.');
    }
    setSaving(false);
  }

  async function moveRole(index: number, direction: -1 | 1) {
    const otherIndex = index + direction;
    if (saving || otherIndex < 0 || otherIndex >= roles.length) return;
    setSaving(true);
    setMessage('');
    const current = roles[index];
    const other = roles[otherIndex];
    const first = await supabase.from('portfolio_roles')
      .update({ display_order: other.display_order }).eq('id', current.id);
    if (first.error) {
      setMessage(`Reorder failed: ${first.error.message}`);
      setSaving(false);
      return;
    }
    const second = await supabase.from('portfolio_roles')
      .update({ display_order: current.display_order }).eq('id', other.id);
    if (second.error) {
      setMessage(`Reorder failed: ${second.error.message}. Refreshing role order.`);
    } else {
      setMessage('Roles reordered.');
    }
    await loadRoles();
    setSaving(false);
  }

  if (loading) return <p>Loading roles...</p>;

  return (
    <section className="admin-editor">
      <div className="rd-roles-toolbar">
        <div>
          <h2>Professional Roles</h2>
          <p>Manage the titles displayed on your portfolio.</p>
        </div>
        <button type="button" onClick={openAddModal} disabled={saving}>+ Add Role</button>
      </div>

      {roles.length === 0 && <p>No roles yet. Select Add Role to create one.</p>}

      <div className="rd-roles-list">
        {roles.map((role, index) => (
          <div className="rd-roles-row" key={role.id}>
            <div className="rd-roles-title"><span className="rd-roles-number">{index + 1}</span><strong>{role.title}</strong></div>
            <div className="rd-roles-actions">
              <button type="button" disabled={saving || index === 0} onClick={() => void moveRole(index, -1)} aria-label={`Move ${role.title} up`}>↑</button>
              <button type="button" disabled={saving || index === roles.length - 1} onClick={() => void moveRole(index, 1)} aria-label={`Move ${role.title} down`}>↓</button>
              <button type="button" disabled={saving} onClick={() => openEditModal(role)}>Edit</button>
              <button type="button" disabled={saving} onClick={() => void deleteRole(role)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {message && <p role="status">{message}</p>}

      {modalOpen && (
        <div className="rd-roles-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <div className="rd-roles-modal" role="dialog" aria-modal="true" aria-labelledby="rd-role-modal-title">
            <div className="rd-roles-modal-heading">
              <h2 id="rd-role-modal-title">{editingRole ? 'Edit Role' : 'Add Role'}</h2>
              <button type="button" onClick={closeModal} disabled={saving} aria-label="Close role editor">×</button>
            </div>
            <form onSubmit={(event) => void saveRole(event)}>
              <label htmlFor="rd-role-title">Professional role title</label>
              <input id="rd-role-title" autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Senior DevOps Engineer" required maxLength={150} />
              {message && <p role="alert">{message}</p>}
              <div className="rd-roles-modal-actions">
                <button type="button" onClick={closeModal} disabled={saving}>Cancel</button>
                <button type="submit" disabled={saving || !title.trim()}>{saving ? 'Saving...' : editingRole ? 'Save Changes' : 'Add Role'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
