"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Plus, MessageCircle, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/components/AuthContext";
import PaywallModal from "@/components/PaywallModal";
import { track } from "@/components/PostHogProvider";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  updated_at: string;
};

const WELCOME =
  "Co Cię dziś interesuje? Mogę opowiedzieć o Twoim kosmogramie, dzisiejszym układzie planet, albo odpowiedzieć na pytanie o konkretną sytuację.";

const STARTERS = [
  "Dlaczego ostatnio jestem taki/a zmęczony/a?",
  "Co mój kosmogram mówi o relacjach?",
  "Czy to dobry moment na zmianę pracy?",
  "Co dziś powinienem/powinnam wiedzieć?",
];

export default function ChatPage() {
  const { session } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showConvList, setShowConvList] = useState(false);
  const [error, setError] = useState("");
  const [showPaywall, setShowPaywall] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const convListRef = useRef<HTMLDivElement>(null);

  const authHeader = useCallback((): Record<string, string> =>
    session ? { Authorization: `Bearer ${session.access_token}` } : {}
  , [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Close conv list on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (convListRef.current && !convListRef.current.contains(e.target as Node)) {
        setShowConvList(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadConversations = useCallback(async () => {
    if (!session) return;
    const res = await fetch("/api/chat/conversations", { headers: authHeader() });
    if (!res.ok) return;
    const { conversations: data } = await res.json() as { conversations: Conversation[] };
    setConversations(data ?? []);
  }, [session, authHeader]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  async function openConversation(id: string) {
    setActiveId(id);
    setShowConvList(false);
    setLoadingHistory(true);
    setMessages([]);
    setError("");
    try {
      const res = await fetch(`/api/chat/history?id=${id}`, { headers: authHeader() });
      const { messages: data } = await res.json() as { messages: Message[] };
      setMessages(data ?? []);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function createConversation(): Promise<string | null> {
    const res = await fetch("/api/chat/new", { method: "POST", headers: authHeader() });
    if (!res.ok) { setError("Nie udało się stworzyć rozmowy"); return null; }
    const { id } = await res.json() as { id: string };
    const newConv: Conversation = { id, title: "Nowa rozmowa", updated_at: new Date().toISOString() };
    setConversations(prev => [newConv, ...prev]);
    setActiveId(id);
    setMessages([]);
    setShowConvList(false);
    return id;
  }

  async function sendMessage(text?: string, overrideConvId?: string) {
    const content = (text ?? input).trim();
    const convId = overrideConvId ?? activeId;
    if (!content || !convId || sending) return;

    setInput("");
    setSending(true);
    setError("");
    const userMsg: Message = { role: "user", content };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ conversationId: convId, content }),
      });

      if (!res.ok) {
        const { error: err } = await res.json() as { error: string };
        if (err === "PAYWALL") { setShowPaywall(true); setMessages(prev => prev.slice(0, -1)); return; }
        setError(err ?? "Błąd AI");
        return;
      }

      const { reply } = await res.json() as { reply: string };
      setMessages(prev => {
        if (prev.filter(m => m.role === "user").length === 1) track("first_chat");
        return [...prev, { role: "assistant", content: reply }];
      });

      setConversations(prev => prev.map(c =>
        c.id === convId
          ? { ...c, title: c.title === "Nowa rozmowa" ? content.slice(0, 50) : c.title, updated_at: new Date().toISOString() }
          : c
      ));
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Wystąpił błąd. Spróbuj ponownie." }]);
    } finally {
      setSending(false);
    }
  }

  async function startWithMessage(text: string) {
    if (!session) return;
    const id = await createConversation();
    if (id) await sendMessage(text, id);
    inputRef.current?.focus();
  }

  async function handleNewConversation() {
    if (!session) return;
    await createConversation();
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  const activeConv = conversations.find(c => c.id === activeId);
  const isEmpty = !loadingHistory && messages.length === 0;

  return (
    <div className="h-screen bg-[#03010d] text-white flex flex-col overflow-hidden">
      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          reason="Bezpłatny limit 3 wiadomości wyczerpany."
        />
      )}
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />

      <Navbar />

      <main className="relative z-10 flex flex-col flex-1 min-h-0 pt-16">
        <div className="flex flex-col flex-1 min-h-0 max-w-2xl mx-auto w-full px-4">

          {/* Conversation bar */}
          <div className="flex items-center gap-2 py-3 border-b border-white/5 shrink-0">
            <div className="relative flex-1" ref={convListRef}>
              <button
                onClick={() => setShowConvList(v => !v)}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl bg-white/5 hover:bg-white/8 text-sm text-slate-300 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="flex-1 truncate">
                  {activeConv ? activeConv.title : "Wybierz rozmowę…"}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${showConvList ? "rotate-180" : ""}`} />
              </button>

              {showConvList && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0e0a1f] border border-purple-900/40 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <p className="text-slate-500 text-sm px-4 py-3">Brak rozmów — zacznij nową</p>
                  ) : (
                    conversations.map(c => (
                      <button
                        key={c.id}
                        onClick={() => openConversation(c.id)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-purple-900/20 transition-colors ${c.id === activeId ? "text-white bg-purple-900/10" : "text-slate-400"}`}
                      >
                        <span className="block truncate">{c.title}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleNewConversation}
              disabled={!session}
              title="Nowa rozmowa"
              className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 hover:bg-violet-600/30 hover:text-white transition-colors disabled:opacity-40 shrink-0"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">

            {!session && (
              <div className="text-center py-16">
                <MessageCircle className="w-10 h-10 text-violet-400/30 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Zaloguj się, żeby rozmawiać z Cosmogramem</p>
              </div>
            )}

            {session && !activeId && (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-900/50">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <p className="text-white font-medium mb-1" style={{ fontFamily: "'Cinzel', serif" }}>Cosmogram Chat</p>
                <p className="text-slate-500 text-xs mb-6">Zadaj pytanie o swój kosmogram</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm mx-auto">
                  {STARTERS.map(s => (
                    <button
                      key={s}
                      onClick={() => startWithMessage(s)}
                      disabled={sending}
                      className="text-left px-3 py-2.5 rounded-xl border border-purple-800/30 text-slate-400 hover:text-white hover:border-purple-600/50 hover:bg-purple-900/20 text-xs transition-colors disabled:opacity-40"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {session && activeId && loadingHistory && (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto" />
              </div>
            )}

            {session && activeId && isEmpty && !loadingHistory && (
              <div className="py-6">
                <div className="glass-card rounded-2xl p-4 border border-violet-900/20 max-w-sm mx-auto text-center mb-4">
                  <p className="text-slate-300 text-sm leading-relaxed">{WELCOME}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm mx-auto">
                  {STARTERS.map(s => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      disabled={sending}
                      className="text-left px-3 py-2.5 rounded-xl border border-purple-800/30 text-slate-400 hover:text-white hover:border-purple-600/50 hover:bg-purple-900/20 text-xs transition-colors disabled:opacity-40"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                  msg.role === "user"
                    ? "bg-violet-600/25 border border-violet-500/30 text-white rounded-tr-sm"
                    : "bg-white/5 border border-white/8 text-slate-200 rounded-tl-sm"
                }`}>
                  {msg.role === "assistant" ? (
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="text-violet-300 font-semibold">{children}</strong>,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-1.5 h-1.5 bg-violet-400/70 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-violet-400/70 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-violet-400/70 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-center text-red-400 text-xs py-2">{error}</p>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {session && activeId && (
            <div className="py-3 border-t border-white/5 shrink-0">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => { setInput(e.target.value); autoResize(e.target); }}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  placeholder="Wpisz pytanie… (Enter wysyła)"
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-violet-500/40 resize-none disabled:opacity-50 transition-colors"
                  style={{ maxHeight: "120px" }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || sending}
                  className="p-3 rounded-2xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
