"use client";

import { useState } from "react";
import { ArrowRight, Sparkles, Star, Zap } from "lucide-react";

export default function BottomCTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <section
      id="join"
      aria-labelledby="cta-heading"
      className="relative py-24 sm:py-36 overflow-hidden"
    >
      {/* Multi-layer background */}
      <div
        aria-hidden="true"
        className="absolute inset-0 star-bg opacity-50 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] nebula-orb opacity-80 pointer-events-none"
      />
      {/* Ring decorations */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-violet-700/20 pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-violet-800/10 pointer-events-none"
      />

      {/* Floating stars */}
      <Star
        className="absolute top-[20%] left-[15%] w-3 h-3 text-amber-400/50 animate-pulse"
        aria-hidden="true"
        style={{ animationDuration: "3.2s" }}
      />
      <Star
        className="absolute top-[30%] right-[12%] w-2 h-2 text-violet-400/60 animate-pulse"
        aria-hidden="true"
        style={{ animationDuration: "4s" }}
      />
      <Star
        className="absolute bottom-[25%] left-[10%] w-2 h-2 text-amber-300/40 animate-pulse"
        aria-hidden="true"
        style={{ animationDuration: "2.5s" }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        {/* Urgency badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-amber-600/30 bg-amber-900/10 text-amber-400 text-xs font-medium tracking-wide">
          <Zap className="w-3 h-3 fill-amber-400" />
          Limited early access — Launch approaching
          <Zap className="w-3 h-3 fill-amber-400" />
        </div>

        {/* Heading */}
        <h2
          id="cta-heading"
          className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          Don&apos;t let the stars{" "}
          <span className="gradient-text text-glow">wait for you.</span>
        </h2>

        {/* Sub-copy */}
        <p className="text-base sm:text-xl text-slate-400 leading-relaxed mb-10 max-w-xl mx-auto">
          Join the waitlist today. Be the first to receive your free AI birth chart reading when we launch — and help shape the future of astrology.
        </p>

        {/* Waitlist form */}
        <div className="max-w-md mx-auto">
          {submitted ? (
            <div className="py-8 px-6 rounded-2xl glass-card flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-600/30 to-purple-700/20 border border-violet-400/30 flex items-center justify-center">
                <Star className="w-8 h-8 text-amber-400 fill-amber-400" />
              </div>
              <div>
                <p
                  className="text-xl font-semibold text-white mb-1"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  You&apos;re on the list!
                </p>
                <p className="text-slate-400 text-sm">
                  The cosmos has noted your name. We&apos;ll be in touch.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Sparkles className="w-3 h-3 text-violet-400" />
                Check your inbox for confirmation
              </div>
            </div>
          ) : (
            <>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3"
                aria-label="Bottom waitlist signup"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/70 focus:ring-1 focus:ring-violet-500/30 transition-all duration-200"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-xl shadow-purple-900/40 hover:shadow-purple-700/50 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed glow-nebula whitespace-nowrap"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Claim Your Spot
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Micro-trust signals */}
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-4 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-green-500" />
                  Free forever plan
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-green-500" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-green-500" />
                  Unsubscribe anytime
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top/bottom fades */}
      <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#03010d] to-transparent pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#03010d] to-transparent pointer-events-none" />
    </section>
  );
}
