import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: number;
  name: string;
  headline: string;
  biography: string;
}

const emptyProfile: Profile = { id: 1, name: '', headline: '', biography: '' };

export default function ProfileEditor() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [draft, setDraft] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const { data, error } = await supabase
        .from('portfolio_profile')
        .select('id, name, headline, biography')
        .eq('id', 1)
        .maybeSingle();

      if (!active) return;
      if (error) setMessage(`Unable to load profile: ${error.message}`);
      else if (data) setProfile(data);
      setLoading(false);
    }

    void loadProfile();
    return () => { active = false; };
  }, []);

  function openEditor() {
    setDraft({ ...profile });
    setMessage('');
    setIsEditing(true);
  }

  function closeEditor() {
    if (!saving) setIsEditing(false);
  }

  async function handleSave(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const updatedProfile = {
      id: 1,
      name: draft.name.trim(),
      headline: draft.headline.trim(),
      biography: draft.biography.trim(),
    };
    if (!updatedProfile.name || !updatedProfile.headline || !updatedProfile.biography) return;

    setSaving(true);
    setMessage('');
    const { error } = await supabase
      .from('portfolio_profile')
      .upsert(updatedProfile, { onConflict: 'id' });

    if (error) {
      setMessage(`Save failed: ${error.message}`);
    } else {
      setProfile(updatedProfile);
      setIsEditing(false);
      setMessage('Profile saved successfully!');
    }
    setSaving(false);
  }

  if (loading) return <p>Loading profile...</p>;

  return (
    <section className="admin-editor rd-profile-editor">
      <div className="rd-profile-toolbar">
        <p>Manage the personal information displayed on your public portfolio.</p>
        <button type="button" onClick={openEditor}>Edit Profile</button>
      </div>

      <div className="rd-profile-summary">
        <div className="rd-profile-field"><span>Full Name</span><strong>{profile.name || 'Not set'}</strong></div>
        <div className="rd-profile-field"><span>Headline</span><p>{profile.headline || 'Not set'}</p></div>
        <div className="rd-profile-field"><span>Biography</span><p className="rd-profile-biography">{profile.biography || 'Not set'}</p></div>
      </div>

      {message && <p role="status" className="rd-profile-message">{message}</p>}

      {isEditing && (
        <div className="rd-profile-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeEditor();
        }}>
          <div className="rd-profile-modal" role="dialog" aria-modal="true" aria-labelledby="rd-profile-modal-title">
            <div className="rd-profile-modal-heading">
              <h2 id="rd-profile-modal-title">Edit Profile</h2>
              <button type="button" onClick={closeEditor} disabled={saving} aria-label="Close editor">×</button>
            </div>
            <form onSubmit={(event) => void handleSave(event)} className="rd-profile-modal-form">
              <label htmlFor="profile-name">Full Name</label>
              <input id="profile-name" autoFocus required value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
              <label htmlFor="profile-headline">Headline</label>
              <input id="profile-headline" required value={draft.headline} onChange={(event) => setDraft((current) => ({ ...current, headline: event.target.value }))} />
              <label htmlFor="profile-biography">Biography</label>
              <textarea id="profile-biography" rows={6} required value={draft.biography} onChange={(event) => setDraft((current) => ({ ...current, biography: event.target.value }))} />
              {message && <p role="status">{message}</p>}
              <div className="rd-profile-modal-actions">
                <button type="button" onClick={closeEditor} disabled={saving}>Cancel</button>
                <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
