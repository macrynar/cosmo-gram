// pSEO pilot „Księżyc w znaku": dane (treść autorska, głos Astrei).
// Tytuł strony budować jako `Księżyc w ${SIGN_LOCATIVE[sign]}` (src/lib/i18n/astro.ts).
// Pilot: 3 znaki (wzorzec baru). Pozostałe 9 dochodzą po akceptacji, ten sam kontrakt.
// Reguły treści: forma neutralna 2 os., bez myślników, bez przepowiedni zdarzeń,
// symboliczne lustro (nie wyrocznia). Każdy znak musi mieć realnie unikalną treść.

export type MoonSign = {
  slug: string;
  sign: string;
  element: "Ogień" | "Ziemia" | "Powietrze" | "Woda";
  excerpt: string;
  lead: string;
  feeling: string;
  needs: string;
  love: string;
  shadow: string;
  faq: { q: string; a: string }[];
};

export const MOON_SIGNS: MoonSign[] = [
  {
    slug: "skorpion",
    sign: "Skorpion",
    element: "Woda",
    excerpt:
      "Księżyc w Skorpionie: emocje głębokie, intensywne i bez półśrodków. Czego potrzebujesz, żeby czuć się bezpiecznie, jak kochasz i co kryje cień tego położenia.",
    lead:
      "Księżyc w Skorpionie to emocje przeżywane na pełnej głębokości, rzadko pokazywane na zewnątrz. Czujesz mocno i nie umiesz na pół gwizdka. Pod spokojną powierzchnią toczy się znacznie więcej, niż widać. Potrzebujesz prawdy i bliskości bez maski, a powierzchowność męczy Cię szybciej niż samotność.",
    feeling:
      "Emocje docierają do Ciebie z dużą siłą, nawet jeśli twarz pozostaje spokojna. Wyczuwasz to, co niedopowiedziane, i rzadko dajesz się zwieść pozorom. Nie przeżywasz uczuć przelotnie. To, co Cię poruszy, zostaje w Tobie długo, czasem dłużej, niż chcesz.",
    needs:
      "Żeby czuć się bezpiecznie, musisz komuś naprawdę zaufać, a zaufanie budujesz powoli i sprawdzasz w praniu. Potrzebujesz szczerości, głębi i poczucia, że możesz pokazać się w całości, także w tych częściach, które zwykle ukrywasz. Płytkie relacje i wymuszona otwartość działają na Ciebie odwrotnie do zamierzenia.",
    love:
      "Kochasz lojalnie i całym sobą, ale nie od razu. Najpierw obserwujesz, czy druga osoba jest bezpieczna. Kiedy już się zwiążesz, wchodzisz głęboko i oczekujesz tej samej szczerości w zamian. Bliskość bez prawdy nie wystarcza Ci na długo.",
    shadow:
      "Twoja głębia ma drugą stronę: potrzebę kontroli, zazdrość i milczenie jako tarczę, kiedy ktoś Cię zrani. Zamiast powiedzieć wprost, potrafisz się zamknąć i karać wycofaniem. Najwięcej zyskujesz, gdy intensywność zamieniasz w szczerą rozmowę, zanim urośnie w mur.",
    faq: [
      {
        q: "Czy Księżyc w Skorpionie jest trudny?",
        a: "Nie trudny, raczej intensywny. Daje głębię uczuć i lojalność, ale wymaga zaufania i bezpieczeństwa, żeby się otworzyć. Łatwiej z nim, gdy masz wokół ludzi, przy których nie musisz nosić maski.",
      },
      {
        q: "Jak okazywać bliskość komuś z Księżycem w Skorpionie?",
        a: "Szczerze i konsekwentnie. Ta osoba wyczuwa fałsz, a buduje zaufanie powoli. Stałość i prawda znaczą dla niej więcej niż wielkie gesty.",
      },
    ],
  },
  {
    slug: "baran",
    sign: "Baran",
    element: "Ogień",
    excerpt:
      "Księżyc w Baranie: emocje szybkie, gorące i szczere. Jak czujesz, czego potrzebujesz, by być sobą, jak kochasz i co kryje cień tego położenia.",
    lead:
      "Księżyc w Baranie to emocje szybkie i gorące, które przychodzą jak błyskawica i równie szybko gasną. Reagujesz od razu, często zanim zdążysz pomyśleć. Potrzebujesz działania i szczerości, bo duszenie uczuć w sobie męczy Cię bardziej niż otwarta różnica zdań. Wybuchasz, ale rzadko chowasz urazę.",
    feeling:
      "Czujesz natychmiast i wprost. Kiedy coś Cię poruszy, wiesz to w tej samej sekundzie i trudno Ci to ukryć. Nie umiesz długo tłumić, a stłumione napięcie i tak znajdzie ujście. Plusem jest to, że Twoje emocje są czytelne i szczere, bez podwójnego dna.",
    needs:
      "Potrzebujesz przestrzeni do reagowania i poczucia, że możesz działać, a nie tylko czekać. Bezpieczeństwo daje Ci szczerość postawiona na stole, nawet jeśli oznacza krótką iskrę. Najgorzej znosisz niedopowiedzenia, zwlekanie i emocjonalne gierki.",
    love:
      "Kochasz odważnie i bezpośrednio. Lubisz inicjować, zdobywać i wiedzieć, na czym stoisz. Nuży Cię letniość i zbyt długie analizy. Najlepiej działa na Ciebie partner, który mówi wprost i czasem rzuci Ci zdrowe wyzwanie.",
    shadow:
      "Twoja żywiołowość bywa niecierpliwa i skupiona na sobie. Potrafisz wybuchnąć, zanim pomyślisz, albo ruszyć dalej, zanim druga osoba nadąży z własnym uczuciem. Najwięcej zyskujesz, gdy między impulsem a reakcją zostawiasz sobie jeden oddech.",
    faq: [
      {
        q: "Czy Księżyc w Baranie jest porywczy?",
        a: "Bywa. Daje szybkie, gorące reakcje, które jednak równie szybko mijają. Uraza rzadko zostaje. Z czasem łatwiej z tym położeniem, gdy nauczysz się robić krótką pauzę przed reakcją.",
      },
      {
        q: "Czego potrzebuje ktoś z Księżycem w Baranie?",
        a: "Szczerości i przestrzeni do działania. Ta osoba woli otwarty spór niż chłodne milczenie i źle znosi emocjonalne gierki.",
      },
    ],
  },
  {
    slug: "bliznieta",
    sign: "Bliźnięta",
    element: "Powietrze",
    excerpt:
      "Księżyc w Bliźniętach: emocje przeżywane przez słowa i myśli. Jak czujesz, czego potrzebujesz, jak kochasz i co kryje cień tego położenia.",
    lead:
      "Księżyc w Bliźniętach przeżywa emocje przez słowa i myśli. Żeby coś naprawdę poczuć, najpierw musisz to nazwać, opowiedzieć, obrócić w głowie. Potrzebujesz rozmowy, ruchu i nowych bodźców, bo cisza i monotonia szybko Cię uwierają. Czasem tłumaczysz uczucia, zamiast po prostu w nich być.",
    feeling:
      "Twoje emocje są ruchliwe i ciekawe świata. Potrafisz czuć kilka rzeczy naraz i szybko przeskakiwać między nastrojami. Rozmowa jest Twoim sposobem na przetwarzanie tego, co w środku. Kiedy o czymś opowiesz, zwykle robi Ci się lżej.",
    needs:
      "Potrzebujesz kontaktu, wymiany zdań i poczucia, że dzieje się coś nowego. Bezpieczeństwo daje Ci ktoś, z kim można rozmawiać o wszystkim, bez oceniania. Źle znosisz nudę, milczenie w relacji i sytuacje, w których nie wolno zadać pytania.",
    love:
      "Kochasz lekko, ciekawie i przez słowa. Lubisz partnera, który Cię rozśmieszy i z którym nigdy nie kończą się tematy. Bliskość budujesz w rozmowie, a nie w wielkich deklaracjach. Ważne, żeby ta lekkość nie stała się ucieczką od głębszych uczuć.",
    shadow:
      "Twoja zwinność umysłu bywa też ucieczką. Zamiast poczuć trudną emocję, potrafisz ją zracjonalizować albo zagadać. Niepokój i rozproszenie biorą się czasem z unikania tego, co naprawdę pod spodem. Najwięcej zyskujesz, gdy pozwalasz sobie poczuć, zanim zaczniesz tłumaczyć.",
    faq: [
      {
        q: "Czy Księżyc w Bliźniętach jest niestały emocjonalnie?",
        a: "Raczej ruchliwy niż niestały. Szybko zmienia nastroje i przetwarza uczucia przez rozmowę. Daje lekkość i ciekawość, a większą równowagę zyskuje, gdy uczy się zatrzymać przy jednym uczuciu dłużej.",
      },
      {
        q: "Jak zbliżyć się do kogoś z Księżycem w Bliźniętach?",
        a: "Rozmową. Ta osoba otwiera się przez słowa i ceni partnera, z którym nie kończą się tematy. Cisza i brak wymiany zdań oddalają ją najszybciej.",
      },
    ],
  },
];

export function getAllMoonSigns(): MoonSign[] {
  return MOON_SIGNS;
}

export function getMoonSign(slug: string): MoonSign | null {
  return MOON_SIGNS.find((m) => m.slug === slug) ?? null;
}
