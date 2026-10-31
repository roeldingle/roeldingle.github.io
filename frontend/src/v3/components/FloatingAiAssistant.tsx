import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { PortfolioProfile } from '../../types/portfolio';

type ChatMessage = {
  role: 'assistant' | 'user';
  text: string;
};

type FloatingAiAssistantProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  triggerPrompt: string;
  portfolio: PortfolioProfile;
};

function createPortfolioAnswer(
  promptText: string,
  portfolio: PortfolioProfile
): string {
  const normalizedPrompt = promptText.toLowerCase();
  const requestedProject = portfolio.projects.find((project) =>
    normalizedPrompt.includes(project.title.toLowerCase())
  );

  if (requestedProject) {
    const projectTechnologies = requestedProject.technologies.length
      ? ` Technologies include ${requestedProject.technologies.join(', ')}.`
      : '';

    return `${requestedProject.title}: ${requestedProject.description}${projectTechnologies}`;
  }

  const skillNames = portfolio.skills.map((skill) => skill.name);

  if (
    normalizedPrompt.includes('stack') ||
    normalizedPrompt.includes('tech') ||
    normalizedPrompt.includes('framework')
  ) {
    return skillNames.length
      ? `Roel's listed technical skills include ${skillNames.join(', ')}.`
      : 'There are no technical skills listed in the portfolio yet.';
  }

  if (
    normalizedPrompt.includes('ai') ||
    normalizedPrompt.includes('rag') ||
    normalizedPrompt.includes('llm')
  ) {
    const aiSkills = portfolio.skills
      .filter((skill) => /ai|rag|llm|vector/i.test(`${skill.name} ${skill.category}`))
      .map((skill) => skill.name);
    const aiProjects = portfolio.projects
      .filter((project) => /ai|rag|llm|studyquest/i.test(`${project.title} ${project.description}`))
      .map((project) => project.title);
    const relatedWork = [...aiSkills, ...aiProjects];

    return relatedWork.length
      ? `AI-related skills and projects include ${relatedWork.join(', ')}.`
      : `${portfolio.name}'s portfolio does not list AI-specific skills or projects yet.`;
  }

  if (
    normalizedPrompt.includes('test') ||
    normalizedPrompt.includes('playwright') ||
    normalizedPrompt.includes('matrix') ||
    normalizedPrompt.includes('devops')
  ) {
    const engineeringSkills = portfolio.skills
      .filter((skill) => /test|playwright|selenium|jenkins|devops|ci\/cd/i.test(`${skill.name} ${skill.category}`))
      .map((skill) => skill.name);

    return engineeringSkills.length
      ? `Testing and delivery technologies in the portfolio include ${engineeringSkills.join(', ')}.`
      : 'There are no testing or delivery technologies listed in the portfolio yet.';
  }

  if (
    normalizedPrompt.includes('about') ||
    normalizedPrompt.includes('leader') ||
    normalizedPrompt.includes('experience') ||
    normalizedPrompt.includes('roel')
  ) {
    return `${portfolio.name} — ${portfolio.headline}. ${portfolio.biography}`;
  }

  if (
    normalizedPrompt.includes('contact') ||
    normalizedPrompt.includes('hire') ||
    normalizedPrompt.includes('email')
  ) {
    const socialLinks = portfolio.socialLinks
      .map((link) => `${link.platform}: ${link.url}`)
      .join(' | ');

    return socialLinks
      ? `You can connect with ${portfolio.name} here: ${socialLinks}`
      : 'No contact links are listed in the portfolio yet.';
  }

  const projectTitles = portfolio.projects.map((project) => project.title);
  return projectTitles.length
    ? `Explore ${portfolio.name}'s projects: ${projectTitles.join(', ')}.`
    : `Explore ${portfolio.name}'s portfolio to learn more about their work.`;
}

export default function FloatingAiAssistant({
  isOpen,
  setIsOpen,
  triggerPrompt,
  portfolio,
}: FloatingAiAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: `Hello! I'm ${portfolio.name}'s AI assistant. Ask me about their skills, background, or projects.`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const portfolioDataRef = useRef(portfolio);

  useEffect(() => {
    portfolioDataRef.current = portfolio;
  }, [portfolio]);

  const handleSendPrompt = useCallback((userPrompt: string) => {
    if (!userPrompt.trim()) return;

    setMessages((currentMessages) => [
      ...currentMessages,
      { role: 'user', text: userPrompt },
    ]);
    setInputValue('');
    setIsTyping(true);

    window.setTimeout(() => {
      const assistantReply = createPortfolioAnswer(
        userPrompt,
        portfolioDataRef.current
      );

      setMessages((currentMessages) => [
        ...currentMessages,
        { role: 'assistant', text: assistantReply },
      ]);
      setIsTyping(false);
    }, 600);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (triggerPrompt) {
      // Defer this prop-triggered action so state updates run outside the
      // effect body; cleanup cancels a stale prompt if the request changes.
      const promptTimer = window.setTimeout(() => {
        setIsOpen(true);
        handleSendPrompt(`Tell me more about ${triggerPrompt}`);
      }, 0);

      return () => {
        window.clearTimeout(promptTimer);
      };
    }
  }, [triggerPrompt, handleSendPrompt, setIsOpen]);

  return (
    <>
      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          id="v3-ai-chat-panel"
          className="ai-modal-box"
          role="dialog"
          aria-modal="false"
          aria-labelledby="v3-ai-chat-title"
          style={{
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 24px 48px -12px rgba(15, 23, 42, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 9999
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} className="pulsing-dot ai-status-dot"></span>
              <span id="v3-ai-chat-title" style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em' }}>ASK MY AI ASSISTANT</span>
            </div>
            <button
              className="ai-modal-close"
              type="button"
              aria-label="Close AI assistant"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                fontSize: '18px',
                cursor: 'pointer',
                padding: '0 4px',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>

          {/* Quick Prompts */}
          <div style={{
            display: 'flex',
            gap: '6px',
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {['Tech Stack?', 'AI Projects?', 'Leadership Experience?'].map((quick) => (
              <button
                key={quick}
                className="ai-quick-prompt"
                type="button"
                onClick={() => handleSendPrompt(quick)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#e2e8f0',
                  fontSize: '11px',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                {quick}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="custom-scrollbar" aria-live="polite" aria-relevant="additions text" style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background: msg.role === 'user' ? '#2563eb' : 'rgba(255, 255, 255, 0.07)',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  lineHeight: '1.5',
                  border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '8px 12px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                fontSize: '11px',
                color: '#94a3b8'
              }}>
                Typing response...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(inputValue);
            }}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything about Roel's background..."
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '10px',
                padding: '8px 12px',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            <button
              className="ai-send-button"
              type="submit"
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        className={`ai-fab-btn${isOpen ? ' is-open' : ''}`}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="v3-ai-chat-panel"
        aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '28px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 20px',
          background: '#0f172a',
          color: '#ffffff',
          borderRadius: '999px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 12px 28px -4px rgba(15, 23, 42, 0.35)',
          cursor: 'pointer',
          zIndex: 9998,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} className="pulsing-dot ai-status-dot"></span>
        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em' }}>
          {isOpen ? 'Close Assistant' : 'Ask My AI'}
        </span>
      </button>
    </>
  );
}
