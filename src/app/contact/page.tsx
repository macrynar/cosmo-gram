import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Kontakt — Cosmogram",
  description: "Skontaktuj się z zespołem Cosmogram. Pytania, sugestie, współpraca — jesteśmy tu.",
  alternates: { canonical: "https://www.cosmo-gram.com/contact" },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white font-brand mb-4">Kontakt</h1>
          <p className="text-slate-400">Pytania i sugestie: <a href="mailto:hello@cosmo-gram.com" className="text-amber-400 hover:text-amber-300 transition-colors">hello@cosmo-gram.com</a></p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
