import React, { useRef, useState } from 'react';
import { FiMessageCircle, FiSend, FiX } from 'react-icons/fi';
import { chatAPI } from '../services/api';
import { extractErrorMessage } from '../utils/helpers';

const initialMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Hi, I am FINNOVA AI. Ask me about your spending, budgets, goals, bills, or account balance.',
  },
];

const initialSuggestions = [
  'How am I doing this month?',
  'Where am I spending the most?',
  'Show my budget status',
  'Forecast expenses',
];

export default function AIChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef(null);

  const openChat = () => {
    setIsOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 80);
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) {
      return;
    }

    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: trimmed,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const response = await chatAPI.sendMessage(trimmed);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: response.data?.message || 'I could not find an answer for that yet.',
        },
      ]);
      if (Array.isArray(response.data?.suggestions) && response.data.suggestions.length > 0) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          text: extractErrorMessage(error),
        },
      ]);
    } finally {
      setIsSending(false);
      window.setTimeout(() => inputRef.current?.focus(), 80);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end">
      {isOpen && (
        <section
          className="mb-3 w-[22rem] max-w-full overflow-hidden rounded-lg border shadow-2xl"
          style={{
            backgroundColor: 'var(--app-surface)',
            borderColor: 'var(--app-border)',
            color: 'var(--app-text)',
          }}
          aria-label="FINNOVA AI chat"
        >
          <header className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--app-border)' }}>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">FINNOVA AI</p>
              <p className="truncate text-xs" style={{ color: 'var(--app-muted)' }}>Finance assistant</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
              aria-label="Close chat"
              title="Close chat"
            >
              <FiX size={18} />
            </button>
          </header>

          <div className="max-h-80 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <p
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <p className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-800">Thinking...</p>
              </div>
            )}
          </div>

          <div className="border-t px-4 py-3" style={{ borderColor: 'var(--app-border)' }}>
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  disabled={isSending}
                  className="rounded-lg border px-2.5 py-1.5 text-xs transition-colors hover:bg-gray-100 disabled:opacity-60"
                  style={{ borderColor: 'var(--app-border)' }}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="input-field min-w-0 flex-1 text-sm"
                placeholder="Ask about your finances"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                className="btn-primary inline-flex h-10 w-10 items-center justify-center p-0 disabled:opacity-60"
                aria-label="Send message"
                title="Send message"
              >
                <FiSend size={17} />
              </button>
            </form>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={isOpen ? () => setIsOpen(false) : openChat}
        className="btn-primary inline-flex h-14 w-14 items-center justify-center rounded-lg p-0 shadow-xl"
        aria-label={isOpen ? 'Close FINNOVA AI chat' : 'Open FINNOVA AI chat'}
        title={isOpen ? 'Close FINNOVA AI chat' : 'Open FINNOVA AI chat'}
      >
        {isOpen ? <FiX size={24} /> : <FiMessageCircle size={24} />}
      </button>
    </div>
  );
}
