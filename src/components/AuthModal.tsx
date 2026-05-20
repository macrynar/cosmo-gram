"use client";

import { useState } from "react";
import { X, Mail, Lock, ArrowLeft, Loader2, Sparkles, Check } from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "register" | "forgot";

type Props = { onClose: () => void };

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

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

export default function AuthModal({ onClose }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  function reset() {
    setError("");
    setInfo("");
  }

  function switchMode(m: Mode) {
    setMode(m);
    reset();
  }

  async function handleOAuth(provider: "google" | "facebook") {
    setLoading(provider);
    setError("");
    const redirectTo = typeof window !== "undefined"
      ? `${window.location.origin}/generate`
      : "/generate";
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (err) setError(err.message);
    setLoading(null);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading("email");

    if (mode === "register") {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) setError(err.message);
      else setInfo("Sprawdź skrzynkę — wysłaliśmy link potwierdzający rejestrację.");
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError("Nieprawidłowy email lub hasło.");
      else onClose();
    }

    setLoading(null);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading("forgot");
    const redirectTo = typeof window !== "undefined"
      ? `${window.location.origin}/reset-password`
      : "/reset-password";
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (err) setError(err.message);
    else setInfo("Gotowe! Sprawdź skrzynkę — link wygasa po godzinie.");
    setLoading(null);
  }

  const isBusy = loading !== null;

  // ── Forgot password view ───────────────────────────────────────
  if (mode === "forgot") {
    return (
      <ModalShell onClose={onClose}>
        <button
          onClick={() => switchMode("login")}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Wróć do logowania
        </button>

        <h2 className="text-lg font-semibold text-white mb-1 font-brand">
          Resetowanie hasła
        </h2>
        <p className="text-slate-500 text-xs mb-5">
          Podaj adres e-mail — wyślemy link do ustawienia nowego hasła.
        </p>

        {info ? (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-green-900/20 border border-green-700/30">
            <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <p className="text-sm text-green-300">{info}</p>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <InputField
              icon={<Mail className="w-4 h-4" />}
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={setEmail}
              required
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <SubmitButton loading={loading === "forgot"} disabled={isBusy}>
              Wyślij link resetujący
            </SubmitButton>
          </form>
        )}
      </ModalShell>
    );
  }

  // ── Login / Register view ──────────────────────────────────────
  return (
    <ModalShell onClose={onClose}>
      <p className="text-center text-sm text-slate-500 -mt-3 mb-5">
        {mode === "login" ? "Witaj z powrotem" : "Dołącz do Cosmogram"}
      </p>

      {/* Social buttons */}
      <div className="space-y-2 mb-5">
        <SocialButton
          icon={<GoogleIcon />}
          label="Kontynuuj z Google"
          loading={loading === "google"}
          disabled={isBusy}
          onClick={() => handleOAuth("google")}
        />
        <SocialButton
          icon={<FacebookIcon />}
          label="Kontynuuj z Facebook"
          loading={loading === "facebook"}
          disabled={isBusy}
          onClick={() => handleOAuth("facebook")}
        />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-[11px] text-slate-600 shrink-0">lub e-mail</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      {/* Email form */}
      <form onSubmit={handleEmailSubmit} className="space-y-3">
        <InputField
          icon={<Mail className="w-4 h-4" />}
          type="email"
          placeholder="twoj@email.com"
          value={email}
          onChange={setEmail}
          required
        />
        <div>
          <InputField
            icon={<Lock className="w-4 h-4" />}
            type="password"
            placeholder={mode === "register" ? "min. 6 znaków" : "hasło"}
            value={password}
            onChange={setPassword}
            required
            minLength={6}
          />
          {mode === "login" && (
            <button
              type="button"
              onClick={() => switchMode("forgot")}
              className="mt-1.5 text-[11px] text-slate-500 hover:text-amber-400 transition-colors float-right"
            >
              Zapomniałem hasła
            </button>
          )}
        </div>

        {error && <p className="text-red-400 text-xs pt-1 clear-both">{error}</p>}
        {info && <p className="text-green-400 text-xs pt-1 clear-both">{info}</p>}

        <div className="clear-both pt-1">
          <SubmitButton loading={loading === "email"} disabled={isBusy}>
            {mode === "login" ? "Zaloguj się" : "Zarejestruj się"}
          </SubmitButton>
        </div>
      </form>

      {/* Switch mode */}
      <p className="mt-5 text-center text-xs text-slate-500">
        {mode === "login" ? "Nie masz konta?" : "Masz już konto?"}{" "}
        <button
          onClick={() => switchMode(mode === "login" ? "register" : "login")}
          className="text-amber-400 hover:text-amber-300 transition-colors"
        >
          {mode === "login" ? "Zarejestruj się" : "Zaloguj się"}
        </button>
      </p>
    </ModalShell>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-amber-900/25 bg-[#0a0807]/95 backdrop-blur-xl p-7 shadow-2xl shadow-black/60">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-600 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center mb-7">
          <Image
            src="/logo-b-refined.svg"
            alt="Cosmogram"
            width={200}
            height={50}
            className="h-11 w-auto [filter:brightness(0)_invert(1)]"
          />
        </div>
        {children}
      </div>
    </div>
  );
}

function SocialButton({
  icon, label, loading, disabled, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 hover:bg-white/8 hover:text-white hover:border-white/15 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}

function InputField({
  icon, type, placeholder, value, onChange, required, minLength,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
        {icon}
      </div>
      <input
        type={type}
        required={required}
        minLength={minLength}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-600/50 focus:bg-amber-900/10 transition-colors"
      />
    </div>
  );
}

function SubmitButton({
  children, loading, disabled,
}: {
  children: React.ReactNode;
  loading: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
