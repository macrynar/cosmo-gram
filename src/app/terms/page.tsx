import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Regulamin — Cosmogram",
  description: "Regulamin korzystania z serwisu Cosmogram.",
  alternates: { canonical: "https://www.cosmo-gram.com/terms" },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <h1 className="font-brand text-3xl sm:text-4xl font-bold text-white mb-2">Regulamin</h1>
        <p className="text-slate-500 text-sm mb-10">serwisu cosmo-gram.com · wersja z dnia 10 czerwca 2026</p>

        <LegalSection n="1" title="Kto świadczy usługę">
          <p>Usługodawcą serwisu Cosmogram, dostępnego pod adresem www.cosmo-gram.com, jest:</p>
          <div className="mt-3 p-4 rounded-xl text-sm" style={{ background: "rgba(212,175,55,0.06)", border: "0.5px solid rgba(212,175,55,0.18)" }}>
            <p className="font-semibold text-amber-300">UXIS Maciej Rynarzewski</p>
            <p className="text-slate-400">ul. Kołłątaja 32/12, 15-774 Białystok</p>
            <p className="text-slate-400">NIP: 5423081327</p>
            <p className="text-slate-400">e-mail: <a href="mailto:hello@cosmo-gram.com" className="text-amber-400 hover:text-amber-300">hello@cosmo-gram.com</a></p>
          </div>
          <p className="mt-3">W regulaminie piszemy po prostu „Cosmogram" albo „my".</p>
        </LegalSection>

        <LegalSection n="2" title="Czym jest Cosmogram">
          <p>Cosmogram to narzędzie online łączące astrologię z technologią AI, służące do:</p>
          <ul>
            <li>poznania swojego kosmogramu urodzeniowego i jego interpretacji,</li>
            <li>refleksji nad sobą i samopoznania,</li>
            <li>śledzenia kalendarza astrologicznego i dziennego horoskopu,</li>
            <li>porównywania kosmogramów dwóch osób (Cosmo Match),</li>
            <li>rozmowy z asystentem AI o swoim kosmogramie (Cosmo Chat),</li>
            <li>tworzenia kosmogramów dzieci przez rodziców lub opiekunów.</li>
          </ul>
          <p className="mt-3">Usługa ma charakter: refleksyjny, rozwojowy, edukacyjny i rozrywkowy.</p>
        </LegalSection>

        <LegalSection n="3" title="Czym Cosmogram nie jest">
          <div className="p-4 rounded-xl mb-4" style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.20)" }}>
            <p className="text-red-300 font-semibold mb-2">Ważne — przeczytaj uważnie:</p>
            <p>Cosmogram <strong className="text-white">nie jest</strong> poradą medyczną, psychologiczną ani psychiatryczną, diagnozą ani terapią, poradą prawną, finansową ani inwestycyjną, metodą naukową ani badaniem o potwierdzonej skuteczności, przewidywaniem przyszłości o gwarantowanej trafności, ani opinią specjalisty.</p>
          </div>
          <p>Astrologia ma charakter symboliczny i interpretacyjny. Treści w Cosmogram traktuj jako symboliczne lustro — materiał do refleksji nad sobą, a nie jako fakty czy prognozy.</p>
          <p className="mt-3">Treści nie zastępują lekarza, psychologa, prawnika ani doradcy finansowego. Nie należy opierać wyłącznie na nich ważnych decyzji. Jeśli jesteś w kryzysie psychicznym albo masz poważne problemy zdrowotne, skontaktuj się z odpowiednim specjalistą lub służbami pomocowymi.</p>
        </LegalSection>

        <LegalSection n="4" title="Jak działa usługa">
          <p>W Cosmogram możesz założyć konto, podać swoje dane urodzenia (data, godzina, miejsce), otrzymać kosmogram urodzeniowy wraz z interpretacją generowaną przez AI, korzystać z karty astrologicznej, kalendarza astrologicznego i Dni Mocy, otrzymywać dzienny horoskop, porównać kosmogramy dwóch osób w Cosmo Match, rozmawiać z asystentem AI w Cosmo Chat oraz tworzyć i zapisywać kosmogramy swoich dzieci.</p>
          <p className="mt-3">Niektóre funkcje mogą być darmowe, a niektóre płatne.</p>
        </LegalSection>

        <LegalSection n="5" title="Jak należy rozumieć treści">
          <p>Kosmogramy, interpretacje, horoskopy, wyniki dopasowania i odpowiedzi AI są tworzone automatycznie na podstawie podanych danych urodzenia, zgodnie z zasadami astrologii i przy użyciu modeli AI. Mają charakter pomocniczy i interpretacyjny, mogą zawierać uproszczenia lub błędy, nie są gwarancją trafności i nie są „prawdą obiektywną" o Tobie ani o innych osobach.</p>
          <p className="mt-3">Traktuj je jako materiał do refleksji nad sobą, a nie jako pewnik.</p>
        </LegalSection>

        <LegalSection n="6" title="Konto użytkownika">
          <p>Aby korzystać z pełnej usługi, możesz potrzebować konta. Zakładając konto, podajesz prawdziwe dane, dbasz o bezpieczeństwo hasła i nie udostępniasz swojego konta innym osobom.</p>
          <p className="mt-3">Odpowiadasz za działania wykonane z użyciem Twojego konta, chyba że ktoś uzyskał do niego dostęp bez Twojej winy.</p>
        </LegalSection>

        <LegalSection n="7" title="Kto może korzystać z Cosmogram">
          <p>Z Cosmogram mogą korzystać osoby, które mają co najmniej 18 lat, chyba że w danym przypadku dopuszczamy korzystanie przez młodsze osoby zgodnie z prawem i za zgodą opiekuna.</p>
          <p className="mt-3">Funkcja kosmogramu dziecka jest przeznaczona dla rodziców i opiekunów prawnych. Podając dane urodzenia dziecka, potwierdzasz, że jesteś jego rodzicem lub opiekunem prawnym albo masz zgodę rodzica lub opiekuna.</p>
        </LegalSection>

        <LegalSection n="8" title="Dane innych osób (Cosmo Match)">
          <p>Jeżeli w Cosmo Match podajesz dane urodzenia innej osoby, potwierdzasz, że masz do tego podstawę — np. zgodę tej osoby albo że dane dotyczą Ciebie i osoby, z którą pozostajesz w relacji pozwalającej na takie porównanie.</p>
          <p className="mt-3">Nie używaj danych innych osób wbrew ich woli.</p>
        </LegalSection>

        <LegalSection n="9" title="Płatne funkcje i subskrypcja">
          <p>Niektóre funkcje Cosmogram mogą być płatne. Jeżeli kupujesz plan płatny: cena jest podana przed zakupem, widzisz, czy płatność jest jednorazowa czy cykliczna, oraz widzisz, jak anulować subskrypcję.</p>
          <p className="mt-3">Jeśli wybierasz subskrypcję, może ona odnawiać się automatycznie zgodnie z warunkami pokazanymi przy zakupie, dopóki jej nie anulujesz.</p>
        </LegalSection>

        <LegalSection n="10" title="Anulowanie subskrypcji">
          <p>Możesz anulować subskrypcję zgodnie z instrukcją dostępną w koncie lub przekazaną przy zakupie. Po anulowaniu nie pobierzemy kolejnej opłaty za następny okres. Zachowasz dostęp do końca opłaconego okresu, chyba że opis oferty mówi inaczej.</p>
        </LegalSection>

        <LegalSection n="11" title="Odstąpienie od umowy">
          <p>Jeżeli jesteś konsumentem, możesz mieć prawo odstąpić od umowy zawartej online — zgodnie z obowiązującymi przepisami.</p>
          <p className="mt-3">Jednocześnie, jeśli wyraźnie poprosisz o rozpoczęcie świadczenia usługi od razu — np. o natychmiastowe wygenerowanie treści cyfrowych, takich jak kosmogram lub interpretacja — przed upływem ustawowego terminu na odstąpienie, Twoje prawo odstąpienia może zostać ograniczone albo wygasnąć w przypadkach przewidzianych przez prawo. Przy zakupie poprosimy Cię o wyraźną zgodę na natychmiastowe rozpoczęcie świadczenia i potwierdzenie, że przyjmujesz to do wiadomości.</p>
        </LegalSection>

        <LegalSection n="12" title="Zasady korzystania">
          <p>Korzystając z Cosmogram, nie możesz: łamać prawa, podszywać się pod inne osoby, podawać danych innych osób bez podstawy lub ich zgody, próbować włamywać się do systemu, zakłócać działania usługi, w tym automatycznie generować treści ponad przewidziane limity, kopiować lub sprzedawać usługi Cosmogram bez zgody, ani używać treści Cosmogram jako oficjalnej diagnozy, ekspertyzy lub prognozy.</p>
        </LegalSection>

        <LegalSection n="13" title="Dane, które wpisujesz">
          <p>Nie wpisuj do formularzy i czatu AI danych, których nie trzeba podawać, zwłaszcza szczegółów dotyczących zdrowia, diagnoz i leczenia, danych innych osób bez ich zgody ani innych bardzo wrażliwych informacji.</p>
          <p className="mt-3">Jeżeli mimo to podasz takie dane, robisz to na własną odpowiedzialność, chyba że dana funkcja wyraźnie prosi o takie informacje.</p>
        </LegalSection>

        <LegalSection n="14" title="AI i automatyczne odpowiedzi">
          <p>W Cosmogram większość treści jest generowana automatycznie przez AI. Odpowiedzi AI nie zawsze są trafne, mogą być niepełne, mogą nie pasować do Twojej sytuacji i nie zastępują kontaktu ze specjalistą. AI ma Ci pomagać w refleksji i rozwoju, a nie podejmować decyzje za Ciebie.</p>
        </LegalSection>

        <LegalSection n="15" title="Nasza odpowiedzialność">
          <p>Dokładamy starań, żeby Cosmogram działał poprawnie. Nie odpowiadamy jednak za decyzje, które podejmiesz wyłącznie na podstawie treści lub AI, skutki użycia usługi niezgodnie z jej przeznaczeniem, błędy wynikające z nieprawidłowych danych wpisanych przez użytkownika, ani przerwy techniczne lub awarie niezależne od nas.</p>
          <p className="mt-3">Jeżeli prawo wymaga innego zakresu odpowiedzialności wobec konsumenta, stosujemy przepisy prawa.</p>
        </LegalSection>

        <LegalSection n="16" title="Reklamacje">
          <p>Jeżeli coś działa nieprawidłowo albo chcesz złożyć reklamację, napisz na: <a href="mailto:hello@cosmo-gram.com" className="text-amber-400 hover:text-amber-300">hello@cosmo-gram.com</a></p>
          <p className="mt-3">W wiadomości opisz problem, adres e-mail przypisany do konta i czego oczekujesz. Postaramy się odpowiedzieć bez zbędnej zwłoki.</p>
        </LegalSection>

        <LegalSection n="17" title="Własność intelektualna">
          <p>Wszystkie elementy Cosmogram — w tym nazwa, wygląd, teksty, grafiki, układ platformy, karta astrologiczna, interpretacje i materiały — należą do nas albo do naszych partnerów/licencjodawców.</p>
          <p className="mt-3">Możesz korzystać z nich na własny użytek w ramach usługi, w tym udostępniać swoje wyniki przez funkcje udostępniania wbudowane w serwis. Nie możesz ich kopiować, sprzedawać ani wykorzystywać komercyjnie bez zgody.</p>
        </LegalSection>

        <LegalSection n="18" title="Prywatność">
          <p>Zasady przetwarzania danych osobowych opisujemy w osobnej <a href="/privacy" className="text-amber-400 hover:text-amber-300">Polityce Prywatności</a>.</p>
        </LegalSection>

        <LegalSection n="19" title="Zmiany regulaminu">
          <p>Możemy zmienić regulamin, jeśli zmieni się prawo, zmieni się sposób działania usługi, dodamy nowe funkcje lub będzie to potrzebne z powodów bezpieczeństwa lub organizacyjnych. Aktualna wersja regulaminu będzie zawsze dostępna na stronie.</p>
        </LegalSection>

        <LegalSection n="20" title="Prawo właściwe">
          <p>Do korzystania z Cosmogram stosuje się prawo polskie, z uwzględnieniem praw konsumenta wynikających z obowiązujących przepisów.</p>
        </LegalSection>

        <LegalSection n="21" title="Kontakt">
          <p>W razie pytań napisz do nas: <a href="mailto:hello@cosmo-gram.com" className="text-amber-400 hover:text-amber-300">hello@cosmo-gram.com</a></p>
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
