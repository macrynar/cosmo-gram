"use client";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { ROUTES } from "@/lib/routes";

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

// shared input class
const INPUT = [
  "w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-600",
  "focus:outline-none transition-all duration-400",
].join(" ");

const INPUT_STYLE = {
  background: "rgba(0,0,0,0.45)",
  border: "0.5px solid rgba(212,175,55,0.18)",
};
const INPUT_FOCUS_STYLE = {
  borderColor: "rgba(212,175,55,0.55)",
  boxShadow: "0 0 18px rgba(212,175,55,0.10)",
};

function MysticInput({
  type, placeholder, value, onChange, icon: Icon,
}: {
  type: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.FC<{ className?: string }>;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
      <input
        type={type}
        required
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={INPUT}
        style={{ ...INPUT_STYLE, ...(focused ? INPUT_FOCUS_STYLE : {}) }}
      />
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState<string | null>(null);

  const redirectTo = searchParams.get("redirect") || ROUTES.app.today.path;

  useEffect(() => {
    if (!authLoading && user) router.replace(redirectTo);
  }, [user, authLoading, router, redirectTo]);

  async function handleOAuth() {
    setLoading("google"); setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`
          : undefined,
      },
    });
    if (err) { setError(err.message); setLoading(null); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading("email");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError("Nieprawidłowy e-mail lub hasło."); setLoading(null); }
    else router.replace(redirectTo);
  }

  const isBusy = loading !== null;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(22,16,50,0.70) 0%, #050508 100%)" }}
    >
      {/* Star bg */}
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true"
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(88,60,140,0.16) 0%, transparent 70%)", filter: "blur(2px)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href={ROUTES.public.home.path} aria-label="Cosmogram">
            <Image src="/logo-b-refined.svg" alt="Cosmogram" width={200} height={50}
              className="h-11 w-auto [filter:brightness(0)_invert(1)]" priority />
          </Link>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-7"
          style={{
            background: "rgba(5,4,14,0.82)",
            border: "0.5px solid rgba(212,175,55,0.22)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 0 80px rgba(5,4,14,0.8), 0 0 0 0.5px rgba(212,175,55,0.08) inset",
          }}
        >
          <p className="text-center text-sm text-slate-500 mb-5"
            style={{ fontFamily: "var(--font-cormorant), serif", fontSize: "1rem" }}>
            Witaj z powrotem
          </p>

          {/* Gold divider */}
          <div className="altar-divider mb-5" />

          {/* Google */}
          <button
            onClick={handleOAuth}
            disabled={isBusy}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:text-white transition-all duration-400 disabled:opacity-50"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "0.5px solid rgba(255,255,255,0.10)",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.30)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.10)"; }}
          >
            {loading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
            Kontynuuj z Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "rgba(212,175,55,0.12)" }} />
            <span className="text-[11px] tracking-widest" style={{ color: "rgba(212,175,55,0.40)" }}>lub</span>
            <div className="flex-1 h-px" style={{ background: "rgba(212,175,55,0.12)" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <MysticInput type="email" placeholder="twoj@email.com" value={email}
              onChange={e => setEmail(e.target.value)} icon={Mail} />
            <div>
              <MysticInput type="password" placeholder="hasło" value={password}
                onChange={e => setPassword(e.target.value)} icon={Lock} />
              <Link href={ROUTES.public.forgotPassword.path}
                className="mt-2 text-[11px] hover:text-[#D4AF37] float-right transition-colors duration-300"
                style={{ color: "rgba(212,175,55,0.45)" }}>
                Zapomniałem hasła
              </Link>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs pt-1 clear-both"
              >
                {error}
              </motion.p>
            )}

            <div className="clear-both pt-2">
              <motion.button
                type="submit"
                disabled={isBusy}
                whileHover={isBusy ? undefined : {
                  boxShadow: "0 0 22px rgba(212,175,55,0.35), 0 0 45px rgba(212,175,55,0.12)",
                  y: -1,
                }}
                whileTap={isBusy ? undefined : { scale: 0.98 }}
                className="w-full py-3 rounded-xl text-sm font-medium tracking-wider uppercase transition-all duration-400 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, rgba(212,175,55,0.90) 0%, rgba(197,160,89,0.90) 100%)",
                  color: "#050508",
                  border: "0.5px solid rgba(212,175,55,0.60)",
                }}
              >
                {loading === "email" && <Loader2 className="w-4 h-4 animate-spin" />}
                Zaloguj się
              </motion.button>
            </div>
          </form>

          <p className="mt-5 text-center text-xs text-slate-600">
            Nie masz konta?{" "}
            <Link
              href={`${ROUTES.public.signup.path}${redirectTo !== ROUTES.app.today.path ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="transition-colors duration-300 hover:text-[#F3E5AB]"
              style={{ color: "#D4AF37" }}
            >
              Zarejestruj się
            </Link>
          </p>
        </div>

        {/* Bottom links */}
        <p className="text-center text-[11px] text-slate-700 mt-5">
          <Link href={ROUTES.public.terms.path} className="hover:text-slate-500 transition-colors">Regulamin</Link>
          {" · "}
          <Link href={ROUTES.public.privacy.path} className="hover:text-slate-500 transition-colors">Prywatność</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full animate-spin border-t-2"
          style={{ borderColor: "transparent", borderTopColor: "#D4AF37" }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
