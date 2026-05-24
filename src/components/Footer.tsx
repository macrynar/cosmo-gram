import Link from "next/link";
import Image from "next/image";
import { ROUTES, BRAND } from "@/lib/routes";

const COLUMNS = [
  {
    heading: "Produkt",
    links: [
      { label: ROUTES.public.cosmogram.label,      href: ROUTES.public.cosmogram.path },
      { label: ROUTES.public.dailyHoroscope.label, href: ROUTES.public.dailyHoroscope.path },
      { label: BRAND.match,                        href: ROUTES.public.match.path },
      { label: ROUTES.public.forKids.label,        href: ROUTES.public.forKids.path },
      { label: ROUTES.public.pricing.label,        href: ROUTES.public.pricing.path },
    ],
  },
  {
    heading: "Zasoby",
    links: [
      { label: ROUTES.public.blog.label,       href: ROUTES.public.blog.path },
      { label: ROUTES.public.howAiWorks.label, href: ROUTES.public.howAiWorks.path },
    ],
  },
  {
    heading: "Firma",
    links: [
      { label: ROUTES.public.about.label,   href: ROUTES.public.about.path },
      { label: ROUTES.public.contact.label, href: ROUTES.public.contact.path },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: ROUTES.public.terms.label,   href: ROUTES.public.terms.path },
      { label: ROUTES.public.privacy.label, href: ROUTES.public.privacy.path },
      { label: ROUTES.public.cookies.label, href: ROUTES.public.cookies.path },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-amber-900/20 bg-[#03010d]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          {/* Logo + tagline */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <Link href={ROUTES.public.home.path} aria-label="Cosmogram">
              <Image
                src="/logo-b-refined.svg"
                alt="Cosmogram"
                width={132}
                height={33}
                className="h-8 w-auto [filter:brightness(0)_invert(1)]"
              />
            </Link>
            <p className="text-xs text-slate-600 max-w-[200px] leading-relaxed">
              Twój kosmiczny przewodnik — astrologia i AI w jednym miejscu.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map(col => (
            <div key={col.heading} className="flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-700 font-medium mb-1">
                {col.heading}
              </p>
              {col.links.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-amber-900/30 to-transparent mb-6" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700">
          <p>© {year} Cosmogram. Dane astronomiczne: Swiss Ephemeris. AI: Anthropic Claude.</p>
          <p>Stworzone z ❤️ w Polsce.</p>
        </div>
      </div>
    </footer>
  );
}
