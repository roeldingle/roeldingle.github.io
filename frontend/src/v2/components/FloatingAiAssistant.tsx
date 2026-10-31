import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { aiKnowledgeBase } from '../data/portfolioData';

type FloatingAiAssistantProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  triggerPrompt: string;
};

type Message = {
  role: 'assistant' | 'user';
  text: string;
};

export default function FloatingAiAssistant({
  isOpen,
  setIsOpen,
  triggerPrompt,
}: FloatingAiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hello! I'm Roel's AI assistant. Ask me anything about his technical stack, leadership background, or active AI projects." }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendPrompt = useCallback((userText: string) => {
    if (!userText.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = "Roel is dedicated to building robust software architectures and innovative AI systems. You can explore his projects or review his stack directly on this dashboard.";
      const lower = userText.toLowerCase();

      if (lower.includes('stack') || lower.includes('tech') || lower.includes('framework')) {
        reply = aiKnowledgeBase.stack;
      } else if (lower.includes('ai') || lower.includes('rag') || lower.includes('study tracker') || lower.includes('llm')) {
        reply = aiKnowledgeBase.ai;
      } else if (lower.includes('test') || lower.includes('playwright') || lower.includes('matrix') || lower.includes('devops')) {
        reply = aiKnowledgeBase.testing;
      } else if (lower.includes('about') || lower.includes('leader') || lower.includes('experience') || lower.includes('roel')) {
        reply = aiKnowledgeBase.about;
      } else if (lower.includes('contact') || lower.includes('hire') || lower.includes('email')) {
        reply = aiKnowledgeBase.contact;
      }

      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 600);
  }, []);

  useEffect(() => {
    if (!triggerPrompt) return;

    const timeoutId = window.setTimeout(() => {
      setIsOpen(true);
      handleSendPrompt(`Tell me more about ${triggerPrompt}`);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    }
  }, [handleSendPrompt, setIsOpen, triggerPrompt]);

  return (
    <>
      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="v2-assistant-panel" style={{
          animation: 'fadeInUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
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
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} className="pulsing-dot"></span>
              <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em' }}>ASK MY AI ASSISTANT</span>
            </div>
            <button
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
          <div className="custom-scrollbar" style={{
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
        className="v2-assistant-toggle"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          transform: isOpen ? 'scale(0.96)' : 'scale(1)'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = isOpen ? 'scale(0.96)' : 'scale(1)'}
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8' }} className="pulsing-dot"></span>
        <span style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.02em' }}>
          {isOpen ? 'Close Assistant' : 'Ask My AI'}
        </span>
      </button>
    </>
  );
}
