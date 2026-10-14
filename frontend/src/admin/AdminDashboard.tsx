
import { useState } from 'react';
import ProfileEditor from './ProfileEditor';
import RolesEditor from './RolesEditor';
import SkillsEditor from './SkillsEditor';
import ProjectsEditor from './ProjectsEditor';
import './AdminDashboard.css';

type AdminPage = 'overview' | 'profile' | 'roles' | 'skills' | 'projects';

interface AdminDashboardProps {
  onLogout: () => Promise<void>;
}

const menuItems: { id: AdminPage; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'profile', label: 'Profile', icon: '◉' },
  { id: 'roles', label: 'Roles', icon: '▣' },
  { id: 'skills', label: 'Skills', icon: '✦' },
  { id: 'projects', label: 'Projects', icon: '▤' },
];

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activePage, setActivePage] = useState<AdminPage>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function navigate(page: AdminPage) {
    setActivePage(page);
    setSidebarOpen(false);
  }

  function renderContent() {
    switch (activePage) {
      case 'profile':
        return <ProfileEditor />;
      case 'roles':
        return <RolesEditor />;
      case 'skills':
        return <SkillsEditor />;
      case 'projects':
        return <ProjectsEditor />;
      default:
        return (
          <div className="rd-overview">
            <div className="rd-welcome">
              <h2>Welcome to RD Command Center</h2>
              <p>
                Manage your portfolio, professional experience,
                technical skills, and published projects.
              </p>
            </div>

            <div className="rd-stats">
              {menuItems.slice(1).map((item) => (
                <button
                  key={item.id}
                  className="rd-stat-card"
                  onClick={() => navigate(item.id)}
                >
                  <span className="rd-stat-icon">{item.icon}</span>
                  <strong>{item.label}</strong>
                  <small>Manage {item.label.toLowerCase()}</small>
                  <span className="rd-stat-arrow">↗</span>
                </button>
              ))}
            </div>

            <div className="rd-info-card">
              <h3>Portfolio Management</h3>
              <p>
                Changes saved through the editors are stored in Supabase
                and reflected on your public portfolio after refresh.
              </p>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Public Portfolio ↗
              </a>
            </div>
          </div>
        );
    }
  }

  return (
    <div className="rd-admin-layout">
      <aside className={`rd-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="rd-sidebar-brand">
          <img src="/primary-logo.png" alt="RD Logo" />
          <div>
            <strong>RD Command Center</strong>
            <small>Portfolio Administration</small>
          </div>
        </div>

        <div className="rd-sidebar-label">WORKSPACE</div>

        <nav className="rd-sidebar-nav" aria-label="Admin navigation">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`rd-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
              aria-current={activePage === item.id ? 'page' : undefined}
            >
              <span className="rd-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="rd-sidebar-footer">
          <a href="/" target="_blank" rel="noopener noreferrer">
            ↗ View Website
          </a>
          <button type="button" onClick={() => void onLogout()}>
            ↪ Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="rd-sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="rd-main-area">
        <header className="rd-topbar">
          <button
            type="button"
            className="rd-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>

          <div>
            <span className="rd-topbar-subtitle">PORTFOLIO CMS</span>
            <h1>{menuItems.find((item) => item.id === activePage)?.label}</h1>
          </div>

          <span className="rd-admin-status">
            <span className="rd-status-dot" />
            Admin Session
          </span>
        </header>

        <main className="rd-content">{renderContent()}</main>
      </div>
    </div>
  );
}
