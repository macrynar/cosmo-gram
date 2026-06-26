import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Jak działa AI w Cosmogramie",
  description: "Transparentność: jakich modeli AI używamy, jakie są granice odpowiedzialności i jak interpretujemy dane astronomiczne.",
  alternates: { canonical: "https://www.cosmo-gram.com/how-ai-works" },
};

const SECTIONS = [
  { heading: "Jakich modeli AI używamy?", body: "Cosmogram korzysta z Claude (Anthropic) jako głównego modelu językowego do generowania interpretacji kosmogramów." },
  { heading: "Skąd dane astronomiczne?", body: "Pozycje planet liczymy z danych astronomicznych NASA (efemerydy NASA JPL). Pod spodem korzystamy ze Swiss Ephemeris, biblioteki uznawanej za standard w profesjonalnej astrologii. To te same dane, na których pracują zawodowi astrolodzy." },
  { heading: "Granice odpowiedzialności", body: "Interpretacje Cosmogram mają charakter inspiracyjny i edukacyjny. Nie zastępują porad medycznych, psychologicznych ani finansowych." },
  { heading: "Prywatność danych", body: "Dane urodzenia przechowujemy zaszyfrowane i nigdy nie udostępniamy ich stronom trzecim. Możesz usunąć konto i wszystkie dane w ustawieniach." },
];

export default function HowAiWorksPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white font-brand mb-4">Jak działa AI</h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Transparentność to dla nas priorytet. Oto jak działa Cosmogram pod maską.</p>
        </div>
        <div className="space-y-6">
          {SECTIONS.map(s => (
            <div key={s.heading} className="glass-card rounded-2xl p-6 border border-amber-900/20">
              <h2 className="text-lg font-semibold text-amber-200 mb-2">{s.heading}</h2>
              <p className="text-slate-400 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
