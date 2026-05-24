"use client";

import Navbar from "@/components/Navbar";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function HoroscopePage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <Link href={ROUTES.app.today.path}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-white text-sm transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Wróć
        </Link>
        <h1 className="text-3xl font-bold text-white font-brand mb-3">Horoskop</h1>
        <p className="text-slate-500">Spersonalizowany horoskop dzienny i tranzyty tygodnia — wkrótce.</p>
      </main>
    </div>
  );
}
