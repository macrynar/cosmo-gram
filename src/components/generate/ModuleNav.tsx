"use client";

import { useEffect, useRef, useState } from "react";
import { ALL_MODULE_IDS, type ModuleId } from "@/lib/schemas/astroModule";

const SHORT_NAMES: Record<ModuleId, string> = {
  core:        "Rdzeń",
  superpowers: "Supermoce",
  childhood:   "Korzenie",
  love:        "Miłość",
  career:      "Powołanie",
  shadows:     "Cienie",
  roots:       "Duchowe",
  purpose:     "Misja",
};

const LS_READ = "cosmo_modules_read";

function loadRead(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_READ);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {}
  return new Set();
}

function saveRead(ids: Set<string>) {
  try { localStorage.setItem(LS_READ, JSON.stringify([...ids])); } catch {}
}

interface Props {
  visibleIds: ModuleId[];
}

export default function ModuleNav({ visibleIds }: Props) {
  const [activeId, setActiveId]   = useState<ModuleId | null>(null);
  const [readIds,  setReadIds]    = useState<Set<string>>(new Set());
  const [underline, setUnderline] = useState<{ left: number; width: number } | null>(null);
  const buttonRefs   = useRef<Map<string, HTMLButtonElement>>(new Map());
  const navRef       = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReadIds(loadRead());

    const handler = (e: Event) => {
      const { id } = (e as CustomEvent<{ id: string }>).detail;
      setReadIds(prev => {
        const next = new Set(prev);
        next.add(id);
        saveRead(next);
        return next;
      });
    };
    document.addEventListener("cosmo-module-expanded", handler);
    return () => document.removeEventListener("cosmo-module-expanded", handler);
  }, []);

  // IntersectionObserver — track which module has most visibility
  useEffect(() => {
    if (visibleIds.length === 0) return;
    const ratios: Record<string, number> = {};
    const observers: IntersectionObserver[] = [];

    visibleIds.forEach(id => {
      const el = document.getElementById(`module-${id}`);
      if (!el) return;
      const obs = new IntersectionObserver(
        entries => {
          entries.forEach(e => { ratios[id] = e.intersectionRatio; });
          const best = Object.entries(ratios).reduce<[string, number]>(
            (max, [k, v]) => v > max[1] ? [k, v] : max,
            ["", 0]
          );
          if (best[1] > 0) setActiveId(best[0] as ModuleId);
        },
        { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [visibleIds]);

  function scrollTo(id: ModuleId) {
    const el = document.getElementById(`module-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveRead(next);
      return next;
    });
    document.dispatchEvent(new CustomEvent("cosmo-module-expanded", { detail: { id } }));
  }

  // Compute underline position relative to the sticky container
  useEffect(() => {
    const currentId = activeId ?? visibleIds[0] ?? null;
    if (!currentId || !containerRef.current) { setUnderline(null); return; }
    const btn = buttonRefs.current.get(currentId);
    if (!btn) { setUnderline(null); return; }
    const containerRect = containerRef.current.getBoundingClientRect();
    const btnRect       = btn.getBoundingClientRect();
    setUnderline({
      left:  btnRect.left - containerRect.left,
      width: btnRect.width,
    });
  }, [activeId, visibleIds]);

  if (visibleIds.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="sticky top-16 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 mb-6"
      style={{
        background:     "rgba(11,9,18,0.92)",
        borderBottom:   "0.5px solid rgba(224,181,102,0.10)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Underline centered on active tab */}
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "rgba(224,181,102,0.07)" }}>
        {underline && (
          <div
            className="absolute h-full transition-all duration-400"
            style={{
              left:       underline.left,
              width:      underline.width,
              background: "rgba(224,181,102,0.70)",
            }}
          />
        )}
      </div>

      {/* Chapter tabs */}
      <div ref={navRef} className="flex items-center gap-1 overflow-x-auto scrollbar-none max-w-[70ch] mx-auto">
        {ALL_MODULE_IDS.map((id, i) => {
          const isVisible = visibleIds.includes(id);
          const isActive  = id === activeId;
          const isRead    = readIds.has(id);

          return (
            <button
              key={id}
              ref={el => { if (el) buttonRefs.current.set(id, el); else buttonRefs.current.delete(id); }}
              onClick={() => isVisible && scrollTo(id)}
              title={SHORT_NAMES[id]}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full whitespace-nowrap transition-all duration-300 shrink-0"
              style={
                isActive ? {
                  background: "rgba(224,181,102,0.14)",
                  border:     "0.5px solid rgba(224,181,102,0.42)",
                  color:      "rgba(224,181,102,0.95)",
                } : isVisible ? {
                  border:  "0.5px solid transparent",
                  color:   "rgba(100,116,139,0.80)",
                  cursor:  "pointer",
                } : {
                  border:  "0.5px solid transparent",
                  color:   "rgba(100,116,139,0.28)",
                  cursor:  "default",
                }
              }
            >
              {isRead && !isActive && (
                <span style={{ fontSize: "8px", color: "rgba(224,181,102,0.45)" }}>✓</span>
              )}
              <span style={{ fontSize: "10px", fontWeight: 500, letterSpacing: "0.04em" }}>
                {i + 1}. {SHORT_NAMES[id]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
