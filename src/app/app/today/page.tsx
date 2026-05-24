"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Star } from "lucide-react";
import { ROUTES, BRAND } from "@/lib/routes";
import { CosmoIcon } from "@/components/CosmoIcon";
import { Heart, MessageCircle, BookOpen, Calendar } from "lucide-react";

const tiles = [
  {
    label: ROUTES.app.cosmogram.navLabel,
    desc: "Twój pełny kosmogram natalny",
    href: ROUTES.app.cosmogram.path,
    icon: <CosmoIcon className="w-6 h-6" />,
    gradient: "from-amber-600/20 to-amber-900/10",
    border: "border-amber-700/30",
  },
  {
    label: "Horoskop",
    desc: "Horoskop dzienny i tranzyty tygodnia",
    href: ROUTES.app.horoscope.path,
    icon: <Calendar className="w-6 h-6 text-sky-400" />,
    gradient: "from-sky-600/20 to-sky-900/10",
    border: "border-sky-700/30",
  },
  {
    label: BRAND.match,
    desc: "Analiza kompatybilności dwóch osób",
    href: ROUTES.app.match.path,
    icon: <Heart className="w-6 h-6 text-pink-400" />,
    gradient: "from-pink-600/20 to-pink-900/10",
    border: "border-pink-700/30",
  },
  {
    label: BRAND.chat,
    desc: "Pytania do swoich kosmogramów",
    href: ROUTES.app.chat.path,
    icon: <MessageCircle className="w-6 h-6 text-violet-400" />,
    gradient: "from-violet-600/20 to-violet-900/10",
    border: "border-violet-700/30",
  },
  {
    label: ROUTES.app.library.label,
    desc: "Zapisane profile bliskich",
    href: ROUTES.app.library.path,
    icon: <BookOpen className="w-6 h-6 text-emerald-400" />,
    gradient: "from-emerald-600/20 to-emerald-900/10",
    border: "border-emerald-700/30",
  },
];

export default function TodayPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] nebula-orb opacity-20 pointer-events-none" />
      <Star className="fixed top-[20%] left-[8%] w-2 h-2 text-amber-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "3.5s" }} />
      <Star className="fixed top-[60%] right-[5%] w-2 h-2 text-amber-400/30 animate-pulse pointer-events-none" style={{ animationDuration: "4.2s" }} />

      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <div className="mb-10 text-center">
          <p className="text-slate-500 text-xs tracking-widest uppercase mb-2">Panel</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white font-brand">Dziś</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map(tile => (
            <Link key={tile.href} href={tile.href}
              className={`glass-card rounded-2xl p-5 border ${tile.border} bg-gradient-to-br ${tile.gradient} hover:scale-[1.02] transition-transform group`}>
              <div className="mb-3">{tile.icon}</div>
              <h2 className="font-semibold text-white mb-1 group-hover:text-amber-100 transition-colors">{tile.label}</h2>
              <p className="text-slate-500 text-xs">{tile.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
