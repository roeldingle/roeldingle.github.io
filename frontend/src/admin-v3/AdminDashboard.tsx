import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { type AdminActivity } from '../lib/adminActivity';
import ProfileEditor from './ProfileEditor';
import RolesEditor from './RolesEditor';
import SkillsEditor from './SkillsEditor';
import ProjectsEditor from './ProjectsEditor';
import NotesEditor from './NotesEditor';
import KnowledgeTracker from './KnowledgeTracker';
import './AdminDashboard.css';

interface SidebarCourse { id: string; title: string; }
type AdminPage = 'overview' | 'profile' | 'roles' | 'skills' | 'projects' |'notes' | 'knowledge';
interface AdminDashboardProps { onLogout: () => Promise<void>; }
interface DashboardStats {
  projects: number;
  publishedProjects: number;
  notes: number;
  roles: number;
  skills: number;
  courses: number;
  modules: number;
  lessons: number;
  completedLessons: number;
}

function formatActivityDescription(activity: AdminActivity): string {
  const title = `"${activity.entity_title}"`;

  switch (activity.action) {
    case 'created':
      return `Created a new ${activity.entity_type} named ${title}.`;
    case 'updated':
      return `Updated ${activity.entity_type} ${title}.`;
    case 'deleted':
      return `Deleted ${activity.entity_type} ${title}.`;
    case 'published':
      return `Published ${activity.entity_type} ${title}.`;
    case 'unpublished':
      return `Unpublished ${activity.entity_type} ${title}.`;
    case 'reordered':
      return `Reordered ${activity.entity_title}.`;
    case 'imported':
      return `Imported ${activity.entity_title}.`;
    case 'progress updated':
      return `Updated progress for ${activity.entity_type} ${title}.`;
  }
}

const menuItems: { id: AdminPage; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'profile', label: 'Profile', icon: '◉' },
  { id: 'roles', label: 'Roles', icon: '▣' },
  { id: 'skills', label: 'Skills', icon: '✦' },
  { id: 'projects', label: 'Projects', icon: '▤' },
  { id: 'notes', label: 'Notes', icon: '▤' },
  { id: 'knowledge', label: 'Courses', icon: '◈' },
];

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activePage, setActivePage] = useState<AdminPage>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmsOpen, setCmsOpen] = useState(true);
  const [knowledgeOpen, setKnowledgeOpen] = useState(true);
  const [sidebarCourses, setSidebarCourses] = useState<SidebarCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [activitiesError, setActivitiesError] = useState('');
  const [adminName, setAdminName] = useState('there');
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    let active = true;

    async function loadAdminName() {
      const [{ data: { user }, error: userError }, { data: profile, error: profileError }] =
        await Promise.all([
          supabase.auth.getUser(),
          supabase.from('portfolio_profile').select('name').eq('id', 1).maybeSingle(),
        ]);

      if (!active) return;
      if (userError) console.error('Failed to load administrator identity:', userError.message);
      if (profileError) console.error('Failed to load profile name for greeting:', profileError.message);

      const metadataName = user?.user_metadata?.full_name ?? user?.user_metadata?.name;
      const accountName = user?.email?.split('@')[0];
      setAdminName(profile?.name?.trim() || metadataName || accountName || 'there');
    }

    void loadAdminName();
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function loadSidebarCourses() {
      const { data, error } = await supabase.from('knowledge_courses')
        .select('id, title').order('display_order');
      if (!active) return;
      if (error) {
        console.error('Failed to load sidebar courses:', error.message);
        return;
      }
      setSidebarCourses(data ?? []);
    }
    void loadSidebarCourses();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (activePage !== 'overview') return;
    let active = true;
    async function loadStats() {
      setStatsLoading(true);
      setStatsError('');
      const results = await Promise.all([
        supabase.from('portfolio_projects').select('*', { count: 'exact', head: true }),
        supabase.from('portfolio_projects').select('*', { count: 'exact', head: true }).eq('is_published', true),
        supabase.from('portfolio_notes').select('*', { count: 'exact', head: true }),
        supabase.from('portfolio_roles').select('*', { count: 'exact', head: true }),
        supabase.from('portfolio_skills').select('*', { count: 'exact', head: true }),
        supabase.from('knowledge_courses').select('*', { count: 'exact', head: true }),
        supabase.from('knowledge_modules').select('*', { count: 'exact', head: true }),
        supabase.from('knowledge_lessons').select('*', { count: 'exact', head: true }),
        supabase.from('knowledge_lessons').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      ]);
      if (!active) return;
      const failure = results.find((result) => result.error);
      if (failure?.error) {
        setStatsError(`Unable to load dashboard statistics: ${failure.error.message}`);
      } else {
        const [projects, publishedProjects, notes, roles, skills, courses, modules, lessons, completedLessons] =
          results.map((result) => result.count ?? 0);
        setStats({ projects, publishedProjects, notes, roles, skills, courses, modules, lessons, completedLessons });
      }
      setStatsLoading(false);

      const { data: activityData, error: activityError } = await supabase
        .from('admin_activity_logs')
        .select('id, action, entity_type, entity_title, created_at')
        .order('created_at', { ascending: false })
        .limit(8);

      if (!active) return;
      if (activityError) {
        setActivitiesError(`Unable to load recent activity: ${activityError.message}`);
      } else {
        setActivities(activityData ?? []);
        setActivitiesError('');
      }
    }
    void loadStats();
    return () => { active = false; };
  }, [activePage]);

  function navigate(page: AdminPage) {
    setActivePage(page);
    setSidebarOpen(false);
    if (page === 'knowledge') setSelectedCourseId(null);
  }

  function renderContent() {
    switch (activePage) {
      case 'profile': return <ProfileEditor />;
      case 'roles': return <RolesEditor />;
      case 'skills': return <SkillsEditor />;
      case 'projects': return <ProjectsEditor />;
      case 'notes': return <NotesEditor />;
      case 'knowledge': return (
        <KnowledgeTracker selectedCourseId={selectedCourseId} onBackToCourses={() => setSelectedCourseId(null)} />
      );
      default: {
        const cards: { id: AdminPage; label: string; icon: string; value: string; detail: string }[] = [
          { id: 'roles', label: 'Roles', icon: '▣', value: String(stats?.roles ?? '—'), detail: 'Professional roles' },
          { id: 'skills', label: 'Skills', icon: '✦', value: String(stats?.skills ?? '—'), detail: 'Technical skills' },
          { id: 'projects', label: 'Projects', icon: '▤', value: String(stats?.projects ?? '—'), detail: `${stats?.publishedProjects ?? '—'} published` },
          { id: 'knowledge', label: 'Courses', icon: '◈', value: String(stats?.courses ?? '—'), detail: 'Learning courses' },
          { id: 'knowledge', label: 'Modules', icon: '▦', value: String(stats?.modules ?? '—'), detail: 'Learning modules' },
          { id: 'knowledge', label: 'Lessons', icon: '◉', value: String(stats?.lessons ?? '—'), detail: `${stats?.completedLessons ?? '—'} completed` },
          { id: 'notes', label: 'Notes', icon: '▧', value: String(stats?.notes ?? '—'), detail: 'Personal learning notes' },
        ];
        return (
          <div className="rd-dashboard-overview">
            <section className="rd-welcome-panel">
              <div>
                <p className="rd-welcome-eyebrow">YOUR WORKSPACE, AT A GLANCE</p>
                <h2>{currentTime.getHours() < 12 ? 'Good morning' : currentTime.getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {adminName}</h2>
                <p>Here’s what’s happening in your command center.</p>
              </div>
              <time className="rd-welcome-clock" dateTime={currentTime.toISOString()}>
                <strong>{currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</strong>
                <span>{currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                <small>YOUR LOCAL TIME</small>
              </time>
            </section>
            {statsLoading && <p className="rd-overview-message" role="status">Loading dashboard statistics...</p>}
            {statsError && <p className="rd-overview-message rd-knowledge-error" role="alert">{statsError}</p>}
            {activitiesError && <p className="rd-overview-message rd-knowledge-error" role="alert">{activitiesError}</p>}
            <div className="rd-overview-content">
              <div className="rd-stats">
                {cards.map((card) => (
                  <button key={card.label} type="button" className={`rd-stat-card rd-stat-${card.label.toLowerCase()}`} onClick={() => navigate(card.id)}>
                    <span className="rd-stat-icon">{card.icon}</span>
                    <strong>{card.label}</strong>
                    <span className="rd-overview-stat-value">{card.value}</span>
                    <small>{card.detail}</small>
                    <span className="rd-stat-arrow">↗</span>
                  </button>
                ))}
              </div>
              <div className="rd-overview-secondary">
                {stats && (
                  <section className="rd-info-card rd-learning-progress-card">
                    <h3>Learning Progress</h3>
                    <p>{stats.completedLessons} of {stats.lessons} lessons completed</p>
                    <progress value={stats.completedLessons} max={Math.max(stats.lessons, 1)} style={{ width: '100%' }} />
                  </section>
                )}
                <section className="rd-info-card rd-activity-card">
                  <div className="rd-activity-heading">
                    <div>
                      <h3>Recent Activity</h3>
                      <p>Your latest changes across the Admin workspace.</p>
                    </div>
                  </div>
                  {activities.length > 0 ? (
                    <ol className="rd-activity-list">
                      {activities.map((activity) => (
                        <li key={activity.id} className="rd-activity-item">
                          <span className="rd-activity-dot" aria-hidden="true" />
                          <span className="rd-activity-description">
                            {formatActivityDescription(activity)}
                          </span>
                          <time dateTime={activity.created_at}>
                            {new Date(activity.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </time>
                        </li>
                      ))}
                    </ol>
                  ) : !activitiesError ? (
                    <p>No recent activity yet. Changes you make in Admin will appear here.</p>
                  ) : null}
                </section>
              </div>
            </div>
            <div className="rd-info-card rd-portfolio-management-card">
              <h3>Portfolio Management</h3>
              <p>Changes saved through the editors are stored in Supabase and reflected on your public portfolio after refresh.</p>
              <a href="/" target="_blank" rel="noopener noreferrer">View Public Portfolio ↗</a>
            </div>
          </div>
        );
      }
    }
  }

  return (
    <div className="rd-admin-layout">
      <aside className={`rd-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="rd-sidebar-brand">
          <img src="/primary-logo.png" alt="RD Logo" />
          <div><strong>RD Command Center</strong><small>// V3 PORTFOLIO ADMIN</small></div>
        </div>
        <div className="rd-sidebar-label">WORKSPACE</div>
        <div className="rd-sidebar-navigation">
          <button type="button" className={`rd-nav-item ${activePage === 'overview' ? 'active' : ''}`} onClick={() => navigate('overview')}>
            <span>▣</span><span>Dashboard</span>
          </button>
          <button type="button" className="rd-nav-item rd-nav-parent" aria-expanded={cmsOpen} onClick={() => setCmsOpen((current) => !current)}>
            <span>▤</span><span>CMS</span><span className={`rd-nav-chevron ${cmsOpen ? 'open' : ''}`}>›</span>
          </button>
          {cmsOpen && (
            <div className="rd-nav-children">
              {([['profile', 'Profile'], ['roles', 'Roles'], ['skills', 'Skills'], ['projects', 'Projects']] as const).map(([id, label]) => (
                <button type="button" key={id} className={`rd-nav-item rd-nav-child ${activePage === id ? 'active' : ''}`} onClick={() => navigate(id)}>
                  <span>•</span><span>{label}</span>
                </button>
              ))}
            </div>
          )}
          <button type="button" className="rd-nav-item rd-nav-parent" aria-expanded={knowledgeOpen} onClick={() => {
            setKnowledgeOpen((current) => !current);
            setActivePage('knowledge');
            setSelectedCourseId(null);
            setSidebarOpen(false);
          }}>
            <span>◈</span><span>Courses</span><span className={`rd-nav-chevron ${knowledgeOpen ? 'open' : ''}`}>›</span>
          </button>
          {knowledgeOpen && (
            <div className="rd-nav-children">
              {sidebarCourses.map((course) => (
                <button type="button" key={course.id} className={`rd-nav-item rd-nav-child ${activePage === 'knowledge' && selectedCourseId === course.id ? 'active' : ''}`}
                  onClick={() => { setActivePage('knowledge'); setSelectedCourseId(course.id); setSidebarOpen(false); }}>
                  <span>◦</span><span>{course.title}</span>
                </button>
              ))}
            </div>
          )}
          <button type="button" className={`rd-nav-item ${activePage === 'notes' ? 'active' : ''}`} onClick={() => navigate('notes')}>
            <span>▣</span><span>Notes</span>
          </button>
        </div>
        <div className="rd-sidebar-footer">
          <a href="/" target="_blank" rel="noopener noreferrer">↗ View Website</a>
          <button type="button" onClick={() => void onLogout()}>↪ Sign Out</button>
        </div>
      </aside>
      {sidebarOpen && <button type="button" className="rd-sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <div className="rd-main-area">
        <header className="rd-topbar">
          <button type="button" className="rd-menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle navigation">☰</button>
          <div><span className="rd-topbar-subtitle">PORTFOLIO CMS</span><h1>{menuItems.find((item) => item.id === activePage)?.label}</h1></div>
          <span className="rd-admin-status"><span className="rd-status-dot" />Admin Session</span>
        </header>
        <main className="rd-content">{renderContent()}</main>
      </div>
    </div>
  );
}
