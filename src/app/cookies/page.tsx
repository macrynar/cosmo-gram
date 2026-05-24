import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Polityka cookies — Cosmogram",
  description: "Informacje o plikach cookies używanych przez serwis Cosmogram.",
  alternates: { canonical: "https://cosmogram.pl/cookies" },
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <h1 className="font-brand text-3xl font-bold text-white mb-4">Polityka cookies</h1>
        <p className="text-slate-400">Polityka cookies zostanie opublikowana wkrótce. W przypadku pytań skontaktuj się pod adresem <a href="mailto:hello@cosmogram.pl" className="text-amber-400">hello@cosmogram.pl</a>.</p>
      </main>
      <Footer />
    </div>
  );
}
