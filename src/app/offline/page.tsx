"use client";

import { Sparkles } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#03010d] flex flex-col items-center justify-center text-white px-6">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mb-6 shadow-lg shadow-purple-800/50">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Cinzel', serif" }}>
        Brak połączenia
      </h1>
      <p className="text-slate-400 text-center max-w-xs">
        Gwiazdy milczą gdy nie ma internetu. Sprawdź połączenie i spróbuj ponownie.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-8 px-6 py-3 rounded-full bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition-colors"
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}
