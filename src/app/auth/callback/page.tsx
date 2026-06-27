"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type ConsentState = "loading" | "needs_terms" | "done";

// Typy linków e-mail, które wymieniamy na sesję po stronie klienta (verifyOtp).
const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
];

export default function AuthCallback() {
  const router = useRouter();
  const [state, setState]               = useState<ConsentState>("loading");
  const [termsAccepted, setTermsAccepted]       = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [session, setSession]           = useState<{ access_token: string } | null>(null);
  const [redirectTarget, setRedirectTarget]     = useState("/app/cosmogram");
  const [hasPendingChart, setHasPendingChart]   = useState(false);

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const emailType = params.get("type") as EmailOtpType | null;
      // Open-redirect guard: akceptuj tylko ścieżki wewnętrzne ("/...").
      // Odrzuć absolutne URL-e i protocol-relative ("//evil.com").
      const redirectParam = params.get("redirect");
      const redirect =
        redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")
          ? redirectParam
          : "/app/cosmogram";
      setRedirectTarget(redirect);

      let sess: { access_token: string } | null = null;
      let freshOAuth = false;

      if (code) {
        // PKCE exchange. May fail harmlessly if the Supabase client's
        // detectSessionInUrl already consumed the code — we recover via getSession below.
        const { data } = await supabase.auth.exchangeCodeForSession(code).catch(() => ({ data: { session: null } }));
        if (data.session) { sess = data.session; freshOAuth = true; }
      }

      // Link z maila (rejestracja / magic link / reset hasła). Link żyje na
      // naszej domenie i niesie token_hash — wymieniamy go na sesję bez
      // przechodzenia przez brzydki adres *.supabase.co.
      if (!sess && tokenHash && emailType && EMAIL_OTP_TYPES.includes(emailType)) {
        const { data } = await supabase.auth
          .verifyOtp({ token_hash: tokenHash, type: emailType })
          .catch(() => ({ data: { session: null } }));
        if (data.session) {
          sess = data.session;
          // welcome e-mail tylko przy pierwszym potwierdzeniu konta
          if (emailType === "signup") freshOAuth = true;
        }
      }

      // Fallback: covers (a) already-consumed code, (b) returning user with a live session.
      if (!sess) {
        const { data } = await supabase.auth.getSession();
        if (data.session) sess = data.session;
      }

      if (!sess) {
        router.replace("/login");
        return;
      }

      if (freshOAuth) {
        fetch("/api/email/welcome", {
          method: "POST",
          headers: { Authorization: `Bearer ${sess.access_token}` },
        }).catch(() => {});
      }

      setSession(sess);

      // Check if terms were already accepted (from signup wizard or previous visit)
      const stored = localStorage.getItem("cosmo_terms_accepted");
      const hasPending = localStorage.getItem("cosmogram_pending_chart");

      // Persist pending birth data to Supabase so it survives cross-device/cross-browser flows
      // (e.g. user signs up on desktop, clicks confirmation link from mobile mail app)
      let pendingChartSaved = false;
      if (hasPending) {
        try {
          const pendingData = JSON.parse(hasPending) as Record<string, unknown>;
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            await supabase
              .from("user_preferences")
              .upsert({ user_id: currentUser.id, pending_birth_data: pendingData }, { onConflict: "user_id" });
            pendingChartSaved = true;
          }
        } catch {
          // non-critical — same-device localStorage path still works
        }
      }
      setHasPendingChart(!!hasPending || pendingChartSaved);

      if (stored) {
        // Already accepted — save consent to DB and proceed
        try {
          const parsed = JSON.parse(stored) as { marketing?: boolean };
          await fetch("/api/save-consent", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.access_token}` },
            body: JSON.stringify({ terms: true, marketing: parsed.marketing ?? false }),
          });
        } catch {}
        router.replace((hasPending || pendingChartSaved) ? "/app/cosmogram?autostart=true" : redirect);
      } else {
        // New user via Google OAuth on login page — show terms gate
        setState("needs_terms");
      }
    }

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function acceptTerms() {
    if (!termsAccepted || !session) return;
    setSaving(true);
    localStorage.setItem("cosmo_terms_accepted", JSON.stringify({
      accepted: true, marketing: marketingConsent, at: new Date().toISOString(), v: "2026-06-10",
    }));
    try {
      await fetch("/api/save-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ terms: true, marketing: marketingConsent }),
      });
    } catch {}
    const hasPending = localStorage.getItem("cosmogram_pending_chart");
    // hasPendingChart covers cross-device case where localStorage was empty but Supabase has the data
    router.replace((hasPending || hasPendingChart) ? "/app/cosmogram?autostart=true" : redirectTarget);
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-[#03010d] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(22,16,50,0.72) 0%, #050508 100%)" }}>
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="rounded-3xl p-7 sm:p-8"
          style={{ background: "rgba(5,4,14,0.88)", border: "0.5px solid rgba(212,175,55,0.20)", backdropFilter: "blur(28px)" }}>

          <p className="text-[10px] uppercase tracking-[0.28em] mb-3" style={{ color: "rgba(212,175,55,0.50)" }}>
            Ostatni krok
          </p>
          <h2 className="text-2xl font-medium text-white mb-1"
            style={{ fontFamily: "var(--font-cormorant), serif" }}>
            Zanim wejdziesz do Cosmogram
          </h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Potrzebujemy Twojej zgody zgodnie z wymogami RODO.
          </p>

          <div className="space-y-3 mb-6">
            <ConsentCheckbox
              checked={termsAccepted}
              onChange={setTermsAccepted}
              required
              label={
                <>
                  Akceptuję{" "}
                  <Link href="/terms" target="_blank" className="underline underline-offset-2" style={{ color: "rgba(212,175,55,0.75)" }}>Regulamin</Link>
                  {" "}i potwierdzam zapoznanie się z{" "}
                  <Link href="/privacy" target="_blank" className="underline underline-offset-2" style={{ color: "rgba(212,175,55,0.75)" }}>Polityką Prywatności</Link>.
                </>
              }
            />
            <ConsentCheckbox
              checked={marketingConsent}
              onChange={setMarketingConsent}
              label="Chcę otrzymywać e-maile o nowościach i ofertach Cosmogram. Wypiszesz się jednym kliknięciem."
            />
          </div>

          <button
            onClick={acceptTerms}
            disabled={!termsAccepted || saving}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 disabled:opacity-40 transition-all duration-300"
            style={{ background: "linear-gradient(135deg, #D4AF37, #C5A059)", color: "#050508" }}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Wejdź do Cosmogram →"}
          </button>

          <p className="mt-3 text-center text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.16)" }}>
            Administratorem danych jest UXIS Maciej Rynarzewski.{" "}
            <Link href="/privacy" target="_blank" className="underline underline-offset-2">Szczegóły i Twoje prawa</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

function ConsentCheckbox({ checked, onChange, label, required }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer group">
      <div className="relative mt-0.5 shrink-0">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
        <div
          className="w-4 h-4 rounded transition-all duration-200 flex items-center justify-center"
          style={{
            background: checked ? "rgba(212,175,55,0.85)" : "transparent",
            border: checked ? "0.5px solid #D4AF37" : "0.5px solid rgba(255,255,255,0.20)",
          }}
        >
          {checked && <Check className="w-2.5 h-2.5 text-[#050508]" />}
        </div>
      </div>
      <p className="text-[11px] leading-relaxed group-hover:text-slate-400 transition-colors" style={{ color: "rgba(255,255,255,0.38)" }}>
        {required && <span className="text-red-400 mr-0.5">*</span>}
        {label}
      </p>
    </label>
  );
}
