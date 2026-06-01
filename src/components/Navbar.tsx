"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Settings, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import { ROUTES, BRAND } from "@/lib/routes";

const PUBLIC_NAV = [
  { label: ROUTES.public.cosmogram.label,      href: ROUTES.public.cosmogram.path },
  { label: ROUTES.public.dailyHoroscope.label, href: ROUTES.public.dailyHoroscope.path },
  { label: BRAND.match,                        href: ROUTES.public.match.path },
  { label: ROUTES.public.blog.label,           href: ROUTES.public.blog.path },
  { label: ROUTES.public.pricing.label,        href: ROUTES.public.pricing.path },
];

const APP_NAV = [
  { label: ROUTES.app.cosmogram.navLabel ?? ROUTES.app.cosmogram.label, href: ROUTES.app.cosmogram.path },
  { label: ROUTES.app.calendar.label,                                    href: ROUTES.app.calendar.path },
  { label: ROUTES.app.map.label,                                        href: ROUTES.app.map.path },
  { label: BRAND.match,                                                  href: ROUTES.app.match.path },
  { label: BRAND.chat,                                                   href: ROUTES.app.chat.path },
];

function getInitials(email?: string | null) {
  if (!email) return "?";
  return email.split("@")[0].slice(0, 2).toUpperCase();
}

function getAvatarColor(email?: string | null) {
  const colors = [
    "from-amber-600 to-amber-800",
    "from-amber-700 to-yellow-800",
    "from-yellow-600 to-amber-700",
    "from-amber-500 to-amber-700",
  ];
  if (!email) return colors[0];
  return colors[email.charCodeAt(0) % colors.length];
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isApp = pathname.startsWith("/app");
  const navLinks = isApp ? APP_NAV : PUBLIC_NAV;
  const logoHref = user ? ROUTES.app.today.path : ROUTES.public.home.path;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? "bg-[#050311]/92 backdrop-blur-xl border-b border-amber-800/25 shadow-lg shadow-black/35"
          : "bg-transparent"
      }`}
    >
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
              className="h-[46px] w-auto transition-opacity duration-200 group-hover:opacity-85 [filter:brightness(0)_invert(1)]"
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 rounded-full text-sm font-medium tracking-wide transition-all duration-200 ${
                  isActive(link.href)
                    ? "text-amber-100 bg-amber-900/25 border border-amber-700/30"
                    : "text-slate-400 hover:text-amber-100 hover:bg-amber-900/10"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {!loading && (
              user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(v => !v)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-amber-900/10 transition-colors group"
                    aria-label="Menu konta"
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(user.email)} flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-amber-900/40`}>
                      {getInitials(user.email)}
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-amber-100 transition-colors max-w-[100px] truncate">
                      {user.email?.split("@")[0]}
                    </span>
                    <svg className={`w-3 h-3 text-amber-500/70 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-amber-900/30 bg-[#0b0719]/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-amber-900/20">
                        <p className="text-xs text-slate-500">Zalogowany jako</p>
                        <p className="text-sm text-slate-300 truncate mt-0.5">{user.email}</p>
                      </div>
                      <div className="p-1.5">
                        <Link
                          href={ROUTES.app.settings.path}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-amber-100 hover:bg-amber-900/15 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-amber-500/70" />
                          {ROUTES.app.settings.label}
                        </Link>
                        <button
                          onClick={() => { signOut(); setDropdownOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:text-red-400 hover:bg-red-900/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4 text-slate-500" />
                          Wyloguj
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href={ROUTES.public.login.path}
                    className="px-4 py-2 rounded-full text-sm font-medium text-slate-400 hover:text-amber-100 hover:bg-amber-900/10 transition-all duration-200"
                  >
                    {ROUTES.public.login.cta}
                  </Link>
                  <Link
                    href={ROUTES.public.signup.path}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-amber-900/20 border border-amber-700/40 text-amber-200 hover:bg-amber-800/25 hover:border-amber-600/60 hover:text-white transition-all duration-200"
                  >
                    {ROUTES.public.signup.cta}
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Mobile: avatar + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            {!loading && user && (
              <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(user.email)} flex items-center justify-center text-xs font-bold text-white`}>
                {getInitials(user.email)}
              </div>
            )}
            <button
              className="p-2 text-slate-400 hover:text-amber-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-amber-900/20 mt-1 pt-3">
            <div className="space-y-0.5 mb-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm tracking-wide transition-colors ${
                    isActive(link.href)
                      ? "text-amber-100 bg-amber-900/25 font-medium border border-amber-700/25"
                      : "text-slate-300 hover:text-amber-100 hover:bg-amber-900/10"
                  }`}
                >
                  {isActive(link.href) && <span className="w-1 h-1 rounded-full bg-amber-400 shrink-0" />}
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-amber-900/20 pt-3 space-y-0.5">
              {!loading && user ? (
                <>
                  <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(user.email)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                      {getInitials(user.email)}
                    </div>
                    <span className="text-xs text-slate-500 truncate">{user.email}</span>
                  </div>
                  <Link
                    href={ROUTES.app.settings.path}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-amber-100 hover:bg-amber-900/10 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-amber-500/70" />
                    {ROUTES.app.settings.label}
                  </Link>
                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:text-red-400 hover:bg-red-900/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-slate-500" />
                    Wyloguj
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-3">
                  <Link
                    href={ROUTES.public.login.path}
                    className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm text-slate-300 hover:text-amber-100 hover:bg-amber-900/10 border border-white/10 transition-colors"
                  >
                    {ROUTES.public.login.cta}
                  </Link>
                  <Link
                    href={ROUTES.public.signup.path}
                    className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-900/20 border border-amber-700/40 text-amber-200"
                  >
                    {ROUTES.public.signup.cta}
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
