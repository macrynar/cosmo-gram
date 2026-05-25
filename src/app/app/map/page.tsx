"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Map, List, ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import IntentionPicker from "@/components/Map/IntentionPicker";
import CitySearch from "@/components/Map/CitySearch";
import CityDetails from "@/components/Map/CityDetails";
import CompareMode from "@/components/Map/CompareMode";
import MobileCityList from "@/components/Map/MobileCityList";
import PaywallTeaser from "@/components/Map/PaywallTeaser";
import { useAuth } from "@/components/AuthContext";
import { track } from "@/components/PostHogProvider";
import type { Astrocartography, ActiveLine, Intention, PlanetLines } from "@/lib/astrocartography";
import { activeLinesForCity } from "@/lib/astrocartography";
import type { City } from "@/lib/cityDatabase";

// Dynamic import to avoid SSR issues with react-simple-maps
const MapCanvas = dynamic(() => import("@/components/Map/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0d0a1a] rounded-xl">
      <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
    </div>
  ),
});

interface LibraryProfile {
  id: string;
  name: string;
  birth_date: string;
}

type MobileTab = "map" | "list";

export default function CosmoMapPage() {
  const { session, user, loading: authLoading } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  const [astro, setAstro] = useState<Astrocartography | null>(null);
  const [compareAstro, setCompareAstro] = useState<Astrocartography | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);

  const [intention, setIntention] = useState<Intention | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showParans, setShowParans] = useState(false);

  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityLines, setCityLines] = useState<ActiveLine[]>([]);
  const [cityInterpretation, setCityInterpretation] = useState("");
  const [cityLoading, setCityLoading] = useState(false);

  const [compareProfileId, setCompareProfileId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<LibraryProfile[]>([]);

  const [mobileTab, setMobileTab] = useState<MobileTab>("map");
  const [panelOpen, setPanelOpen] = useState(false);
  const [error, setError] = useState("");

  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);

  const authHeader: Record<string, string> = session ? { Authorization: `Bearer ${session.access_token}` } : {};

  // Check premium
  useEffect(() => {
    if (authLoading || !session) return;
    fetch("/api/subscription-status", { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json())
      .then((d) => setIsPremium(d.hasSubscription ?? false))
      .catch(() => setIsPremium(false));
  }, [authLoading, session]);

  // Load user lines
  useEffect(() => {
    if (!session || isPremium === null) return;
    if (!isPremium) return;
    setMapLoading(true);
    setError("");
    fetch("/api/cosmo-map-compute", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({}),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setAstro({ planets: data.lines as Record<string, PlanetLines>, parans: data.parans, birth: { lat: 0, lon: 0, gst_deg: 0 } } as Astrocartography);
        track("cosmo_map_opened", { is_premium: true });
      })
      .catch(() => setError("Nie udalo sie zaladowac mapy."))
      .finally(() => setMapLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isPremium]);

  // Load library profiles for compare mode
  useEffect(() => {
    if (!session) return;
    fetch("/api/get-children", { headers: authHeader })
      .then((r) => r.json())
      .then((data) => {
        const list = (data.children ?? []).map((c: { id: string; name?: string; birth_date: string }) => ({
          id: c.id,
          name: c.name || c.birth_date,
          birth_date: c.birth_date,
        }));
        setProfiles(list);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Load compare lines when profile selected
  useEffect(() => {
    if (!compareProfileId || !session) { setCompareAstro(null); return; }
    setCompareLoading(true);
    fetch("/api/cosmo-map-compute", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ profile_id: compareProfileId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setCompareAstro({ planets: data.lines as Record<string, PlanetLines>, parans: data.parans, birth: { lat: 0, lon: 0, gst_deg: 0 } } as Astrocartography);
          track("cosmo_map_compare_started", { compared_with_profile_id: compareProfileId });
        }
      })
      .catch(() => {})
      .finally(() => setCompareLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareProfileId, session]);

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

    track("cosmo_map_city_viewed", {
      city_slug: city.slug,
      active_planets: [...new Set(lines.map((l) => l.planet))],
    });
    track("cosmo_map_city_searched", {
      city_slug: city.slug,
      has_active_lines: lines.length > 0,
      lines_count: lines.length,
    });

    // Zoom to city
    setCenter([city.lon, city.lat]);
    setZoom(3);

    // Fetch interpretation
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
      setCityInterpretation("Nie udalo sie zaladowac interpretacji.");
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

  if (authLoading || isPremium === null) {
    return (
      <div className="min-h-screen bg-[#03010d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] nebula-orb opacity-30 pointer-events-none" />

      <Navbar />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white font-brand">
            Cosmo <span className="gradient-text text-glow">Map</span>
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Twoja mapa mocy planetarnej</p>
        </div>

        {!isPremium ? (
          <div className="h-[520px]">
            <PaywallTeaser />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Controls bar */}
            <div className="glass-card rounded-2xl px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center">
              <IntentionPicker selected={intention} onChange={handleIntentionChange} />
              <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
                <CitySearch onSelect={handleCitySelect} />
                <CompareMode
                  profiles={profiles}
                  selectedProfileId={compareProfileId}
                  onSelect={setCompareProfileId}
                  loading={compareLoading}
                />
                <button
                  onClick={() => setShowAll((v) => !v)}
                  className={`px-3 py-2 rounded-xl text-xs border transition-all ${
                    showAll
                      ? "border-amber-600/50 bg-amber-900/20 text-amber-200"
                      : "border-amber-900/20 text-slate-500 hover:border-amber-700/30"
                  }`}
                >
                  Wszystkie linie
                </button>
                <button
                  onClick={() => setShowParans((v) => !v)}
                  className={`px-3 py-2 rounded-xl text-xs border transition-all ${
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
              <div className="glass-card rounded-xl px-4 py-3 border-red-700/30 bg-red-900/15 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Mobile tabs */}
            <div className="flex md:hidden gap-1 glass-card rounded-xl p-1">
              <button
                onClick={() => setMobileTab("map")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mobileTab === "map" ? "bg-amber-900/30 text-amber-100" : "text-slate-400"
                }`}
              >
                <Map className="w-4 h-4" /> Mapa
              </button>
              <button
                onClick={() => setMobileTab("list")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mobileTab === "list" ? "bg-amber-900/30 text-amber-100" : "text-slate-400"
                }`}
              >
                <List className="w-4 h-4" /> Lista
              </button>
            </div>

            {/* Main content */}
            <div className="flex gap-4 items-start">
              {/* Map + Mobile list */}
              <div className="flex-1 min-w-0">
                {/* Map (always visible on desktop, conditional on mobile) */}
                <div className={`glass-card rounded-2xl overflow-hidden ${mobileTab === "list" ? "hidden md:block" : ""}`}
                  style={{ height: "480px" }}>
                  {mapLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#0d0a1a]">
                      <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
                      <p className="text-sm text-slate-500">Obliczam linie planetarne…</p>
                    </div>
                  ) : (
                    <MapCanvas
                      astro={astro}
                      compareAstro={compareAstro}
                      intention={intention}
                      showAll={showAll}
                      selectedCity={selectedCity}
                      zoom={zoom}
                      center={center}
                      onZoomChange={(z, c) => { setZoom(z); setCenter(c); }}
                    />
                  )}
                </div>

                {/* Parans panel */}
                {showParans && astro && astro.parans.length > 0 && (
                  <div className="glass-card rounded-2xl p-4 mt-3">
                    <h3 className="text-sm font-medium text-slate-300 mb-2">Parans — punkty równolegle aktywne</h3>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {astro.parans.slice(0, 30).map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="text-amber-400">{p.planet_a}</span>
                          <span className="text-slate-600">×</span>
                          <span className="text-violet-400">{p.planet_b}</span>
                          <span className="text-slate-600">{p.type}</span>
                          <span className="ml-auto text-slate-500">{p.latitude.toFixed(1)}°</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mobile city list */}
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

              {/* Desktop sidebar — city details */}
              {panelOpen && selectedCity && (
                <div className="hidden md:flex w-80 shrink-0 glass-card rounded-2xl p-4 h-[480px] flex-col">
                  <CityDetails
                    city={selectedCity}
                    activeLines={cityLines}
                    interpretation={cityInterpretation}
                    loading={cityLoading}
                    onClose={handleClosePanel}
                    onShare={() => {}}
                  />
                </div>
              )}
            </div>

            {/* Mobile bottom sheet — city details */}
            {panelOpen && selectedCity && mobileTab === "map" && (
              <div className="md:hidden glass-card rounded-2xl">
                <button
                  onClick={() => setPanelOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-300"
                >
                  <span className="font-medium">{selectedCity.name_pl}</span>
                  {panelOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
                {panelOpen && (
                  <div className="px-4 pb-4 max-h-80 overflow-y-auto">
                    <CityDetails
                      city={selectedCity}
                      activeLines={cityLines}
                      interpretation={cityInterpretation}
                      loading={cityLoading}
                      onClose={handleClosePanel}
                      onShare={() => {}}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
