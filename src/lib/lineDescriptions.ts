import type { Planet, LineType } from "@/lib/astrocartography";

export type LineDescription = {
  short: string;
  full: string;
};

export const LINE_DESCRIPTIONS: Record<Planet, Record<LineType, LineDescription>> = {
  Sun: {
    MC:  { short: "Tu cię widzą i błyszczysz",          full: "Słońce na szczycie nieba. Tu cię widzą, tu twoje imię nabiera ciężaru, twarz pojawia się w odpowiednich miejscach." },
    IC:  { short: "Powrót do siebie bez maski",          full: "Słońce u korzeni. Miejsce uziemienia tożsamości — wracasz do tego kim jesteś bez warstw, jakie nakłada świat." },
    ASC: { short: "Pewność siebie, witalność rośnie",    full: "Słońce wschodzi z tobą. Emanujesz autorytetem, ludzie cię zauważają, ciało odzyskuje energię." },
    DSC: { short: "Partnerstwa, które zmieniają kurs",   full: "Słońce zachodzi w drugich. Spotykasz osoby które cię definiują — relacje tu nawiązane mają wagę życiowych zwrotów." },
  },
  Moon: {
    MC:  { short: "Emocje stają się walutą",             full: "Księżyc w blasku publicznym. Dobre miejsce dla opieki, twórczości, kontaktu z ludźmi — empatia tu pracuje na ciebie." },
    IC:  { short: "Pierwotny dom emocjonalny",           full: "Księżyc u dna nieba. Czas zwalnia, sen głębszy, sentyment wraca. Miasto które potrafi przytulić." },
    ASC: { short: "Wrażliwość i intuicja prowadzą",      full: "Księżyc wschodzi z tobą. Jesteś przezroczysty emocjonalnie — intuicja staje się ostra, ciało reaguje na nastroje miejsca." },
    DSC: { short: "Przyciągasz opiekuńcze figury",       full: "Księżyc zachodzi w innych. Trafiają się matkujące osoby, romantyczne projekcje, intensywne więzi emocjonalne." },
  },
  Mercury: {
    MC:  { short: "Twoje słowa są słyszane",             full: "Merkury na szczycie. Miejsce na publikacje, wystąpienia, intelektualną widoczność — to co napiszesz, ma szansę zaiskrzyć." },
    IC:  { short: "Cichy dom dla myśli",                 full: "Merkury u korzeni. Dobre miejsce na pisanie, naukę, wewnętrzny dialog — umysł znajduje tu rytm pracy." },
    ASC: { short: "Bystrość, szybkie kontakty",          full: "Merkury wschodzi. Jesteś werbalny, ciekawy, ludzie chcą z tobą rozmawiać — lokalne sieci same się tworzą." },
    DSC: { short: "Spotykasz mentorów i rozmówców",      full: "Merkury w partnerstwach. Trafiasz na osoby które zmieniają twój sposób myślenia — biznesowi partnerzy, intelektualne romansy." },
  },
  Venus: {
    MC:  { short: "Tu jesteś piękny dla świata",         full: "Wenus na szczycie. Miejsce dla sztuki, mody, publicznej miłości — twoja estetyka znajduje publiczność." },
    IC:  { short: "Dom pełen harmonii i komfortu",       full: "Wenus u korzeni. Codzienne życie staje się piękne — dobra kuchnia, ładne przestrzenie, ciepło wśród bliskich." },
    ASC: { short: "Promieniujesz urokiem",               full: "Wenus wschodzi. Ludzie cię lubią od pierwszego spojrzenia, ciało odzyskuje dobrostan, atrakcyjność rośnie." },
    DSC: { short: "Miłość przychodzi do ciebie",         full: "Wenus w partnerstwach. Romanse same trafiają, ktoś otwiera dla ciebie serce — niska bariera wejścia w relacje." },
  },
  Mars: {
    MC:  { short: "Walczysz publicznie i wygrywasz",     full: "Mars na szczycie. Miejsce dla przedsiębiorczości, sportu, konkurencji — agresja konwertuje się w wyniki." },
    IC:  { short: "Dużo energii, trudno zwolnić",        full: "Mars u korzeni. Może być silna pasja w sypialni, ale też konflikty rodzinne — trudniej tu po prostu odpocząć." },
    ASC: { short: "Energia, siła, adrenalina",           full: "Mars wschodzi. Miejsce dla treningu, sportu, fizycznych wyzwań — ciało chce działać, nie regenerować." },
    DSC: { short: "Spotykasz wojowników i konfrontacje", full: "Mars w partnerstwach. Spotkasz pasjonatów ale też osoby z ostrymi krawędziami — relacje intensywne, czasem walka." },
  },
  Jupiter: {
    MC:  { short: "Sukces większy niż się spodziewasz",  full: "Jowisz na szczycie. Ekspansja kariery, dobra prasa, ważne kontakty mentoringowe — okno na duży zawodowy ruch." },
    IC:  { short: "Hojny dom, optymizm w przestrzeni",   full: "Jowisz u korzeni. Miejsce gdzie chce się gości, gdzie jest oddech, gdzie wszystko wydaje się możliwe." },
    ASC: { short: "Drzwi same się otwierają",            full: "Jowisz wschodzi. Optymizm cię otwiera, szczęście podąża, ludzie odpowiadają ci dobrocią — chwilowo łatwiej niż w domu." },
    DSC: { short: "Spotykasz nauczycieli i mentorów",    full: "Jowisz w partnerstwach. Ludzie którzy poszerzają twój świat — cudzoziemcy, akademicy, mentorzy, duchowi przewodnicy." },
  },
  Saturn: {
    MC:  { short: "Mistrzostwo przez ciężką, długą pracę", full: "Saturn na szczycie. To nie awans, to budowanie — miejsce dla długoterminowej kariery, autorytetu, trwałych osiągnięć." },
    IC:  { short: "Samotnie, ale fundamentalnie głęboko",  full: "Saturn u korzeni. Możesz być samotny, ale fundament który tu zbudujesz wytrzyma dekady — miejsce dla introspekcji." },
    ASC: { short: "Poważnie odbierany, autorytet",         full: "Saturn wschodzi. Wyglądasz dojrzalej niż jesteś, ludzie traktują cię z respektem, ale ciężko o spontaniczność." },
    DSC: { short: "Starsi, poważni, wymagający partnerzy", full: "Saturn w partnerstwach. Trafiasz na trwałe ale wymagające relacje — przewaga wieku, doświadczenia, czasem chłodu." },
  },
  Uranus: {
    MC:  { short: "Niespodziewane przełomy zawodowe",    full: "Uran na szczycie. Innowacja, technologia, bycie pierwszym — kariera tu może wystrzelić nieoczekiwaną ścieżką." },
    IC:  { short: "Niespokojny dom, częste zmiany",      full: "Uran u korzeni. Częste przeprowadzki, nietypowi współlokatorzy, brak stabilności — nie dla osoby szukającej zakorzenienia." },
    ASC: { short: "Oryginalność jako magnes",            full: "Uran wschodzi. Przyciągasz uwagę przez bycie innym — outsiderzy znajdują się nawzajem." },
    DSC: { short: "Nieprzewidywalni partnerzy, wolność", full: "Uran w partnerstwach. Niezwykłe układy, ludzie spoza twojej bańki, relacje na własnych zasadach." },
  },
  Neptune: {
    MC:  { short: "Marzenia stają się karierą",          full: "Neptun na szczycie. Sztuka, film, muzyka, duchowość jako zawód — miejsce dla osób żyjących z wyobraźni." },
    IC:  { short: "Mgliste, marzycielskie schronienie",  full: "Neptun u korzeni. Dobre miejsce na sen, modlitwę, twórczość — uważaj na zatrzymanie czasu i eskapizm." },
    ASC: { short: "Stajesz się nieuchwytny i intrygujący", full: "Neptun wschodzi. Ludzie cię projektują i romantyzują — twoja tożsamość rozmywa się w obrazach które o tobie tworzą." },
    DSC: { short: "Dusze pokrewne, ale uważaj na iluzje", full: "Neptun w partnerstwach. Spotykasz osoby które wydają się magiczne — uważaj kogo idealizujesz, sprawdzaj fakty." },
  },
  Pluto: {
    MC:  { short: "Władza, ale przez transformację",     full: "Pluton na szczycie. Wpływ i siła zawodowa — ale za cenę intensywnych zmian wizerunku, czasem skandali." },
    IC:  { short: "Głęboka transformacja samego siebie", full: "Pluton u korzeni. Może być terapeutyczne, może wyrywać z fundamentów — nie jedziesz tu na lekko." },
    ASC: { short: "Intensywność, ludzie czują twoją siłę", full: "Pluton wschodzi. Jesteś magnetyczny — niektórzy się boją, inni są zauroczeni, nikt nie zostaje obojętny." },
    DSC: { short: "Spotykasz osoby które cię odmienią",  full: "Pluton w partnerstwach. Relacje głębokie, czasem niszczące, zawsze przekształcające — nic tu nie zostanie powierzchowne." },
  },
};

export function getLineDescription(planet: Planet, lineType: LineType): LineDescription {
  return LINE_DESCRIPTIONS[planet][lineType];
}
