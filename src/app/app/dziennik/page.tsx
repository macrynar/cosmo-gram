"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import HistorySelector, { type HistoryItem } from "@/components/HistorySelector";
import { CosmoIcon } from "@/components/CosmoIcon";
import { useAuth } from "@/components/AuthContext";
import { useStreak } from "@/lib/useStreak";
import { computeMoonPhaseName, MOON_PHASE_INFO } from "@/lib/moonPhases";
import { ROUTES } from "@/lib/routes";
import { Flame, BookOpen, Lock, ChevronRight } from "lucide-react";

const SHORT_MONTHS = ["sty","lut","mar","kwi","maj","cze","lip","sie","wrz","paź","lis","gru"];
const FULL_MONTHS  = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];

type SavedReading = {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  created_at: string;
};

type Note = {
  date: string;      // YYYY-MM-DD
  note_text: string;
  updated_at: string;
};

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function groupByMonth(notes: Note[]): Map<string, Note[]> {
  const map = new Map<string, Note[]>();
  for (const n of notes) {
    const key = n.date.slice(0, 7); // YYYY-MM
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  }
  return map;
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number);
  return `${FULL_MONTHS[month - 1]} ${year}`;
}

function MoonIcon({ phase }: { phase: NonNullable<ReturnType<typeof computeMoonPhaseName>> }) {
  const info = MOON_PHASE_INFO[phase];
  return <span title={info.label} className="text-base leading-none">{info.symbol}</span>;
}

export default function DziennikPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const { current: streakDays, longest: longestStreak, milestone, dismissMilestone } = useStreak();

  const [readings, setReadings]           = useState<SavedReading[]>([]);
  const [selectedId, setSelectedId]       = useState<string | null>(null);
  const [notes, setNotes]                 = useState<Note[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [loadingNotes, setLoadingNotes]   = useState(false);
  const [error, setError]                 = useState("");

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  // Fetch readings
  const loadReadings = useCallback(async () => {
    if (!session) return;
    setLoadingReadings(true);
    try {
      const res  = await fetch("/api/get-readings", { headers: authHeader });
      const { readings: data } = await res.json() as { readings: SavedReading[] };
      setReadings(data ?? []);
      if (data?.length) setSelectedId(data[0].id);
    } catch { setError("Nie udało się wczytać kosmogramów."); }
    finally  { setLoadingReadings(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Fetch notes for selected reading
  const loadNotes = useCallback(async (readingId: string) => {
    if (!session) return;
    setLoadingNotes(true);
    setNotes([]);
    try {
      const res  = await fetch(`/api/calendar-notes?reading_id=${readingId}`, { headers: authHeader });
      const { notes: data } = await res.json() as { notes: Note[] };
      setNotes(data ?? []);
    } catch { /* silent */ }
    finally { setLoadingNotes(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) { router.push(ROUTES.public.login.path); return; }
    loadReadings();
  }, [authLoading, session, loadReadings, router]);

  useEffect(() => {
    if (selectedId) loadNotes(selectedId);
  }, [selectedId, loadNotes]);

  const selectorItems: HistoryItem[] = readings.map(r => ({
    id: r.id,
    name: r.name || `${r.birth_place?.split(",")[0] ?? ""} · ${r.birth_date}`,
    subtitle: r.birth_date,
  }));

  const grouped = useMemo(() => groupByMonth(notes), [notes]);
  const months  = [...grouped.keys()]; // already sorted desc

  // Compute moon phase per note (client-side, cheap)
  function getMoonPhase(dateStr: string) {
    return computeMoonPhaseName(new Date(dateStr + "T12:00:00Z"));
  }

  // MILESTONE BANNER
  const milestoneCopy: Record<number, string> = {
    7:   "Tydzień z gwiazdami. ✨ Dobry start.",
    30:  "Miesiąc z kosmogramem. 🌙 Odblokowano: 1× darmowy insight wzorców.",
    90:  "90 dni! ⭐ Odblokowano: 1× darmowa głęboka interpretacja AI.",
    180: "Pół roku z Cosmogramem. 🌟 Odblokowano: Twój cykl półroczny.",
    365: "Rok! 🪐 Odblokowano: darmowy Solar Return na ten rok.",
  };

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] nebula-orb opacity-40 pointer-events-none" />

      <Navbar />

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-white font-brand">
              Cosmo <span className="gradient-text text-glow">Dziennik</span>
            </h1>
            <p className="text-slate-500 text-sm mt-1">Twoje notatki i ślad astrologiczny</p>
          </div>
          {streakDays >= 1 && (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1.5 text-orange-300 font-semibold">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>{streakDays} {streakDays === 1 ? "dzień" : streakDays < 5 ? "dni" : "dni"} z rzędu</span>
                </div>
                {longestStreak > streakDays && (
                  <p className="text-[11px] text-slate-600">rekord: {longestStreak}d</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Milestone banner */}
        {milestone && milestoneCopy[milestone] && (
          <div className="glass-card rounded-2xl p-4 mb-5 border border-amber-500/30 bg-amber-900/10 flex items-start gap-3">
            <span className="text-2xl">🎉</span>
            <div className="flex-1">
              <p className="text-sm text-amber-200 font-medium">{milestoneCopy[milestone]}</p>
            </div>
            <button onClick={dismissMilestone} className="text-slate-600 hover:text-slate-400 text-lg leading-none">×</button>
          </div>
        )}

        {/* Chart selector */}
        {readings.length > 0 && (
          <div className="glass-card rounded-2xl px-4 py-3 mb-5">
            <HistorySelector
              items={selectorItems}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
              onDelete={async (id) => {
                const updated = readings.filter(r => r.id !== id);
                setReadings(updated);
                if (id === selectedId) setSelectedId(updated[0]?.id ?? null);
              }}
              onRename={async (id, name) => {
                await fetch("/api/rename-reading", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json", ...authHeader },
                  body: JSON.stringify({ id, name }),
                });
                setReadings(prev => prev.map(r => r.id === id ? { ...r, name } : r));
              }}
              onNew={() => router.push(ROUTES.app.cosmogram.path)}
              newLabel="Nowy kosmogram"
            />
          </div>
        )}

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        {/* Pattern insights — premium gate */}
        {notes.length >= 5 && (
          <div className="glass-card rounded-2xl p-4 mb-5 border border-white/8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#03010d]/80 pointer-events-none" />
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-300">Wzorce po 30 dniach <span className="text-amber-400/80 text-xs ml-1">Premium</span></p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Auto-generated insight z Twoich wpisów: "Zauważyliśmy, że w dniach gdy Saturn jest aktywny,
                  pisałeś o trudnych decyzjach w 4 na 5 przypadków..."
                </p>
                {notes.length >= 30 ? (
                  <button className="mt-2 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                    Odblokuj wzorce →
                  </button>
                ) : (
                  <p className="mt-1.5 text-[11px] text-slate-600">
                    {30 - notes.length} notatek do odblokowania darmowego podglądu
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {(loadingReadings || loadingNotes) && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Wczytuję…</p>
          </div>
        )}

        {/* Empty state */}
        {!loadingReadings && !loadingNotes && notes.length === 0 && readings.length > 0 && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white mb-2">Brak notatek</h2>
            <p className="text-slate-400 text-sm mb-5">
              Otwórz Kalendarz, kliknij dowolny dzień i zacznij pisać — notatki pojawią się tutaj.
            </p>
            <Link
              href={ROUTES.app.calendar.path}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-amber-700/40 border border-amber-500/30 text-amber-200 hover:bg-amber-700/60 transition-colors"
            >
              Idź do Kalendarza
            </Link>
          </div>
        )}

        {!loadingReadings && readings.length === 0 && !loadingReadings && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <CosmoIcon className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-white mb-2">Najpierw stwórz kosmogram</h2>
            <Link href={ROUTES.app.cosmogram.path} className="text-amber-400 text-sm hover:text-amber-300 transition-colors">
              Przejdź do tworzenia →
            </Link>
          </div>
        )}

        {/* Notes list grouped by month */}
        {!loadingNotes && months.map(monthKey => (
          <div key={monthKey} className="mb-8">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3 px-1">
              {monthLabel(monthKey)}
            </h2>
            <div className="space-y-2">
              {grouped.get(monthKey)!.map(note => {
                const moonPhase = getMoonPhase(note.date);
                const calendarUrl = `${ROUTES.app.calendar.path}?date=${note.date}`;

                return (
                  <Link
                    key={note.date}
                    href={calendarUrl}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-white/3 border border-white/8 hover:bg-white/5 hover:border-white/15 transition-all group"
                  >
                    {/* Date */}
                    <div className="shrink-0 text-right w-14">
                      <p className="text-amber-400 font-semibold text-sm">{formatDateLong(note.date).split(" ").slice(0, 2).join(" ")}</p>
                      <p className="text-slate-600 text-xs">{note.date.slice(0, 4)}</p>
                    </div>

                    {/* Moon phase icon (if applicable) */}
                    <div className="shrink-0 mt-0.5 w-5 text-center">
                      {moonPhase && <MoonIcon phase={moonPhase} />}
                    </div>

                    {/* Note preview */}
                    <div className="flex-1 min-w-0">
                      {moonPhase && (
                        <p className="text-[11px] text-indigo-400/80 font-medium mb-0.5">
                          {MOON_PHASE_INFO[moonPhase].label} · {MOON_PHASE_INFO[moonPhase].purpose}
                        </p>
                      )}
                      <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                        {note.note_text}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-colors shrink-0 mt-0.5" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Footer CTA */}
        {notes.length > 0 && (
          <p className="text-center text-xs text-slate-600 mt-4">
            Łącznie {notes.length} {notes.length === 1 ? "wpis" : notes.length < 5 ? "wpisy" : "wpisów"} ·{" "}
            <Link href={ROUTES.app.calendar.path} className="text-amber-700 hover:text-amber-500 transition-colors">
              Dodaj kolejny w Kalendarzu →
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
