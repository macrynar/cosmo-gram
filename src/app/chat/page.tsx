"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Plus, MessageCircle, ChevronDown, User, Baby } from "lucide-react";
import Navbar from "@/components/Navbar";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/components/AuthContext";
import PaywallModal from "@/components/PaywallModal";
import { track } from "@/components/PostHogProvider";

type Message = { role: "user" | "assistant"; content: string };

type ChartOption = {
  id: string;
  type: "natal" | "child";
  name: string;
  birth_date: string;
};

type Conversation = {
  id: string;
  title: string;
  updated_at: string;
};

const STARTERS = [
  "Dlaczego ostatnio jestem taki/a zmęczony/a?",
  "Co mój kosmogram mówi o relacjach?",
  "Czy to dobry moment na zmianę pracy?",
  "Co dziś powinienem/powinnam wiedzieć?",
];

export default function ChatPage() {
  const { session } = useAuth();

  const [charts, setCharts]           = useState<ChartOption[]>([]);
  const [selectedChart, setSelectedChart] = useState<ChartOption | null>(null);
  const [showChartPicker, setShowChartPicker] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId]       = useState<string | null>(null);
  const [messages, setMessages]       = useState<Message[]>([]);
  const [input, setInput]             = useState("");
  const [sending, setSending]         = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showConvList, setShowConvList] = useState(false);
  const [error, setError]             = useState("");
  const [showPaywall, setShowPaywall] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const convListRef    = useRef<HTMLDivElement>(null);
  const chartPickerRef = useRef<HTMLDivElement>(null);

  const authHeader = useCallback((): Record<string, string> =>
    session ? { Authorization: `Bearer ${session.access_token}` } : {}
  , [session]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (convListRef.current && !convListRef.current.contains(e.target as Node))
        setShowConvList(false);
      if (chartPickerRef.current && !chartPickerRef.current.contains(e.target as Node))
        setShowChartPicker(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadCharts = useCallback(async () => {
    if (!session) return;
    const res = await fetch("/api/get-all-charts", { headers: authHeader() });
    if (!res.ok) return;
    const { charts: data } = await res.json() as { charts: ChartOption[] };
    setCharts(data ?? []);
    if (data?.length > 0 && !selectedChart) setSelectedChart(data[0]);
  }, [session, authHeader, selectedChart]);

  const loadConversations = useCallback(async () => {
    if (!session) return;
    const res = await fetch("/api/chat/conversations", { headers: authHeader() });
    if (!res.ok) return;
    const { conversations: data } = await res.json() as { conversations: Conversation[] };
    setConversations(data ?? []);
  }, [session, authHeader]);

  useEffect(() => {
    loadCharts();
    loadConversations();
  }, [loadCharts, loadConversations]);

  // Persist chart context per conversation in localStorage
  function saveChartContext(convId: string, chart: ChartOption) {
    try {
      const stored = JSON.parse(localStorage.getItem("chat_chart_ctx") ?? "{}") as Record<string, { id: string; type: string }>;
      stored[convId] = { id: chart.id, type: chart.type };
      localStorage.setItem("chat_chart_ctx", JSON.stringify(stored));
    } catch { /* ignore */ }
  }
  function restoreChartContext(convId: string): ChartOption | null {
    try {
      const stored = JSON.parse(localStorage.getItem("chat_chart_ctx") ?? "{}") as Record<string, { id: string; type: string }>;
      const ctx = stored[convId];
      if (!ctx) return null;
      return charts.find(c => c.id === ctx.id) ?? null;
    } catch { return null; }
  }

  async function openConversation(conv: Conversation) {
    setActiveId(conv.id);
    setShowConvList(false);
    setLoadingHistory(true);
    setMessages([]);
    setError("");
    const saved = restoreChartContext(conv.id);
    if (saved) setSelectedChart(saved);
    try {
      const res = await fetch(`/api/chat/history?id=${conv.id}`, { headers: authHeader() });
      const { messages: data } = await res.json() as { messages: Message[] };
      setMessages(data ?? []);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function createConversation(chart?: ChartOption): Promise<string | null> {
    const res = await fetch("/api/chat/new", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
    });
    if (!res.ok) { setError("Nie udało się stworzyć rozmowy"); return null; }
    const { id } = await res.json() as { id: string };
    const ctx = chart ?? selectedChart;
    if (ctx) saveChartContext(id, ctx);
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
    setMessages(prev => [...prev, { role: "user", content }]);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          conversationId: convId,
          content,
          chartContextType: selectedChart?.type,
          chartContextId: selectedChart?.id,
        }),
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
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  const activeConv = conversations.find(c => c.id === activeId);
  const isEmpty = !loadingHistory && messages.length === 0;

  return (
    <div className="h-screen bg-[#03010d] text-white flex flex-col overflow-hidden">
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} reason="Bezpłatny limit 3 wiadomości wyczerpany." />}
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <Navbar />

      <main className="relative z-10 flex flex-col flex-1 min-h-0 pt-16">
        <div className="flex flex-col flex-1 min-h-0 max-w-2xl mx-auto w-full px-4">

          {/* ── Chart context selector ── */}
          {session && charts.length > 0 && (
            <div ref={chartPickerRef} className="relative shrink-0 pt-3 pb-2">
              <p className="text-xs text-slate-600 mb-1.5 pl-1">Kontekst rozmowy</p>
              <button
                onClick={() => setShowChartPicker(v => !v)}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl bg-amber-900/15 border border-amber-800/25 hover:bg-amber-900/20 text-sm text-slate-300 transition-colors"
              >
                {selectedChart?.type === "child"
                  ? <Baby className="w-4 h-4 text-green-400 shrink-0" />
                  : <User className="w-4 h-4 text-amber-400 shrink-0" />}
                <span className="flex-1 truncate">
                  {selectedChart ? `${selectedChart.name} · ${selectedChart.birth_date}` : "Wybierz kosmogram…"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform shrink-0 ${showChartPicker ? "rotate-180" : ""}`} />
              </button>

              {showChartPicker && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0b0906]/98 border border-amber-900/30 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto backdrop-blur-xl">
                  {charts.length === 0 ? (
                    <p className="text-slate-500 text-sm px-4 py-3">Brak kosmogramów — wygeneruj kosmogram natalny lub dziecka</p>
                  ) : (
                    <>
                      {charts.filter(c => c.type === "natal").length > 0 && (
                        <p className="text-xs text-slate-600 px-4 pt-3 pb-1 uppercase tracking-wide">Kosmogramy natalne</p>
                      )}
                      {charts.filter(c => c.type === "natal").map(c => (
                        <button key={c.id} onMouseDown={() => { setSelectedChart(c); setShowChartPicker(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-amber-900/15 transition-colors ${selectedChart?.id === c.id ? "text-white bg-amber-900/10" : "text-slate-400"}`}>
                          <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="text-slate-600 text-xs shrink-0">{c.birth_date}</span>
                        </button>
                      ))}
                      {charts.filter(c => c.type === "child").length > 0 && (
                        <p className="text-xs text-slate-600 px-4 pt-3 pb-1 uppercase tracking-wide border-t border-white/5 mt-1">Kosmogramy dzieci</p>
                      )}
                      {charts.filter(c => c.type === "child").map(c => (
                        <button key={c.id} onMouseDown={() => { setSelectedChart(c); setShowChartPicker(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-green-900/15 transition-colors ${selectedChart?.id === c.id ? "text-white bg-green-900/10" : "text-slate-400"}`}>
                          <Baby className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="text-slate-600 text-xs shrink-0">{c.birth_date}</span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Conversation selector ── */}
          <div className="flex items-center gap-2 py-2 border-b border-white/5 shrink-0">
            <div className="relative flex-1" ref={convListRef}>
              <button
                onClick={() => setShowConvList(v => !v)}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl bg-white/5 hover:bg-white/8 text-sm text-slate-300 transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="flex-1 truncate">
                  {activeConv ? activeConv.title : "Wybierz rozmowę…"}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${showConvList ? "rotate-180" : ""}`} />
              </button>

              {showConvList && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#0b0906]/95 border border-amber-900/30 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto backdrop-blur-xl">
                  {conversations.length === 0 ? (
                    <p className="text-slate-500 text-sm px-4 py-3">Brak rozmów — zacznij nową</p>
                  ) : conversations.map(c => {
                    const ctxChart = restoreChartContext(c.id);
                    return (
                      <button key={c.id} onClick={() => openConversation(c)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-amber-900/15 transition-colors ${c.id === activeId ? "text-white bg-amber-900/10" : "text-slate-400"}`}>
                        <span className="block truncate">{c.title}</span>
                        {ctxChart && (
                          <span className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                            {ctxChart.type === "child" ? <Baby className="w-3 h-3" /> : <User className="w-3 h-3" />}
                            {ctxChart.name}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button onClick={handleNewConversation} disabled={!session} title="Nowa rozmowa"
              className="p-2 rounded-xl bg-amber-900/20 border border-amber-700/35 text-amber-300 hover:bg-amber-800/30 hover:text-white transition-colors disabled:opacity-40 shrink-0">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
            {!session && (
              <div className="text-center py-16">
                <MessageCircle className="w-10 h-10 text-amber-400/30 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Zaloguj się, żeby rozmawiać z Cosmogramem</p>
              </div>
            )}

            {session && !activeId && (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-950/50">
                  <MessageCircle className="w-6 h-6 text-amber-100" />
                </div>
                <p className="text-white font-medium mb-1 font-brand">Cosmogram Chat</p>
                <p className="text-slate-500 text-xs mb-6">
                  {selectedChart
                    ? `Pytasz o kosmogram: ${selectedChart.name}`
                    : "Wybierz kosmogram powyżej, a potem zadaj pytanie"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm mx-auto">
                  {STARTERS.map(s => (
                    <button key={s} onClick={() => startWithMessage(s)} disabled={sending || !selectedChart}
                      className="text-left px-3 py-2.5 rounded-xl border border-amber-900/25 text-slate-400 hover:text-white hover:border-amber-700/50 hover:bg-amber-900/15 text-xs transition-colors disabled:opacity-40">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {session && activeId && loadingHistory && (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin mx-auto" />
              </div>
            )}

            {session && activeId && isEmpty && !loadingHistory && (
              <div className="py-6">
                <div className="glass-card rounded-2xl p-4 border border-amber-900/20 max-w-sm mx-auto text-center mb-4">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Co Cię dziś interesuje? Mogę opowiedzieć o kosmogramie
                    {selectedChart ? ` ${selectedChart.name}` : ""}, dzisiejszym układzie planet, albo odpowiedzieć na konkretne pytanie.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm mx-auto">
                  {STARTERS.map(s => (
                    <button key={s} onClick={() => sendMessage(s)} disabled={sending}
                      className="text-left px-3 py-2.5 rounded-xl border border-amber-900/25 text-slate-400 hover:text-white hover:border-amber-700/50 hover:bg-amber-900/15 text-xs transition-colors disabled:opacity-40">
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
                    ? "bg-amber-900/25 border border-amber-700/35 text-white rounded-tr-sm"
                    : "bg-white/5 border border-white/8 text-slate-200 rounded-tl-sm"
                }`}>
                  {msg.role === "assistant" ? (
                    <ReactMarkdown components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="text-amber-300 font-semibold">{children}</strong>,
                    }}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : msg.content}
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-5">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-1.5 h-1.5 bg-amber-400/70 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-center text-red-400 text-xs py-2">{error}</p>}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input ── */}
          {session && activeId && (
            <div className="py-3 border-t border-white/5 shrink-0">
              <div className="flex items-end gap-2">
                <textarea ref={inputRef} value={input}
                  onChange={e => { setInput(e.target.value); autoResize(e.target); }}
                  onKeyDown={handleKeyDown} disabled={sending}
                  placeholder="Wpisz pytanie… (Enter wysyła)"
                  rows={1}
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600/40 resize-none disabled:opacity-50 transition-colors"
                  style={{ maxHeight: "120px" }}
                />
                <button onClick={() => sendMessage()} disabled={!input.trim() || sending}
                  className="p-3 rounded-2xl bg-amber-700 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
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
