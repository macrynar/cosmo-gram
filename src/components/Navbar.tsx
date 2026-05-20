"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Menu, X, LogOut, User } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import AuthModal from "@/components/AuthModal";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user, signOut, loading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Kosmogram", href: "/generate" },
    { label: "Astro Match", href: "/astro-match" },
    { label: "Dziecko", href: "/children" },
    { label: "Chat", href: "/chat" },
    { label: "Ustawienia", href: "/settings" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#07031a]/90 backdrop-blur-xl border-b border-purple-900/30 shadow-lg shadow-purple-950/20"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <a
            href="#"
            className="flex items-center gap-2 group"
            aria-label="Cosmo-gram home"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-800/50 group-hover:shadow-purple-600/60 transition-shadow duration-300">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-md group-hover:bg-purple-500/40 transition-all duration-300" />
            </div>
            <span
              className="text-lg font-semibold tracking-wide text-white"
              style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.05em" }}
            >
              Cosmo
              <span className="text-violet-400">-gram</span>
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-slate-400 hover:text-white transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-violet-400 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/generate"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-all duration-200 shadow-lg shadow-purple-900/40"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Wygeneruj Kosmogram
            </Link>
            {!loading && (
              user ? (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs text-slate-400 border border-purple-800/30 bg-purple-950/30">
                    <User className="w-3.5 h-3.5" />
                    {user.email?.split("@")[0]}
                  </span>
                  <button
                    onClick={signOut}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs text-slate-400 hover:text-white border border-purple-800/30 hover:border-purple-600/50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Wyloguj
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-violet-600/20 border border-violet-500/40 text-violet-300 hover:bg-violet-600/30 hover:border-violet-400/60 hover:text-white transition-all duration-200"
                >
                  Zaloguj się
                </button>
              )
            )}
          </div>
          {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-purple-900/30 mt-1 pt-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-2 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-purple-900/20 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 space-y-2">
              <Link
                href="/generate"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-full text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Wygeneruj Kosmogram
              </Link>
              <a
                href="#waitlist"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-full text-sm font-medium border border-violet-600/40 text-violet-300 hover:bg-violet-900/30 transition-colors"
              >
                Join Waitlist
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
