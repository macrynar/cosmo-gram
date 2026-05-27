"use client";

import { useEffect, useRef, useState } from "react";
import type { Astrocartography, Planet, ActiveLine } from "@/lib/astrocartography";
import { PLANET_PL, activeLinesForCity } from "@/lib/astrocartography";
import type { CuratedCity } from "@/lib/curatedCities";
import { PLANET_LINE_COLORS, PLANET_GLYPHS } from "@/lib/mapColors";
import type { Intention } from "@/lib/intentions";

interface SidebarState {
  type: "empty" | "line" | "city";
  planet?: Planet;
  lineType?: string;
  city?: CuratedCity;
  cityLines?: ActiveLine[];
}

interface Props {
  astro: Astrocartography;
  cities: CuratedCity[];
  intention: Intention;
  onCityClick: (city: CuratedCity, lines: ActiveLine[]) => void;
  birthLocation: { lat: number; lon: number } | null;
  residenceLocation?: { lat: number; lon: number } | null;
}

export default function MapExplorer({ astro, cities, intention, onCityClick, birthLocation, residenceLocation }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<ReturnType<typeof import("leaflet")["map"]> | null>(null);
  const [sidebar, setSidebar] = useState<SidebarState>({ type: "empty" });
  const [onlyIntention, setOnlyIntention] = useState(false);

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;

    // Leaflet dynamically imported to avoid SSR
    import("leaflet").then((L) => {
      // Fix default icon issue with webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({ iconUrl: "", shadowUrl: "" });

      const map = L.map(mapRef.current!, {
        center: [30, 15],
        zoom: 2,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 18,
        attribution: "© CartoDB",
      }).addTo(map);

      leafletRef.current = map;

      // Draw lines
      drawLines(L, map, astro, intention, onlyIntention, setSidebar);

      // Draw cities
      drawCities(L, map, cities, astro, intention, onCityClick, setSidebar);

      // Birth marker
      if (birthLocation) {
        const goldIcon = L.divIcon({
          className: "",
          html: '<div style="width:12px;height:12px;background:#FFB800;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px #FFB80088"></div>',
          iconSize: [12, 12],
        });
        L.marker([birthLocation.lat, birthLocation.lon], { icon: goldIcon })
          .bindTooltip("Miejsce urodzenia", { permanent: false })
          .addTo(map);
      }

      // Residence marker
      if (residenceLocation) {
        const blueIcon = L.divIcon({
          className: "",
          html: '<div style="width:10px;height:10px;background:#60a5fa;border:2px solid #fff;border-radius:50%;box-shadow:0 0 4px #60a5fa88"></div>',
          iconSize: [10, 10],
        });
        L.marker([residenceLocation.lat, residenceLocation.lon], { icon: blueIcon })
          .bindTooltip("Twoje miasto", { permanent: false })
          .addTo(map);
      }

      map.on("click", (e) => {
        // Check if click not on marker/polyline — show empty
        const target = e.originalEvent.target as HTMLElement;
        if (target.tagName === "svg" || target.tagName === "path" || target.closest(".leaflet-marker-pane")) return;
        setSidebar({ type: "empty" });
      });
    });

    return () => {
      leafletRef.current?.remove();
      leafletRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const intentionLineKeys = new Set(intention.primary_lines.map((l) => `${l.planet}-${l.type}`));

  return (
    <div className="flex gap-0 rounded-2xl overflow-hidden border border-slate-700/30 glass-card" style={{ height: 500 }}>
      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="w-full h-full" />
        {/* Layer toggle */}
        <div className="absolute top-3 right-3 z-[1000] flex gap-2">
          <button
            onClick={() => setOnlyIntention((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border backdrop-blur-sm transition-all ${
              onlyIntention
                ? "bg-amber-800/80 text-amber-100 border-amber-600/60"
                : "bg-[#0b0719]/80 text-slate-400 border-slate-700/60 hover:border-amber-700/40"
            }`}
          >
            Tylko intencja
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-64 shrink-0 border-l border-slate-700/30 bg-[#0b0719]/80 overflow-y-auto p-4 flex flex-col gap-3">
        {sidebar.type === "empty" && (
          <p className="text-slate-500 text-xs leading-relaxed">
            Kliknij linię lub miasto żeby zobaczyć interpretację.<br /><br />
            Linie ciągłe: MC/ASC. Przerywane: IC/DSC.
          </p>
        )}

        {sidebar.type === "line" && sidebar.planet && sidebar.lineType && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ color: PLANET_LINE_COLORS[sidebar.planet] }} className="text-lg">
                {PLANET_GLYPHS[sidebar.planet]}
              </span>
              <div>
                <div className="text-sm font-semibold text-white">Linia {PLANET_PL[sidebar.planet]} {sidebar.lineType}</div>
                <div className="text-xs text-slate-500">Planeta na linii {sidebar.lineType}</div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {intentionLineKeys.has(`${sidebar.planet}-${sidebar.lineType}`)
                ? "Ta linia jest aktywna dla wybranej intencji."
                : "Linia planetarna — kliknij miasto na niej dla pełnej narracji."}
            </p>
          </div>
        )}

        {sidebar.type === "city" && sidebar.city && (
          <div>
            <div className="font-semibold text-white mb-1">{sidebar.city.name_pl}</div>
            <div className="text-xs text-slate-500 mb-3">{sidebar.city.country_pl}</div>
            {sidebar.cityLines && sidebar.cityLines.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {sidebar.cityLines.slice(0, 4).map((l, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-1.5 py-0.5 rounded border"
                    style={{ color: PLANET_LINE_COLORS[l.planet], borderColor: PLANET_LINE_COLORS[l.planet] + "60" }}
                  >
                    {PLANET_GLYPHS[l.planet]} {l.type} {l.distance_km}km
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => sidebar.city && onCityClick(sidebar.city, sidebar.cityLines ?? [])}
              className="w-full py-2 text-xs font-medium text-amber-300 border border-amber-700/40 rounded-lg hover:bg-amber-900/20 transition-colors"
            >
              Pełna narracja →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function drawLines(
  L: typeof import("leaflet"),
  map: ReturnType<typeof L.map>,
  astro: Astrocartography,
  intention: Intention,
  onlyIntention: boolean,
  setSidebar: (s: SidebarState) => void,
) {
  const intentionLineKeys = new Set(intention.primary_lines.map((l) => `${l.planet}-${l.type}`));
  const planets = Object.keys(astro.planets) as Planet[];

  for (const planet of planets) {
    const pl = astro.planets[planet];
    const color = PLANET_LINE_COLORS[planet];

    const drawLine = (lineType: string, coords: [number, number][], dashed: boolean) => {
      const key = `${planet}-${lineType}`;
      if (onlyIntention && !intentionLineKeys.has(key)) return;

      const opacity = intentionLineKeys.has(key) ? 0.85 : 0.35;
      const weight = intentionLineKeys.has(key) ? 2.5 : 1.5;

      const line = L.polyline(coords, {
        color,
        weight,
        opacity,
        dashArray: dashed ? "6 4" : undefined,
      }).addTo(map);

      line.on("click", () => setSidebar({ type: "line", planet, lineType }));
      line.on("mouseover", () => line.setStyle({ weight: weight + 1.5, opacity: 1 }));
      line.on("mouseout", () => line.setStyle({ weight, opacity }));
    };

    // MC (solid vertical)
    const mcLon = pl.mc_longitude;
    drawLine("MC", [[-85, mcLon], [85, mcLon]], false);

    // IC (dashed vertical)
    const icLon = ((mcLon + 180) % 360) - 180;
    drawLine("IC", [[-85, icLon], [85, icLon]], true);

    // ASC (solid curve)
    if (pl.asc_curve?.length > 0) {
      const coords = pl.asc_curve.map((p) => [p.lat, p.lon] as [number, number]);
      drawLine("ASC", coords, false);
    }

    // DSC (dashed curve)
    if (pl.dsc_curve?.length > 0) {
      const coords = pl.dsc_curve.map((p) => [p.lat, p.lon] as [number, number]);
      drawLine("DSC", coords, true);
    }
  }
}

function drawCities(
  L: typeof import("leaflet"),
  map: ReturnType<typeof L.map>,
  cities: CuratedCity[],
  astro: Astrocartography,
  intention: Intention,
  onCityClick: (city: CuratedCity, lines: ActiveLine[]) => void,
  setSidebar: (s: SidebarState) => void,
) {
  const intentionLineKeys = new Set(intention.primary_lines.map((l) => `${l.planet}-${l.type}`));

  for (const city of cities) {
    const cityLines = activeLinesForCity({ lat: city.lat, lon: city.lon }, astro);
    const intentionLines = cityLines.filter((l) => intentionLineKeys.has(`${l.planet}-${l.type}`));
    const isActive = intentionLines.length > 0;

    const size = isActive ? 10 : 6;
    const bg = isActive
      ? (PLANET_LINE_COLORS[intentionLines[0].planet] ?? "#FFB800")
      : "#4a5568";
    const shadow = isActive ? `0 0 6px ${bg}88` : "none";

    const icon = L.divIcon({
      className: "",
      html: `<div style="width:${size}px;height:${size}px;background:${bg};border:1.5px solid rgba(255,255,255,0.3);border-radius:50%;box-shadow:${shadow};cursor:pointer"></div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });

    const marker = L.marker([city.lat, city.lon], { icon })
      .bindTooltip(city.name_pl, { permanent: false, offset: [8, 0] })
      .addTo(map);

    marker.on("click", () => {
      setSidebar({ type: "city", city, cityLines });
    });

    marker.on("dblclick", () => {
      onCityClick(city, cityLines);
    });
  }
}
