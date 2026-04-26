/**
 * ChatBot — AI-powered floating chatbot widget.
 * Uses the /api/chatbot backend endpoint (keyword-AI with Dialogflow hook).
 * Shows on all pages via App.jsx.
 */
import React, { useState, useRef, useEffect } from 'react';
import api from '../api';

const QUICK_REPLIES = [
  { label: '📋 Available tasks',  text: 'Show me available tasks'       },
  { label: '📊 My task status',   text: 'What is my task status?'       },
  { label: '🏆 Leaderboard',      text: 'Show me the leaderboard'        },
  { label: '❓ Help',              text: 'Help'                           },
];

const INITIAL_MSGS = [
  {
    role: 'bot',
    text: "👋 Hi! I'm **VolunteerAI Assistant**. I can help you with task availability, status updates, and more. What would you like to know?",
  },
];

function formatText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

export default function ChatBot() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState(INITIAL_MSGS);
  const [input, setInput]       = useState('');
  const [typing, setTyping]     = useState(false);
  const bottomRef               = useRef(null);
  const inputRef                = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const sendMessage = async (text = input.trim()) => {
    if (!text) return;
    const userMsg = { role: 'user', text };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const res = await api.sendChatMessage(text);
      setMessages((m) => [...m, { role: 'bot', text: res.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'bot', text: "Sorry, I'm having trouble connecting right now. Please try again." },
      ]);
    } finally {
      setTyping(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[500] flex flex-col items-end gap-6 text-slate-900 dark:text-white">
      {/* Chat panel */}
      {open && (
        <div
          id="chatbot-panel"
          className="w-[380px] max-w-[calc(100vw-40px)] h-[540px] max-h-[calc(100vh-140px)] glass-card shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-br from-primary-500/10 to-violet-500/10 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-xl shadow-lg shadow-primary-500/20">
                🤖
              </div>
              <div>
                <div className="font-bold text-sm leading-tight">VolunteerAI Assistant</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-soft" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Active Now</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white rounded-2xl rounded-tr-none shadow-lg shadow-primary-500/20 font-medium'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-2xl rounded-tl-none border border-slate-200 dark:border-white/10'
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                />
              </div>
            ))}
            {typing && (
              <div className="flex justify-start animate-fade-in">
                <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl rounded-tl-none px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
            {messages.length <= 2 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {QUICK_REPLIES.map((q) => (
                  <button
                    key={q.text}
                    onClick={() => sendMessage(q.text)}
                    className="px-3 py-1.5 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-full text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:border-primary-500 hover:text-primary-500 transition-all active:scale-95"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="How can I help you today?"
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-900 dark:text-white"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || typing}
                className="w-12 h-12 bg-primary-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 disabled:opacity-50 transition-all active:scale-95"
              >
                ➤
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        id="chatbot-toggle-btn"
        onClick={() => setOpen((o) => !o)}
        className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-xl shadow-primary-500/40 flex items-center justify-center text-2xl text-white transition-all active:scale-90 ${
          open ? 'rotate-90' : 'animate-pulse-soft hover:scale-110'
        }`}
        title="AI Assistant"
      >
        {open ? '✕' : '🤖'}
      </button>
    </div>
  );
}


