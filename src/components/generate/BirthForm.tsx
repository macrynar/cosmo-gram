"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MapPin, Calendar, Clock, Loader2 } from "lucide-react";
import { CosmoIcon } from "@/components/CosmoIcon";

interface GeoResult {
  displayName: string;
  lat: number;
  lng: number;
}

interface Props {
  onSubmit: (data: {
    name: string;
    date: string;
    time: string;
    place: string;
    lat: number;
    lng: number;
    timeUnknown: boolean;
  }) => void;
  loading: boolean;
  onDateChange?: (date: string) => void;
}

export default function BirthForm({ onSubmit, loading, onDateChange }: Props) {
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
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setDropdownOpen(false); setSelected(null); return; }
    setGeocoding(true);
    try {
      const res  = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json() as { results: GeoResult[] };
      const results = data.results ?? [];
      setSuggestions(results);
      if (results.length === 1) {
        // Single unambiguous result — auto-select and fill input
        setSelected(results[0]);
        setPlaceQuery(results[0].displayName);
        setDropdownOpen(false);
      } else if (results.length > 1) {
        // Multiple results — show dropdown, user must pick explicitly
        setSelected(null);
        setDropdownOpen(true);
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!date) return;
    if (!timeUnknown && !time) return;

    let loc = selected;
    if (!loc && placeQuery.length >= 2) {
      setGeocoding(true);
      try {
        const res  = await fetch(`/api/geocode?q=${encodeURIComponent(placeQuery)}`);
        const data = await res.json() as { results: GeoResult[] };
        if (data.results?.length > 0) {
          loc = data.results[0];
          setSelected(loc);
        }
      } finally {
        setGeocoding(false);
      }
    }
    if (!loc) return;

    onSubmit({
      name,
      date,
      time: timeUnknown ? "12:00" : time,
      place: loc.displayName,
      lat: loc.lat,
      lng: loc.lng,
      timeUnknown,
    });
  }

  const isValid = !!date && (timeUnknown || !!time) && !!selected;

  const inputClass = `w-full px-3 py-2.5 rounded-xl bg-[#0a0806] border border-amber-900/35 text-white text-sm
    focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600/55
    [color-scheme:dark] transition`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {/* Name */}
      <div>
        <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
          Imię osoby
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. Anna"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-end">
        {/* Date */}
        <div className="flex-1 min-w-0">
          <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
            <Calendar className="w-3 h-3 text-amber-400" /> Data urodzenia
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); onDateChange?.(e.target.value); }}
            required
            max={new Date().toISOString().split("T")[0]}
            className={inputClass}
          />
        </div>

        {/* Time */}
        <div className="w-full sm:w-44 flex-shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <label className="flex items-center gap-1 text-xs font-medium text-slate-400">
              <Clock className="w-3 h-3 text-amber-400" /> Godzina
            </label>
            <button
              type="button"
              onClick={() => setTimeUnknown(v => !v)}
              className="text-xs text-slate-500 hover:text-amber-400 transition-colors"
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
              onChange={(e) => setTime(e.target.value)}
              required={!timeUnknown}
              className={inputClass}
            />
          )}
        </div>

        {/* Place */}
        <div ref={wrapperRef} className="flex-[2] min-w-0 relative">
          <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
            <MapPin className="w-3 h-3 text-amber-400" /> Miejsce urodzenia
          </label>
          <div className="relative">
            <input
              type="text"
              value={placeQuery}
              onChange={handlePlaceChange}
              placeholder="np. Warszawa"
              required
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

        {/* Submit */}
        <div className="flex-shrink-0">
          <button
            type="submit"
            disabled={!isValid || loading}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap
              ${isValid && !loading
                ? "bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-lg shadow-amber-950/40 hover:shadow-amber-800/50 hover:scale-[1.02] active:scale-[0.99]"
                : "bg-amber-900/20 text-slate-500 cursor-not-allowed"
              }`}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Liczę…</>
              : <><CosmoIcon className="w-4 h-4" /> Generuj</>
            }
          </button>
        </div>
      </div>

      {timeUnknown && (
        <p className="text-xs text-amber-500/70 pl-1">
          Bez godziny urodzenia interpretacja pomija Ascendent, MC i domy astrologiczne. Pozycja Księżyca może być przybliżona.
        </p>
      )}
    </form>
  );
}
