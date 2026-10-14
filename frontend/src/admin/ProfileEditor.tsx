import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: number;
  name: string;
  headline: string;
  biography: string;
}

const emptyProfile: Profile = {
  id: 1,
  name: '',
  headline: '',
  biography: '',
};

export default function ProfileEditor() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await supabase
        .from('portfolio_profile')
        .select('id, name, headline, biography')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        setMessage(`Unable to load profile: ${error.message}`);
      } else if (data) {
        setProfile(data);
      }

      setLoading(false);
    }

    void loadProfile();
  }, []);

  async function handleSave(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('portfolio_profile')
      .upsert({
        id: 1,
        name: profile.name.trim(),
        headline: profile.headline.trim(),
        biography: profile.biography.trim(),
      }, { onConflict: 'id' });

    setMessage(
      error ? `Save failed: ${error.message}` : 'Profile saved successfully!'
    );

    setSaving(false);
  }

  if (loading) return <p>Loading profile...</p>;

  return (
    <form className="admin-profile-form" onSubmit={handleSave}>
      <p>Manage your profile and display on your portfolio.</p>

      <label htmlFor="profile-name">Full Name</label>
      <input
        id="profile-name"
        value={profile.name}
        onChange={(event) =>
          setProfile({ ...profile, name: event.target.value })
        }
        required
      />

      <label htmlFor="profile-headline">Headline</label>
      <input
        id="profile-headline"
        value={profile.headline}
        onChange={(event) =>
          setProfile({ ...profile, headline: event.target.value })
        }
        required
      />

      <label htmlFor="profile-biography">Biography</label>
      <textarea
        id="profile-biography"
        rows={5}
        value={profile.biography}
        onChange={(event) =>
          setProfile({ ...profile, biography: event.target.value })
        }
        required
      />

      {message && <p role="status">{message}</p>}

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}