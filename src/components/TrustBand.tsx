import { Cpu, Database, ShieldCheck } from "lucide-react";

const badges = [
  {
    icon: Database,
    label: "Swiss Ephemeris",
    sub: "Precyzja astronomiczna",
  },
  {
    icon: Cpu,
    label: "Claude + AI",
    sub: "Interpretacje kontekstowe",
  },
  {
    icon: ShieldCheck,
    label: "Privacy First",
    sub: "Twoje dane pozostają Twoje",
  },
];

export default function TrustBand() {
  return (
    <section
      aria-label="Technologia i zaufanie"
      className="relative py-8 border-y border-amber-900/20 bg-gradient-to-r from-[#03010d] via-[#1a140d]/30 to-[#03010d]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-amber-300/80 mb-6 font-medium">
          Na czym to działa
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
          {badges.map((badge, i) => (
            <div key={badge.label} className="flex items-center">
              <div className="flex items-center gap-3 px-6 py-3">
                <div className="w-9 h-9 rounded-lg bg-amber-900/20 border border-amber-700/30 flex items-center justify-center flex-shrink-0">
                  <badge.icon className="w-4.5 h-4.5 text-amber-300" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{badge.label}</p>
                  <p className="text-xs text-slate-500">{badge.sub}</p>
                </div>
              </div>

              {i < badges.length - 1 && (
                <div className="hidden sm:block w-px h-10 bg-amber-900/30 mx-2" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-700 mt-6 tracking-wide">
          Dokładne obliczenia • Głębokie interpretacje AI • Bezpieczne przechowywanie danych
        </p>
      </div>
    </section>
  );
}
