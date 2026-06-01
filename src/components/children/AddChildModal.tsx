"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, MapPin, Calendar, Clock, User, Loader2, AlertCircle } from "lucide-react";
import { CosmoIcon } from "@/components/CosmoIcon";

type GeoResult = { displayName: string; lat: number; lng: number };

export type ChildFormData = {
  name: string;
  date: string;
  time: string;
  place: string;
  lat: number;
  lng: number;
};

type Props = {
  onClose: () => void;
  onSubmit: (data: ChildFormData) => void;
  loading?: boolean;
  error?: string;
};

export default function AddChildModal({ onClose, onSubmit, loading, error: externalError }: Props) {
  const [name, setName]           = useState("");
  const [date, setDate]           = useState("");
  const [time, setTime]           = useState("");
  const [placeQuery, setPlaceQuery] = useState("");
  const [selected, setSelected]   = useState<GeoResult | null>(null);
  const [suggestions, setSuggestions] = useState<GeoResult[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dateError, setDateError] = useState("");
  const [submitError, setSubmitError] = useState("");
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

  const today = new Date().toISOString().split("T")[0];

  function validateDate(val: string) {
    if (!val) { setDateError(""); return; }
    const birth = new Date(val);
    const now = new Date();
    if (birth > now) {
      setDateError("Data urodzenia nie może być w przyszłości");
      return;
    }
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    if (age > 17) {
      setDateError("Karta dziecka dotyczy dzieci do 17 lat");
      return;
    }
    setDateError("");
  }

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setDropdownOpen(false); setSelected(null); return; }
    setGeocoding(true);
    try {
      const res  = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json() as { results: GeoResult[] };
      const results = data.results ?? [];
      setSuggestions(results);
      if (results.length === 1) {
        setSelected(results[0]);
        setPlaceQuery(results[0].displayName);
        setDropdownOpen(false);
      } else if (results.length > 1) {
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

  function handleSelectPlace(r: GeoResult) {
    setSelected(r);
    setPlaceQuery(r.displayName);
    setDropdownOpen(false);
    setSuggestions([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date || !time || dateError) return;

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
      name: name.trim(),
      date,
      time,
      place: loc.displayName,
      lat: loc.lat,
      lng: loc.lng,
    });
  }

  const isValid = !!name.trim() && !!date && !!time && !!selected && !dateError && !geocoding;

  const inputClass = `w-full px-3 py-2.5 rounded-xl bg-[#0a0806] border border-amber-900/35 text-white text-sm
    focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/60
    disabled:opacity-40 [color-scheme:dark] transition`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
      <div className="relative w-full max-w-md glass-card rounded-2xl p-6 border border-green-900/30">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full border border-green-500/30 bg-green-900/20 text-green-300 text-xs font-medium">
            <CosmoIcon className="w-3 h-3" />
            Nowa karta dziecka
          </div>
          <h2 className="text-xl font-bold text-white font-brand">
            Dane urodzeniowe
          </h2>
          <p className="text-slate-500 text-xs mt-1">Wszystkie pola wymagane · Godzina urodzenia jest ważna dla dokładności</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
              <User className="w-3 h-3 text-green-400" /> Imię dziecka
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="np. Zosia"
              required
              disabled={loading}
              className={inputClass}
            />
          </div>

          {/* Date */}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
              <Calendar className="w-3 h-3 text-green-400" /> Data urodzenia
            </label>
            <input
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); validateDate(e.target.value); }}
              required
              max={today}
              disabled={loading}
              className={inputClass}
            />
            {dateError && <p className="mt-1 text-xs text-red-400">{dateError}</p>}
          </div>

          {/* Time */}
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
              <Clock className="w-3 h-3 text-green-400" /> Godzina urodzenia
            </label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              required
              disabled={loading}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-slate-600">Znajdziesz w akcie urodzenia lub dokumentach ze szpitala</p>
          </div>

          {/* Place */}
          <div ref={wrapperRef} className="relative">
            <label className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-1.5">
              <MapPin className="w-3 h-3 text-green-400" /> Miejsce urodzenia
            </label>
            <div className="relative">
              <input
                type="text"
                value={placeQuery}
                onChange={handlePlaceChange}
                placeholder="np. Kraków"
                disabled={loading}
                className={`${inputClass} pr-8`}
              />
              {geocoding && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-400 animate-spin" />}
              {selected && !geocoding && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-400 text-sm">✓</span>}
            </div>
            {dropdownOpen && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-amber-900/30 bg-[#0a0807]/98 backdrop-blur shadow-2xl z-50 overflow-hidden">
                {suggestions.map((r, i) => (
                  <button key={i} type="button" onMouseDown={() => handleSelectPlace(r)}
                    className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-green-900/30 hover:text-white transition-colors border-b border-amber-900/15 last:border-0 truncate">
                    <MapPin className="inline w-3 h-3 text-green-400 mr-1.5 -mt-0.5" />
                    {r.displayName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {(externalError || submitError) && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-900/20 border border-red-700/30 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {externalError || submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || loading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300
              ${isValid && !loading
                ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-900/50 hover:shadow-green-700/60 hover:scale-[1.01] active:scale-[0.99]"
                : "bg-green-900/20 text-slate-500 cursor-not-allowed"
              }`}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Generuję interpretację…</>
              : <><CosmoIcon className="w-4 h-4" /> Generuj kartę dziecka</>
            }
          </button>
        </form>
      </div>
      </div>
    </div>
  );
}
