import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Kosmogram - czym jest i jak go interpretowac - Cosmogram",
  description: "Kosmogram natalny to mapa nieba z chwili Twoich urodzin. Odkryj, co mowi o Twoim charakterze, relacjach i potencjale - znacznie wiecej niz znak zodiaku.",
  alternates: { canonical: "https://cosmogram.pl/cosmogram" },
  openGraph: {
    title: "Kosmogram - czym jest i jak go interpretowac",
    description: "Mapa nieba z chwili Twoich urodzin - czym jest kosmogram i dlaczego jest dokladniejszy niz horoskop ze znaku.",
    url: "https://cosmogram.pl/cosmogram",
    images: [{ url: "https://cosmogram.pl/og-default.png", width: 1200, height: 630 }],
  },
};

const SECTIONS = [
  {
    heading: "Czym jest kosmogram?",
    body: "Kosmogram natalny (zwany tez mapa urodzenia lub natal chart) to zapis polozenia planet, Slonca i Ksiezyca w chwili Twoich narodzin. Inaczej niz popularny horoskop ze znaku, kosmogram uwzglednia dokladny czas i miejsce urodzenia - dlatego dwa bliznieta z roznych miast maja inne kosmogramy.",
  },
  {
    heading: "Co mozesz odczytac z kosmogramu?",
    body: "Kosmogram opisuje Twoj temperament, wzorce emocjonalne, styl relacji, talenty i obszary, w ktorych napotykasz wyzwania. To nie przepowiednia - to mapa potencjalu, z ktorym przyszedles na swiat.",
  },
  {
    heading: "Dlaczego AI robi to lepiej?",
    body: "Tradycyjna interpretacja kosmogramu zajmuje astrologowi kilka godzin. Cosmogram analizuje wszystkie planety, domy, aspekty i konfiguracje jednoczesnie, generujac spojnia, spersonalizowana interpretacje w kilkanascie sekund.",
  },
  {
    heading: "Jak wygenerowac swoj kosmogram?",
    body: "Wystarczaja data, czas i miejsce urodzenia. Im dokladniejszy czas, tym pelniejsza analiza. Jesli nie znasz godziny, generujemy uproszczony kosmogram bez systemu domow - nadal bardzo wartosciowy.",
  },
];

export default function CosmogramPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <div className="text-center mb-12">
          <p className="text-slate-500 text-xs tracking-widest uppercase mb-3">Kosmogram natalny</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white font-brand mb-4">
            Czytaj z gwiazd,<br />
            <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
              nie ze znaku
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Kosmogram natalny to Twoja osobista mapa nieba — dokladniejsza i glebsza niz popularny horoskop ze znaku zodiaku.
          </p>
          <Link
            href={ROUTES.public.signup.path}
            className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-white font-semibold hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg shadow-amber-950/40"
          >
            Wygeneruj swoj kosmogram — bezplatnie
          </Link>
        </div>

        <div className="space-y-8">
          {SECTIONS.map(s => (
            <div key={s.heading} className="glass-card rounded-2xl p-6 border border-amber-900/20">
              <h2 className="text-lg font-semibold text-amber-200 mb-2">{s.heading}</h2>
              <p className="text-slate-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href={ROUTES.public.signup.path}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-white font-semibold hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg shadow-amber-950/40"
          >
            Sprawdz swoj kosmogram teraz
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
