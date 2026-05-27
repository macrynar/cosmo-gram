"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import IntentionPicker from "@/components/Map/IntentionPicker";
import ViewToggle, { type ViewMode } from "@/components/Map/ViewToggle";
import PlacesView from "@/components/Map/PlacesView";
import PlaceFullNarrative from "@/components/Map/PlaceFullNarrative";
import PaywallTeaser from "@/components/Map/PaywallTeaser";
import { useAuth } from "@/components/AuthContext";
import { useSubscription } from "@/components/SubscriptionContext";
import { track } from "@/components/PostHogProvider";
import type { Astrocartography, ActiveLine, PlanetLines } from "@/lib/astrocartography";
import { activeLinesForCity } from "@/lib/astrocartography";
import { CURATED_CITIES, type CuratedCity } from "@/lib/curatedCities";
import { INTENTIONS, getIntention, type IntentionId } from "@/lib/intentions";

const MapExplorer = dynamic(() => import("@/components/Map/MapExplorer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] flex items-center justify-center bg-[#0d0a1a] rounded-2xl">
      <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
    </div>
  ),
});

type SavedReading = {
  id: string;
  name: string;
  birth_date: string;
  birth_place: string;
};

function PersonSelector({
  readings,
  selectedId,
  onChange,
  loading,
}: {
  readings: SavedReading[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = readings.find((r) => r.id === selectedId) ?? readings[0];
  if (readings.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-900/15 border border-amber-700/30 text-sm text-amber-100 hover:bg-amber-900/25 transition-all"
      >
        <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-medium truncate max-w-[140px]">
          {selected ? (selected.name || selected.birth_place?.split(",")[0] || selected.birth_date) : "Wybierz osobę"}
        </span>
        {loading && <span className="text-[10px] text-slate-500">Ładuję…</span>}
        <ChevronDown className={`w-3 h-3 text-amber-500/70 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[220px] rounded-xl border border-amber-900/30 bg-[#0b0719]/98 backdrop-blur shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 text-[10px] text-slate-500 border-b border-amber-900/20 uppercase tracking-wider">
            Czyja mapa?
          </div>
          {readings.map((r) => (
            <button
              key={r.id}
              onMouseDown={() => { onChange(r.id); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-sm border-b border-amber-900/10 last:border-0 transition-colors ${
                r.id === (selectedId ?? readings[0]?.id)
                  ? "bg-amber-900/25 text-amber-100"
                  : "text-slate-300 hover:bg-amber-900/15 hover:text-white"
              }`}
            >
              <span className="font-medium">{r.name || r.birth_place?.split(",")[0] || "Bez nazwy"}</span>
              <span className="text-slate-500 text-xs ml-2">{r.birth_date}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CosmoMapPage() {
  const { session, loading: authLoading } = useAuth();
  const { isPro, isLoading: subLoading } = useSubscription();

  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null);
  const [astro, setAstro] = useState<Astrocartography | null>(null);
  const [birthCoords, setBirthCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [error, setError] = useState("");

  const [view, setView] = useState<ViewMode>("places");
  const [intentionId, setIntentionId] = useState<IntentionId>("spokoj");
  const [selectedPlace, setSelectedPlace] = useState<{ city: CuratedCity; lines: ActiveLine[] } | null>(null);
  const [teasers, setTeasers] = useState<Record<string, string>>({});

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  // Load readings
  useEffect(() => {
    if (!session) return;
    fetch("/api/get-readings", { headers: authHeader })
      .then((r) => r.json())
      .then((data: { readings: SavedReading[] }) => {
        const list = data.readings ?? [];
        setReadings(list);
        if (list.length > 0) setSelectedReadingId(list[0].id);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Load astrocartography lines
  useEffect(() => {
    if (!session || !selectedReadingId) return;
    setMapLoading(true);
    setAstro(null);
    setSelectedPlace(null);
    setError("");

    fetch("/api/cosmo-map-compute", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ reading_id: selectedReadingId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setAstro({
          planets: data.lines as Record<string, PlanetLines>,
          parans: data.parans ?? [],
          birth: { lat: data.birthLat ?? 0, lon: data.birthLon ?? 0, gst_deg: 0 },
        } as Astrocartography);
        if (data.birthLat && data.birthLon) {
          setBirthCoords({ lat: data.birthLat, lon: data.birthLon });
        }
        track("cosmo_map_opened", { is_premium: true });
      })
      .catch(() => setError("Nie udało się załadować mapy."))
      .finally(() => setMapLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReadingId, session]);

  const intention = useMemo(() => getIntention(intentionId) ?? INTENTIONS[0], [intentionId]);

  const handleIntentionChange = useCallback((id: IntentionId) => {
    setIntentionId(id);
    track("cosmo_map_intention_selected", { intention_id: id });
  }, []);

  const handleViewChange = useCallback((v: ViewMode) => {
    setView(v);
    track("cosmo_map_view_changed", { to: v });
  }, []);

  const handlePlaceClick = useCallback((city: CuratedCity, linesOrLine: ActiveLine[] | ActiveLine | null) => {
    const lines = Array.isArray(linesOrLine) ? linesOrLine : (linesOrLine ? [linesOrLine] : []);
    setSelectedPlace({ city, lines });
    track("cosmo_map_place_opened", { slug: city.slug, intention: intentionId });
  }, [intentionId]);

  const handlePlaceClickFromMap = useCallback((city: CuratedCity, lines: ActiveLine[]) => {
    handlePlaceClick(city, lines);
  }, [handlePlaceClick]);

  const handleShowOnMap = useCallback(() => {
    setView("map");
    setSelectedPlace(null);
  }, []);

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-[#03010d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isPro) {
    track("cosmo_map_paywall_shown", {});
    return (
      <div className="min-h-screen bg-[#03010d] text-white">
        <Navbar />
        <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white font-brand mb-4">
            Cosmo <span className="gradient-text text-glow">Map</span>
          </h1>
          <PaywallTeaser />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white font-brand leading-tight">
              Cosmo <span className="gradient-text text-glow">Map</span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Miejsca zgodne z Twoją energią</p>
          </div>
          <PersonSelector
            readings={readings}
            selectedId={selectedReadingId}
            onChange={setSelectedReadingId}
            loading={mapLoading}
          />
          <div className="ml-auto">
            <ViewToggle value={view} onChange={handleViewChange} />
          </div>
        </div>

        {/* Intention picker */}
        <div className="glass-card rounded-2xl px-4 py-3 mb-4">
          <IntentionPicker value={intentionId} onChange={handleIntentionChange} />
        </div>

        {error && (
          <div className="glass-card rounded-xl px-4 py-3 mb-4 bg-red-900/15 border-red-700/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {readings.length === 0 && !mapLoading && (
          <div className="glass-card rounded-2xl p-8 text-center text-slate-400 text-sm">
            Brak zapisanych kosmogramów. Najpierw wygeneruj swój kosmogram.
          </div>
        )}

        {mapLoading && (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-sm text-slate-500">Obliczam linie planetarne…</p>
          </div>
        )}

        {astro && !mapLoading && (
          <>
            {view === "places" && (
              <PlacesView
                intention={intention}
                astro={astro}
                cities={CURATED_CITIES}
                teasers={teasers}
                onPlaceClick={handlePlaceClick}
              />
            )}

            {view === "map" && (
              <MapExplorer
                astro={astro}
                cities={CURATED_CITIES}
                intention={intention}
                onCityClick={handlePlaceClickFromMap}
                birthLocation={birthCoords}
              />
            )}
          </>
        )}
      </main>

      {/* Place full narrative drawer */}
      {selectedPlace && (
        <PlaceFullNarrative
          city={selectedPlace.city}
          intentionId={intentionId}
          activeLines={selectedPlace.lines.length > 0
            ? selectedPlace.lines
            : astro
              ? activeLinesForCity({ lat: selectedPlace.city.lat, lon: selectedPlace.city.lon }, astro)
              : []}
          accessToken={session?.access_token}
          readingId={selectedReadingId ?? undefined}
          onClose={() => setSelectedPlace(null)}
          onShowOnMap={handleShowOnMap}
          onCityChange={(city) => {
            const lines = astro
              ? activeLinesForCity({ lat: city.lat, lon: city.lon }, astro)
              : [];
            setSelectedPlace({ city, lines });
          }}
        />
      )}
    </div>
  );
}
