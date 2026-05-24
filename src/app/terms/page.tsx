import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Regulamin — Cosmogram",
  description: "Regulamin korzystania z serwisu Cosmogram.",
  alternates: { canonical: "https://cosmogram.pl/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24 prose prose-invert prose-slate max-w-none">
        <h1 className="font-brand text-white">Regulamin</h1>
        <p className="text-slate-400">Regulamin zostanie opublikowany wkrótce. W przypadku pytań skontaktuj się pod adresem <a href="mailto:hello@cosmogram.pl" className="text-amber-400">hello@cosmogram.pl</a>.</p>
      </main>
      <Footer />
    </div>
  );
}
