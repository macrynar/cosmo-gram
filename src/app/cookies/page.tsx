import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Polityka cookies — Cosmogram",
  description: "Informacje o plikach cookies używanych przez serwis Cosmogram.",
  alternates: { canonical: "https://www.cosmo-gram.com/cookies" },
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <h1 className="font-brand text-3xl sm:text-4xl font-bold text-white mb-2">Polityka cookies</h1>
        <p className="text-slate-500 text-sm mb-10">serwisu cosmo-gram.com · wersja z dnia 10 czerwca 2026</p>

        <LegalSection n="1" title="Czym są cookies">
          <p>Cookies to małe pliki zapisywane na Twoim urządzeniu, gdy odwiedzasz stronę. Pomagają stronie działać poprawnie, zapamiętać ustawienia i mierzyć, jak użytkownicy korzystają z serwisu.</p>
        </LegalSection>

        <LegalSection n="2" title="Po co używamy cookies">
          <p>Używamy cookies, aby: strona działała prawidłowo, utrzymać sesję logowania, zapamiętać Twoje ustawienia, poprawiać wydajność i bezpieczeństwo, mierzyć ruch i rozwijać produkt oraz prowadzić działania marketingowe — jeśli korzystamy z takich narzędzi i jeśli jest na to wymagana zgoda.</p>
        </LegalSection>

        <LegalSection n="3" title="Jakie rodzaje cookies możemy stosować">
          <div className="space-y-4 mt-3">
            <CookieCategory label="a) Niezbędne" color="rgba(212,175,55,0.15)" border="rgba(212,175,55,0.30)">
              Cookies potrzebne do działania strony i podstawowych funkcji, np. logowania, bezpieczeństwa i obsługi sesji. Bez nich serwis może nie działać poprawnie.
            </CookieCategory>
            <CookieCategory label="b) Analityczne" color="rgba(88,60,140,0.12)" border="rgba(88,60,140,0.30)">
              Pomagają nam zrozumieć, ile osób korzysta ze strony, które funkcje są najczęściej używane i gdzie pojawiają się problemy. Dzięki nim możemy ulepszać Cosmogram.
            </CookieCategory>
            <CookieCategory label="c) Funkcjonalne" color="rgba(59,130,246,0.10)" border="rgba(59,130,246,0.25)">
              Pozwalają zapamiętać Twoje wybory, np. ustawienia interfejsu albo preferencje.
            </CookieCategory>
            <CookieCategory label="d) Marketingowe" color="rgba(239,68,68,0.08)" border="rgba(239,68,68,0.22)">
              Mogą być używane do mierzenia skuteczności kampanii lub dopasowania komunikacji marketingowej.
            </CookieCategory>
          </div>
        </LegalSection>

        <LegalSection n="4" title="Na które cookies potrzebna jest zgoda">
          <p>Cookies niezbędne mogą działać bez dodatkowej zgody, bo są potrzebne do działania serwisu.</p>
          <p className="mt-3">Cookies analityczne, funkcjonalne i marketingowe — jeśli nie są ściśle niezbędne — działają dopiero po Twojej zgodzie. Zgoda na cookies musi być dobrowolna, świadoma, konkretna i możliwa do wycofania tak łatwo, jak została wyrażona. Niedopuszczalne są domyślnie zaznaczone zgody.</p>
        </LegalSection>

        <LegalSection n="5" title="Jak zarządzać cookies">
          <p>Możesz: zaakceptować wszystkie cookies, odrzucić wszystkie nieobowiązkowe cookies, wybrać tylko niektóre kategorie lub później zmienić zdanie i wycofać zgodę.</p>
          <p className="mt-3">Dodatkowo możesz zarządzać cookies w ustawieniach swojej przeglądarki.</p>
        </LegalSection>

        <LegalSection n="6" title="Jak długo cookies są przechowywane">
          <p>Niektóre cookies działają tylko podczas sesji — do momentu zamknięcia przeglądarki. Inne mogą pozostać na urządzeniu przez określony czas albo do ich usunięcia.</p>
        </LegalSection>

        <LegalSection n="7" title="Czy korzystamy z narzędzi zewnętrznych">
          <p>Możemy korzystać z narzędzi dostarczanych przez podmioty trzecie, np. do analityki produktowej, płatności, uwierzytelniania i logowania, bezpieczeństwa, obsługi aplikacji oraz personalizacji.</p>
        </LegalSection>

        <LegalSection n="8" title="Cookies a dane osobowe">
          <p>Niektóre cookies mogą wiązać się z danymi osobowymi, np. adresem IP, identyfikatorem urządzenia lub identyfikatorem użytkownika. W takim przypadku stosujemy zasady opisane w <a href="/privacy" className="text-amber-400 hover:text-amber-300">Polityce Prywatności</a>.</p>
        </LegalSection>

        <LegalSection n="9" title="Zmiany polityki cookies">
          <p>Możemy aktualizować tę politykę, jeśli zmienią się technologie, zmieni się prawo, zmieni się sposób działania serwisu lub dodamy nowe narzędzia. Aktualna wersja będzie zawsze dostępna na stronie.</p>
        </LegalSection>
      </main>
      <Footer />
    </div>
  );
}

function LegalSection({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-3 flex items-baseline gap-2">
        <span className="text-xs font-normal" style={{ color: "rgba(212,175,55,0.5)" }}>§{n}</span>
        {title}
      </h2>
      <div className="text-slate-400 text-sm leading-relaxed space-y-2">
        {children}
      </div>
    </section>
  );
}

function CookieCategory({ label, color, border, children }: { label: string; color: string; border: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl text-sm" style={{ background: color, border: `0.5px solid ${border}` }}>
      <p className="font-semibold text-white mb-1">{label}</p>
      <p className="text-slate-400">{children}</p>
    </div>
  );
}
