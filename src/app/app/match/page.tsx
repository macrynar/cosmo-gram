"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import PersonBirthForm, { type PersonData, type SavedReadingOption } from "@/components/astro-match/PersonBirthForm";
import CompatibilityResultView from "@/components/astro-match/CompatibilityResult";
import PaywallModal from "@/components/astro-match/PaywallModal";
import ShareModal from "@/components/ShareModal";
import { useAuth } from "@/components/AuthContext";
import { useSubscription } from "@/components/SubscriptionContext";
import { track } from "@/components/PostHogProvider";
import type { CompatibilityResult } from "@/app/api/astro-match/route";

// Cinematic intro „kino w kole" — zastępuje stary loader tekstowy (bez napisów)
const INTRO_STYLES = `
@keyframes mxl-spin    { to { transform: rotate(360deg); } }
@keyframes mxl-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.04); } }
.mxl-glow  { animation: mxl-breathe 7s ease-in-out infinite; }
.mxl-scan  { position:absolute; width:130%; height:130%; border-radius:50%;
  background: conic-gradient(from 0deg, transparent 0 66%, rgba(255,174,61,.22) 86%, transparent 100%);
  animation: mxl-spin 3.2s linear infinite; }
.mxl-iring { position:absolute; width:58%; height:58%; border-radius:50%;
  border:1px solid rgba(224,181,102,.4); animation: mxl-breathe 2.6s ease-in-out infinite; }
.mxl-iring-b { width:74%; height:74%; border-style:dashed; border-color:rgba(224,181,102,.18);
  animation: mxl-spin 16s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .mxl-glow,.mxl-scan,.mxl-iring,.mxl-iring-b { animation:none!important; }
}
`;

// Statusy pokazywane w środku koła podczas generowania (cyklują)
const LOAD_STEPS = [
  "Nakładamy Wasze kosmogramy…",
  "Liczymy aspekty synastrii…",
  "Astrea odczytuje Wasze połączenia…",
  "Składamy interpretację…",
];

type SavedMatch = {
  id: string; name: string;
  person1_name: string; person2_name: string;
  overall_score: number;
  compatibility_data: CompatibilityResult;
  created_at: string;
};

export default function AstroMatchPage() {
  const { session } = useAuth();
  const { isPro } = useSubscription();
  const searchParams = useSearchParams();
  const animate = searchParams.get("reveal") !== "instant";

  const [matches, setMatches]               = useState<SavedMatch[]>([]);
  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savedReadings, setSavedReadings]   = useState<SavedReadingOption[]>([]);

  const [person1, setPerson1] = useState<PersonData | null>(null);
  const [person2, setPerson2] = useState<PersonData | null>(null);
  const [result, setResult]   = useState<CompatibilityResult | null>(null);
  const [resultIsPremium, setResultIsPremium] = useState(false);
  const [resultNames, setResultNames] = useState({ p1: "", p2: "" });
  const [loading, setLoading]   = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [error, setError]       = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [showShare, setShowShare]     = useState(false);
  const [view, setView] = useState<"setup" | "result">("setup");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  // Cykluj statusy w loaderze (reset robi handleSubmit przy starcie)
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setLoadStep(s => (s + 1) % LOAD_STEPS.length), 2200);
    return () => clearInterval(id);
  }, [loading]);

  const loadAll = useCallback(async () => {
    if (!session) return;
    setLoadingHistory(true);
    try {
      const [matchRes, readingRes] = await Promise.all([
        fetch("/api/get-matches",  { headers: authHeader }),
        fetch("/api/get-readings", { headers: authHeader }),
      ]);
      const { matches: matchData }    = await matchRes.json()   as { matches: SavedMatch[] };
      const { readings: readingData } = await readingRes.json() as { readings: SavedReadingOption[] };

      setMatches(matchData ?? []);
      setSavedReadings(readingData ?? []);

      if (matchData?.length > 0) {
        setSelectedId(matchData[0].id);
        displayMatch(matchData[0]);
        setView("result");
      }
    } finally {
      setLoadingHistory(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  function displayMatch(m: SavedMatch) {
    setResult(m.compatibility_data);
    setResultIsPremium(isPro);
    setResultNames({ p1: m.person1_name, p2: m.person2_name });
  }

  function handleSelectMatch(id: string) {
    setSelectedId(id);
    setError("");
    const m = matches.find(m => m.id === id);
    if (m) { displayMatch(m); setView("result"); }
  }

  async function handleDeleteMatch(id: string) {
    await fetch(`/api/delete-match?id=${id}`, { method: "DELETE", headers: authHeader });
    const updated = matches.filter(m => m.id !== id);
    setMatches(updated);
    if (id === selectedId) {
      if (updated.length > 0) { setSelectedId(updated[0].id); displayMatch(updated[0]); }
      else { setSelectedId(null); setResult(null); setView("setup"); }
    }
  }

  function handleNew() {
    setSelectedId(null); setResult(null); setError("");
    setPerson1(null); setPerson2(null); setView("setup");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!person1 || !person2) return;

    setLoading(true); setLoadStep(0); setError(""); setResult(null);
    try {
      const res = await fetch("/api/astro-match", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ person1, person2 }),
      });
      if (!res.ok) {
        const e = await res.json() as { error: string };
        if (e.error === "MONTHLY_LIMIT") {
          // TODO COPY (Mac)
          setError("Osiągnięto limit 5 analiz w tym miesiącu. Limit odnawia się 1. dnia miesiąca.");
          return;
        }
        if (e.error === "FREE_LIMIT") {
          // Free: 1 match gratis → kolejne za paywallem.
          setShowPaywall(true);
          return;
        }
        throw new Error(e.error ?? "Błąd analizy");
      }
      const { result: matchResult, isPaidUser } = await res.json() as { result: CompatibilityResult; isPaidUser: boolean };
      setResult(matchResult);
      setResultIsPremium(isPaidUser);
      setResultNames({ p1: person1.name || "Osoba 1", p2: person2.name || "Osoba 2" });
      track("match_revealed", { score: matchResult.overallScore });
      setView("result");

      if (session) {
        const saveRes = await fetch("/api/save-match", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({
            person1Name: person1.name, person1BirthDate: person1.date,
            person1BirthTime: person1.time, person1BirthPlace: person1.place,
            person2Name: person2.name, person2BirthDate: person2.date,
            person2BirthTime: person2.time, person2BirthPlace: person2.place,
            overallScore: matchResult.overallScore, compatibilityData: matchResult,
          }),
        });
        if (saveRes.ok) {
          const { id } = await saveRes.json() as { id: string };
          const newEntry: SavedMatch = {
            id,
            name: `${person1.name || "Osoba 1"} × ${person2.name || "Osoba 2"}`,
            person1_name: person1.name, person2_name: person2.name,
            overall_score: matchResult.overallScore,
            compatibility_data: matchResult,
            created_at: new Date().toISOString(),
          };
          setMatches(prev => [newEntry, ...prev]);
          setSelectedId(id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !!person1 && !!person2 && !loading;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(130% 90% at 50% -5%, #1A1530 0%, #0B0912 62%) fixed #0B0912",
      color: "#F4F1EA",
      fontFamily: "'General Sans', system-ui, sans-serif",
    }}>
      {/* Grain */}
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 70, opacity: .045,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")`,
      }} />

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}
      <Navbar />

      <main style={{ position: "relative", zIndex: 10, maxWidth: "1040px", margin: "0 auto", padding: "88px 24px 80px" }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: "center", marginBottom: "26px" }}
        >
          <h1 style={{
            fontFamily: "'Fraunces', serif", fontWeight: 500,
            fontSize: "clamp(34px, 5vw, 52px)", margin: "0 0 6px",
            background: "linear-gradient(110deg,#FFF8EC 0%,#FFD9A0 55%,#E8BE78 100%)",
            WebkitBackgroundClip: "text", backgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Cosmo Match
          </h1>
          <p style={{ color: "#877FA0", fontSize: "15px" }}>
            Porównanie kosmogramów · Synastria · Interpretacja Astrei
          </p>
        </motion.div>

        {/* ── Match history chips ── */}
        {(loadingHistory || matches.length > 0) && (
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginBottom: "22px" }}>
            {loadingHistory ? (
              <div style={{ padding: "10px 18px", borderRadius: "999px", border: "1px solid #2B2540", background: "#14101F", color: "#877FA0", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Wczytuję…
              </div>
            ) : (
              <>
                {matches.map(m => {
                  const isActive = m.id === selectedId;
                  const label    = m.name || `${m.person1_name} × ${m.person2_name}`;
                  const dateLabel = m.created_at
                    ? new Date(m.created_at).toLocaleDateString("pl-PL", { day: "2-digit", month: "2-digit", year: "2-digit" })
                    : null;
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        borderRadius: "999px", transition: ".2s ease",
                        border: `1px solid ${isActive ? "#E0B566" : "#2B2540"}`,
                        background: isActive ? "rgba(224,181,102,.10)" : "#14101F",
                      }}
                    >
                      <button
                        onClick={() => handleSelectMatch(m.id)}
                        style={{
                          padding: "10px 14px 10px 18px", borderRadius: "999px 0 0 999px",
                          fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
                          background: "transparent", border: "none",
                          color: isActive ? "#E9DCC0" : "#B6AFC6",
                          display: "inline-flex", alignItems: "center", gap: "8px",
                        }}
                      >
                        {label}
                        {dateLabel && (
                          <span style={{ fontSize: "11px", color: "#877FA0", fontVariantNumeric: "tabular-nums" }}>
                            {dateLabel}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(m.id); }}
                        title="Usuń match"
                        style={{
                          padding: "8px 12px 8px 4px", background: "transparent", border: "none",
                          cursor: "pointer", display: "flex", alignItems: "center",
                          color: isActive ? "rgba(224,181,102,.50)" : "rgba(135,127,160,.40)",
                          borderRadius: "0 999px 999px 0", transition: ".2s ease",
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#E07055"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = isActive ? "rgba(224,181,102,.50)" : "rgba(135,127,160,.40)"; }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={handleNew}
                  style={{
                    padding: "10px 18px", borderRadius: "999px",
                    border: "1px dashed #2B2540", background: "transparent",
                    color: "#877FA0", fontSize: "14px", cursor: "pointer",
                    fontFamily: "inherit", display: "flex", alignItems: "center", gap: "6px",
                    transition: ".2s ease",
                  }}
                  onMouseEnter={e => { const b = e.currentTarget; b.style.borderColor = "#E0B566"; b.style.color = "#E0B566"; }}
                  onMouseLeave={e => { const b = e.currentTarget; b.style.borderColor = "#2B2540"; b.style.color = "#877FA0"; }}
                >
                  <Plus size={13} /> Nowy match
                </button>
              </>
            )}
          </div>
        )}


        {/* ── Loading: cinematic intro „kino w kole" (bez napisów) ── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: "center", marginBottom: "24px" }}
            >
              <style dangerouslySetInnerHTML={{ __html: INTRO_STYLES }} />

              {/* Header — spójny z hero, dla płynnego przejścia w koło */}
              <div style={{ fontSize: "11px", letterSpacing: ".3em", textTransform: "uppercase", color: "#877FA0", marginBottom: "4px" }}>
                Kompatybilność
              </div>
              <div style={{ fontSize: "14px", color: "#B6AFC6", marginBottom: "18px" }}>
                <b style={{ color: "#F4F1EA" }}>{person1?.name || "Osoba 1"}</b>
                <span style={{ color: "#E0B566", margin: "0 8px" }}>×</span>
                <b style={{ color: "#F4F1EA" }}>{person2?.name || "Osoba 2"}</b>
              </div>

              <div style={{ position: "relative", width: "min(440px,90vw)", aspectRatio: "1", margin: "0 auto" }}>
                <div className="mxl-glow" style={{
                  position: "absolute", inset: "-6%", borderRadius: "50%", pointerEvents: "none",
                  background: "radial-gradient(circle, rgba(255,174,61,.16) 0, rgba(255,174,61,.05) 42%, transparent 66%)",
                }} />
                <div style={{
                  position: "absolute", inset: 0, borderRadius: "50%", overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid rgba(224,181,102,.16)",
                  background: "radial-gradient(circle, rgba(11,9,18,.32) 0, rgba(11,9,18,.74) 78%)",
                }}>
                  <video
                    src="/assets/match/match-reveal.mp4"
                    muted loop playsInline autoPlay preload="auto"
                    onError={e => { (e.currentTarget as HTMLVideoElement).style.display = "none"; }}
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: .95 }}
                  />
                  <div className="mxl-scan" />
                  <div className="mxl-iring mxl-iring-b" />
                  <div className="mxl-iring" />
                </div>

                {/* Status czynności — w środku koła */}
                <div style={{
                  position: "absolute", inset: 0, display: "flex",
                  alignItems: "center", justifyContent: "center",
                  pointerEvents: "none", padding: "0 36px", textAlign: "center",
                }}>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadStep}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        margin: 0, fontFamily: "'Fraunces', serif", fontStyle: "italic",
                        fontSize: "16px", lineHeight: 1.4, color: "#E9DCC0",
                        textShadow: "0 2px 16px rgba(0,0,0,.75)",
                      }}
                    >
                      {LOAD_STEPS[loadStep]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Result view ── */}
        <AnimatePresence mode="wait">
          {view === "result" && result && !loading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {result.summary?.includes("chwilowo niedostępna") && (
                <div style={{
                  marginBottom: "16px", padding: "12px 18px", borderRadius: "14px",
                  background: "rgba(224,181,102,.07)", border: "1px solid rgba(224,181,102,.22)",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px",
                }}>
                  <span style={{ fontSize: "13px", color: "#E0B566" }}>
                    Ta analiza pochodzi ze starszej wersji i nie ma jeszcze interpretacji AI.
                  </span>
                  <button onClick={handleNew} style={{
                    padding: "6px 14px", borderRadius: "999px", fontSize: "12px",
                    background: "rgba(224,181,102,.15)", border: "1px solid rgba(224,181,102,.35)",
                    color: "#E0B566", cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                  }}>
                    Nowy match →
                  </button>
                </div>
              )}
              <CompatibilityResultView
                result={result}
                person1Name={resultNames.p1}
                person2Name={resultNames.p2}
                isPremiumUser={resultIsPremium}
                onPaywall={() => setShowPaywall(true)}
                animate={animate}
                selectedMatchId={selectedId}
                onShare={() => { track("match_shared"); setShowShare(true); }}
                onNewMatch={handleNew}
              />
            </motion.div>
          )}

          {/* ── Setup view ── */}
          {view === "setup" && !loading && (
            <motion.form
              key="setup"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", marginBottom: "20px" }}>
                {/* Panel Osoba 1 */}
                <div style={{
                  flex: "1 1 260px", minWidth: "260px",
                  border: "1px solid #2B2540", borderRadius: "22px",
                  background: "#14101F", padding: "24px",
                }}>
                  <PersonBirthForm
                    label="Osoba 1"
                    accent="#FFAE3D"
                    onChange={setPerson1}
                    disabled={loading}
                    savedReadings={savedReadings}
                  />
                </div>

                {/* Panel Osoba 2 */}
                <div style={{
                  flex: "1 1 260px", minWidth: "260px",
                  border: "1px solid #2B2540", borderRadius: "22px",
                  background: "#14101F", padding: "24px",
                }}>
                  <PersonBirthForm
                    label="Osoba 2"
                    accent="#E0B566"
                    onChange={setPerson2}
                    disabled={loading}
                    savedReadings={savedReadings}
                  />
                </div>
              </div>

              {error && (
                <div style={{
                  marginBottom: "16px", padding: "12px 16px", borderRadius: "14px",
                  fontSize: "14px", textAlign: "center",
                  background: "rgba(226,101,74,.08)", border: ".5px solid rgba(226,101,74,.22)",
                  color: "#fca5a5",
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "10px",
                    padding: "14px 32px", borderRadius: "999px",
                    fontSize: "15px", fontWeight: 600, fontFamily: "inherit",
                    border: "none", cursor: canSubmit ? "pointer" : "not-allowed",
                    transition: "box-shadow .3s, opacity .2s",
                    ...(canSubmit ? {
                      background: "linear-gradient(135deg,#FFC56B 0%,#FFAE3D 45%,#F08F2E 100%)",
                      color: "#201405",
                      boxShadow: "0 0 40px rgba(255,174,61,.22)",
                    } : {
                      background: "rgba(255,255,255,.04)",
                      color: "#475569",
                    }),
                  }}
                  onMouseEnter={e => canSubmit && ((e.currentTarget as HTMLElement).style.boxShadow = "0 0 60px rgba(255,174,61,.32)")}
                  onMouseLeave={e => canSubmit && ((e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(255,174,61,.22)")}
                >
                  ♡ Porównaj kosmogramy →
                </button>
              </div>

              {!session && (
                <p style={{ marginTop: "12px", fontSize: "12px", color: "#877FA0", textAlign: "center" }}>
                  Match bezpłatny · Zaloguj się żeby zapisać historię
                </p>
              )}
              {session && !isPro && (
                /* TODO COPY (Mac) */
                <p style={{ marginTop: "12px", fontSize: "12px", color: "#877FA0", textAlign: "center" }}>
                  Score + 3 moduły bezpłatnie · Pełna analiza 8 wymiarów w planie Plus
                </p>
              )}
            </motion.form>
          )}
        </AnimatePresence>

      </main>

      {showShare && selectedId && (
        <ShareModal type="match" matchId={selectedId} onClose={() => setShowShare(false)} />
      )}

      {/* ── Confirm delete modal ── */}
      {confirmDeleteId && (() => {
        const m = matches.find(x => x.id === confirmDeleteId);
        const label = m ? (m.name || `${m.person1_name} × ${m.person2_name}`) : "ten match";
        return (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(5,4,14,0.80)",
              backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "24px",
            }}
            onClick={() => setConfirmDeleteId(null)}
          >
            <div
              style={{
                background: "#14101F",
                border: "1px solid #2B2540",
                borderRadius: "20px",
                padding: "28px 28px 24px",
                maxWidth: "340px",
                width: "100%",
                boxShadow: "0 24px 60px rgba(0,0,0,.6)",
              }}
              onClick={e => e.stopPropagation()}
            >
              <p style={{ fontSize: "12px", color: "#877FA0", textTransform: "uppercase", letterSpacing: ".15em", marginBottom: "10px" }}>
                Potwierdź usunięcie
              </p>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#E9DCC0", marginBottom: "6px" }}>
                Usunąć „{label}”?
              </p>
              <p style={{ fontSize: "13px", color: "#877FA0", lineHeight: 1.5, marginBottom: "24px" }}>
                Tej operacji nie można cofnąć. Analiza i wyniki zostaną trwale usunięte.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  style={{
                    flex: 1, padding: "11px", borderRadius: "12px",
                    border: "1px solid #2B2540", background: "transparent",
                    color: "#B6AFC6", fontSize: "14px", cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Anuluj
                </button>
                <button
                  onClick={async () => {
                    await handleDeleteMatch(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  style={{
                    flex: 1, padding: "11px", borderRadius: "12px",
                    border: "1px solid rgba(224,107,85,.40)",
                    background: "rgba(224,107,85,.12)",
                    color: "#E07055", fontSize: "14px", fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}
                >
                  <Trash2 size={13} /> Usuń
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
