"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Star } from "lucide-react";

export default function Hero() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden"
    >
      {/* Layered background */}
      <div className="absolute inset-0 star-bg" aria-hidden="true" />

      {/* Large nebula glow — top center */}
      <div
        aria-hidden="true"
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] nebula-orb opacity-60 pointer-events-none"
      />

      {/* Soft ring decorations */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-purple-800/10 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-purple-900/10 pointer-events-none"
      />

      {/* Floating star accents */}
      <Star
        className="absolute top-[22%] left-[12%] w-3 h-3 text-amber-400/60 animate-pulse"
        aria-hidden="true"
        style={{ animationDuration: "3s" }}
      />
      <Star
        className="absolute top-[35%] right-[10%] w-2 h-2 text-violet-400/70 animate-pulse"
        aria-hidden="true"
        style={{ animationDuration: "4.5s" }}
      />
      <Star
        className="absolute bottom-[30%] left-[8%] w-2 h-2 text-amber-300/50 animate-pulse"
        aria-hidden="true"
        style={{ animationDuration: "3.7s" }}
      />
      <Star
        className="absolute bottom-[25%] right-[15%] w-3 h-3 text-violet-300/50 animate-pulse"
        aria-hidden="true"
        style={{ animationDuration: "2.8s" }}
      />

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-violet-500/30 bg-violet-900/20 text-violet-300 text-xs sm:text-sm font-medium tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          The Future of Astrology is Here
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>

        {/* H1 */}
        <h1
          className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Your exact birth chart.{" "}
          <span className="gradient-text text-glow">Decoded by AI.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-400 leading-relaxed mb-10">
          Stop settling for generic horoscopes. Cosmo-gram uses{" "}
          <span className="text-violet-300 font-medium">precise astronomical data</span>{" "}
          and{" "}
          <span className="text-violet-300 font-medium">advanced AI</span>{" "}
          to give you a personalized, deep, and beautifully designed reading.
        </p>

        {/* Waitlist CTA */}
        <div id="waitlist" className="max-w-md mx-auto">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-6 px-6 rounded-2xl glass-card">
              <div className="w-12 h-12 rounded-full bg-violet-600/30 border border-violet-400/40 flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
              </div>
              <p className="text-white font-semibold text-lg" style={{ fontFamily: "'Cinzel', serif" }}>
                You&apos;re on the list!
              </p>
              <p className="text-slate-400 text-sm text-center">
                We&apos;ll notify you the moment Cosmo-gram launches. The stars are aligning for you.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3"
              aria-label="Join waitlist form"
            >
              <div className="flex-1 relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-5 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500/70 focus:bg-violet-900/10 focus:ring-1 focus:ring-violet-500/30 transition-all duration-200"
                  aria-label="Email address"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-900/40 hover:shadow-purple-700/50 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap glow-nebula"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Join the Waitlist
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {!submitted && (
            <p className="mt-3 text-xs text-slate-600 text-center">
              No spam, ever. Unsubscribe anytime. 100% free.
            </p>
          )}

          {/* Direct CTA to generate */}
          <div className="mt-6">
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-900/40 hover:shadow-amber-700/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
            >
              <Sparkles className="w-4 h-4" />
              Wygeneruj swój kosmogram teraz
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="mt-2 text-xs text-slate-600 text-center">Bezpłatnie · Natychmiastowo · Bez rejestracji</p>
          </div>
        </div>

        {/* Social proof micro-copy */}
        <div className="flex items-center justify-center gap-4 mt-10 text-xs text-slate-500">
          <div className="flex -space-x-2">
            {["🌙", "⭐", "✨", "🔮"].map((emoji, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-900 to-space-900 border border-purple-700/40 flex items-center justify-center text-xs"
              >
                {emoji}
              </div>
            ))}
          </div>
          <span>Join <strong className="text-slate-400">2,400+</strong> astrology seekers on the waitlist</span>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#03010d] to-transparent pointer-events-none"
      />
    </section>
  );
}
