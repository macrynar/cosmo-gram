import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Polityka prywatności — Cosmogram",
  description: "Polityka prywatności serwisu Cosmogram. Dowiedz się, jak przetwarzamy Twoje dane.",
  alternates: { canonical: "https://www.cosmo-gram.com/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <h1 className="font-brand text-3xl sm:text-4xl font-bold text-white mb-2">Polityka prywatności</h1>
        <p className="text-slate-500 text-sm mb-10">serwisu cosmo-gram.com · wersja z dnia 13 czerwca 2026</p>

        <LegalSection n="1" title="Kto odpowiada za Twoje dane">
          <p>Administratorem Twoich danych jest operator serwisu Cosmogram (www.cosmo-gram.com):</p>
          <div className="mt-3 p-4 rounded-xl text-sm" style={{ background: "rgba(212,175,55,0.06)", border: "0.5px solid rgba(212,175,55,0.18)" }}>
            <p className="font-semibold text-amber-300">UXIS Maciej Rynarzewski</p>
            <p className="text-slate-400">ul. Kołłątaja 32/12, 15-774 Białystok</p>
            <p className="text-slate-400">NIP: 5423081327</p>
            <p className="text-slate-400">e-mail: <a href="mailto:hello@cosmo-gram.com" className="text-amber-400 hover:text-amber-300">hello@cosmo-gram.com</a></p>
          </div>
        </LegalSection>

        <LegalSection n="2" title="Po co jest ta polityka">
          <p>Ta polityka wyjaśnia: jakie dane zbieramy, po co je zbieramy, jak długo je przechowujemy, komu możemy je przekazać oraz jakie masz prawa.</p>
        </LegalSection>

        <LegalSection n="3" title="Jak działa Cosmogram">
          <p>Cosmogram to narzędzie online łączące astrologię z technologią AI. Na podstawie podanych danych urodzenia obliczamy kosmogram i pokazujemy interpretacje, kartę astrologiczną, kalendarz astrologiczny, dzienny horoskop, porównania kosmogramów (Cosmo Match) oraz odpowiedzi asystenta AI (Cosmo Chat).</p>
          <p className="mt-3 text-slate-500 text-xs">Cosmogram nie jest poradą medyczną, psychologiczną, prawną ani finansową. Treści mają charakter refleksyjny, rozwojowy, edukacyjny i rozrywkowy. Astrologia ma charakter symboliczny i interpretacyjny — wyniki nie są prognozą ani faktem.</p>
        </LegalSection>

        <LegalSection n="4" title="Jakie dane możemy zbierać">
          <ul>
            <li>dane konta, np. adres e-mail i dane logowania,</li>
            <li>dane urodzenia: datę, godzinę (jeśli ją podasz) i miejsce urodzenia oraz imię,</li>
            <li>dane urodzenia dzieci, które podajesz jako rodzic lub opiekun,</li>
            <li>dane urodzenia innej osoby, które podajesz w Cosmo Match,</li>
            <li>dane związane z płatnością i subskrypcją,</li>
            <li>wygenerowane kosmogramy, interpretacje, wyniki dopasowania i historię korzystania z usługi,</li>
            <li>treść pytań wpisywanych do czatu AI i wygenerowane odpowiedzi,</li>
            <li>notatki, które zapisujesz w kalendarzu,</li>
            <li>preferencje powiadomień i e-maili,</li>
            <li>dane techniczne, np. adres IP, typ urządzenia, przeglądarkę, logi systemowe,</li>
            <li>dane związane z cookies i podobnymi technologiami.</li>
          </ul>
        </LegalSection>

        <LegalSection n="5" title="Skąd mamy Twoje dane">
          <p>Najczęściej dostajemy je bezpośrednio od Ciebie (gdy zakładasz konto, podajesz dane urodzenia, tworzysz porównanie lub piszesz do AI), automatycznie (gdy korzystasz z serwisu) lub od operatora płatności — w zakresie potrzebnym do potwierdzenia płatności i obsługi subskrypcji.</p>
        </LegalSection>

        <LegalSection n="6" title="Dane dzieci i osób trzecich">
          <p>W Cosmogram możesz podać dane urodzenia swojego dziecka (kosmogram dziecka) albo innej osoby (Cosmo Match). W takich przypadkach dane podajesz Ty i to Ty odpowiadasz za to, że masz do tego podstawę, np. władzę rodzicielską albo zgodę tej osoby.</p>
          <p className="mt-3">Dane te wykorzystujemy wyłącznie do obliczenia kosmogramu i wygenerowania interpretacji lub porównania. Nie tworzymy kont dla tych osób ani nie kontaktujemy się z nimi. Możesz w każdej chwili usunąć te dane ze swojego konta.</p>
        </LegalSection>

        <LegalSection n="7" title="Po co przetwarzamy dane">
          <p>Przetwarzamy dane, aby: założyć i obsługiwać Twoje konto, obliczyć kosmogram i wygenerować interpretacje, pokazywać kalendarz astrologiczny i dzienny horoskop, tworzyć porównania kosmogramów i odpowiedzi czatu AI, wysyłać e-maile związane z usługą, obsługiwać płatności i subskrypcję, dbać o bezpieczeństwo serwisu, zapobiegać nadużyciom, odpowiadać na Twoje wiadomości, prowadzić statystyki i ulepszać usługę oraz wysyłać marketing — jeśli wyrazisz na to zgodę.</p>
        </LegalSection>

        <LegalSection n="8" title="Na jakiej podstawie prawnej działamy">
          <p>Przetwarzamy dane, gdy: są potrzebne do wykonania umowy (świadczenia usługi Cosmogram), są potrzebne do wypełnienia obowiązków prawnych (np. podatkowych), mamy uzasadniony interes (np. bezpieczeństwo, obrona przed roszczeniami, rozwój produktu) lub wyraziłeś zgodę (np. na niektóre cookies albo komunikację marketingową).</p>
        </LegalSection>

        <LegalSection n="9" title="Profilowanie i AI">
          <p>W Cosmogram stosujemy profilowanie — automatyczną analizę podanych danych urodzenia i Twojej aktywności w celu obliczenia kosmogramu, wygenerowania spersonalizowanych interpretacji, horoskopów i rekomendacji oraz personalizacji odpowiedzi czatu AI.</p>
          <p className="mt-3">Wynik jest interpretacją symboliczną, a nie „ostateczną prawdą" o Tobie. Profilowanie w Cosmogram służy personalizacji i pokazaniu treści — nie podejmujemy wobec Ciebie decyzji, które wywołują skutki prawne albo podobnie istotnie wpływają na Twoją sytuację.</p>
          <p className="mt-3">Do zewnętrznych modeli AI przekazujemy tylko dane potrzebne do wygenerowania treści: dane z kosmogramu (daty i miejsca urodzenia), bieżące ułożenie planet oraz treść wpisaną przez Ciebie do czatu. Treść wiadomości czatu przesyłana jest do modelu w formie niezmienionej — to natura usługi konwersacyjnej. Nie wpisuj do czatu danych, których nie chcesz udostępniać zewnętrznemu dostawcy AI.</p>
          <p className="mt-3">Treści generowane przez AI mogą być niepełne, uproszczone albo błędne. Nie zastępują specjalisty.</p>
        </LegalSection>

        <LegalSection n="10" title="Jakich danych nie chcemy">
          <p>Nie chcemy, abyś wpisywał do Cosmogram danych, które nie są potrzebne, zwłaszcza informacji o stanie zdrowia, diagnoz i leczenia, danych o innych osobach bez ich zgody ani innych bardzo wrażliwych danych. Dotyczy to szczególnie czatu AI.</p>
        </LegalSection>

        <LegalSection n="11" title="Komu możemy przekazywać dane">
          <p>Możemy przekazywać dane podmiotom pomagającym nam świadczyć usługę, np.: dostawcom hostingu i infrastruktury, dostawcom narzędzi do przechowywania danych i uwierzytelniania, operatorom płatności, dostawcom narzędzi do wysyłki e-maili, dostawcom narzędzi analitycznych, dostawcom modeli AI oraz księgowości i prawnikom. Przekazujemy tylko tyle danych, ile jest potrzebne do danego celu.</p>
        </LegalSection>

        <LegalSection n="12" title="Czy przekazujemy dane poza EOG">
          <p>Niektórzy nasi dostawcy, w tym dostawcy infrastruktury i modeli AI, mogą działać poza Europejskim Obszarem Gospodarczym. W takim przypadku stosujemy wymagane zabezpieczenia prawne, np. odpowiednie klauzule umowne, oraz ograniczamy zakres przekazywanych danych do niezbędnego minimum.</p>
        </LegalSection>

        <LegalSection n="13" title="Jak długo przechowujemy dane">
          <ul>
            <li>dane konta i zapisane kosmogramy — przez czas, kiedy masz konto,</li>
            <li><strong className="text-slate-300">historia rozmów z asystentem AI (Cosmo Chat)</strong> — przez 12 miesięcy od ostatniej wiadomości w danej rozmowie; po upływie tego czasu rozmowy są automatycznie usuwane. Możesz usunąć historię czatu w dowolnym momencie w <a href="/app/settings/privacy" className="text-amber-400 hover:text-amber-300">ustawieniach → Prywatność</a>,</li>
            <li>dane potrzebne do płatności i rozliczeń — przez okres wymagany przez przepisy,</li>
            <li>dane potrzebne do obrony przed roszczeniami — do czasu przedawnienia roszczeń,</li>
            <li>dane przetwarzane na podstawie zgody — do czasu jej wycofania lub utraty przydatności.</li>
          </ul>
        </LegalSection>

        <LegalSection n="14" title="Jakie masz prawa">
          <p>Masz prawo do: dostępu do swoich danych, poprawienia danych, usunięcia danych, ograniczenia przetwarzania, przeniesienia danych, sprzeciwu wobec przetwarzania (gdy podstawą jest nasz uzasadniony interes), cofnięcia zgody w dowolnym momencie oraz złożenia skargi do Prezesa UODO.</p>
          <p className="mt-3">Realizację praw możesz zlecić bezpośrednio w <a href="/app/settings/privacy" className="text-amber-400 hover:text-amber-300">ustawieniach konta</a> lub pisząc na <a href="mailto:hello@cosmo-gram.com" className="text-amber-400 hover:text-amber-300">hello@cosmo-gram.com</a>.</p>
        </LegalSection>

        <LegalSection n="15" title="Jak skorzystać ze swoich praw">
          <p>Napisz do nas na: <a href="mailto:hello@cosmo-gram.com" className="text-amber-400 hover:text-amber-300">hello@cosmo-gram.com</a></p>
          <p className="mt-3">Część operacji możesz wykonać samodzielnie w ustawieniach konta, np. zmienić preferencje e-mail albo usunąć zapisane kosmogramy i dane dzieci. Dla bezpieczeństwa możemy poprosić Cię o potwierdzenie tożsamości.</p>
        </LegalSection>

        <LegalSection n="16" title="Czy podanie danych jest obowiązkowe">
          <p>Podanie części danych jest dobrowolne, ale bez niektórych danych nie będziemy mogli założyć konta, obliczyć kosmogramu (potrzebujemy co najmniej daty i miejsca urodzenia), obsłużyć płatności ani odpowiedzieć na reklamację.</p>
        </LegalSection>

        <LegalSection n="17" title="Jak dbamy o bezpieczeństwo">
          <p>Stosujemy odpowiednie środki techniczne i organizacyjne, aby chronić dane przed utratą, wyciekiem, nieuprawnionym dostępem lub zniszczeniem.</p>
        </LegalSection>

        <LegalSection n="18" title="Zmiany polityki prywatności">
          <p>Możemy aktualizować tę politykę, jeśli zmieni się prawo, sposób działania usługi, zakres funkcji lub sposób przetwarzania danych. Aktualna wersja będzie zawsze dostępna na stronie.</p>
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
