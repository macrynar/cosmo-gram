"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { HeartHandshake, Share2, Plus, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import PersonBirthForm, { type PersonData, type SavedReadingOption } from "@/components/astro-match/PersonBirthForm";
import CompatibilityResultView from "@/components/astro-match/CompatibilityResult";
import PaywallModal from "@/components/astro-match/PaywallModal";
import ShareModal from "@/components/ShareModal";
import HistorySelector, { type HistoryItem } from "@/components/HistorySelector";
import { useAuth } from "@/components/AuthContext";
import { useSubscription } from "@/components/SubscriptionContext";
import { track } from "@/components/PostHogProvider";
import type { CompatibilityResult } from "@/app/api/astro-match/route";

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

  const [matches, setMatches]           = useState<SavedMatch[]>([]);
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [savedReadings, setSavedReadings]   = useState<SavedReadingOption[]>([]);

  const [person1, setPerson1]   = useState<PersonData | null>(null);
  const [person2, setPerson2]   = useState<PersonData | null>(null);
  const [result, setResult]         = useState<CompatibilityResult | null>(null);
  const [resultIsPremium, setResultIsPremium] = useState(false);
  const [resultNames, setResultNames] = useState({ p1: "", p2: "" });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [showShare, setShowShare]     = useState(false);
  const [showForm, setShowForm]       = useState(false);

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const loadAll = useCallback(async () => {
    if (!session) return;
    setLoadingHistory(true);
    try {
      const [matchRes, readingRes] = await Promise.all([
        fetch("/api/get-matches",  { headers: authHeader }),
        fetch("/api/get-readings", { headers: authHeader }),
      ]);
      const { matches: matchData }   = await matchRes.json()   as { matches: SavedMatch[] };
      const { readings: readingData } = await readingRes.json() as { readings: SavedReadingOption[] };

      setMatches(matchData);
      setSavedReadings(readingData ?? []);

      if (matchData.length > 0 && !selectedId) {
        setSelectedId(matchData[0].id);
        displayMatch(matchData[0]);
        setShowForm(false);
      } else {
        setShowForm(true);
      }
    } finally {
      setLoadingHistory(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (!session) { setShowForm(true); return; }
    loadAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  function displayMatch(m: SavedMatch) {
    setResult(m.compatibility_data);
    setResultIsPremium(isPro);
    setResultNames({ p1: m.person1_name, p2: m.person2_name });
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setShowForm(false);
    setError("");
    const m = matches.find(m => m.id === id);
    if (m) displayMatch(m);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/delete-match?id=${id}`, { method: "DELETE", headers: authHeader });
    const updated = matches.filter(m => m.id !== id);
    setMatches(updated);
    if (id === selectedId) {
      if (updated.length > 0) { setSelectedId(updated[0].id); displayMatch(updated[0]); }
      else { setSelectedId(null); setResult(null); setShowForm(true); }
    }
  }

  async function handleRename(id: string, name: string) {
    await fetch("/api/rename-match", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ id, name }),
    });
    setMatches(prev => prev.map(m => m.id === id ? { ...m, name } : m));
  }

  function handleNew() {
    setSelectedId(null); setResult(null); setError("");
    setShowForm(true); setPerson1(null); setPerson2(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!person1 || !person2) return;

    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/astro-match", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ person1, person2 }),
      });
      if (!res.ok) {
        const e = await res.json() as { error: string };
        if (e.error === "MONTHLY_LIMIT") {
          setError("Osiągnięto limit 10 analiz w tym miesiącu. Limit odnawia się 1. dnia miesiąca.");
          return;
        }
        throw new Error(e.error ?? "Błąd analizy");
      }
      const { result: matchResult, isPaidUser } = await res.json() as { result: CompatibilityResult; isPaidUser: boolean };
      setResult(matchResult);
      setResultIsPremium(isPaidUser);
      setResultNames({ p1: person1.name || "Osoba 1", p2: person2.name || "Osoba 2" });
      track("first_match", { score: matchResult.overallScore });
      setShowForm(false);

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
            id, name: `${person1.name || "Osoba 1"} × ${person2.name || "Osoba 2"}`,
            person1_name: person1.name, person2_name: person2.name,
            overall_score: matchResult.overallScore, compatibility_data: matchResult,
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

  const selectorItems: HistoryItem[] = matches.map(m => ({
    id: m.id,
    name: m.name || `${m.person1_name || "Osoba 1"} × ${m.person2_name || "Osoba 2"}`,
    subtitle: `${m.overall_score}/100`,
  }));

  const canSubmit = !!person1 && !!person2 && !loading;

  return (
    <div className="min-h-screen text-white" style={{ background: "#050508" }}>
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(88,60,140,0.15) 0%, transparent 70%)" }}
      />

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8 text-center"
        >
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-5"
            style={{ color: "#fb7185", background: "rgba(244,63,94,0.08)", border: "0.5px solid rgba(244,63,94,0.25)" }}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            Analiza kompatybilności
          </div>
          <h1
            className="text-3xl sm:text-4xl font-semibold text-white mb-2"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            Cosmo{" "}
            <span style={{
              background: "linear-gradient(135deg, #fb7185 0%, #fda4af 50%, #e11d48 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Match
            </span>
          </h1>
          <p className="text-slate-500 text-sm">Porównanie kosmogramów · Synastria · Interpretacja AI</p>
        </motion.div>

        {/* History selector */}
        {session && !loadingHistory && matches.length > 0 && (
          <div
            className="rounded-2xl px-4 py-3 mb-5"
            style={{ background: "rgba(5,4,14,0.65)", border: "0.5px solid rgba(212,175,55,0.14)", backdropFilter: "blur(18px)" }}
          >
            <HistorySelector
              items={selectorItems}
              selectedId={selectedId}
              onSelect={handleSelect}
              onDelete={handleDelete}
              onRename={handleRename}
              onNew={handleNew}
              newLabel="Nowy match"
            />
          </div>
        )}

        {loadingHistory && (
          <div
            className="rounded-2xl p-10 text-center mb-5"
            style={{ background: "rgba(5,4,14,0.65)", border: "0.5px solid rgba(212,175,55,0.14)" }}
          >
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" style={{ color: "#D4AF37", opacity: 0.5 }} />
            <p className="text-slate-600 text-sm">Wczytuję historię matchów…</p>
          </div>
        )}

        {/* Result */}
        {result && !showForm && (
          <>
            <CompatibilityResultView
              result={result}
              person1Name={resultNames.p1}
              person2Name={resultNames.p2}
              isPremiumUser={resultIsPremium}
              onPaywall={() => setShowPaywall(true)}
              animate={animate}
            />
            {selectedId && (
              <div className="flex justify-center mt-5">
                <button
                  onClick={() => setShowShare(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all duration-300"
                  style={{ border: "0.5px solid rgba(244,63,94,0.30)", color: "#fb7185" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(244,63,94,0.07)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <Share2 className="w-4 h-4" />
                  Udostępnij wynik
                </button>
              </div>
            )}
          </>
        )}

        {/* Form */}
        {!loadingHistory && showForm && (
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {/* Person 1 */}
              <div
                className="rounded-2xl p-6"
                style={{ background: "rgba(5,4,14,0.72)", border: "0.5px solid rgba(212,175,55,0.18)", backdropFilter: "blur(24px)" }}
              >
                <PersonBirthForm
                  label="Osoba 1"
                  accent="#D4AF37"
                  onChange={setPerson1}
                  disabled={loading}
                  savedReadings={savedReadings}
                />
              </div>

              {/* Divider symbol on mobile */}
              <div className="md:hidden flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 w-16" style={{ background: "linear-gradient(to right, transparent, rgba(244,63,94,0.30))" }} />
                  <HeartHandshake className="w-5 h-5" style={{ color: "rgba(244,63,94,0.50)" }} />
                  <div className="h-px flex-1 w-16" style={{ background: "linear-gradient(to left, transparent, rgba(244,63,94,0.30))" }} />
                </div>
              </div>

              {/* Person 2 */}
              <div
                className="rounded-2xl p-6"
                style={{ background: "rgba(5,4,14,0.72)", border: "0.5px solid rgba(244,63,94,0.18)", backdropFilter: "blur(24px)" }}
              >
                <PersonBirthForm
                  label="Osoba 2"
                  accent="#fb7185"
                  onChange={setPerson2}
                  disabled={loading}
                  savedReadings={savedReadings}
                />
              </div>
            </div>

            {error && (
              <div
                className="mb-4 p-3 rounded-xl text-sm text-center"
                style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}
              >
                {error}
              </div>
            )}

            <div className="text-center">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-300"
                style={canSubmit ? {
                  background: "linear-gradient(135deg, #e11d48, #fb7185)",
                  color: "white",
                  boxShadow: "0 4px 24px rgba(244,63,94,0.25)",
                } : {
                  background: "rgba(255,255,255,0.04)",
                  color: "#475569",
                  cursor: "not-allowed",
                }}
                onMouseEnter={e => canSubmit && ((e.currentTarget as HTMLElement).style.transform = "scale(1.02)")}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analizuję kompatybilność…</>
                ) : (
                  <><Plus className="w-4 h-4" /> Analizuj kompatybilność</>
                )}
              </button>

              {!session && (
                <p className="mt-3 text-xs text-slate-600">
                  Match bezpłatny · Zaloguj się żeby zapisać historię
                </p>
              )}
              {session && !isPro && (
                <p className="mt-3 text-xs text-slate-600">
                  Wynik score + pierwsza sekcja bezpłatnie · Pełna analiza w planie Plus
                </p>
              )}
            </div>
          </motion.form>
        )}
      </main>

      {showShare && selectedId && (
        <ShareModal type="match" matchId={selectedId} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
