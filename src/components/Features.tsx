import { Calculator, BrainCircuit, Palette } from "lucide-react";

const features = [
  {
    icon: Calculator,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-900/20 border-amber-700/30",
    glowColor: "hover:border-amber-500/30",
    badge: "01",
    title: "Mathematical Precision",
    description:
      "We don't guess. We calculate exact planetary positions using Swiss Ephemeris—the same software used by professional astronomers and astrologers worldwide. Every degree, every minute, every second counts.",
    highlights: ["Accurate to fractions of a degree", "Covers 600 BC – AD 2400", "Includes all major & minor bodies"],
  },
  {
    icon: BrainCircuit,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-900/20 border-violet-700/30",
    glowColor: "hover:border-violet-500/30",
    badge: "02",
    title: "AI-Powered Insights",
    description:
      "Deep, psychological, and empathetic interpretations of your chart. Our AI goes beyond sun signs—it weaves together your entire cosmic fingerprint into a narrative that actually resonates with who you are.",
    highlights: ["Personalized narrative, not templates", "Psychological depth & nuance", "Empathetic, human-like tone"],
  },
  {
    icon: Palette,
    iconColor: "text-pink-400",
    iconBg: "bg-pink-900/20 border-pink-700/30",
    glowColor: "hover:border-pink-500/30",
    badge: "03",
    title: "Beautiful Visuals",
    description:
      "Say goodbye to outdated 90s charts. Explore your stars in a stunning modern UI with interactive chart wheels, smooth animations, and a design that honors the art of the cosmos.",
    highlights: ["Interactive chart wheel", "Modern dark-mode design", "Exportable as stunning art"],
  },
];

export default function Features() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="relative py-24 sm:py-32"
    >
      {/* Section background glow */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/5 to-transparent pointer-events-none"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-16 sm:mb-20">
          <p className="inline-block text-xs uppercase tracking-[0.25em] text-violet-400 font-medium mb-4 px-3 py-1 rounded-full border border-violet-700/30 bg-violet-900/10">
            Why Cosmo-gram
          </p>
          <h2
            id="features-heading"
            className="text-3xl sm:text-5xl font-bold text-white leading-tight"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Astrology,{" "}
            <span className="gradient-text">engineered.</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-slate-400 text-base sm:text-lg">
            Three pillars that separate Cosmo-gram from every other astrology app on the market.
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature) => (
            <article
              key={feature.title}
              className={`relative glass-card rounded-2xl p-7 transition-all duration-300 group ${feature.glowColor}`}
            >
              {/* Badge number */}
              <span className="absolute top-5 right-6 text-xs font-mono text-slate-700 group-hover:text-slate-600 transition-colors">
                {feature.badge}
              </span>

              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center mb-6 ${feature.iconBg} group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className={`w-6 h-6 ${feature.iconColor}`} strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h3
                className="text-lg font-semibold text-white mb-3"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {feature.title}
              </h3>

              {/* Description */}
              <p className="text-slate-400 text-sm leading-relaxed mb-5">
                {feature.description}
              </p>

              {/* Highlights */}
              <ul className="space-y-2">
                {feature.highlights.map((hl) => (
                  <li key={hl} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="w-1 h-1 rounded-full bg-violet-500 flex-shrink-0" />
                    {hl}
                  </li>
                ))}
              </ul>

              {/* Subtle bottom glow on hover */}
              <div
                aria-hidden="true"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-violet-600/0 to-transparent group-hover:via-violet-500/40 transition-all duration-500"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
