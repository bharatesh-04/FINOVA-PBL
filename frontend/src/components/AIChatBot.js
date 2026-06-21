import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageCircle, FiMic, FiMicOff, FiSend, FiVolume2, FiX } from 'react-icons/fi';
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
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(true);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const shouldSpeakRef = useRef(false);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const voiceSupported = Boolean(SpeechRecognition);
  const canSpeak = 'speechSynthesis' in window;

  const openChat = () => {
    setIsOpen(true);
    window.setTimeout(() => inputRef.current?.focus(), 80);
  };

  const speak = (text) => {
    if (!canSpeak || !voiceReplies || !text) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  const handleLocalCommand = (text) => {
    const normalized = text.toLowerCase();
    const routes = [
      { label: 'Dashboard', path: '/dashboard', terms: ['dashboard', 'home'] },
      { label: 'Transactions', path: '/transactions', terms: ['transactions', 'expenses', 'expense list'] },
      { label: 'Accounts', path: '/accounts', terms: ['accounts', 'balance'] },
      { label: 'Budgets', path: '/budgets', terms: ['budgets', 'budget', 'smart budget', 'generate budget'] },
      { label: 'Goals', path: '/goals', terms: ['goals', 'saving goals'] },
      { label: 'Analytics', path: '/analytics', terms: ['analytics', 'prediction', 'forecast', 'reports'] },
      { label: 'Bills', path: '/bills', terms: ['bills', 'receipts', 'scanner'] },
    ];

    const route = routes.find((item) => (
      (normalized.includes('open') || normalized.includes('show') || normalized.includes('go to') || normalized.includes('generate'))
      && item.terms.some((term) => normalized.includes(term))
    ));

    if (!route) {
      return null;
    }

    navigate(route.path);
    return `Opening ${route.label}.`;
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

    const localReply = handleLocalCommand(trimmed);
    if (localReply) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: localReply,
        },
      ]);
      if (shouldSpeakRef.current) {
        speak(localReply);
        shouldSpeakRef.current = false;
      }
      return;
    }

    setIsSending(true);

    try {
      const response = await chatAPI.sendMessage(trimmed);
      const replyText = response.data?.message || 'I could not find an answer for that yet.';
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: replyText,
        },
      ]);
      if (shouldSpeakRef.current) {
        speak(replyText);
        shouldSpeakRef.current = false;
      }
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

  const startVoiceInput = () => {
    if (!voiceSupported || isSending) {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-voice-error`,
          role: 'assistant',
          text: 'Voice input is not available in this browser.',
        },
      ]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      setInput(transcript);
      shouldSpeakRef.current = true;
      sendMessage(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-voice-error`,
          role: 'assistant',
          text: 'I could not hear that clearly. Try again.',
        },
      ]);
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const stopVoiceInput = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
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
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setVoiceReplies((value) => !value)}
                disabled={!canSpeak}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-40 ${
                  voiceReplies ? 'text-blue-600' : ''
                }`}
                aria-label={voiceReplies ? 'Disable voice replies' : 'Enable voice replies'}
                title={voiceReplies ? 'Disable voice replies' : 'Enable voice replies'}
              >
                <FiVolume2 size={17} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-gray-100"
                aria-label="Close chat"
                title="Close chat"
              >
                <FiX size={18} />
              </button>
            </div>
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
              <button
                type="button"
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                disabled={!voiceSupported || isSending}
                className={`btn-secondary inline-flex h-10 w-10 items-center justify-center p-0 disabled:opacity-60 ${
                  isListening ? 'text-red-500' : ''
                }`}
                aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                title={isListening ? 'Stop listening' : 'Start voice input'}
              >
                {isListening ? <FiMicOff size={17} /> : <FiMic size={17} />}
              </button>
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
            {isListening && (
              <p className="mt-2 text-xs" style={{ color: 'var(--app-muted)' }}>Listening...</p>
            )}
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
