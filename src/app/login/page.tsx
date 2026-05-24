"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, ArrowLeft, Loader2, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";
import { ROUTES } from "@/lib/routes";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const redirectTo = searchParams.get("redirect") || ROUTES.app.today.path;

  useEffect(() => {
    if (!authLoading && user) router.replace(redirectTo);
  }, [user, authLoading, router, redirectTo]);

  async function handleOAuth(provider: "google" | "facebook") {
    setLoading(provider);
    setError("");
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
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
    setError("");
    setLoading("email");
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError("Nieprawidłowy email lub hasło.");
      setLoading(null);
    } else {
      router.replace(redirectTo);
    }
  }

  const isBusy = loading !== null;

  return (
    <div className="min-h-screen bg-[#03010d] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Link href={ROUTES.public.home.path} aria-label="Cosmogram">
            <Image src="/logo-b-refined.svg" alt="Cosmogram" width={200} height={50}
              className="h-11 w-auto [filter:brightness(0)_invert(1)]" priority />
          </Link>
        </div>

        <div className="rounded-2xl border border-amber-900/25 bg-[#0a0807]/95 backdrop-blur-xl p-7 shadow-2xl shadow-black/60">
          <p className="text-center text-sm text-slate-500 mb-5">Witaj z powrotem</p>

          <div className="space-y-2 mb-5">
            <button onClick={() => handleOAuth("google")} disabled={isBusy}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/8 hover:text-white transition-all disabled:opacity-50">
              {loading === "google" ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
              Kontynuuj z Google
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[11px] text-slate-600">lub e-mail</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input type="email" required placeholder="twoj@email.com" value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600/50 focus:bg-amber-900/10 transition-colors" />
            </div>
            <div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input type="password" required placeholder="hasło" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600/50 focus:bg-amber-900/10 transition-colors" />
              </div>
              <Link href={ROUTES.public.forgotPassword.path}
                className="mt-1.5 text-[11px] text-slate-500 hover:text-amber-400 transition-colors float-right">
                Zapomniałem hasła
              </Link>
            </div>
            {error && <p className="text-red-400 text-xs pt-1 clear-both">{error}</p>}
            <div className="clear-both pt-1">
              <button type="submit" disabled={isBusy}
                className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {loading === "email" && <Loader2 className="w-4 h-4 animate-spin" />}
                Zaloguj się
              </button>
            </div>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            Nie masz konta?{" "}
            <Link href={`${ROUTES.public.signup.path}${redirectTo !== ROUTES.app.today.path ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
              className="text-amber-400 hover:text-amber-300 transition-colors">
              Zarejestruj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#03010d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
