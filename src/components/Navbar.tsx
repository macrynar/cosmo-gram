"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Settings, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { ROUTES, BRAND } from "@/lib/routes";

const PUBLIC_NAV = [
  { label: ROUTES.public.cosmogram.label,   href: ROUTES.public.cosmogram.path },
  { label: ROUTES.public.calendar.label,    href: ROUTES.public.calendar.path },
  { label: BRAND.match,                     href: ROUTES.public.match.path },
  { label: BRAND.chat,                      href: ROUTES.public.chatPublic.path },
  { label: ROUTES.public.pricing.label,     href: ROUTES.public.pricing.path },
];

const APP_NAV = [
  { label: ROUTES.app.cosmogram.navLabel ?? ROUTES.app.cosmogram.label, href: ROUTES.app.cosmogram.path },
  { label: ROUTES.app.calendar.label, href: ROUTES.app.calendar.path },
  { label: BRAND.match,               href: ROUTES.app.match.path },
  { label: BRAND.chat,                href: ROUTES.app.chat.path },
];

function getInitials(email?: string | null) {
  if (!email) return "?";
  return email.split("@")[0].slice(0, 2).toUpperCase();
}

function getAvatarColor(email?: string | null): [string, string] {
  const palettes: [string, string][] = [
    ["#D4AF37", "#8B6914"],
    ["#C5A059", "#6b4c1a"],
    ["#d6b07d", "#7a5530"],
    ["#b9894c", "#5a3a10"],
  ];
  if (!email) return palettes[0];
  return palettes[email.charCodeAt(0) % palettes.length];
}

export default function Navbar() {
  const [scrolled, setScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, signOut, loading }    = useAuth();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isApp     = pathname.startsWith("/app");
  const navLinks  = isApp ? APP_NAV : PUBLIC_NAV;
  const logoHref  = user ? ROUTES.app.today.path : ROUTES.public.home.path;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  const [c1, c2] = getAvatarColor(user?.email);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || menuOpen
          ? "border-b border-[rgba(212,175,55,0.14)] shadow-[0_4px_40px_rgba(0,0,0,0.5)]"
          : ""
      }`}
      style={{
        background: scrolled || menuOpen
          ? "rgba(5,4,14,0.88)"
          : "transparent",
        backdropFilter: scrolled || menuOpen ? "blur(24px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled || menuOpen ? "blur(24px) saturate(180%)" : "none",
      }}
    >
      {/* Thin gold top line when scrolled */}
      {scrolled && (
        <div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.35), transparent)" }}
        />
      )}

      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href={logoHref} className="flex items-center gap-2 group shrink-0" aria-label="Cosmogram">
            <Image
              src="/logo-b-refined.svg"
              alt="Cosmogram"
              width={200}
              height={50}
              priority
              className="h-[44px] w-auto transition-all duration-500 group-hover:opacity-80 [filter:brightness(0)_invert(1)]"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-400 ${
                    active
                      ? "text-[#F3E5AB]"
                      : "text-slate-400 hover:text-[#F3E5AB]"
                  }`}
                  style={active ? {
                    background: "rgba(212,175,55,0.10)",
                    border: "0.5px solid rgba(212,175,55,0.28)",
                  } : {}}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-dot"
                      className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: "#D4AF37" }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && (
              user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(v => !v)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-full transition-all duration-300 hover:bg-[rgba(212,175,55,0.08)] group"
                    aria-label="Menu konta"
                  >
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#050508] shadow-[0_0_12px_rgba(212,175,55,0.35)]"
                      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                    >
                      {getInitials(user.email)}
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-[#F3E5AB] transition-colors max-w-[100px] truncate">
                      {user.email?.split("@")[0]}
                    </span>
                    <motion.svg
                      animate={{ rotate: dropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.25 }}
                      className="w-3 h-3 text-[rgba(212,175,55,0.6)]"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden"
                        style={{
                          background: "rgba(5,4,14,0.96)",
                          border: "0.5px solid rgba(212,175,55,0.22)",
                          backdropFilter: "blur(20px)",
                          boxShadow: "0 8px 40px rgba(0,0,0,0.65), 0 0 0 0.5px rgba(212,175,55,0.10) inset",
                        }}
                      >
                        <div className="px-4 py-3" style={{ borderBottom: "0.5px solid rgba(212,175,55,0.12)" }}>
                          <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-0.5">Zalogowany jako</p>
                          <p className="text-sm text-slate-300 truncate">{user.email}</p>
                        </div>
                        <div className="p-1.5">
                          <Link
                            href={ROUTES.app.settings.path}
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-[#F3E5AB] hover:bg-[rgba(212,175,55,0.08)] transition-all duration-300"
                          >
                            <Settings className="w-4 h-4" style={{ color: "rgba(212,175,55,0.6)" }} />
                            {ROUTES.app.settings.label}
                          </Link>
                          <button
                            onClick={() => { signOut(); setDropdownOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-red-400 hover:bg-red-900/10 transition-all duration-300"
                          >
                            <LogOut className="w-4 h-4 text-slate-600" />
                            Wyloguj
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href={ROUTES.public.login.path}
                    className="px-4 py-2 rounded-full text-xs font-medium text-slate-400 hover:text-[#F3E5AB] transition-colors duration-300"
                  >
                    {ROUTES.public.login.cta}
                  </Link>
                  <Link
                    href={ROUTES.public.signup.path}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all duration-400 hover:shadow-[0_0_18px_rgba(212,175,55,0.30)]"
                    style={{
                      background: "rgba(212,175,55,0.10)",
                      border: "0.5px solid rgba(212,175,55,0.40)",
                      color: "#F3E5AB",
                    }}
                  >
                    {ROUTES.public.signup.cta}
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Mobile: avatar + hamburger (hamburger hidden on /app/* — bottom nav handles navigation) */}
          <div className="md:hidden flex items-center gap-2">
            {!loading && user && isApp ? (
              // App pages: avatar taps to settings, no hamburger
              <Link
                href={ROUTES.app.settings.path}
                aria-label="Konto"
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-[#050508] shadow-[0_0_10px_rgba(212,175,55,0.3)] active:scale-95 transition-transform duration-100"
                style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
              >
                {getInitials(user.email)}
              </Link>
            ) : (
              // Public pages: avatar (display) + hamburger menu
              <>
                {!loading && user && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-[#050508] shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                  >
                    {getInitials(user.email)}
                  </div>
                )}
                <button
                  className="p-2 text-slate-400 hover:text-[#F3E5AB] transition-colors duration-300"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Toggle menu"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={menuOpen ? "close" : "open"}
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </motion.div>
                  </AnimatePresence>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden overflow-hidden"
            >
              <div className="pb-5 pt-3" style={{ borderTop: "0.5px solid rgba(212,175,55,0.12)" }}>
                <div className="space-y-0.5 mb-4">
                  {navLinks.map((link, i) => {
                    const active = isActive(link.href);
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.3 }}
                      >
                        <Link
                          href={link.href}
                          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm tracking-wide transition-all duration-300 ${
                            active
                              ? "text-[#F3E5AB] font-medium"
                              : "text-slate-300 hover:text-[#F3E5AB]"
                          }`}
                          style={active ? {
                            background: "rgba(212,175,55,0.10)",
                            border: "0.5px solid rgba(212,175,55,0.25)",
                          } : {}}
                        >
                          {active && (
                            <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "#D4AF37" }} />
                          )}
                          {link.label}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="pt-3 space-y-0.5" style={{ borderTop: "0.5px solid rgba(212,175,55,0.10)" }}>
                  {!loading && user ? (
                    <>
                      <div className="flex items-center gap-2.5 px-4 py-2 mb-1">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#050508] shrink-0"
                          style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                        >
                          {getInitials(user.email)}
                        </div>
                        <span className="text-xs text-slate-500 truncate">{user.email}</span>
                      </div>
                      <Link
                        href={ROUTES.app.settings.path}
                        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:text-[#F3E5AB] hover:bg-[rgba(212,175,55,0.08)] transition-colors"
                      >
                        <Settings className="w-4 h-4" style={{ color: "rgba(212,175,55,0.5)" }} />
                        {ROUTES.app.settings.label}
                      </Link>
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:text-red-400 hover:bg-red-900/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-slate-600" />
                        Wyloguj
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 px-3">
                      <Link
                        href={ROUTES.public.login.path}
                        className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:text-[#F3E5AB] transition-colors"
                        style={{ border: "0.5px solid rgba(212,175,55,0.15)" }}
                      >
                        {ROUTES.public.login.cta}
                      </Link>
                      <Link
                        href={ROUTES.public.signup.path}
                        className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-[#F3E5AB]"
                        style={{
                          background: "rgba(212,175,55,0.10)",
                          border: "0.5px solid rgba(212,175,55,0.35)",
                        }}
                      >
                        {ROUTES.public.signup.cta}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
