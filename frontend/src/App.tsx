import { portfolio } from './data/portfolio';
import './App.css';

function App() {
  const sortedRoles = [...portfolio.roles].sort(
    (a, b) => a.displayOrder - b.displayOrder
  );

  const skillCategories = [...new Set(
    portfolio.skills.map((skill) => skill.category)
  )];

  return (
    <div className="portfolio-app">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Roel Dingle — Home">
          <img src="/logo.png" alt="RD Logo" className="brand-logo"/>
        </a>

        <nav aria-label="Main navigation">
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#ai">Ask My AI</a>
        </nav>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="hero-content">

            <h1>{portfolio.name}</h1>
            <h2>{portfolio.headline}</h2>

            <p className="hero-description">
              {portfolio.biography}
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#skills">
                Explore My Skills →
              </a>
              <a className="secondary-button" href="#ai">
                Ask My AI
              </a>
            </div>

            <div className="social-links">
              {portfolio.socialLinks.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.platform}
                </a>
              ))}
            </div>
          </div>

        </section>

        <section id="about" className="content-section">
          <p className="eyebrow">ABOUT ME</p>
          <h2>Professional Roles</h2>

          <div className="card-grid">
            {sortedRoles.map((role) => (
              <article className="info-card" key={role.id}>
                <span className="card-icon">◆</span>
                <h3>{role.title}</h3>
              </article>
            ))}
          </div>
        </section>

        <section id="skills" className="content-section">
          <p className="eyebrow">TECHNICAL EXPERTISE</p>
          <h2>Skills & Technologies</h2>

          <div className="card-grid">
            {skillCategories.map((category) => (
              <article className="info-card" key={category}>
                <h3>{category}</h3>
                <div className="skill-list">
                  {portfolio.skills
                    .filter((skill) => skill.category === category)
                    .map((skill) => (
                      <span className="skill-tag" key={skill.id}>
                        {skill.name}
                      </span>
                    ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="ai" className="content-section">
          <div className="ai-panel">
            <p className="eyebrow">COMING SOON</p>
            <h2>Ask My AI Assistant</h2>
            <p>
              Explore my experience, projects, and engineering knowledge
              through an AI-powered assistant built with Python, RAG,
              embeddings, and vector search.
            </p>
            <span className="ai-status">◆ AI integration planned</span>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        &copy; {new Date().getFullYear()} {portfolio.name}.
        Built with React & TypeScript.
      </footer>
    </div>
  );
}

export default App;