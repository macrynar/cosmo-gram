"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { searchCities } from "@/lib/cityDatabase";
import type { City } from "@/lib/cityDatabase";

interface Props {
  onSelect: (city: City) => void;
  placeholder?: string;
}

export default function CitySearch({ onSelect, placeholder = "Sprawdź miasto..." }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const doSearch = useCallback((q: string) => {
    const hits = searchCities(q, 6);
    setResults(hits);
    setOpen(hits.length > 0);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(() => doSearch(val), 200);
  }

  function handleSelect(city: City) {
    setQuery(city.name_pl);
    setOpen(false);
    setResults([]);
    onSelect(city);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2.5 bg-[#0a0806] border border-amber-900/35 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600/55 transition"
        />
        {query && (
          <button onClick={handleClear} className="absolute right-2.5 text-slate-500 hover:text-slate-300">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-xl border border-amber-900/30 bg-[#0a0807]/98 backdrop-blur shadow-2xl z-50 overflow-hidden">
          {results.map((city) => (
            <button
              key={city.slug}
              onMouseDown={() => handleSelect(city)}
              className="w-full text-left px-3 py-2.5 text-sm text-slate-300 hover:bg-amber-900/20 hover:text-white transition-colors border-b border-amber-900/15 last:border-0"
            >
              <span className="font-medium">{city.name_pl}</span>
              <span className="text-slate-500 ml-2 text-xs">{city.country_pl}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
