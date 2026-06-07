"use client";

import { useState, useCallback, useRef, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, MapPin, Calendar, Clock, ChevronRight, Loader2, Check, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { ROUTES } from "@/lib/routes";

export const PENDING_KEY = "cosmogram_pending_chart";

export type PendingChart = {
  name:        string;
  date:        string;
  time:        string;
  timeUnknown: boolean;
  place:       string;
  lat:         number;
  lng:         number;
};

type GeoResult = { displayName: string; lat: number; lng: number };
type Step      = 1 | 2 | 3;

const BASE = "w-full px-4 py-3.5 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none transition-all duration-300";
const ST   = { background: "rgba(5,4,14,0.55)", border: "0.5px solid rgba(212,175,55,0.18)" } as React.CSSProperties;
const SF   = { borderColor: "rgba(212,175,55,0.50)", boxShadow: "0 0 18px rgba(212,175,55,0.08)" } as React.CSSProperties;

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FocusInput({
  icon, type, placeholder, value, onChange, required, minLength, label,
}: {
  icon: React.ReactNode; type: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; minLength?: number; label?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">{icon}</div>
      <input
        type={type} placeholder={placeholder} value={value} onChange={onChange}
        required={required} minLength={minLength} aria-label={label ?? placeholder}
        className={`${BASE} pl-10`}
        style={{ ...ST, ...(focused ? SF : {}) }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

const slide = {
  enter:  { opacity: 0, x: 28 },
  center: { opacity: 1, x: 0  },
  exit:   { opacity: 0, x: -20 },
};

function SignupWizard() {
  const router          = useRouter();
  const searchParams    = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [step, setStep] = useState<Step>(1);

  // Step 1
  const [name,         setName]         = useState("");
  const [date,         setDate]         = useState("");
  const [time,         setTime]         = useState("");
  const [timeUnknown,  setTimeUnknown]  = useState(false);
  const [placeQuery,   setPlaceQuery]   = useState("");
  const [geoResult,    setGeoResult]    = useState<GeoResult | null>(null);
  const [suggestions,  setSuggestions]  = useState<GeoResult[]>([]);
  const [dropOpen,     setDropOpen]     = useState(false);
  const [geocoding,    setGeocoding]    = useState(false);
  const [s1Error,      setS1Error]      = useState("");
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placeRef     = useRef<HTMLDivElement>(null);
  const geoResultRef = useRef<GeoResult | null>(null);

  // Step 2
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [s2Error,    setS2Error]    = useState("");
  const [s2Loading,  setS2Loading]  = useState<"email" | "google" | null>(null);

  const redirectTo = searchParams.get("redirect") || ROUTES.app.today.path;

  useEffect(() => {
    if (!authLoading && user) router.replace(redirectTo);
  }, [user, authLoading, router, redirectTo]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (placeRef.current && !placeRef.current.contains(e.target as Node)) setDropOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const fetchGeo = useCallback(async (q: string): Promise<GeoResult | null> => {
    if (q.length < 2) { setSuggestions([]); setDropOpen(false); setGeoResult(null); geoResultRef.current = null; return null; }
    setGeocoding(true);
    try {
      const res  = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json() as { results: GeoResult[] };
      const rs   = data.results ?? [];
      setSuggestions(rs);
      if (rs.length === 1) {
        setGeoResult(rs[0]); geoResultRef.current = rs[0];
        setPlaceQuery(rs[0].displayName); setDropOpen(false);
        return rs[0];
      } else if (rs.length > 1) {
        setGeoResult(null); geoResultRef.current = null; setDropOpen(true);
      } else {
        setGeoResult(null); geoResultRef.current = null;
      }
      return null;
    } finally {
      setGeocoding(false);
    }
  }, []);

  function onPlaceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setPlaceQuery(v); setGeoResult(null); geoResultRef.current = null;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchGeo(v), 380);
  }

  function pickSuggestion(r: GeoResult) {
    setGeoResult(r); geoResultRef.current = r;
    setPlaceQuery(r.displayName); setDropOpen(false);
  }

  async function goToStep2() {
    setS1Error("");
    if (!date) { setS1Error("Podaj datę urodzenia"); return; }
    let place = geoResultRef.current;
    if (!place && placeQuery.length >= 2) {
      place = await fetchGeo(placeQuery);
    }
    if (!place) { setS1Error("Wybierz miejsce z listy wyników"); return; }

    const pending: PendingChart = {
      name: name.trim(), date,
      time: timeUnknown ? "" : time, timeUnknown,
      place: place.displayName, lat: place.lat, lng: place.lng,
    };
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    setStep(2);
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault(); setS2Error(""); setS2Loading("email");
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setS2Error(error.message); setS2Loading(null); }
    else { setStep(3); setS2Loading(null); }
  }

  async function handleGoogle() {
    setS2Loading("google"); setS2Error("");
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
          : undefined,
      },
    });
  }

  const cityShort  = geoResult?.displayName.split(",")[0] ?? placeQuery.split(",")[0];
  const dateShort  = date
    ? new Date(date + "T12:00:00").toLocaleDateString("pl-PL", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(22,16,50,0.72) 0%, #050508 100%)" }}
    >
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true"
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(88,60,140,0.16) 0%, transparent 70%)", filter: "blur(2px)" }}
      />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href={ROUTES.public.home.path} aria-label="Cosmogram">
            <Image src="/logo-b-refined.svg" alt="Cosmogram" width={200} height={50}
              className="h-10 w-auto [filter:brightness(0)_invert(1)]" priority />
          </Link>
        </div>

        {/* Progress — only for steps 1-2 */}
        {step <= 2 && (
          <motion.div className="flex items-center justify-center gap-2 mb-7"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {([1, 2] as const).map((s, idx) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-400"
                  style={{
                    background: s <= step ? "linear-gradient(135deg, #D4AF37, #C5A059)" : "rgba(212,175,55,0.07)",
                    border: `0.5px solid rgba(212,175,55,${s <= step ? "0.65" : "0.15"})`,
                    color: s <= step ? "#050508" : "rgba(212,175,55,0.30)",
                  }}
                >
                  {s < step ? <Check className="w-3 h-3" /> : s}
                </div>
                {idx < 1 && (
                  <div className="w-14 h-px transition-all duration-500"
                    style={{ background: s < step ? "rgba(212,175,55,0.40)" : "rgba(212,175,55,0.10)" }} />
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Card */}
        <div className="rounded-3xl overflow-hidden"
          style={{ background: "rgba(5,4,14,0.82)", border: "0.5px solid rgba(212,175,55,0.18)", backdropFilter: "blur(28px)" }}>
          <AnimatePresence mode="wait" initial={false}>

            {/* ═══ STEP 1: DANE URODZENIOWE ═══ */}
            {step === 1 && (
              <motion.div key="s1"
                variants={slide} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="p-7 sm:p-8"
              >
                <p className="text-[10px] uppercase tracking-[0.30em] mb-2.5" style={{ color: "rgba(212,175,55,0.55)" }}>
                  Krok 1 z 2
                </p>
                <h2 className="text-[28px] font-medium text-white leading-snug mb-1.5"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}>
                  Kiedy przyszłeś na świat?
                </h2>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  To jedyne dane potrzebne do stworzenia Twojego kosmogramu natalnego. Bezpłatnie.
                </p>

                <div className="space-y-3">
                  {/* Imię */}
                  <FocusInput
                    icon={<span className="text-[13px]" style={{ color: "rgba(212,175,55,0.5)" }}>✦</span>}
                    type="text" placeholder="Twoje imię (opcjonalne)"
                    value={name} onChange={e => setName(e.target.value)}
                  />

                  {/* Data */}
                  <FocusInput
                    icon={<Calendar className="w-4 h-4" />}
                    type="date" placeholder="Data urodzenia" label="Data urodzenia"
                    value={date} onChange={e => setDate(e.target.value)} required
                  />

                  {/* Godzina */}
                  <div>
                    <div className={timeUnknown ? "opacity-35 pointer-events-none" : ""}>
                      <FocusInput
                        icon={<Clock className="w-4 h-4" />}
                        type="time" placeholder="Godzina urodzenia" label="Godzina urodzenia"
                        value={time} onChange={e => setTime(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setTimeUnknown(v => !v)}
                      className="mt-2 flex items-center gap-2 px-2 py-1 rounded-lg transition-all active:scale-95"
                    >
                      <div
                        className="w-4 h-4 rounded border flex items-center justify-center transition-all duration-200"
                        style={{
                          borderColor: timeUnknown ? "#D4AF37" : "rgba(212,175,55,0.25)",
                          background: timeUnknown ? "#D4AF37" : "transparent",
                        }}
                      >
                        {timeUnknown && <Check className="w-2.5 h-2.5 text-[#050508]" />}
                      </div>
                      <span className="text-xs text-slate-500">Nie znam godziny urodzenia</span>
                    </button>
                  </div>

                  {/* Miejsce z autocomplete */}
                  <div ref={placeRef} className="relative">
                    <MapPin className="absolute left-3.5 top-[14px] w-4 h-4 text-slate-500 pointer-events-none z-10" />
                    <input
                      type="text" placeholder="Miasto urodzenia" value={placeQuery}
                      onChange={onPlaceChange}
                      className={`${BASE} pl-10 pr-9`}
                      style={ST}
                      onFocus={e => {
                        Object.assign(e.target.style, SF);
                        if (suggestions.length > 1) setDropOpen(true);
                      }}
                      onBlur={e => { e.target.style.borderColor = "rgba(212,175,55,0.18)"; e.target.style.boxShadow = "none"; }}
                    />
                    <div className="absolute right-3.5 top-[14px] pointer-events-none">
                      {geocoding
                        ? <Loader2 className="w-3.5 h-3.5 text-slate-600 animate-spin" />
                        : geoResult
                          ? <Check className="w-3.5 h-3.5" style={{ color: "#D4AF37" }} />
                          : null}
                    </div>
                    {/* Dropdown suggestions */}
                    {dropOpen && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20"
                        style={{ background: "rgba(5,4,14,0.97)", border: "0.5px solid rgba(212,175,55,0.22)", backdropFilter: "blur(20px)" }}>
                        {suggestions.slice(0, 4).map((r, i) => (
                          <button key={i} type="button" onMouseDown={() => pickSuggestion(r)}
                            className="w-full text-left flex items-center gap-2.5 px-4 py-3 text-sm text-slate-300 hover:bg-[rgba(212,175,55,0.07)] hover:text-[#F3E5AB] transition-colors">
                            <MapPin className="w-3 h-3 text-slate-600 shrink-0" />
                            {r.displayName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {s1Error && (
                  <p className="mt-3 text-xs text-red-400 text-center">{s1Error}</p>
                )}

                <motion.button
                  onClick={goToStep2}
                  disabled={!date || geocoding}
                  whileHover={{ y: -1, boxShadow: "0 0 28px rgba(212,175,55,0.30)" }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-6 w-full py-3.5 rounded-2xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-40 transition-all duration-300"
                  style={{ background: "linear-gradient(135deg, #D4AF37, #C5A059)", color: "#050508" }}
                >
                  {geocoding
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Szukam miejsca…</>
                    : <>Stwórz mój kosmogram <ChevronRight className="w-4 h-4" /></>
                  }
                </motion.button>

                <p className="mt-5 text-center text-xs text-slate-600">
                  Masz już konto?{" "}
                  <Link href={ROUTES.public.login.path}
                    className="transition-colors" style={{ color: "rgba(212,175,55,0.60)" }}>
                    Zaloguj się
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ═══ STEP 2: KONTO ═══ */}
            {step === 2 && (
              <motion.div key="s2"
                variants={slide} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="p-7 sm:p-8"
              >
                <button onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors mb-5 active:opacity-60">
                  <ArrowLeft className="w-3.5 h-3.5" /> Wróć
                </button>

                <p className="text-[10px] uppercase tracking-[0.30em] mb-2.5" style={{ color: "rgba(212,175,55,0.55)" }}>
                  Krok 2 z 2
                </p>
                <h2 className="text-[26px] font-medium text-white leading-snug mb-1.5"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}>
                  Jeden krok od Twojego kosmogramu
                </h2>
                <p className="text-xs text-slate-500 mb-5">
                  Stwórz darmowe konto by go zobaczyć.
                </p>

                {/* Dane preview — pokazuje commitment */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {name && (
                    <span className="px-2.5 py-1 rounded-full text-[11px]"
                      style={{ background: "rgba(212,175,55,0.07)", border: "0.5px solid rgba(212,175,55,0.20)", color: "#F3E5AB" }}>
                      ✦ {name}
                    </span>
                  )}
                  {dateShort && (
                    <span className="px-2.5 py-1 rounded-full text-[11px]"
                      style={{ background: "rgba(212,175,55,0.07)", border: "0.5px solid rgba(212,175,55,0.20)", color: "#F3E5AB" }}>
                      📅 {dateShort}
                    </span>
                  )}
                  {cityShort && (
                    <span className="px-2.5 py-1 rounded-full text-[11px]"
                      style={{ background: "rgba(212,175,55,0.07)", border: "0.5px solid rgba(212,175,55,0.20)", color: "#F3E5AB" }}>
                      📍 {cityShort}
                    </span>
                  )}
                </div>

                {/* Google */}
                <button onClick={handleGoogle} disabled={s2Loading !== null}
                  className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-medium text-slate-300 mb-4 transition-all hover:bg-white/5 active:scale-[0.99] disabled:opacity-50"
                  style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)" }}>
                  {s2Loading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
                  Kontynuuj przez Google
                </button>

                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px" style={{ background: "rgba(212,175,55,0.10)" }} />
                  <span className="text-[10px] text-slate-600 uppercase tracking-widest">lub</span>
                  <div className="flex-1 h-px" style={{ background: "rgba(212,175,55,0.10)" }} />
                </div>

                <form onSubmit={handleEmailSignup} className="space-y-3">
                  <FocusInput
                    icon={<Mail className="w-4 h-4" />}
                    type="email" placeholder="Adres email"
                    value={email} onChange={e => setEmail(e.target.value)} required
                  />
                  <FocusInput
                    icon={<Lock className="w-4 h-4" />}
                    type="password" placeholder="Hasło (min. 8 znaków)"
                    value={password} onChange={e => setPassword(e.target.value)}
                    required minLength={8}
                  />

                  {s2Error && <p className="text-xs text-red-400 text-center">{s2Error}</p>}

                  <motion.button
                    type="submit"
                    disabled={s2Loading !== null || !email || password.length < 8}
                    whileHover={{ y: -1, boxShadow: "0 0 28px rgba(212,175,55,0.30)" }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 rounded-2xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-40 transition-all duration-300"
                    style={{ background: "linear-gradient(135deg, #D4AF37, #C5A059)", color: "#050508" }}
                  >
                    {s2Loading === "email"
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : "Stwórz konto →"
                    }
                  </motion.button>
                </form>

                <p className="mt-5 text-center text-xs text-slate-600">
                  Masz już konto?{" "}
                  <Link href={ROUTES.public.login.path}
                    className="transition-colors" style={{ color: "rgba(212,175,55,0.60)" }}>
                    Zaloguj się
                  </Link>
                </p>
              </motion.div>
            )}

            {/* ═══ STEP 3: SPRAWDŹ EMAIL ═══ */}
            {step === 3 && (
              <motion.div key="s3"
                variants={slide} initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="p-7 sm:p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{
                    background: "radial-gradient(ellipse at 40% 30%, rgba(212,175,55,0.18), rgba(91,44,143,0.12))",
                    border: "0.5px solid rgba(212,175,55,0.35)",
                    boxShadow: "0 0 32px rgba(212,175,55,0.18)",
                  }}
                >
                  <Mail className="w-7 h-7" style={{ color: "#D4AF37" }} />
                </motion.div>

                <h2 className="text-[28px] font-medium text-white mb-2"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}>
                  Sprawdź skrzynkę
                </h2>
                <p className="text-sm text-slate-400 mb-1">Link aktywacyjny wysłaliśmy na</p>
                <p className="text-sm font-semibold mb-5" style={{ color: "#D4AF37" }}>{email}</p>

                <div className="h-px mb-5"
                  style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.18), transparent)" }} />

                <p className="text-xs text-slate-500 leading-relaxed mb-5">
                  Po kliknięciu linku Twój kosmogram wygeneruje się automatycznie ✦
                </p>

                {/* Podgląd danych — wzmacnia oczekiwanie */}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {name && (
                    <span className="px-2.5 py-1 rounded-full text-[11px]"
                      style={{ background: "rgba(212,175,55,0.05)", border: "0.5px solid rgba(212,175,55,0.15)", color: "#F3E5AB" }}>
                      ✦ {name}
                    </span>
                  )}
                  {dateShort && (
                    <span className="px-2.5 py-1 rounded-full text-[11px]"
                      style={{ background: "rgba(212,175,55,0.05)", border: "0.5px solid rgba(212,175,55,0.15)", color: "#F3E5AB" }}>
                      {dateShort}
                    </span>
                  )}
                  {cityShort && (
                    <span className="px-2.5 py-1 rounded-full text-[11px]"
                      style={{ background: "rgba(212,175,55,0.05)", border: "0.5px solid rgba(212,175,55,0.15)", color: "#F3E5AB" }}>
                      📍 {cityShort}
                    </span>
                  )}
                </div>

                <p className="mt-6 text-[10px] text-slate-700">
                  Nie widzisz maila? Sprawdź folder spam.
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: "rgba(212,175,55,0.15)", borderTopColor: "#D4AF37" }} />
      </div>
    }>
      <SignupWizard />
    </Suspense>
  );
}
