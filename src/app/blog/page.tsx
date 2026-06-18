import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Blog — Cosmogram",
  description: "Artykuły o astrologii, kosmogramach i tym, co mówią gwiazdy. Wiedza, która pomaga rozumieć siebie głębiej.",
  alternates: { canonical: "https://www.cosmo-gram.com/blog" },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white font-brand mb-4">Blog</h1>
          <p className="text-slate-400 text-lg">Artykuły o astrologii i kosmogramach — wkrótce.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
