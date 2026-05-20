import { Cpu, Database, ShieldCheck } from "lucide-react";

const badges = [
  {
    icon: Database,
    label: "Swiss Ephemeris",
    sub: "Astronomical precision",
  },
  {
    icon: Cpu,
    label: "State-of-the-art AI",
    sub: "Deep chart interpretation",
  },
  {
    icon: ShieldCheck,
    label: "Privacy First",
    sub: "Your data, your cosmos",
  },
];

export default function TrustBand() {
  return (
    <section
      aria-label="Trust and technology indicators"
      className="relative py-8 border-y border-purple-900/20 bg-gradient-to-r from-[#03010d] via-purple-950/10 to-[#03010d]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Top label */}
        <p className="text-center text-xs uppercase tracking-[0.25em] text-slate-600 mb-6 font-medium">
          Powered by
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
          {badges.map((badge, i) => (
            <div key={badge.label} className="flex items-center">
              {/* Badge */}
              <div className="flex items-center gap-3 px-6 py-3">
                <div className="w-9 h-9 rounded-lg bg-violet-900/30 border border-violet-700/30 flex items-center justify-center flex-shrink-0">
                  <badge.icon className="w-4.5 h-4.5 text-violet-400" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">{badge.label}</p>
                  <p className="text-xs text-slate-500">{badge.sub}</p>
                </div>
              </div>

              {/* Divider (not after last item) */}
              {i < badges.length - 1 && (
                <div
                  className="hidden sm:block w-px h-10 bg-purple-900/40 mx-2"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>

        {/* Marquee-style subtle text for mobile complement */}
        <p className="text-center text-xs text-slate-700 mt-6 tracking-wide">
          Swiss Ephemeris precision &nbsp;·&nbsp; GPT-class AI interpretations &nbsp;·&nbsp; Built for seekers who demand the truth
        </p>
      </div>
    </section>
  );
}
