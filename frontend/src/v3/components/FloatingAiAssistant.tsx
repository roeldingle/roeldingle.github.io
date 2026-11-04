import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { PortfolioProfile } from '../../types/portfolio';

type ChatMessage = {
  role: 'assistant' | 'user';
  text: string;
  provider?: string;
};

type FloatingAiAssistantProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  triggerPrompt: string;
  portfolio: PortfolioProfile;
  onTriggerHandled?: () => void;
};

const BACKEND_BASE_URL = (
  import.meta.env.VITE_AI_BACKEND_URL || 'https://ai-resume-chat-bdov.onrender.com'
).replace(/\/+$/, '');

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
  onTriggerHandled,
}: FloatingAiAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: `Hello! I'm ${portfolio.name}'s AI assistant. Ask me about their background, technical stack, DevOps leadership, or AI RAG projects!`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'waking' | 'connected' | 'fallback'>('waking');
  const [activeProvider, setActiveProvider] = useState<string>('');
  const isChatDisabled = backendStatus === 'waking' || isTyping;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const portfolioDataRef = useRef(portfolio);
  const messagesRef = useRef(messages);
  const lastHandledTriggerPromptRef = useRef<string>('');

  useEffect(() => {
    portfolioDataRef.current = portfolio;
  }, [portfolio]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Keep checking until Render has finished starting its web service.
  useEffect(() => {
    let isComponentMounted = true;
    let retryTimer: number | undefined;
    let activeController: AbortController | undefined;

    const checkBackendReadiness = async () => {
      const controller = new AbortController();
      activeController = controller;
      const timeoutId = window.setTimeout(() => controller.abort(), 12000);

      try {
        const response = await fetch(`${BACKEND_BASE_URL}/`, {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (response.ok && isComponentMounted) {
          setBackendStatus('connected');
          return;
        }
      } catch {
        // A failed health check is expected while Render is starting up.
      } finally {
        window.clearTimeout(timeoutId);
      }

      if (isComponentMounted) {
        retryTimer = window.setTimeout(() => {
          void checkBackendReadiness();
        }, 3000);
      }
    };

    void checkBackendReadiness();

    return () => {
      isComponentMounted = false;
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
      }
      activeController?.abort();
    };
  }, []);

  const handleSendPrompt = useCallback(async (userPrompt: string) => {
    const trimmed = userPrompt.trim();
    if (!trimmed || backendStatus === 'waking' || isTyping) return;

    setInputValue('');
    setMessages((current) => [...current, { role: 'user', text: trimmed }]);
    setIsTyping(true);

    const historyPayload = messagesRef.current.slice(-4).map((msg) => ({
      role: msg.role,
      content: msg.text,
    }));

    let streamSuccess = false;

    try {
      const controller = new AbortController();
      // Render free tier can take up to 45s on cold start; give adequate window
      const timeoutId = window.setTimeout(() => controller.abort(), 45000);

      const response = await fetch(`${BACKEND_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: trimmed,
          history: historyPayload,
        }),
        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      if (response.ok && response.body) {
        setBackendStatus('connected');
        const providerHeader = response.headers.get('X-Model-Provider') || '';
        if (providerHeader) {
          setActiveProvider(providerHeader);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let accumulated = '';

        setMessages((current) => [
          ...current,
          {
            role: 'assistant',
            text: '',
            provider: providerHeader || undefined,
          },
        ]);
        setIsTyping(false);
        streamSuccess = true;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          setMessages((current) => {
            const updated = [...current];
            const lastIdx = updated.length - 1;
            if (lastIdx >= 0 && updated[lastIdx].role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                text: accumulated,
              };
            }
            return updated;
          });
        }
      }
    } catch (err) {
      console.warn('Backend stream unavailable, using offline fallback:', err);
    } finally {
      setIsTyping(false);
    }

    if (!streamSuccess) {
      setBackendStatus('fallback');
      const fallbackReply = createPortfolioAnswer(
        trimmed,
        portfolioDataRef.current
      );
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: fallbackReply,
          provider: 'Offline Knowledge Base',
        },
      ]);
    }
  }, [backendStatus, isTyping]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!triggerPrompt) {
      lastHandledTriggerPromptRef.current = '';
      return;
    }

    if (
      backendStatus === 'connected' &&
      !isTyping &&
      triggerPrompt !== lastHandledTriggerPromptRef.current
    ) {
      const promptTimer = window.setTimeout(() => {
        lastHandledTriggerPromptRef.current = triggerPrompt;
        setIsOpen(true);
        void handleSendPrompt(`Tell me more about ${triggerPrompt}`);
        onTriggerHandled?.();
      }, 0);

      return () => {
        window.clearTimeout(promptTimer);
      };
    }
  }, [triggerPrompt, backendStatus, isTyping, handleSendPrompt, setIsOpen, onTriggerHandled]);

  // Status indicator helpers
  const getStatusDotColor = () => {
    if (backendStatus === 'connected') return '#10B981'; // Green
    if (backendStatus === 'waking') return '#f59e0b';    // Amber
    return '#94a3b8';                                  // Muted grey fallback
  };

  const getStatusLabel = () => {
    if (backendStatus === 'connected') {
      return activeProvider ? `AI Copilot (${activeProvider})` : 'AI Copilot Ready';
    }
    if (backendStatus === 'waking') return 'Waking AI Server...';
    return 'Offline Mode (Local Knowledge)';
  };

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
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: getStatusDotColor(),
                  }}
                  className="pulsing-dot ai-status-dot"
                />
                <span
                  id="v3-ai-chat-title"
                  style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em' }}
                >
                  ASK ROEL'S AI COPILOT
                </span>
              </div>
              <span style={{ fontSize: '10px', color: '#94a3b8', paddingLeft: '16px' }}>
                {getStatusLabel()}
              </span>
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
                lineHeight: 1,
              }}
            >
              ✕
            </button>
          </div>

          {/* Quick Prompts */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            {['Tech Stack?', 'Leadership Experience?', 'Automation Stack?'].map((quick) => (
              <button
                key={quick}
                className="ai-quick-prompt"
                type="button"
                onClick={() => handleSendPrompt(quick)}
                disabled={isChatDisabled}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#e2e8f0',
                  fontSize: '11px',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  cursor: isChatDisabled ? 'not-allowed' : 'pointer',
                  opacity: isChatDisabled ? 0.5 : 1,
                  transition: 'background 0.15s ease',
                }}
              >
                {quick}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div
            className="custom-scrollbar"
            aria-live="polite"
            aria-relevant="additions text"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((chatMessage, messageIndex) => (
              <div
                key={messageIndex}
                className={
                  chatMessage.role === 'user'
                    ? 'ai-message-bubble-user'
                    : 'ai-message-bubble-assistant'
                }
                style={{
                  alignSelf: chatMessage.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius:
                    chatMessage.role === 'user'
                      ? '14px 14px 2px 14px'
                      : '14px 14px 14px 2px',
                  fontSize: '12.5px',
                  lineHeight: '1.5',
                }}
              >
                {chatMessage.role === 'assistant' ? (
                  <div className="assistant-markdown">
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {chatMessage.text ||
                        (isTyping && messageIndex === messages.length - 1
                          ? 'Thinking...'
                          : '')}
                    </Markdown>
                    {chatMessage.provider && (
                      <span className="ai-message-provider-tag">
                        ⚡ {chatMessage.provider}
                      </span>
                    )}
                  </div>
                ) : (
                  chatMessage.text
                )}
              </div>
            ))}
            {isTyping && (
              <div className="ai-typing-indicator">
                Generating live response...
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
              background: 'rgba(255, 255, 255, 0.02)',
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                backendStatus === 'waking'
                  ? 'AI assistant is waking up...'
                  : "Ask anything about Roel's background..."
              }
              className="ai-chat-input"
              disabled={isChatDisabled}
              style={{
                flex: 1,
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '12px',
                outline: 'none',
                cursor: isChatDisabled ? 'not-allowed' : 'text',
              }}
            />
            <button
              className="ai-send-button"
              type="submit"
              disabled={isChatDisabled}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: isChatDisabled ? 'not-allowed' : 'pointer',
                opacity: isChatDisabled ? 0.6 : 1,
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
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: getStatusDotColor(),
          }}
          className="pulsing-dot ai-status-dot"
        />
        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em' }}>
          {isOpen ? 'Close Assistant' : "Ask Roel's AI"}
        </span>
      </button>
    </>
  );
}
