"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Plus, Info, X, ChevronDown, User, Baby } from "lucide-react";
import Navbar from "@/components/Navbar";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/components/AuthContext";
import PaywallModal from "@/components/PaywallModal";
import ChatPackModal from "@/components/ChatPackModal";
import { track } from "@/components/PostHogProvider";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = { role: "user" | "assistant"; content: string; followups?: string[] };
type ChartOption = { id: string; type: "natal" | "child"; name: string; birth_date: string };
type Conversation = {
  id: string; title: string; updated_at: string;
  last_message_at: string | null; summary_updated_at: string | null;
};

// ─── Openers pool — ZAWSZE z tej puli, 6 losowanych przy wejściu ─────────────

const OPENERS_POOL = [
  "Jaki jest cel mojego życia?",
  "Kiedy nadejdzie dobry czas na zmianę pracy?",
  "Dlaczego wciąż przyciągam tych samych ludzi?",
  "Czy spotkam kogoś na dłużej — i kiedy?",
  "Co próbuje mi teraz pokazać los?",
  "Czego o sobie jeszcze nie wiem?",
  "W czym tkwi moja prawdziwa siła?",
  "Co blokuje mnie w pieniądzach?",
  "Co muszę puścić, żeby iść dalej?",
  "Kiedy przyjdzie przełom w moim życiu?",
  "Co przyniesie mi najbliższy rok?",
  "Jakiej lekcji uczy mnie teraz życie?",
  "Gdzie jest moje miejsce na świecie?",
  "Czego naprawdę pragnie moje serce?",
];

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Injected CSS — animation + textarea override (bypasses globals !important) ─

const CHAT_STYLES = `
@keyframes ch-spin    { to { transform: rotate(360deg); } }
@keyframes ch-spinr   { to { transform: rotate(-360deg); } }
@keyframes ch-breathe { 0%,100% { transform:scale(1); } 50% { transform:scale(1.045); } }
@keyframes ch-tw      { 0%,100% { opacity:.12; } 50% { opacity:.9; } }
@keyframes ch-pulse   {
  0%,100% { box-shadow:0 0 0 0 rgba(255,174,61,0),0 0 40px rgba(255,174,61,.06); }
  50%     { box-shadow:0 0 0 0 rgba(255,174,61,0),0 0 70px rgba(255,174,61,.16); }
}
.ch-nebula   { animation: ch-spin 150s linear infinite, ch-breathe 9s ease-in-out infinite; }
.ch-ring-1   { animation: ch-spin 70s linear infinite; }
.ch-ring-2   { animation: ch-spinr 95s linear infinite; }
.ch-ring-3   { animation: ch-spinr 55s linear infinite; }
.ch-scan     { animation: ch-spin 18s linear infinite; }
.ch-orb-1    { animation: ch-spin 26s linear infinite; }
.ch-orb-2    { animation: ch-spinr 40s linear infinite; }
.ch-orb-3    { animation: ch-spin 60s linear infinite; }
.ch-star     { animation: ch-tw var(--dur,4s) ease-in-out infinite; }
.ch-dot      { display:inline-block; width:6px; height:6px; border-radius:50%; background:#E0B566; animation:ch-tw 1.1s ease-in-out infinite; flex-shrink:0; }
.ch-coreglow { animation: ch-breathe 6s ease-in-out infinite; }
.ch-orb-halo { animation: ch-breathe 5s ease-in-out infinite; }
.ch-compose  { animation: ch-pulse 6s ease-in-out infinite; }
.ch-compose:focus-within { animation:none!important; box-shadow:0 0 70px rgba(255,174,61,.20)!important; border-color:#E0B566!important; }
.ch-textarea {
  background: transparent!important;
  border: none!important;
  box-shadow: none!important;
  outline: none!important;
  -webkit-appearance: none;
}
.ch-textarea:focus {
  background: transparent!important;
  border: none!important;
  box-shadow: none!important;
  outline: none!important;
}
@media (prefers-reduced-motion: reduce) {
  .ch-nebula,.ch-ring-1,.ch-ring-2,.ch-ring-3,.ch-scan,
  .ch-orb-1,.ch-orb-2,.ch-orb-3,.ch-star,.ch-dot,
  .ch-coreglow,.ch-orb-halo,.ch-compose { animation:none!important; }
}
`;

// ─── Star data ────────────────────────────────────────────────────────────────

type StarDatum = { id: number; left: string; top: string; dur: string; delay: string; big: boolean };

function makeStars(): StarDatum[] {
  return Array.from({ length: 70 }, (_, i) => {
    const a = Math.random() * Math.PI * 2;
    const r = 24 + Math.random() * 30;
    return {
      id: i,
      left:  `${50 + Math.cos(a) * r}%`,
      top:   `${50 + Math.sin(a) * r}%`,
      dur:   `${3 + Math.random() * 4}s`,
      delay: `${Math.random() * 5}s`,
      big:   Math.random() > 0.78,
    };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (m < 2)  return "teraz";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d} d`;
  return `${Math.floor(d / 7)} tyg`;
}

function splitLead(content: string): [string, string] {
  const idx = content.indexOf("\n\n");
  return idx === -1 ? [content, ""] : [content.slice(0, idx), content.slice(idx + 2)];
}

// ─── Astrea signet ────────────────────────────────────────────────────────────

function AstreaSignet({ size = 23 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="-52 -52 104 104" fill="currentColor"
      style={{ color: "var(--accent-deep)", display: "block" }}>
      <path d="M 28.79,-40.86 A 50,50 0 1,0 28.79,40.86 A 40,40 0 1,1 28.79,-40.86 Z"/>
      <circle cx="10" cy="0" r="9"/>
    </svg>
  );
}

// ─── Composer pill ────────────────────────────────────────────────────────────

function Composer({
  inputRef, value, onChange, onKeyDown, onSend, disabled, placeholder, pulse,
}: {
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string; onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void; disabled: boolean; placeholder: string; pulse?: boolean;
}) {
  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }
  return (
    <div
      className={pulse ? "ch-compose" : undefined}
      style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "8px 8px 8px 22px", borderRadius: "999px",
        background: "rgba(20,16,31,.85)", border: "1px solid #2B2540",
        backdropFilter: "blur(8px)", transition: ".3s ease",
      }}
    >
      <textarea
        ref={inputRef}
        value={value}
        className="ch-textarea"
        onChange={e => { onChange(e.target.value); autoResize(e.target); }}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        style={{
          flex: 1, color: "#F4F1EA", fontSize: "16px",
          fontFamily: "inherit", resize: "none", maxHeight: "120px",
          lineHeight: 1.5, padding: 0,
        }}
      />
      <button
        onClick={onSend}
        disabled={!value.trim() || disabled}
        aria-label="Wyślij"
        style={{
          flexShrink: 0, width: "46px", height: "46px", borderRadius: "50%",
          border: "none", cursor: !value.trim() || disabled ? "default" : "pointer",
          background: "linear-gradient(135deg,#FFC56B 0%,#FFAE3D 45%,#F08F2E 100%)",
          color: "#201405", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 26px rgba(255,174,61,.3)",
          opacity: !value.trim() || disabled ? 0.4 : 1,
          transition: "opacity .2s",
        }}
      >
        <Send size={18} />
      </button>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const IDLE_MS = 24 * 60 * 60 * 1000;
const FREE_MSG = 3;

// ─── Licznik wiadomości — pasek postępu + dokup ────────────────────────────────

function CreditMeter({
  isPaid, remaining, limit, credits, onTopUp,
}: {
  isPaid: boolean; remaining: number; limit: number; credits: number; onTopUp: () => void;
}) {
  const consumed  = Math.max(0, Math.min(limit, limit - remaining));
  const pct       = limit > 0 ? Math.round((consumed / limit) * 100) : 0;
  const exhausted = remaining <= 0;
  const fill      = exhausted ? "#E2654A" : "#FFAE3D";
  const label     = isPaid
    ? `${remaining} z ${limit} wiadomości w tym miesiącu`
    : `${remaining} z ${limit} bezpłatnych wiadomości`;

  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginBottom: "6px" }}>
        <span style={{ fontSize: "11.5px", color: "#B6AFC6" }}>
          {label}
          {credits > 0 && <span style={{ color: "#E0B566" }}> · +{credits} z paczki</span>}
        </span>
        <button
          onClick={onTopUp}
          style={{
            flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "4px 11px", borderRadius: "999px", cursor: "pointer",
            background: "rgba(224,181,102,.08)", border: "1px solid rgba(224,181,102,.35)",
            color: "#E0B566", fontSize: "11.5px", fontFamily: "inherit", transition: ".2s ease",
          }}
          onMouseEnter={e => { const b = e.currentTarget; b.style.background = "rgba(224,181,102,.16)"; b.style.borderColor = "#E0B566"; }}
          onMouseLeave={e => { const b = e.currentTarget; b.style.background = "rgba(224,181,102,.08)"; b.style.borderColor = "rgba(224,181,102,.35)"; }}
        >
          <Plus size={12} /> Dokup
        </button>
      </div>
      <div style={{ height: "4px", borderRadius: "999px", background: "#2B2540", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: fill, borderRadius: "999px", transition: "width .4s ease" }} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { session } = useAuth();

  // Original state
  const [charts, setCharts]               = useState<ChartOption[]>([]);
  const [selectedChart, setSelectedChart] = useState<ChartOption | null>(null);
  const [showChartPicker, setShowChartPicker] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId]           = useState<string | null>(null);
  const [messages, setMessages]           = useState<Message[]>([]);
  const [input, setInput]                 = useState("");
  const [sending, setSending]             = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError]                 = useState("");
  const [showPaywall, setShowPaywall]     = useState(false);
  const [showPackModal, setShowPackModal] = useState<"monthly_limit" | "need_topup" | "proactive" | null>(null);
  const [showDataWarning, setShowDataWarning] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [remaining, setRemaining]         = useState<number | null>(null);
  const [limit, setLimit]                 = useState<number>(FREE_MSG);
  const [credits, setCredits]             = useState<number>(0);
  const [isPaid, setIsPaid]               = useState(false);
  const [packSuccess, setPackSuccess]     = useState(false);

  // Redesign state — openers are frozen at mount (shuffle once, never re-shuffle)
  const [stars]   = useState<StarDatum[]>(() => makeStars());
  const [openers] = useState<string[]>(() => shuffled(OPENERS_POOL).slice(0, 6));
  const [showMobileRail, setShowMobileRail] = useState(false);
  const [isMobile, setIsMobile]           = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const fieldRef       = useRef<HTMLDivElement>(null);
  const chartPickerRef = useRef<HTMLDivElement>(null);
  const parallax       = useRef({ px: 0, py: 0, tx: 0, ty: 0, raf: 0 });

  const authHeader = useCallback((): Record<string, string> =>
    session ? { Authorization: `Bearer ${session.access_token}` } : {}
  , [session]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Responsive mobile breakpoint
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 860);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Close chart picker on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (chartPickerRef.current && !chartPickerRef.current.contains(e.target as Node))
        setShowChartPicker(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Parallax on empty state (respects prefers-reduced-motion)
  const showStarfield = messages.length === 0 && !loadingHistory;
  useEffect(() => {
    if (!showStarfield || !fieldRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const p = parallax.current;
    const onMove = (e: MouseEvent) => {
      p.tx = (e.clientX / window.innerWidth  - 0.5) * -22;
      p.ty = (e.clientY / window.innerHeight - 0.5) * -22;
    };
    const loop = () => {
      p.px += (p.tx - p.px) * 0.05;
      p.py += (p.ty - p.py) * 0.05;
      if (fieldRef.current)
        fieldRef.current.style.transform =
          `translate(calc(-50% + ${p.px}px), calc(-50% + ${p.py}px))`;
      p.raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove);
    p.raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(p.raf);
      if (fieldRef.current)
        fieldRef.current.style.transform = "translate(-50%,-50%)";
    };
  }, [showStarfield]);

  // ─── Data loaders ──────────────────────────────────────────────────────────

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
    return data as Conversation[];
  }, [session, authHeader]);

  const loadStatus = useCallback(async () => {
    if (!session) return;
    const res = await fetch("/api/chat/status", { headers: authHeader() });
    if (!res.ok) return;
    const data = await res.json() as { isPaid: boolean; limit: number; remaining: number; credits: number };
    setIsPaid(data.isPaid);
    setRemaining(data.remaining);
    setLimit(data.limit ?? FREE_MSG);
    setCredits(data.credits ?? 0);
  }, [session, authHeader]);

  const maybeTriggerSummary = useCallback(async (convs: Conversation[]) => {
    if (!session) return;
    const stale = convs.filter(c =>
      !c.summary_updated_at && c.last_message_at &&
      Date.now() - new Date(c.last_message_at).getTime() > 3_600_000
    );
    for (const c of stale.slice(0, 3)) {
      fetch("/api/chat/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ conversationId: c.id }),
      }).catch(() => {});
    }
  }, [session, authHeader]);

  const checkDataWarning = useCallback(() => {
    if (!session) return;
    if (localStorage.getItem("chat_data_warning_ok")) { setWarningDismissed(true); return; }
    setShowDataWarning(true);
  }, [session]);

  useEffect(() => {
    loadCharts();
    loadConversations().then(convs => { if (convs) maybeTriggerSummary(convs); });
    loadStatus();
    checkDataWarning();
  }, [loadCharts, loadConversations, loadStatus, maybeTriggerSummary, checkDataWarning]);

  // Powrót ze Stripe po zakupie paczki — odśwież status, pokaż potwierdzenie, wyczyść URL
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("pack_success") !== "1") return;
    track("chat_pack_success");
    setPackSuccess(true);
    // status zaktualizuje się po przetworzeniu webhooka — odpytaj kilka razy
    const tries = [800, 2200, 4500];
    const timers = tries.map(ms => setTimeout(() => loadStatus(), ms));
    const hide = setTimeout(() => setPackSuccess(false), 6000);
    window.history.replaceState({}, "", window.location.pathname);
    return () => { timers.forEach(clearTimeout); clearTimeout(hide); };
  }, [loadStatus]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  function saveChartCtx(convId: string, chart: ChartOption) {
    try {
      const s = JSON.parse(localStorage.getItem("chat_chart_ctx") ?? "{}") as Record<string, { id: string; type: string }>;
      s[convId] = { id: chart.id, type: chart.type };
      localStorage.setItem("chat_chart_ctx", JSON.stringify(s));
    } catch { /* ignore */ }
  }

  function restoreChartCtx(convId: string): ChartOption | null {
    try {
      const s = JSON.parse(localStorage.getItem("chat_chart_ctx") ?? "{}") as Record<string, { id: string; type: string }>;
      const ctx = s[convId];
      return ctx ? (charts.find(c => c.id === ctx.id) ?? null) : null;
    } catch { return null; }
  }

  async function openConversation(conv: Conversation) {
    setActiveId(conv.id);
    setShowMobileRail(false);
    setLoadingHistory(true);
    setMessages([]);
    setError("");
    const saved = restoreChartCtx(conv.id);
    if (saved) setSelectedChart(saved);
    try {
      const res = await fetch(`/api/chat/history?id=${conv.id}`, { headers: authHeader() });
      const { messages: data } = await res.json() as { messages: Message[] };
      setMessages(data ?? []);
      track("chat_session_resumed", { conv_id: conv.id });
    } finally {
      setLoadingHistory(false);
    }
  }

  async function createConversation(): Promise<string | null> {
    const res = await fetch("/api/chat/new", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader() },
    });
    if (!res.ok) { setError("Nie udało się stworzyć rozmowy"); return null; }
    const { id } = await res.json() as { id: string };
    if (selectedChart) saveChartCtx(id, selectedChart);
    setConversations(prev => [
      { id, title: "Nowa rozmowa", updated_at: new Date().toISOString(), last_message_at: null, summary_updated_at: null },
      ...prev,
    ]);
    setActiveId(id);
    setMessages([]);
    setShowMobileRail(false);
    return id;
  }

  async function sendMessage(text?: string, overrideConvId?: string) {
    const content = (text ?? input).trim();
    const convId  = overrideConvId ?? activeId;
    if (!content || !convId || sending) return;
    if (!warningDismissed && showDataWarning) return;
    setInput("");
    setSending(true);
    setError("");
    setMessages(prev => [...prev, { role: "user", content }]);

    try {
      const res = await fetch("/api/chat/message", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({
          conversationId: convId, content,
          chartContextType: selectedChart?.type,
          chartContextId:   selectedChart?.id,
        }),
      });

      if (!res.ok) {
        try {
          const { error: err } = await res.json() as { error: string };
          if (err === "PAYWALL") {
            track("chat_paywall_hit");
            track("chat_limit_reached", { type: "free" });
            setShowPaywall(true);
            setMessages(prev => prev.slice(0, -1));
            return;
          }
          if (err === "MONTHLY_LIMIT") {
            track("chat_limit_reached", { type: "monthly" });
            setMessages(prev => prev.slice(0, -1));
            setShowPackModal("monthly_limit");
            return;
          }
          if (err === "NEED_TOPUP") {
            track("chat_limit_reached", { type: "topup" });
            setMessages(prev => prev.slice(0, -1));
            setShowPackModal("need_topup");
            return;
          }
          setError(err ?? "Błąd AI");
        } catch {
          setError("Błąd AI");
        }
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      // Handle streaming response
      const reader = res.body?.getReader();
      if (!reader) {
        setError("Błąd: brak streamem");
        setMessages(prev => prev.slice(0, -1));
        return;
      }

      const decoder = new TextDecoder();
      let fullText = "";
      let assistantMsgId: string | null = null;

      // Add placeholder assistant message
      setMessages(prev => {
        const newMsg = { role: "assistant" as const, content: "", followups: [] as string[] };
        assistantMsgId = Math.random().toString();
        return [...prev, newMsg];
      });

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;

          // Update message with streaming content
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg?.role === "assistant") {
              lastMsg.content = fullText;
            }
            return updated;
          });
        }
      } finally {
        reader.releaseLock();
      }

      // Parse followups from the final text
      const FOLLOWUP_DELIM = "===PYTANIA===";
      const idx = fullText.indexOf(FOLLOWUP_DELIM);
      let reply = fullText;
      let suggested_followups: string[] = [];

      if (idx !== -1) {
        reply = fullText.slice(0, idx).trim();
        suggested_followups = fullText
          .slice(idx + FOLLOWUP_DELIM.length)
          .split("\n")
          .map(l => l.replace(/^[-*\d.)\s]+/, "").replace(/^["„']|[""']$/g, "").trim())
          .filter(Boolean)
          .slice(0, 2);
      }

      // Update final message with parsed content
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg?.role === "assistant") {
          lastMsg.content = reply;
          lastMsg.followups = suggested_followups;
        }
        return updated;
      });

      setConversations(prev => prev.map(c =>
        c.id === convId
          ? { ...c, title: c.title === "Nowa rozmowa" ? content.slice(0, 50) : c.title, updated_at: new Date().toISOString() }
          : c
      ));

      if (messages.filter(m => m.role === "user").length === 0) track("first_chat");
      loadStatus();
    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Wystąpił błąd. Spróbuj ponownie." }]);
    } finally {
      setSending(false);
    }
  }

  async function dismissDataWarning() {
    setWarningDismissed(true);
    setShowDataWarning(false);
    localStorage.setItem("chat_data_warning_ok", "1");
    if (session)
      fetch("/api/user-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ chat_data_warning_dismissed: true }),
      }).catch(() => {});
  }

  async function startWithMessage(text: string) {
    if (!session) return;
    if (!warningDismissed) await dismissDataWarning();
    let convId = activeId;
    if (conversations[0]?.last_message_at &&
      Date.now() - new Date(conversations[0].last_message_at).getTime() > IDLE_MS)
      convId = null;
    if (!convId) convId = await createConversation();
    if (convId) { await sendMessage(text, convId); inputRef.current?.focus(); }
  }

  async function handleNewConversation() {
    if (!session) return;
    await createConversation();
    inputRef.current?.focus();
  }

  async function deleteConversation(convId: string) {
    await fetch(`/api/chat/delete?id=${convId}`, { method: "DELETE", headers: authHeader() });
    track("chat_history_deleted", { conv_id: convId });
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeId === convId) { setActiveId(null); setMessages([]); }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  function handleEmptyKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) startWithMessage(input.trim());
    }
  }

  // ─── Derived ───────────────────────────────────────────────────────────────

  const activeConv  = conversations.find(c => c.id === activeId);
  // Licznik widoczny zawsze, gdy znamy status (też dla premium) — daje wgląd i dostęp do dokupienia
  const showCounter = remaining !== null;
  const topUp = () => { track("chat_pack_topup_clicked"); setShowPackModal("proactive"); };

  // ─── Rail content ─────────────────────────────────────────────────────────

  const railContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "20px 14px" }}>
      <h2 style={{
        fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase",
        color: "#877FA0", margin: "4px 8px 12px",
      }}>
        Twoje rozmowy z niebem
      </h2>

      <button
        onClick={handleNewConversation}
        disabled={!session}
        style={{
          display: "flex", alignItems: "center", gap: "8px", width: "100%",
          padding: "11px 14px", borderRadius: "12px", marginBottom: "10px",
          border: "1px dashed #2B2540", color: "#E0B566",
          background: "transparent", cursor: "pointer", fontSize: "14px",
          fontFamily: "inherit", transition: ".25s ease",
        }}
        onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = "#E0B566"; b.style.background = "rgba(224,181,102,.05)"; }}
        onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = "#2B2540"; b.style.background = "transparent"; }}
      >
        <Plus size={14} /> Nowa rozmowa
      </button>

      <div style={{ overflowY: "auto", flex: 1 }}>
        {conversations.length === 0 && (
          <p style={{ color: "#877FA0", fontSize: "13px", padding: "8px 12px" }}>
            Brak rozmów — zacznij nową
          </p>
        )}
        {conversations.map(c => {
          const isActive = c.id === activeId;
          const ctx = restoreChartCtx(c.id);
          return (
            <div
              key={c.id}
              onClick={() => openConversation(c)}
              style={{
                display: "flex", gap: "10px", padding: "11px 12px", borderRadius: "12px",
                cursor: "pointer", transition: "background .2s",
                border: `1px solid ${isActive ? "#2B2540" : "transparent"}`,
                background: isActive ? "#14101F" : "transparent",
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "rgba(182,175,198,.04)"; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
            >
              <span style={{ color: "#E0B566", opacity: .85, marginTop: "1px", flexShrink: 0 }}>
                <AstreaSignet size={15} />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <b style={{
                  display: "block", fontWeight: 500, fontSize: "13.5px",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  color: "#F4F1EA",
                }}>
                  {c.title}
                </b>
                {ctx && (
                  <span style={{
                    fontSize: "12px", color: "#877FA0", display: "block",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {ctx.type === "child" ? "◇ " : "○ "}{ctx.name}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                <span style={{ fontSize: "10.5px", color: "#877FA0" }}>
                  {relTime(c.last_message_at ?? c.updated_at)}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); deleteConversation(c.id); }}
                  title="Usuń rozmowę"
                  style={{
                    background: "none", border: "none", color: "#877FA0",
                    cursor: "pointer", padding: "2px", opacity: 0, fontSize: "16px", lineHeight: 1,
                  }}
                  onMouseEnter={e => { const b = e.currentTarget; b.style.opacity = "1"; b.style.color = "#e26060"; }}
                  onMouseLeave={e => { const b = e.currentTarget; b.style.opacity = "0"; b.style.color = "#877FA0"; }}
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      height: "100vh", overflow: "hidden",
      background: "radial-gradient(120% 90% at 50% -10%, #1A1530 0%, #0B0912 65%) fixed #0B0912",
      color: "#F4F1EA",
      fontFamily: "'General Sans', system-ui, sans-serif",
    }}>
      {/* Injected animation CSS */}
      <style dangerouslySetInnerHTML={{ __html: CHAT_STYLES }} />

      {/* Grain overlay */}
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 70, opacity: .045,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} reason="Bezpłatny limit 3 wiadomości wyczerpany." />}
      {showPackModal && <ChatPackModal reason={showPackModal} onClose={() => setShowPackModal(null)} />}

      <Navbar />

      {/* ── Grid below navbar ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "290px 1fr",
        height: "calc(100vh - 64px)",
        marginTop: "64px",
      }}>

        {/* Desktop rail */}
        {!isMobile && (
          <aside style={{
            borderRight: "1px solid #2B2540",
            background: "rgba(11,9,18,.35)",
            overflowY: "auto",
          }}>
            {railContent}
          </aside>
        )}

        {/* Main */}
        <main style={{ position: "relative", overflow: "hidden", height: "100%", width: "100%" }}>

          {/* ════ EMPTY STATE ════ */}
          {showStarfield && (
            <>
              {/* ── Starfield ── */}
              <div
                ref={fieldRef}
                style={{
                  position: "absolute", left: "50%", top: "50%",
                  width: "min(150vh, 150%)", aspectRatio: "1",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "none", zIndex: 0,
                }}
              >
                {/* Nebula */}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="ch-nebula"
                    src="/assets/chat/astrea-nebula.jpg"
                    alt=""
                    style={{
                      width: "74%", height: "74%", objectFit: "contain",
                      borderRadius: "50%", opacity: .9,
                      filter: "drop-shadow(0 0 80px rgba(255,174,61,.10))",
                    }}
                  />
                </div>
                {/* Rings */}
                {([
                  { cls: "ch-ring-2", style: { position: "absolute" as const, width: "60%", height: "60%", borderRadius: "50%", border: "1px solid rgba(43,37,64,.9)" } },
                  { cls: "ch-ring-1", style: { position: "absolute" as const, width: "46%", height: "46%", borderRadius: "50%", border: "1px dashed rgba(224,181,102,.14)" } },
                  { cls: "ch-ring-3", style: { position: "absolute" as const, width: "33%", height: "33%", borderRadius: "50%", border: "1px solid rgba(224,181,102,.20)" } },
                ] as { cls: string; style: React.CSSProperties }[]).map(({ cls, style }) => (
                  <div key={cls} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className={cls} style={style} />
                  </div>
                ))}
                {/* Scan */}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div className="ch-scan" style={{
                    position: "absolute", width: "60%", height: "60%", borderRadius: "50%",
                    background: "conic-gradient(from 0deg, transparent 0 68%, rgba(255,174,61,.13) 84%, transparent 100%)",
                  }} />
                </div>
                {/* Orbits */}
                {([
                  { cls: "ch-orb-1", w: "38%", dotBg: "#FFAE3D", dotShadow: "0 0 10px 2px rgba(255,174,61,.5)",    dw: 6, dh: 6, dm: -3 },
                  { cls: "ch-orb-2", w: "52%", dotBg: "#E0B566", dotShadow: "0 0 8px 1px rgba(224,181,102,.5)",   dw: 6, dh: 6, dm: -3 },
                  { cls: "ch-orb-3", w: "64%", dotBg: "#E9DCC0", dotShadow: "none",                               dw: 4, dh: 4, dm: -2 },
                ]).map(({ cls, w, dotBg, dotShadow, dw, dh, dm }) => (
                  <div key={cls} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div className={cls} style={{ position: "absolute", width: w, height: w, borderRadius: "50%" }}>
                      <b style={{
                        position: "absolute", top: "-3px", left: "50%",
                        width: `${dw}px`, height: `${dh}px`, marginLeft: `${dm}px`,
                        borderRadius: "50%", background: dotBg, boxShadow: dotShadow, display: "block",
                      }} />
                    </div>
                  </div>
                ))}
                {/* Stars */}
                <div style={{ position: "absolute", inset: 0 }}>
                  {stars.map(s => (
                    <i key={s.id} className="ch-star" style={{
                      position: "absolute",
                      left: s.left, top: s.top,
                      width: s.big ? "3px" : "2px",
                      height: s.big ? "3px" : "2px",
                      borderRadius: "50%",
                      background: s.big ? "#E0B566" : "#E9DCC0",
                      ["--dur" as string]: s.dur,
                      animationDelay: s.delay,
                    }} />
                  ))}
                </div>
              </div>

              {/* Scrim */}
              <div style={{
                position: "absolute", left: "50%", top: "50%",
                width: "680px", height: "680px", transform: "translate(-50%,-50%)",
                zIndex: 1, pointerEvents: "none",
                background: "radial-gradient(circle, rgba(11,9,18,.78) 0, rgba(11,9,18,.5) 40%, transparent 66%)",
              }} />
              {/* Core glow */}
              <div className="ch-coreglow" style={{
                position: "absolute", left: "50%", top: "50%",
                width: "340px", height: "340px", transform: "translate(-50%,-50%)",
                zIndex: 1, pointerEvents: "none", borderRadius: "50%",
                background: "radial-gradient(circle, rgba(255,174,61,.16) 0, rgba(255,174,61,.05) 38%, transparent 64%)",
              }} />

              {/* ── Central content ── */}
              <section style={{
                position: "absolute", inset: 0, zIndex: 2,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                textAlign: "center", padding: "24px",
              }}>
                <div style={{ width: "100%", maxWidth: "540px", display: "flex", flexDirection: "column", alignItems: "center" }}>

                  {/* Mobile rail toggle */}
                  {isMobile && (
                    <button onClick={() => setShowMobileRail(true)} style={{
                      alignSelf: "flex-start", marginBottom: "16px",
                      background: "none", border: "none", color: "#877FA0",
                      cursor: "pointer", fontSize: "22px", lineHeight: 1, padding: "4px",
                    }}>
                      ☰
                    </button>
                  )}

                  {/* Eyebrow */}
                  <div style={{
                    fontSize: "12px", letterSpacing: ".36em", textTransform: "uppercase",
                    color: "#E0B566", marginBottom: "14px",
                  }}>
                    Astrea
                  </div>

                  {/* Invite */}
                  <h1 style={{
                    fontFamily: "'Fraunces', serif", fontWeight: 500,
                    fontSize: "clamp(25px, 3vw, 33px)", lineHeight: 1.22,
                    color: "#E9DCC0", marginBottom: "26px",
                  }}>
                    Niebo zna Twoją historię.<br />O co chcesz zapytać?
                  </h1>

                  {/* Chart picker */}
                  {session && charts.length > 1 && (
                    <div ref={chartPickerRef} style={{ position: "relative", width: "100%", maxWidth: "400px", marginBottom: "14px" }}>
                      <button
                        onClick={() => setShowChartPicker(v => !v)}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px", width: "100%",
                          padding: "8px 14px", borderRadius: "12px",
                          background: "rgba(20,16,31,.85)", border: "1px solid #2B2540",
                          color: "#B6AFC6", fontSize: "13px", cursor: "pointer",
                          backdropFilter: "blur(8px)", fontFamily: "inherit",
                        }}
                      >
                        {selectedChart?.type === "child"
                          ? <Baby size={13} style={{ color: "#E0B566", flexShrink: 0 }} />
                          : <User size={13} style={{ color: "#E0B566", flexShrink: 0 }} />}
                        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {selectedChart ? `${selectedChart.name} · ${selectedChart.birth_date}` : "Wybierz kosmogram…"}
                        </span>
                        <ChevronDown size={13} style={{ color: "#877FA0", flexShrink: 0, transform: showChartPicker ? "rotate(180deg)" : "none", transition: ".2s" }} />
                      </button>
                      {showChartPicker && (
                        <div style={{
                          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                          background: "rgba(11,9,18,.97)", border: "1px solid #2B2540",
                          borderRadius: "12px", zIndex: 40, backdropFilter: "blur(12px)", maxHeight: "200px", overflowY: "auto",
                        }}>
                          {charts.map(c => (
                            <button key={c.id}
                              onMouseDown={() => { setSelectedChart(c); setShowChartPicker(false); }}
                              style={{
                                width: "100%", textAlign: "left", padding: "10px 14px",
                                display: "flex", alignItems: "center", gap: "8px",
                                background: selectedChart?.id === c.id ? "rgba(224,181,102,.08)" : "none",
                                border: "none", color: "#F4F1EA", fontSize: "13px",
                                cursor: "pointer", fontFamily: "inherit",
                              }}
                            >
                              {c.type === "child"
                                ? <Baby size={12} style={{ color: "#E0B566", flexShrink: 0 }} />
                                : <User size={12} style={{ color: "#E0B566", flexShrink: 0 }} />}
                              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                              <span style={{ color: "#877FA0", fontSize: "11px", flexShrink: 0 }}>{c.birth_date}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Composer */}
                  <div style={{ width: "100%" }}>
                    <Composer
                      inputRef={inputRef} value={input} onChange={setInput}
                      onKeyDown={handleEmptyKeyDown}
                      onSend={() => { if (input.trim()) startWithMessage(input.trim()); }}
                      disabled={sending} placeholder="Napisz do Astrei…" pulse
                    />
                  </div>

                  {/* Openers — frozen at mount, never re-shuffled */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "9px", justifyContent: "center", marginTop: "18px" }}>
                    {openers.map((q, i) => (
                      <motion.button
                        key={q}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        onClick={() => { track("chat_chip_clicked", { chip: q }); startWithMessage(q); }}
                        disabled={sending}
                        style={{
                          padding: "8px 15px", borderRadius: "999px",
                          border: "1px solid #2B2540",
                          background: "rgba(20,16,31,.6)", backdropFilter: "blur(6px)",
                          color: "#B6AFC6", fontSize: "13px",
                          cursor: "pointer", fontFamily: "inherit",
                          transition: ".2s ease",
                        }}
                        onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = "#E0B566"; b.style.color = "#E9DCC0"; b.style.background = "rgba(224,181,102,.06)"; }}
                        onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = "#2B2540"; b.style.color = "#B6AFC6"; b.style.background = "rgba(20,16,31,.6)"; }}
                      >
                        {q}
                      </motion.button>
                    ))}
                  </div>

                  {/* Licznik + dokup — także na ekranie startowym */}
                  <AnimatePresence>
                    {packSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        style={{
                          marginTop: "20px", width: "100%", maxWidth: "420px",
                          display: "flex", alignItems: "center", gap: "8px",
                          padding: "9px 14px", borderRadius: "10px",
                          background: "rgba(224,181,102,.08)", border: ".5px solid rgba(224,181,102,.35)",
                          color: "#E9DCC0", fontSize: "13px",
                        }}
                      >
                        <span style={{ color: "#FFAE3D" }}>✓</span>
                        Paczka dodana — kredyty są już na Twoim koncie.
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {showCounter && remaining !== null && (
                    <div style={{ width: "100%", maxWidth: "420px", marginTop: "22px" }}>
                      <CreditMeter
                        isPaid={isPaid}
                        remaining={remaining}
                        limit={limit}
                        credits={credits}
                        onTopUp={topUp}
                      />
                    </div>
                  )}

                  {/* Data warning */}
                  <AnimatePresence>
                    {showDataWarning && !warningDismissed && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        style={{
                          marginTop: "20px", display: "flex", alignItems: "flex-start", gap: "10px",
                          padding: "12px 16px", borderRadius: "12px",
                          background: "rgba(212,175,55,.04)", border: ".5px solid rgba(212,175,55,.20)",
                        }}
                      >
                        <Info size={13} style={{ color: "rgba(255,174,61,.6)", flexShrink: 0, marginTop: "1px" }} />
                        <p style={{ fontSize: "12px", color: "#877FA0", flex: 1, lineHeight: 1.6, textAlign: "left" }}>
                          To, co napiszesz, jest przetwarzane przez model AI.{" "}
                          <a href="/legal/privacy" style={{ color: "rgba(255,174,61,.7)" }}>Polityka prywatności</a>
                        </p>
                        <button onClick={dismissDataWarning}
                          style={{ background: "none", border: "none", color: "#877FA0", cursor: "pointer", flexShrink: 0 }}>
                          <X size={13} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>
            </>
          )}

          {/* ════ ACTIVE CONVERSATION ════ */}
          {!showStarfield && (
            <div style={{ position: "absolute", inset: 0, zIndex: 3, display: "flex", flexDirection: "column" }}>

              {/* Chathead */}
              <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "15px 26px", borderBottom: "1px solid #2B2540",
                background: "rgba(11,9,18,.55)", backdropFilter: "blur(10px)", flexShrink: 0,
              }}>
                {isMobile && (
                  <button onClick={() => setShowMobileRail(true)} style={{
                    background: "none", border: "none", color: "#877FA0",
                    cursor: "pointer", fontSize: "22px", lineHeight: 1, padding: "4px", flexShrink: 0,
                  }}>
                    ☰
                  </button>
                )}

                {/* Astrea orb */}
                <div style={{ position: "relative", flexShrink: 0, width: "42px", height: "42px" }}>
                  <div className="ch-orb-halo" style={{
                    position: "absolute", inset: "-7px", borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(255,174,61,.20), transparent 68%)",
                  }} />
                  <div style={{
                    width: "42px", height: "42px", borderRadius: "50%",
                    border: "1px solid #2B2540", background: "#14101F",
                    display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
                  }}>
                    <AstreaSignet size={23} />
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontFamily: "'Fraunces', serif", fontWeight: 500, fontSize: "17px", display: "block" }}>
                    Astrea
                  </b>
                  <span style={{
                    fontSize: "12.5px", color: "#877FA0", display: "block",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {activeConv?.title !== "Nowa rozmowa" && activeConv?.title
                      ? activeConv.title
                      : "czyta Twój kosmogram"}
                  </span>
                </div>

                {/* Chart picker (multi-chart, active state) */}
                {session && charts.length > 1 && (
                  <div ref={chartPickerRef} style={{ position: "relative", flexShrink: 0 }}>
                    <button
                      onClick={() => setShowChartPicker(v => !v)}
                      style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "6px 10px", borderRadius: "20px",
                        background: "rgba(20,16,31,.85)", border: "1px solid #2B2540",
                        color: "#B6AFC6", fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
                      }}
                    >
                      {selectedChart?.type === "child" ? <Baby size={12} /> : <User size={12} />}
                      <span style={{ maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {selectedChart?.name ?? "—"}
                      </span>
                      <ChevronDown size={11} />
                    </button>
                    {showChartPicker && (
                      <div style={{
                        position: "absolute", top: "calc(100% + 4px)", right: 0,
                        background: "rgba(11,9,18,.97)", border: "1px solid #2B2540",
                        borderRadius: "12px", zIndex: 50, backdropFilter: "blur(12px)", minWidth: "180px",
                      }}>
                        {charts.map(c => (
                          <button key={c.id}
                            onMouseDown={() => { setSelectedChart(c); setShowChartPicker(false); }}
                            style={{
                              width: "100%", textAlign: "left", padding: "10px 14px",
                              display: "flex", alignItems: "center", gap: "8px",
                              background: selectedChart?.id === c.id ? "rgba(224,181,102,.08)" : "none",
                              border: "none", color: "#F4F1EA", fontSize: "13px",
                              cursor: "pointer", fontFamily: "inherit",
                            }}
                          >
                            {c.type === "child"
                              ? <Baby size={12} style={{ color: "#E0B566", flexShrink: 0 }} />
                              : <User size={12} style={{ color: "#E0B566", flexShrink: 0 }} />}
                            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div style={{
                flex: 1, overflowY: "auto",
                padding: "32px 24px",
                display: "flex", flexDirection: "column", gap: "24px", alignItems: "center",
              }}>
                {loadingHistory && (
                  <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
                    <div style={{
                      width: "24px", height: "24px", borderRadius: "50%",
                      border: "2px solid rgba(224,181,102,.3)", borderTopColor: "#E0B566",
                    }} className="animate-spin" />
                  </div>
                )}

                {messages.map((msg, i) => {
                  const isLast = i === messages.length - 1;
                  if (msg.role === "user") {
                    return (
                      <div key={i} style={{ width: "100%", maxWidth: "680px", display: "flex", justifyContent: "flex-end" }}>
                        <div style={{
                          background: "#14101F", border: "1px solid #2B2540",
                          padding: "12px 16px", borderRadius: "16px 16px 4px 16px",
                          fontSize: "15px", maxWidth: "80%", color: "#F4F1EA", lineHeight: 1.65,
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  }

                  const [lead, body] = splitLead(msg.content);
                  return (
                    <div key={i} style={{ width: "100%", maxWidth: "680px" }}>
                      <div style={{
                        fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase",
                        color: "#E0B566", marginBottom: "8px",
                      }}>
                        Astrea
                      </div>
                      {/* Lead — Fraunces italic */}
                      <div style={{
                        fontFamily: "'Fraunces', serif", fontStyle: "italic",
                        fontSize: "19px", lineHeight: 1.5,
                        color: "#E9DCC0", marginBottom: body ? "10px" : 0,
                      }}>
                        <ReactMarkdown components={{
                          p: ({ children }) => <span>{children}</span>,
                          strong: ({ children }) => <strong style={{ color: "#FFAE3D", fontStyle: "normal" }}>{children}</strong>,
                        }}>
                          {lead}
                        </ReactMarkdown>
                      </div>
                      {/* Body */}
                      {body && (
                        <div style={{ color: "#B6AFC6", fontSize: "15px", lineHeight: 1.65 }}>
                          <ReactMarkdown components={{
                            p: ({ children }) => <p style={{ marginBottom: "8px" }}>{children}</p>,
                            strong: ({ children }) => <strong style={{ color: "#FFAE3D", fontWeight: 600 }}>{children}</strong>,
                          }}>
                            {body}
                          </ReactMarkdown>
                        </div>
                      )}
                      {/* Follow-up chips */}
                      {isLast && msg.followups && msg.followups.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
                          {msg.followups.map((f, fi) => (
                            <motion.button
                              key={f}
                              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: fi * 0.08, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                              onClick={() => { track("chat_followup_clicked", { followup: f }); sendMessage(f); }}
                              disabled={sending}
                              style={{
                                padding: "6px 14px", borderRadius: "999px",
                                border: "1px solid #2B2540", background: "rgba(20,16,31,.5)",
                                color: "#B6AFC6", fontSize: "13px",
                                cursor: "pointer", fontFamily: "inherit", transition: ".2s",
                              }}
                              onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = "#E0B566"; b.style.color = "#E9DCC0"; }}
                              onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = "#2B2540"; b.style.color = "#B6AFC6"; }}
                            >
                              {f}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {sending && (
                  <div style={{ width: "100%", maxWidth: "680px" }}>
                    <div style={{ fontSize: "11px", letterSpacing: ".22em", textTransform: "uppercase", color: "#E0B566", marginBottom: "8px" }}>
                      Astrea
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", color: "#877FA0", fontSize: "13px" }}>
                      <span className="ch-dot" />
                      <span className="ch-dot" style={{ animationDelay: ".2s" }} />
                      <span className="ch-dot" style={{ animationDelay: ".4s" }} />
                      <span style={{ marginLeft: "6px" }}>Astrea czyta niebo…</span>
                    </div>
                  </div>
                )}

                {error && (
                  <p style={{ color: "#e26060", fontSize: "13px", textAlign: "center" }}>{error}</p>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Footer */}
              <div style={{
                padding: "14px 24px 24px",
                borderTop: "1px solid #2B2540",
                background: "rgba(11,9,18,.55)", backdropFilter: "blur(10px)",
                display: "flex", justifyContent: "center", flexShrink: 0,
              }}>
                <div style={{ width: "100%", maxWidth: "680px" }}>
                  <AnimatePresence>
                    {packSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          padding: "9px 14px", marginBottom: "10px", borderRadius: "10px",
                          background: "rgba(224,181,102,.08)", border: ".5px solid rgba(224,181,102,.35)",
                          color: "#E9DCC0", fontSize: "13px",
                        }}
                      >
                        <span style={{ color: "#FFAE3D" }}>✓</span>
                        Paczka dodana — kredyty są już na Twoim koncie.
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {showCounter && remaining !== null && (
                    <CreditMeter
                      isPaid={isPaid}
                      remaining={remaining}
                      limit={limit}
                      credits={credits}
                      onTopUp={topUp}
                    />
                  )}
                  <AnimatePresence>
                    {showDataWarning && !warningDismissed && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: "10px",
                          padding: "10px 14px", marginBottom: "10px", borderRadius: "10px",
                          background: "rgba(212,175,55,.04)", border: ".5px solid rgba(212,175,55,.20)",
                        }}
                      >
                        <Info size={13} style={{ color: "rgba(255,174,61,.6)", flexShrink: 0, marginTop: "1px" }} />
                        <p style={{ fontSize: "12px", color: "#877FA0", flex: 1, lineHeight: 1.6 }}>
                          To, co napiszesz, jest przetwarzane przez model AI.{" "}
                          <a href="/legal/privacy" style={{ color: "rgba(255,174,61,.7)" }}>Polityka prywatności</a>
                        </p>
                        <button onClick={dismissDataWarning}
                          style={{ background: "none", border: "none", color: "#877FA0", cursor: "pointer", flexShrink: 0 }}>
                          <X size={12} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Composer
                    inputRef={inputRef} value={input} onChange={setInput}
                    onKeyDown={handleKeyDown}
                    onSend={() => sendMessage()}
                    disabled={sending} placeholder="Dopytaj Astreę…"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mobile rail drawer */}
          <AnimatePresence>
            {showMobileRail && (
              <>
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  onClick={() => setShowMobileRail(false)}
                  style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 49 }}
                />
                <motion.div
                  initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    position: "absolute", top: 0, bottom: 0, left: 0, width: "290px",
                    zIndex: 50, background: "rgba(11,9,18,.97)", backdropFilter: "blur(16px)",
                    borderRight: "1px solid #2B2540",
                  }}
                >
                  <button
                    onClick={() => setShowMobileRail(false)}
                    style={{
                      position: "absolute", top: "12px", right: "12px",
                      background: "none", border: "none", color: "#877FA0",
                      cursor: "pointer", fontSize: "22px", lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                  {railContent}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
