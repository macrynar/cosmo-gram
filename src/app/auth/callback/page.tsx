"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(async ({ data }) => {
        // Fire welcome email for new users (idempotent — API skips if already sent)
        if (data.session) {
          fetch("/api/email/welcome", {
            method: "POST",
            headers: { Authorization: `Bearer ${data.session.access_token}` },
          }).catch(() => {});
        }
        router.replace("/app/cosmogram");
      });
      return;
    }

    // Fallback: magic-link / implicit flow — SDK already has the session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") router.replace("/app/cosmogram");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/app/cosmogram");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#03010d] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
    </div>
  );
}
