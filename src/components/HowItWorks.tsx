import { ClipboardList, Orbit, Wand2 } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: ClipboardList,
    title: "Enter Your Birth Data",
    description:
      "Provide your exact birth date, time, and location. Precision matters—we use every detail to map the sky as it appeared the moment you arrived.",
    detail: "Date · Time · Place",
  },
  {
    step: "02",
    icon: Orbit,
    title: "Our Engine Calculates the Stars",
    description:
      "Swiss Ephemeris computes the exact position of every planet, asteroid, and celestial point for your birth moment. No approximations. No rounding.",
    detail: "10+ celestial bodies · Houses · Aspects",
  },
  {
    step: "03",
    icon: Wand2,
    title: "AI Uncovers Your Cosmic Blueprint",
    description:
      "Our AI synthesizes the entire chart into a cohesive, deeply personal reading. Not keywords—a narrative. Your story, written in the stars.",
    detail: "Psychological depth · Narrative · Actionable insights",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-heading"
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      {/* Background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-transparent via-[#07031a]/60 to-transparent pointer-events-none"
      />
      {/* Decorative orb */}
      <div
        aria-hidden="true"
        className="absolute right-[-20%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-900/10 blur-3xl pointer-events-none"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16 sm:mb-20">
          <p className="inline-block text-xs uppercase tracking-[0.25em] text-violet-400 font-medium mb-4 px-3 py-1 rounded-full border border-violet-700/30 bg-violet-900/10">
            How it Works
          </p>
          <h2
            id="how-heading"
            className="text-3xl sm:text-5xl font-bold text-white"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Three steps to your{" "}
            <span className="gradient-text">cosmic truth.</span>
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-slate-400 text-base sm:text-lg">
            From birth data to a full AI-powered reading in under a minute.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connecting line (desktop) */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-violet-800/20 via-violet-600/40 to-violet-800/20"
          />

          {steps.map((step, i) => (
            <div key={step.step} className="flex flex-col items-center text-center group">
              {/* Step circle + icon */}
              <div className="relative mb-6">
                {/* Outer pulse ring */}
                <div className="absolute inset-0 rounded-full bg-violet-600/10 scale-150 opacity-0 group-hover:opacity-100 group-hover:scale-[1.8] transition-all duration-500" />
                {/* Icon ring */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[#150a38] to-[#07031a] border-2 border-violet-700/40 group-hover:border-violet-500/70 transition-colors duration-300 flex flex-col items-center justify-center shadow-lg shadow-purple-950/50 group-hover:glow-nebula">
                  <step.icon
                    className="w-7 h-7 text-violet-400 group-hover:text-violet-300 transition-colors"
                    strokeWidth={1.5}
                  />
                </div>
                {/* Step number badge */}
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center border border-violet-500 shadow-md">
                  {i + 1}
                </div>
              </div>

              {/* Step label */}
              <span className="text-[10px] font-mono uppercase tracking-widest text-violet-600 mb-2">
                Step {step.step}
              </span>

              {/* Title */}
              <h3
                className="text-lg font-semibold text-white mb-3 group-hover:text-violet-100 transition-colors"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                {step.title}
              </h3>

              {/* Description */}
              <p className="text-slate-400 text-sm leading-relaxed mb-4 max-w-[260px]">
                {step.description}
              </p>

              {/* Detail pill */}
              <div className="inline-block px-3 py-1 rounded-full bg-violet-900/20 border border-violet-800/30 text-violet-400 text-xs">
                {step.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
