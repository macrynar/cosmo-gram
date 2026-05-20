"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MapPin, Calendar, Clock, Loader2, User } from "lucide-react";

export type PersonData = {
  name: string;
  date: string;
  time: string;
  place: string;
  lat: number;
  lng: number;
  timeUnknown: boolean;
};

type GeoResult = { displayName: string; lat: number; lng: number };

type Props = {
  label: string;
  accentColor: string;
  onChange: (data: PersonData | null) => void;
  disabled?: boolean;
};

export default function PersonBirthForm({ label, accentColor, onChange, disabled }: Props) {
  const [name, setName]           = useState("");
  const [date, setDate]           = useState("");
  const [time, setTime]           = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [selected, setSelected]   = useState<GeoResult | null>(null);
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Report valid data upward whenever all fields filled
  useEffect(() => {
    if (date && (timeUnknown || time) && selected) {
      onChange({
        name, date,
        time: timeUnknown ? "12:00" : time,
        place: selected.displayName,
        lat: selected.lat,
        lng: selected.lng,
        timeUnknown,
      });
    } else {
      onChange(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, date, time, timeUnknown, selected]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setDropdownOpen(false); setSelected(null); return; }
    setGeocoding(true);
    try {
      const res  = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json() as { results: GeoResult[] };
      const results = data.results ?? [];
      setSuggestions(results);
      if (results.length > 0) {
        setSelected(results[0]);
        setDropdownOpen(results.length > 1);
      } else {
        setSelected(null);
        setDropdownOpen(false);
      }
    } finally {
      setGeocoding(false);
    }
  }, []);

  function handlePlaceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setPlaceQuery(val);
    setSelected(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  }

  function handleSelect(r: GeoResult) {
    setSelected(r);
    setPlaceQuery(r.displayName);
    setDropdownOpen(false);
    setSuggestions([]);
  }

  const inputClass = `w-full px-3 py-2.5 rounded-xl bg-[#0a0806] border border-amber-900/35 text-white text-sm
    focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600/55
    disabled:opacity-40 [color-scheme:dark] transition`;

  return (
    <div className="space-y-3">
      <div className={`text-xs font-semibold uppercase tracking-widest mb-3 ${accentColor}`}>
        {label}
      </div>

      {/* Name */}
      <div>
        <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
          <User className="w-3 h-3 text-amber-400" /> Imię (opcjonalne)
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="np. Anna"
          disabled={disabled}
          className={inputClass}
        />
      </div>

      {/* Date */}
      <div>
        <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
          <Calendar className="w-3 h-3 text-amber-400" /> Data urodzenia
        </label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          max={new Date().toISOString().split("T")[0]}
          disabled={disabled}
          className={inputClass}
        />
      </div>

      {/* Time */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="flex items-center gap-1 text-xs font-medium text-slate-400">
            <Clock className="w-3 h-3 text-amber-400" /> Godzina urodzenia
          </label>
          <button
            type="button"
            onClick={() => setTimeUnknown(v => !v)}
            disabled={disabled}
            className="text-xs text-slate-500 hover:text-amber-400 transition-colors disabled:opacity-40"
          >
            {timeUnknown ? "✕ wróć" : "Nie znam"}
          </button>
        </div>
        {timeUnknown ? (
          <div className="w-full px-3 py-2.5 rounded-xl bg-[#0a0806] border border-amber-900/20 text-slate-600 text-sm italic">
            nieznana
          </div>
        ) : (
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            required={!timeUnknown}
            disabled={disabled}
            className={inputClass}
          />
        )}
        {timeUnknown && (
          <p className="mt-1.5 text-xs text-amber-500/60">
            Bez godziny pomijamy Ascendent i domy.
          </p>
        )}
      </div>

      {/* Place */}
      <div ref={wrapperRef} className="relative">
        <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
          <MapPin className="w-3 h-3 text-amber-400" /> Miejsce urodzenia
        </label>
        <div className="relative">
          <input
            type="text"
            value={placeQuery}
            onChange={handlePlaceChange}
            placeholder="np. Kraków"
            disabled={disabled}
            className={`${inputClass} pr-8`}
          />
          {geocoding && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400 animate-spin" />}
          {selected && !geocoding && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400 text-sm">✓</span>}
        </div>
        {dropdownOpen && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-amber-900/30 bg-[#0a0807]/98 backdrop-blur shadow-2xl z-50 overflow-hidden">
            {suggestions.map((r, i) => (
              <button key={i} type="button" onMouseDown={() => handleSelect(r)}
                className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-amber-900/20 hover:text-white transition-colors border-b border-amber-900/15 last:border-0 truncate">
                <MapPin className="inline w-3 h-3 text-amber-400 mr-1.5 -mt-0.5" />
                {r.displayName}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
