"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart, Star } from "lucide-react";
import { CosmoIcon } from "@/components/CosmoIcon";
import Navbar from "@/components/Navbar";
import PersonBirthForm, { type PersonData } from "@/components/astro-match/PersonBirthForm";
import CompatibilityResultView from "@/components/astro-match/CompatibilityResult";
import PaywallModal from "@/components/astro-match/PaywallModal";
import HistorySelector, { type HistoryItem } from "@/components/HistorySelector";
import { useAuth } from "@/components/AuthContext";
import { track } from "@/components/PostHogProvider";
import type { CompatibilityResult } from "@/app/api/astro-match/route";

type SavedMatch = {
  id: string;
  name: string;
  person1_name: string;
  person2_name: string;
  overall_score: number;
  compatibility_data: CompatibilityResult;
  created_at: string;
};

export default function AstroMatchPage() {
  const { session } = useAuth();

  const [matches, setMatches]       = useState<SavedMatch[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [person1, setPerson1] = useState<PersonData | null>(null);
  const [person2, setPerson2] = useState<PersonData | null>(null);
  const [result, setResult]   = useState<CompatibilityResult | null>(null);
  const [resultNames, setResultNames] = useState({ p1: "", p2: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [showPaywall, setShowPaywall] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const loadMatches = useCallback(async () => {
    if (!session) return;
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/get-matches", { headers: authHeader });
      const { matches: data } = await res.json() as { matches: SavedMatch[] };
      setMatches(data);
      if (data.length > 0 && !selectedId) {
        const first = data[0];
        setSelectedId(first.id);
        displayMatch(first);
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
    loadMatches();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  function displayMatch(m: SavedMatch) {
    setResult(m.compatibility_data);
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
      if (updated.length > 0) {
        setSelectedId(updated[0].id);
        displayMatch(updated[0]);
      } else {
        setSelectedId(null);
        setResult(null);
        setShowForm(true);
      }
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
    setSelectedId(null);
    setResult(null);
    setError("");
    setShowForm(true);
    setPerson1(null);
    setPerson2(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!person1 || !person2) return;

    if (session && matches.length >= 1) {
      setShowPaywall(true);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/astro-match", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ person1, person2 }),
      });

      if (!res.ok) {
        const e = await res.json() as { error: string };
        if (e.error === "PAYWALL") { setShowPaywall(true); return; }
        throw new Error(e.error ?? "Błąd analizy");
      }

      const { result: matchResult } = await res.json() as { result: CompatibilityResult };
      setResult(matchResult);
      setResultNames({ p1: person1.name, p2: person2.name });
      track("first_match", { score: matchResult.overallScore });
      setShowForm(false);

      if (session) {
        const saveRes = await fetch("/api/save-match", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({
            person1Name: person1.name,
            person1BirthDate: person1.date,
            person1BirthTime: person1.time,
            person1BirthPlace: person1.place,
            person2Name: person2.name,
            person2BirthDate: person2.date,
            person2BirthTime: person2.time,
            person2BirthPlace: person2.place,
            overallScore: matchResult.overallScore,
            compatibilityData: matchResult,
          }),
        });
        if (saveRes.ok) {
          const { id } = await saveRes.json() as { id: string };
          const defaultName = `${person1.name || "Osoba 1"} × ${person2.name || "Osoba 2"}`;
          const newEntry: SavedMatch = {
            id, name: defaultName,
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

  const selectorItems: HistoryItem[] = matches.map(m => ({
    id: m.id,
    name: m.name || `${m.person1_name || "Osoba 1"} × ${m.person2_name || "Osoba 2"}`,
    subtitle: `${m.overall_score}/100`,
  }));

  const canSubmit = !!person1 && !!person2 && !loading;

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] nebula-orb opacity-30 pointer-events-none" />
      <Star className="fixed top-[22%] left-[6%] w-2 h-2 text-pink-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "3.2s" }} />
      <Star className="fixed top-[60%] right-[5%] w-2 h-2 text-amber-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "4.5s" }} />

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full border border-pink-500/30 bg-pink-900/20 text-pink-300 text-xs font-medium tracking-wide">
            <Heart className="w-3.5 h-3.5 text-pink-400" />
            Analiza kompatybilności
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-brand">
            Astro <span className="bg-gradient-to-r from-pink-400 to-amber-300 bg-clip-text text-transparent">Match</span>
          </h1>
          <p className="text-slate-500 text-sm">Porównaj dwa kosmogramy · Synastria · Interpretacja AI</p>
        </div>

        {/* History selector */}
        {session && !loadingHistory && matches.length > 0 && (
          <div className="glass-card rounded-2xl px-4 py-3 mb-6">
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

        {/* Loading history */}
        {loadingHistory && (
          <div className="glass-card rounded-2xl p-10 text-center mb-6">
            <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Wczytuję poprzednie matche…</p>
          </div>
        )}

        {/* Result */}
        {result && !showForm && (
          <CompatibilityResultView
            result={result}
            person1Name={resultNames.p1}
            person2Name={resultNames.p2}
          />
        )}

        {/* Form */}
        {!loadingHistory && showForm && (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="glass-card rounded-2xl p-6">
                <PersonBirthForm
                  label="Osoba 1"
                  accentColor="text-amber-400"
                  onChange={setPerson1}
                  disabled={loading}
                />
              </div>
              <div className="glass-card rounded-2xl p-6">
                <PersonBirthForm
                  label="Osoba 2"
                  accentColor="text-pink-400"
                  onChange={setPerson2}
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-700/30 text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <div className="text-center">
              <button
                type="submit"
                disabled={!canSubmit}
                className={`inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
                  canSubmit
                    ? "bg-gradient-to-r from-pink-600 to-amber-600 text-white shadow-lg shadow-amber-950/40 hover:shadow-amber-800/50 hover:scale-[1.02] active:scale-[0.99]"
                    : "bg-amber-900/20 text-slate-500 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analizuję…</>
                ) : (
                  <><CosmoIcon className="w-4 h-4" /> Analizuj kompatybilność</>
                )}
              </button>

              {!session && (
                <p className="mt-3 text-xs text-slate-600">
                  Pierwszy match bezpłatny · Zaloguj się żeby zapisać historię
                </p>
              )}
            </div>
          </form>
        )}

        {!session && result && (
          <p className="text-center text-xs text-slate-600 mt-6">
            Zaloguj się, żeby zapisać historię matchów.
          </p>
        )}

      </main>
    </div>
  );
}
