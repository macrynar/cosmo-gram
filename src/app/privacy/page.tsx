import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Polityka prywatności — Cosmogram",
  description: "Polityka prywatności serwisu Cosmogram. Dowiedz się, jak przetwarzamy Twoje dane.",
  alternates: { canonical: "https://cosmogram.pl/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <h1 className="font-brand text-3xl font-bold text-white mb-4">Polityka prywatności</h1>
        <p className="text-slate-400">Polityka prywatności zostanie opublikowana wkrótce. W przypadku pytań skontaktuj się pod adresem <a href="mailto:hello@cosmogram.pl" className="text-amber-400">hello@cosmogram.pl</a>.</p>
      </main>
      <Footer />
    </div>
  );
}
