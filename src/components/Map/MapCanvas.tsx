"use client";

import { useMemo, useRef } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import type { PlanetLines, Planet, Point, LineType, Astrocartography } from "@/lib/astrocartography";
import { PLANET_COLORS, PLANET_EMOJI, PLANET_PL } from "@/lib/astrocartography";
import type { City } from "@/lib/cityDatabase";

const GEO_URL = "/world-110m.json";

export type ScenarioLine = { planet: Planet; type: LineType };

interface Props {
  astro: Astrocartography | null;
  compareAstro?: Astrocartography | null;
  scenarioLines: ScenarioLine[] | null;
  showAll: boolean;
  selectedCity: City | null;
  onCityClick?: (city: City) => void;
  birthCity?: { lat: number; lon: number };
  zoom?: number;
  center?: [number, number];
  onZoomChange?: (zoom: number, center: [number, number]) => void;
}

function lonToX(lon: number, width: number): number {
  return ((lon + 180) / 360) * width;
}
function latToY(lat: number, height: number): number {
  return ((90 - lat) / 180) * height;
}

function buildMeridianPath(longitude: number, w: number, h: number): string {
  const x = lonToX(longitude, w);
  return `M ${x} ${latToY(66, h)} L ${x} ${latToY(-66, h)}`;
}

function buildCurvePath(curve: Point[], w: number, h: number): string {
  if (curve.length < 2) return "";
  const pts = curve.map((p) => ({ x: lonToX(p.lon, w), y: latToY(p.lat, h) }));
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    if (Math.abs(pts[i].x - pts[i - 1].x) > 100) {
      // wrap-around gap — lift pen
      d += ` M ${pts[i].x} ${pts[i].y}`;
    } else {
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
  }
  return d;
}

interface LineSpec {
  planet: Planet;
  type: "MC" | "IC" | "ASC" | "DSC";
  data: number | Point[];
  color: string;
  opacity?: number;
}

function getVisibleLines(
  planets: Record<Planet, PlanetLines>,
  scenarioLines: ScenarioLine[] | null,
  showAll: boolean,
  color: (p: Planet) => string,
  opacityMod = 1,
): LineSpec[] {
  const specs: LineSpec[] = [];

  if (!showAll && !scenarioLines) {
    const pl = planets["Sun"];
    return [{ planet: "Sun", type: "MC", data: pl.mc_longitude, color: color("Sun"), opacity: 0.7 * opacityMod }];
  }

  if (!showAll && scenarioLines) {
    for (const { planet, type } of scenarioLines) {
      const pl = planets[planet];
      if (!pl) continue;
      if (type === "MC")  specs.push({ planet, type, data: pl.mc_longitude, color: color(planet), opacity: opacityMod });
      else if (type === "IC")  specs.push({ planet, type, data: pl.ic_longitude, color: color(planet), opacity: opacityMod });
      else if (type === "ASC") specs.push({ planet, type, data: pl.asc_curve,    color: color(planet), opacity: opacityMod });
      else                     specs.push({ planet, type, data: pl.dsc_curve,    color: color(planet), opacity: opacityMod });
    }
    return specs;
  }

  // showAll
  for (const [p, pl] of Object.entries(planets) as [Planet, PlanetLines][]) {
    specs.push({ planet: p, type: "MC",  data: pl.mc_longitude, color: color(p), opacity: 0.5 * opacityMod });
    specs.push({ planet: p, type: "IC",  data: pl.ic_longitude, color: color(p), opacity: 0.35 * opacityMod });
    specs.push({ planet: p, type: "ASC", data: pl.asc_curve,    color: color(p), opacity: 0.5 * opacityMod });
    specs.push({ planet: p, type: "DSC", data: pl.dsc_curve,    color: color(p), opacity: 0.35 * opacityMod });
  }
  return specs;
}

const W = 800;
const H = 400;

export default function MapCanvas({
  astro,
  compareAstro,
  scenarioLines,
  showAll,
  selectedCity,
  onCityClick,
  birthCity,
  zoom = 1,
  center = [0, 20],
  onZoomChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const userLines = useMemo(() => {
    if (!astro) return [];
    return getVisibleLines(astro.planets, scenarioLines, showAll, (p) => PLANET_COLORS[p]);
  }, [astro, scenarioLines, showAll]);

  const compareLines = useMemo(() => {
    if (!compareAstro) return [];
    return getVisibleLines(compareAstro.planets, scenarioLines, showAll, () => "#c89968", 0.8);
  }, [compareAstro, scenarioLines, showAll]);

  const allLines = [...userLines, ...compareLines];

  return (
    <div ref={containerRef} className="w-full h-full relative select-none">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: center as [number, number], scale: 120 * zoom }}
        width={W}
        height={H}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={zoom}
          center={center as [number, number]}
          onMoveEnd={({ zoom: z, coordinates }: { zoom: number; coordinates: [number, number] }) => onZoomChange?.(z, coordinates)}
          minZoom={0.8}
          maxZoom={6}
        >
          {/* Base map */}
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: import("react-simple-maps").Geography[] }) =>
              geographies.map((geo: import("react-simple-maps").Geography) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#1a1025"
                  stroke="#2d1f44"
                  strokeWidth={0.3}
                  style={{
                    default: { outline: "none" },
                    hover:   { outline: "none", fill: "#1f1530" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Planet lines rendered as SVG paths inside the projection */}
          {astro && allLines.map((spec, i) => {
            const isNumber = typeof spec.data === "number";
            const path = isNumber
              ? buildMeridianPath(spec.data as number, W, H)
              : buildCurvePath(spec.data as Point[], W, H);
            if (!path) return null;
            return (
              <path
                key={i}
                d={path}
                fill="none"
                stroke={spec.color}
                strokeWidth={spec.type === "MC" || spec.type === "IC" ? 1.5 : 1}
                strokeOpacity={spec.opacity ?? 0.8}
                strokeDasharray={spec.type === "IC" || spec.type === "DSC" ? "4 3" : undefined}
                style={{ pointerEvents: "none" }}
              />
            );
          })}

          {/* Birth place marker */}
          {birthCity && (
            <circle
              cx={lonToX(birthCity.lon, W)}
              cy={latToY(birthCity.lat, H)}
              r={4}
              fill="#f59e0b"
              stroke="#fff"
              strokeWidth={1}
              style={{ pointerEvents: "none" }}
            />
          )}

          {/* Selected city marker */}
          {selectedCity && (
            <>
              <circle
                cx={lonToX(selectedCity.lon, W)}
                cy={latToY(selectedCity.lat, H)}
                r={5}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeOpacity={0.3}
                style={{ pointerEvents: "none" }}
              />
              <circle
                cx={lonToX(selectedCity.lon, W)}
                cy={latToY(selectedCity.lat, H)}
                r={4}
                fill="#f59e0b"
                stroke="#fff"
                strokeWidth={1.2}
                style={{ pointerEvents: "none" }}
              />
              <text
                x={lonToX(selectedCity.lon, W) + 7}
                y={latToY(selectedCity.lat, H) - 5}
                fontSize={8}
                fill="#fbbf24"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {selectedCity.name_pl}
              </text>
            </>
          )}
        </ZoomableGroup>
      </ComposableMap>

      {/* Planet legend — bottom left */}
      {astro && (
        <div className="absolute bottom-2 left-2 flex flex-col gap-1">
          {/* Planet colors */}
          {([...new Set(scenarioLines ? scenarioLines.map(l => l.planet) : (showAll ? Object.keys(PLANET_COLORS) as Planet[] : []))] as Planet[]).map((planet) => (
            <span
              key={planet}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px]"
              style={{ color: PLANET_COLORS[planet as Planet] }}
            >
              {PLANET_EMOJI[planet as Planet]} {PLANET_PL[planet as Planet]}
            </span>
          ))}
          {/* Line type guide */}
          <div className="flex items-center gap-2 px-2 py-1 rounded-full bg-black/60 backdrop-blur mt-0.5">
            <span className="flex items-center gap-1">
              <svg width="16" height="6" className="shrink-0"><line x1="0" y1="3" x2="16" y2="3" stroke="#94a3b8" strokeWidth="1.5"/></svg>
              <span className="text-[9px] text-slate-400">MC/ASC</span>
            </span>
            <span className="flex items-center gap-1">
              <svg width="16" height="6" className="shrink-0"><line x1="0" y1="3" x2="16" y2="3" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3"/></svg>
              <span className="text-[9px] text-slate-400">IC/DSC</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
