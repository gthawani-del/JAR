'use client';

import { Send, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { prompts } from '@/lib/cms/data';

type Msg = { id: string; role: 'user' | 'assistant'; content: string };

export function AskJarConsole({ initialQuestion }: { initialQuestion?: string }) {
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'intro', role: 'assistant', content: 'Welcome to Ask JAR. Submit a strategic question to begin an advisory intelligence conversation.' },
  ]);
  const [conversationId, setConversationId] = useState<string>();
  const [text, setText] = useState(initialQuestion ?? '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [busy, setBusy] = useState(false);
  const initialQuestionSent = useRef(false);

  const send = useCallback(
    async (message = text) => {
      if (!message.trim()) return;
      setBusy(true);
      setText('');
      const res = await fetch('/api/ask-jar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conversationId, message, name: name || undefined, email: email || undefined, company: company || undefined }),
      });
      const data = await res.json();
      setConversationId(data.conversation.id);
      setMessages((prev) => [...prev, ...data.messages]);
      setBusy(false);
    },
    [company, conversationId, email, name, text],
  );

  useEffect(() => {
    if (!initialQuestion || initialQuestionSent.current) return;
    initialQuestionSent.current = true;
    void send(initialQuestion);
  }, [initialQuestion, send]);

  return (
    <div className="console grid min-h-[640px] gap-0 overflow-hidden lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col p-6">
        <div className="border-b border-[var(--gold)]/30 pb-4">
          <p className="gold text-xs font-black uppercase tracking-widest">Conversation Console</p>
          <h2 className="serif mt-2 text-3xl">Ask JAR</h2>
        </div>
        <div className="flex-1 space-y-4 overflow-auto py-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === 'user'
                  ? 'ml-auto max-w-2xl rounded-lg border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-4'
                  : 'max-w-2xl rounded-lg border border-white/10 bg-white/5 p-4'
              }
            >
              <p className="mb-2 text-xs font-black uppercase text-[var(--gold)]">{message.role === 'user' ? 'You' : 'JAR Intelligence'}</p>
              <p className="leading-7 text-stone-100">{message.content}</p>
            </div>
          ))}
          {busy && <div className="text-sm text-stone-400">JAR Intelligence is structuring the response…</div>}
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
          className="flex gap-3 border-t border-[var(--gold)]/30 pt-4"
        >
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={2}
            className="min-w-0 flex-1 rounded-md border border-[var(--gold)]/50 bg-black/20 p-4 outline-none"
            placeholder="Ask a strategic question..."
          />
          <button className="btn btn-primary self-end" disabled={busy}>
            Send <Send size={16} />
          </button>
        </form>
      </div>
      <aside className="border-t border-[var(--gold)]/30 p-6 lg:border-l lg:border-t-0">
        <div className="rounded-lg border border-[var(--gold)]/40 p-5">
          <p className="gold text-xs font-black uppercase">Lead Capture</p>
          <p className="mt-3 text-sm leading-6 text-stone-300">Share details to route this conversation for advisory review.</p>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" className="mt-4 w-full rounded-md border border-[var(--gold)]/40 bg-transparent p-3" />
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" className="mt-3 w-full rounded-md border border-[var(--gold)]/40 bg-transparent p-3" />
          <input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company optional" className="mt-3 w-full rounded-md border border-[var(--gold)]/40 bg-transparent p-3" />
        </div>
        <p className="gold mt-6 text-xs font-black uppercase">Suggested prompts</p>
        <div className="mt-3 space-y-3">
          {prompts.map((prompt) => (
            <button key={prompt} onClick={() => void send(prompt)} className="flex w-full items-center justify-between rounded-md border border-[var(--gold)]/35 p-3 text-left text-sm">
              {prompt}
              <Sparkles className="gold" size={14} />
            </button>
          ))}
        </div>
      </aside>
    </div>
  );
}
