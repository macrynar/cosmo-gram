"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { track } from "@/components/PostHogProvider";
import { useAuth } from "@/components/AuthContext";
import { useSubscription } from "@/components/SubscriptionContext";

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { refresh } = useSubscription();
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    track("subscription_started");

    async function syncAndRedirect() {
      if (session) {
        try {
          await fetch("/api/sync-subscription", {
            method: "POST",
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          refresh();
        } catch {
          // proceed anyway
        }
      }
      setSyncing(false);
      setTimeout(() => router.push("/app/cosmogram"), 3000);
    }

    syncAndRedirect();
  }, [session, router, refresh]);

  return (
    <div className="min-h-screen bg-[#03010d] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/50">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 font-brand">
          Witaj w Cosmogram Plus
        </h1>
        <p className="text-slate-400 text-sm mb-2">
          Twoja subskrypcja jest aktywna.
        </p>
        <p className="text-slate-500 text-xs flex items-center justify-center gap-1">
          {syncing ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Aktywuję subskrypcję…</>
          ) : (
            <><Sparkles className="w-3 h-3" /> Za chwilę zostaniesz przekierowany…</>
          )}
        </p>
        <button
          onClick={() => router.push("/app/cosmogram")}
          className="mt-6 px-6 py-2.5 rounded-full bg-amber-700 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
        >
          Przejdź teraz
        </button>
      </div>
    </div>
  );
}
