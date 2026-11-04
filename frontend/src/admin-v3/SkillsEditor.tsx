import { useEffect, useMemo, useState } from 'react';
import { logAdminActivity } from '../lib/adminActivity';
import { supabase } from '../lib/supabase';

interface Skill {
  id: string;
  name: string;
  category: string;
  display_order: number;
}

type SkillForm = { name: string; category: string };
type SkillSortOption = 'display_order' | 'name_asc' | 'name_desc' | 'category';
const SKILLS_PER_PAGE = 18;

export default function SkillsEditor() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SkillForm>({ name: '', category: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortOption, setSortOption] = useState<SkillSortOption>('display_order');
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(
    () => [...new Set(skills.map((skill) => skill.category.trim()).filter(Boolean))]
      .sort((first, second) => first.localeCompare(second)),
    [skills]
  );

  const filteredSkills = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    const matches = skills.filter((skill) => {
      const matchesSearch = !query ||
        `${skill.name} ${skill.category}`.toLocaleLowerCase().includes(query);
      const matchesCategory = categoryFilter === 'all' || skill.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });

    return matches.sort((first, second) => {
      if (sortOption === 'name_asc') return first.name.localeCompare(second.name);
      if (sortOption === 'name_desc') return second.name.localeCompare(first.name);
      if (sortOption === 'category') {
        return first.category.localeCompare(second.category) || first.name.localeCompare(second.name);
      }
      return first.display_order - second.display_order || first.name.localeCompare(second.name);
    });
  }, [skills, searchTerm, categoryFilter, sortOption]);

  const pageCount = Math.max(1, Math.ceil(filteredSkills.length / SKILLS_PER_PAGE));
  const visiblePage = Math.min(currentPage, pageCount);
  const visibleSkills = filteredSkills.slice(
    (visiblePage - 1) * SKILLS_PER_PAGE,
    visiblePage * SKILLS_PER_PAGE
  );
  const hasActiveFilters = Boolean(searchTerm.trim()) || categoryFilter !== 'all';

  function resetToFirstPage() {
    setCurrentPage(1);
  }

  function clearSkillFilters() {
    setSearchTerm('');
    setCategoryFilter('all');
    setSortOption('display_order');
    setCurrentPage(1);
  }

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
      await logAdminActivity(editingId ? 'updated' : 'created', 'skill', name);
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
      await logAdminActivity('deleted', 'skill', skill.name);
      await loadSkills();
      setMessage('Skill deleted.');
    }
    setSaving(false);
  }

  if (loading) return <p>Loading skills...</p>;

  return (
    <section className="admin-editor rd-skills-editor">
      <div className="rd-skills-heading">
        <div>
          <h2>Technical Skills</h2>
          <p>Manage and organize your skills by category.</p>
          <span className="rd-skills-total">
            {skills.length} {skills.length === 1 ? 'skill' : 'skills'} across {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </span>
        </div>
        <button type="button" onClick={openAdd} disabled={saving}>+ Add Skill</button>
      </div>

      {skills.length === 0 && <p>No skills yet. Add your first technical skill.</p>}

      {skills.length > 0 && (
        <div className="rd-skills-toolbar" role="search" aria-label="Filter and sort skills">
          <div className="rd-skills-search">
            <label htmlFor="rd-skills-search">Search skills</label>
            <input
              id="rd-skills-search"
              type="search"
              placeholder="Search skill or category..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                resetToFirstPage();
              }}
            />
          </div>
          <div className="rd-skills-filter">
            <label htmlFor="rd-skills-category">Category</label>
            <select
              id="rd-skills-category"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                resetToFirstPage();
              }}
            >
              <option value="all">All categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <div className="rd-skills-filter">
            <label htmlFor="rd-skills-sort">Sort by</label>
            <select
              id="rd-skills-sort"
              value={sortOption}
              onChange={(event) => {
                setSortOption(event.target.value as SkillSortOption);
                resetToFirstPage();
              }}
            >
              <option value="display_order">Default order</option>
              <option value="name_asc">Name A–Z</option>
              <option value="name_desc">Name Z–A</option>
              <option value="category">Category</option>
            </select>
          </div>
          <div className="rd-skills-filter-summary">
            <span>Showing {filteredSkills.length === 0 ? 0 : (visiblePage - 1) * SKILLS_PER_PAGE + 1}–{Math.min(visiblePage * SKILLS_PER_PAGE, filteredSkills.length)} of {filteredSkills.length}</span>
            {(hasActiveFilters || sortOption !== 'display_order') && (
              <button type="button" onClick={clearSkillFilters}>Reset</button>
            )}
          </div>
        </div>
      )}

      <div className="rd-skills-list">
        {visibleSkills.map((skill) => (
          <div className="rd-skills-row" key={skill.id}>
            <div className="rd-skills-details">
              <strong>{skill.name}</strong>
              <span>{skill.category}</span>
            </div>
            <div className="rd-skills-actions">
              <button type="button" disabled={saving} onClick={() => openEdit(skill)}>Edit</button>
              <button type="button" disabled={saving} onClick={() => void deleteSkill(skill)}>Delete</button>
            </div>
          </div>
        ))}
        {filteredSkills.length === 0 && skills.length > 0 && (
          <div className="rd-skills-empty">
            <p>No skills match your search or category.</p>
            <button type="button" onClick={clearSkillFilters}>Clear filters</button>
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <nav className="rd-skills-pagination" aria-label="Skills pages">
          <button type="button" disabled={visiblePage === 1} onClick={() => setCurrentPage(visiblePage - 1)}>
            Previous
          </button>
          <span>Page {visiblePage} of {pageCount}</span>
          <button type="button" disabled={visiblePage === pageCount} onClick={() => setCurrentPage(visiblePage + 1)}>
            Next
          </button>
        </nav>
      )}

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
