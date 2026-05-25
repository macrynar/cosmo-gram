"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, ChevronUp, User } from "lucide-react";
import Navbar from "@/components/Navbar";
import IntentionPicker from "@/components/Map/IntentionPicker";
import CitySearch from "@/components/Map/CitySearch";
import CityDetails from "@/components/Map/CityDetails";
import MobileCityList from "@/components/Map/MobileCityList";
import { computeTopCities } from "@/components/Map/MobileCityList";
import { useAuth } from "@/components/AuthContext";
import { track } from "@/components/PostHogProvider";
import type { Astrocartography, ActiveLine, Intention, PlanetLines } from "@/lib/astrocartography";
import { activeLinesForCity, PLANET_PL, PLANET_EMOJI, PLANET_COLORS, LINE_PL_SHORT } from "@/lib/astrocartography";
import type { City } from "@/lib/cityDatabase";

const MapCanvas = dynamic(() => import("@/components/Map/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0d0a1a] rounded-xl">
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

type MobileTab = "map" | "list";

// ── Person selector ──────────────────────────────────────────────────────────
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

// ── Top cities panel ─────────────────────────────────────────────────────────
function TopCitiesPanel({
  astro,
  intention,
  onCitySelect,
  selectedCity,
  authHeader,
}: {
  astro: Astrocartography;
  intention: Intention | null;
  onCitySelect: (city: City) => void;
  selectedCity: City | null;
  authHeader: Record<string, string>;
}) {
  const topCities = useMemo(() => computeTopCities(astro, intention, 8), [astro, intention]);

  if (topCities.length === 0) return (
    <div className="p-4 text-center text-slate-500 text-sm">
      Brak miast z aktywnymi liniami dla tej intencji.
    </div>
  );

  return (
    <div className="divide-y divide-amber-900/15">
      {topCities.map(({ city, lines }) => {
        const top = lines[0];
        const isSelected = selectedCity?.slug === city.slug;
        return (
          <button
            key={city.slug}
            onClick={() => onCitySelect(city)}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors group ${
              isSelected ? "bg-amber-900/25" : "hover:bg-amber-900/12"
            }`}
          >
            <span
              className="text-lg leading-none w-6 shrink-0"
              style={{ color: PLANET_COLORS[top.planet] }}
            >
              {PLANET_EMOJI[top.planet]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-white truncate group-hover:text-amber-100">
                {city.name_pl}
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {PLANET_PL[top.planet]} {LINE_PL_SHORT[top.type]} · {city.country_pl}
              </div>
            </div>
            <span className="text-[11px] text-slate-600 shrink-0">{top.distance_km} km</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function CosmoMapPage() {
  const { session, loading: authLoading } = useAuth();

  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null);

  const [astro, setAstro] = useState<Astrocartography | null>(null);
  const [birthCoords, setBirthCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [mapLoading, setMapLoading] = useState(false);

  const [intention, setIntention] = useState<Intention | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showParans, setShowParans] = useState(false);

  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityLines, setCityLines] = useState<ActiveLine[]>([]);
  const [cityInterpretation, setCityInterpretation] = useState("");
  const [cityLoading, setCityLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const [mobileTab, setMobileTab] = useState<MobileTab>("map");
  const [error, setError] = useState("");

  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  // Load saved readings
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

  // Load lines when reading changes
  useEffect(() => {
    if (!session || !selectedReadingId) return;
    setMapLoading(true);
    setAstro(null);
    setSelectedCity(null);
    setPanelOpen(false);
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
          parans: data.parans,
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

  const handleIntentionChange = useCallback((i: Intention | null) => {
    setIntention(i);
    if (i) track("cosmo_map_intention_selected", { intention: i });
  }, []);

  const handleCitySelect = useCallback(async (city: City) => {
    if (!astro || !session) return;
    setSelectedCity(city);
    setPanelOpen(true);
    setMobileTab("map");

    const lines = activeLinesForCity({ lat: city.lat, lon: city.lon }, astro);
    setCityLines(lines);
    setCityInterpretation("");

    track("cosmo_map_city_viewed", { city_slug: city.slug, active_planets: [...new Set(lines.map((l) => l.planet))] });

    setCenter([city.lon, city.lat]);
    setZoom(3);

    setCityLoading(true);
    try {
      const res = await fetch("/api/cosmo-map-city", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          city_slug: city.slug,
          city_name_pl: city.name_pl,
          city_country_pl: city.country_pl,
          active_lines: lines,
        }),
      });
      const data = await res.json() as { interpretation_markdown: string };
      setCityInterpretation(data.interpretation_markdown ?? "");
    } catch {
      setCityInterpretation("Nie udało się załadować interpretacji.");
    } finally {
      setCityLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [astro, session]);

  const handleClosePanel = () => {
    setSelectedCity(null);
    setPanelOpen(false);
    setZoom(1);
    setCenter([0, 20]);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#03010d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  const selectedReading = readings.find((r) => r.id === selectedReadingId);

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] nebula-orb opacity-30 pointer-events-none" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6">
        {/* Header + person selector */}
        <div className="flex items-center gap-4 mb-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white font-brand leading-tight">
              Cosmo <span className="gradient-text text-glow">Map</span>
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Mapa mocy planetarnej</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <PersonSelector
              readings={readings}
              selectedId={selectedReadingId}
              onChange={setSelectedReadingId}
              loading={mapLoading}
            />
          </div>
        </div>

        {readings.length === 0 && !mapLoading && (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-slate-400 text-sm mb-4">
              Brak zapisanych kosmogramów. Najpierw wygeneruj swój kosmogram.
            </p>
          </div>
        )}

        {(readings.length > 0 || mapLoading) && (
          <div className="flex flex-col gap-4">
            {/* Controls bar */}
            <div className="glass-card rounded-2xl px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <IntentionPicker selected={intention} onChange={handleIntentionChange} />
              <div className="flex items-center gap-2 flex-wrap">
                <CitySearch onSelect={handleCitySelect} />
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className={`px-3 py-2 rounded-xl text-xs border transition-all whitespace-nowrap ${
                    showAll
                      ? "border-amber-600/50 bg-amber-900/20 text-amber-200"
                      : "border-amber-900/20 text-slate-500 hover:border-amber-700/30"
                  }`}
                >
                  Wszystkie linie
                </button>
                <button
                  onClick={() => setShowParans((v) => !v)}
                  className={`px-3 py-2 rounded-xl text-xs border transition-all whitespace-nowrap ${
                    showParans
                      ? "border-violet-600/50 bg-violet-900/20 text-violet-200"
                      : "border-amber-900/20 text-slate-500 hover:border-amber-700/30"
                  }`}
                >
                  Parans
                </button>
              </div>
            </div>

            {error && (
              <div className="glass-card rounded-xl px-4 py-3 bg-red-900/15 border-red-700/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Mobile tabs */}
            <div className="flex md:hidden gap-1 glass-card rounded-xl p-1">
              {(["map", "list"] as MobileTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mobileTab === tab ? "bg-amber-900/30 text-amber-100" : "text-slate-400"
                  }`}
                >
                  {tab === "map" ? "Mapa" : "Lista miast"}
                </button>
              ))}
            </div>

            {/* Main layout: map + right panel */}
            <div className="flex gap-4 items-start">
              {/* Left: map */}
              <div className={`flex-1 min-w-0 flex flex-col gap-3 ${mobileTab === "list" ? "hidden md:flex" : ""}`}>
                <div className="glass-card rounded-2xl overflow-hidden" style={{ height: "460px" }}>
                  {mapLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#0d0a1a]">
                      <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
                      <p className="text-sm text-slate-500">Obliczam linie planetarne…</p>
                    </div>
                  ) : (
                    <MapCanvas
                      astro={astro}
                      intention={intention}
                      showAll={showAll}
                      selectedCity={selectedCity}
                      birthCity={birthCoords ?? undefined}
                      zoom={zoom}
                      center={center}
                      onZoomChange={(z, c) => { setZoom(z); setCenter(c); }}
                    />
                  )}
                </div>

                {/* Parans */}
                {showParans && astro && astro.parans.length > 0 && (
                  <div className="glass-card rounded-2xl p-4">
                    <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                      Parans — punkty równolegle aktywne
                    </h3>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {astro.parans.slice(0, 30).map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="text-amber-400">{PLANET_PL[p.planet_a]}</span>
                          <span className="text-slate-600">×</span>
                          <span className="text-violet-400">{PLANET_PL[p.planet_b]}</span>
                          <span className="text-slate-600 text-[10px]">{p.type}</span>
                          <span className="ml-auto text-slate-500">{p.latitude.toFixed(1)}°</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mobile: city details sheet */}
                {panelOpen && selectedCity && (
                  <div className="md:hidden glass-card rounded-2xl overflow-hidden">
                    <button
                      onClick={() => setPanelOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-300"
                    >
                      <span className="font-medium">{selectedCity.name_pl}</span>
                      {panelOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </button>
                    <div className="px-4 pb-4 max-h-72 overflow-y-auto">
                      <CityDetails
                        city={selectedCity}
                        activeLines={cityLines}
                        interpretation={cityInterpretation}
                        loading={cityLoading}
                        onClose={handleClosePanel}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Right panel: top cities OR city details */}
              <div className="hidden md:block w-72 xl:w-80 shrink-0">
                {panelOpen && selectedCity ? (
                  <div className="glass-card rounded-2xl p-4 flex flex-col" style={{ minHeight: "460px" }}>
                    <CityDetails
                      city={selectedCity}
                      activeLines={cityLines}
                      interpretation={cityInterpretation}
                      loading={cityLoading}
                      onClose={handleClosePanel}
                    />
                  </div>
                ) : (
                  <div className="glass-card rounded-2xl overflow-hidden" style={{ maxHeight: "460px", overflowY: "auto" }}>
                    <div className="px-4 py-3 border-b border-amber-900/20 sticky top-0 bg-[#0d0a17]/95 backdrop-blur z-10">
                      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        {intention
                          ? `Najlepsze miasta · ${intention === "love" ? "Miłość" : intention === "career" ? "Kariera" : "Spokój"}`
                          : "Wybierz intencję, by zobaczyć miasta"}
                      </h3>
                      {selectedReading && (
                        <p className="text-[10px] text-slate-600 mt-0.5 truncate">
                          dla: {selectedReading.name || selectedReading.birth_place?.split(",")[0] || selectedReading.birth_date}
                        </p>
                      )}
                    </div>

                    {!astro || mapLoading ? (
                      <div className="p-6 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
                      </div>
                    ) : !intention ? (
                      <div className="p-5 text-center">
                        <p className="text-slate-500 text-sm">
                          Kliknij intencję powyżej (Miłość / Kariera / Spokój), żeby zobaczyć najlepsze miasta i otworzyć interpretację.
                        </p>
                      </div>
                    ) : (
                      <TopCitiesPanel
                        astro={astro}
                        intention={intention}
                        onCitySelect={handleCitySelect}
                        selectedCity={selectedCity}
                        authHeader={authHeader}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: city list tab */}
            {mobileTab === "list" && (
              <div className="md:hidden glass-card rounded-2xl overflow-hidden" style={{ maxHeight: "480px", overflowY: "auto" }}>
                <MobileCityList
                  astro={astro}
                  intention={intention}
                  onCitySelect={handleCitySelect}
                  selectedCity={selectedCity}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
