import { Sparkles } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  const links = [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Join Waitlist", href: "#waitlist" },
  ];

  const legal = [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ];

  return (
    <footer className="relative border-t border-purple-900/20 bg-[#03010d]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">

          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <a href="#" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span
                className="text-base font-semibold text-white"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Cosmo<span className="text-violet-400">-gram</span>
              </span>
            </a>
            <p className="text-xs text-slate-600 max-w-[220px] text-center md:text-left leading-relaxed">
              The next generation of astrology. Precise, personal, and powered by AI.
            </p>
          </div>

          {/* Nav links */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-700 font-medium mb-1">
              Navigate
            </p>
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Legal links */}
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-700 font-medium mb-1">
              Legal
            </p>
            {legal.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="my-8 h-px bg-gradient-to-r from-transparent via-purple-900/30 to-transparent" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700">
          <p>© {year} Cosmo-gram. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made with{" "}
            <span className="text-violet-600">✦</span>{" "}
            for seekers of cosmic truth.
          </p>
        </div>
      </div>
    </footer>
  );
}
