"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Check } from "lucide-react";
import { track } from "@/components/PostHogProvider";

export default function SubscriptionSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    track("trial_started");
    const t = setTimeout(() => router.push("/generate"), 5000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#03010d] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/50">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
          Witaj w Cosmogram Plus
        </h1>
        <p className="text-slate-400 text-sm mb-2">
          Twój 7-dniowy trial właśnie się zaczął.
        </p>
        <p className="text-slate-500 text-xs flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3" />
          Za chwilę zostaniesz przekierowany do swojego kosmogramu…
        </p>
        <button
          onClick={() => router.push("/generate")}
          className="mt-6 px-6 py-2.5 rounded-full bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors"
        >
          Przejdź teraz
        </button>
      </div>
    </div>
  );
}
