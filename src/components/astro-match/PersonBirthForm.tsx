"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MapPin, Calendar, Clock, Loader2, User, ChevronDown } from "lucide-react";

export type PersonData = {
  name: string;
  date: string;
  time: string;
  place: string;
  lat: number;
  lng: number;
  timeUnknown: boolean;
};

export type SavedReadingOption = {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  chart_data: { birthData: { lat: number; lng: number; timeUnknown?: boolean } };
};

type GeoResult = { displayName: string; lat: number; lng: number };

type Props = {
  label: string;
  accent: string;          // CSS color, e.g. "#D4AF37"
  onChange: (data: PersonData | null) => void;
  disabled?: boolean;
  savedReadings?: SavedReadingOption[];
};

const BASE = "w-full px-3.5 py-3 rounded-xl text-sm text-white placeholder-slate-700 focus:outline-none transition-all duration-300 [color-scheme:dark]";
const ST: React.CSSProperties = { background: "rgba(5,4,14,0.55)", border: "0.5px solid rgba(212,175,55,0.18)" };

export default function PersonBirthForm({ label, accent, onChange, disabled, savedReadings = [] }: Props) {
  const [mode, setMode] = useState<"saved" | "manual">(savedReadings.length > 0 ? "saved" : "manual");
  const [selectedReadingId, setSelectedReadingId] = useState<string | null>(null);

  const [name, setName]               = useState("");
  const [date, setDate]               = useState("");
  const [time, setTime]               = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [placeQuery, setPlaceQuery]   = useState("");
  const [selected, setSelected]       = useState<GeoResult | null>(null);
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [geocoding, setGeocoding]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (mode === "saved") return;
    if (date && (timeUnknown || time) && selected) {
      onChange({ name, date, time: timeUnknown ? "12:00" : time, place: selected.displayName, lat: selected.lat, lng: selected.lng, timeUnknown });
    } else {
      onChange(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, date, time, timeUnknown, selected, mode]);

  function pickReading(r: SavedReadingOption) {
    setSelectedReadingId(r.id);
    const bd = r.chart_data.birthData;
    onChange({
      name: r.name,
      date: r.birth_date,
      time: r.birth_time || "12:00",
      place: r.birth_place,
      lat: bd.lat,
      lng: bd.lng,
      timeUnknown: bd.timeUnknown ?? !r.birth_time,
    });
  }

  function clearReading() {
    setSelectedReadingId(null);
    onChange(null);
  }

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setDropdownOpen(false); setSelected(null); return; }
    setGeocoding(true);
    try {
      const res  = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json() as { results: GeoResult[] };
      const results = data.results ?? [];
      setSuggestions(results);
      if (results.length > 0) { setSelected(results[0]); setDropdownOpen(results.length > 1); }
      else { setSelected(null); setDropdownOpen(false); }
    } finally { setGeocoding(false); }
  }, []);

  function handlePlaceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setPlaceQuery(val);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  }

  function handleSelectGeo(r: GeoResult) {
    setSelected(r);
    setPlaceQuery(r.displayName);
    setDropdownOpen(false);
    setSuggestions([]);
  }

  const inputStyle = (focused: boolean): React.CSSProperties => ({
    ...ST,
    ...(focused ? { borderColor: `${accent}80`, boxShadow: `0 0 16px ${accent}12` } : {}),
  });

  function FocusInput({ icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }) {
    const [focused, setFocused] = useState(false);
    return (
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">{icon}</div>
        <input {...props} className={`${BASE} pl-10`} style={inputStyle(focused)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
      </div>
    );
  }

  const selectedReading = savedReadings.find(r => r.id === selectedReadingId);

  return (
    <div className="space-y-4">
      {/* Label */}
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: accent }}>
          {label}
        </p>
        {/* Mode toggle — only show if user has saved readings */}
        {savedReadings.length > 0 && (
          <div className="flex rounded-lg overflow-hidden" style={{ border: "0.5px solid rgba(212,175,55,0.16)" }}>
            {(["saved", "manual"] as const).map(m => (
              <button key={m} type="button" onClick={() => { setMode(m); clearReading(); }}
                className="px-3 py-1 text-xs transition-all duration-200"
                style={mode === m ? { background: `${accent}18`, color: accent } : { color: "rgba(148,163,184,0.5)" }}
              >
                {m === "saved" ? "Moje" : "Nowe"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SAVED MODE */}
      {mode === "saved" && (
        <div className="space-y-2">
          {savedReadings.map(r => {
            const isSelected = r.id === selectedReadingId;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => isSelected ? clearReading() : pickReading(r)}
                disabled={disabled}
                className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                style={{
                  background: isSelected ? `${accent}12` : "rgba(5,4,14,0.55)",
                  border: `0.5px solid ${isSelected ? `${accent}55` : "rgba(212,175,55,0.12)"}`,
                  boxShadow: isSelected ? `0 0 20px ${accent}10` : "none",
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: isSelected ? `${accent}20` : "rgba(255,255,255,0.04)", color: isSelected ? accent : "#64748b" }}
                >
                  {(r.name || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: isSelected ? "#f8f4e8" : "#94a3b8" }}>
                    {r.name || r.birth_place}
                  </p>
                  <p className="text-xs text-slate-600 truncate">
                    {new Date(r.birth_date + "T12:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })}
                    {r.birth_time ? ` · ${r.birth_time}` : " · godzina nieznana"}
                    {" · " + r.birth_place.split(",")[0]}
                  </p>
                </div>
                {isSelected && (
                  <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: `${accent}18`, color: accent }}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}

          {selectedReading && (
            <p className="text-xs text-center" style={{ color: `${accent}80` }}>
              Kliknij ponownie aby odznaczyć
            </p>
          )}
        </div>
      )}

      {/* MANUAL MODE */}
      {mode === "manual" && (
        <div className="space-y-3">
          {/* Name */}
          <FocusInput
            icon={<User className="w-3.5 h-3.5 text-slate-500" />}
            type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Imię (opcjonalne)" disabled={disabled}
          />

          {/* Date */}
          <FocusInput
            icon={<Calendar className="w-3.5 h-3.5 text-slate-500" />}
            type="date" value={date} onChange={e => setDate(e.target.value)}
            required max={new Date().toISOString().split("T")[0]} disabled={disabled}
          />

          {/* Time */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-xs text-slate-600">
                <Clock className="w-3 h-3" /> Godzina
              </span>
              <button type="button" onClick={() => setTimeUnknown(v => !v)} disabled={disabled}
                className="text-xs transition-colors" style={{ color: timeUnknown ? accent : "#64748b" }}>
                {timeUnknown ? "✕ znam godzinę" : "Nie znam"}
              </button>
            </div>
            {timeUnknown ? (
              <div className="px-3.5 py-3 rounded-xl text-sm text-slate-600 italic"
                style={{ background: "rgba(5,4,14,0.40)", border: "0.5px solid rgba(212,175,55,0.08)" }}>
                nieznana — pomijamy Ascendent i domy
              </div>
            ) : (
              <FocusInput
                icon={<Clock className="w-3.5 h-3.5 text-slate-500" />}
                type="time" value={time} onChange={e => setTime(e.target.value)}
                required={!timeUnknown} disabled={disabled}
              />
            )}
          </div>

          {/* Place */}
          <div ref={wrapperRef} className="relative">
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                type="text" value={placeQuery} onChange={handlePlaceChange}
                placeholder="Miasto urodzenia" disabled={disabled}
                className={`${BASE} pl-10 pr-8`}
                style={ST}
              />
              {geocoding && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin" style={{ color: accent }} />}
              {selected && !geocoding && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: accent }}>✓</span>}
            </div>
            {dropdownOpen && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50 shadow-2xl"
                style={{ background: "rgba(5,4,14,0.97)", border: "0.5px solid rgba(212,175,55,0.22)", backdropFilter: "blur(20px)" }}>
                {suggestions.map((r, i) => (
                  <button key={i} type="button" onMouseDown={() => handleSelectGeo(r)}
                    className="w-full text-left flex items-center gap-2 px-3.5 py-2.5 text-sm text-slate-300 hover:text-white transition-colors truncate"
                    style={{ borderBottom: i < suggestions.length - 1 ? "0.5px solid rgba(212,175,55,0.08)" : "none" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(212,175,55,0.06)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <MapPin className="w-3 h-3 shrink-0" style={{ color: accent }} />
                    {r.displayName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
