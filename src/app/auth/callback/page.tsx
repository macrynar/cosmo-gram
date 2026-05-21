"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Supabase SDK detects ?code= in URL and auto-exchanges it for a session.
    // We just wait for SIGNED_IN then send the user to /generate.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        router.replace("/generate");
      }
    });

    // Handle the case where the session was already established before we subscribed.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/generate");
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#03010d] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin" />
    </div>
  );
}
