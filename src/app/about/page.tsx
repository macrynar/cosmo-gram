import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "O projekcie — Cosmogram",
  description: "Cosmogram to projekt łączący astrologię i AI. Dowiedz się, kto stoi za projektem i czym różnimy się od konkurencji.",
  alternates: { canonical: "https://cosmogram.pl/about" },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <div className="text-center mb-12">
          <p className="text-slate-500 text-xs tracking-widest uppercase mb-3">Projekt</p>
          <h1 className="text-4xl font-bold text-white font-brand mb-4">O projekcie</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Cosmogram to projekt dla osób, które chcą czegoś więcej niż codzienny horoskop ze znaku.
          </p>
        </div>
        <div className="glass-card rounded-2xl p-8 border border-amber-900/20">
          <p className="text-slate-400 leading-relaxed">Wkrótce — piszemy o sobie.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
