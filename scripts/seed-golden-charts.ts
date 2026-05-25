/**
 * Seeds 50 known charts into golden_test_charts for regression testing.
 * Run: npx ts-node --project tsconfig.scripts.json scripts/seed-golden-charts.ts
 *
 * Birth data from Astro-Databank (Rodden Rating A or AA where available).
 * Time rounded to nearest 15 min for non-AA records.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GOLDEN_CHARTS = [
  // ── World icons (20) ──────────────────────────────────────────────────────
  {
    name: "Albert Einstein",
    description: "Fizyk, laureat Nobla",
    birth_data: { date: "1879-03-14", time: "11:30", lat: 48.4, lon: 10.0, tz: "Europe/Berlin" },
    expected_traits: ["analytical", "unconventional", "pacifist", "humanitarian", "genius"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Marie Curie",
    description: "Fizyczka i chemiczka, dwukrotna laureatka Nobla",
    birth_data: { date: "1867-11-07", time: "12:00", lat: 52.23, lon: 21.01, tz: "Europe/Warsaw" },
    expected_traits: ["perseverant", "scientific", "pioneering", "discreet", "dedicated"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Mahatma Gandhi",
    description: "Przywódca ruchu niepodległościowego Indii",
    birth_data: { date: "1869-10-02", time: "07:45", lat: 21.63, lon: 69.61, tz: "Asia/Kolkata" },
    expected_traits: ["spiritual", "peaceful", "determined", "self-disciplined", "idealistic"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Nelson Mandela",
    description: "Prezydent RPA, działacz praw człowieka",
    birth_data: { date: "1918-07-18", time: "14:54", lat: -31.57, lon: 28.78, tz: "Africa/Johannesburg" },
    expected_traits: ["resilient", "dignified", "justice-oriented", "forgiving", "leadership"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Nikola Tesla",
    description: "Wynalazca i inżynier elektryczny",
    birth_data: { date: "1856-07-10", time: "00:00", lat: 44.57, lon: 15.96, tz: "Europe/Belgrade" },
    expected_traits: ["visionary", "eccentric", "obsessive", "inventive", "reclusive"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Steve Jobs",
    description: "Współzałożyciel Apple",
    birth_data: { date: "1955-02-24", time: "19:15", lat: 37.77, lon: -122.42, tz: "America/Los_Angeles" },
    expected_traits: ["perfectionist", "visionary", "controlling", "charismatic", "innovative"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Madonna",
    description: "Piosenkarka, ikona pop-kultury",
    birth_data: { date: "1958-08-16", time: "07:05", lat: 42.26, lon: -83.15, tz: "America/Detroit" },
    expected_traits: ["ambitious", "provocative", "disciplined", "reinvention", "controlling"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Winston Churchill",
    description: "Premier Wielkiej Brytanii podczas II Wojny Światowej",
    birth_data: { date: "1874-11-30", time: "01:30", lat: 51.84, lon: -1.36, tz: "Europe/London" },
    expected_traits: ["determined", "rhetorical", "depressive-resilient", "strategic", "stubborn"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Carl Jung",
    description: "Psychiatra, twórca psychologii analitycznej",
    birth_data: { date: "1875-07-26", time: "19:32", lat: 47.65, lon: 8.62, tz: "Europe/Zurich" },
    expected_traits: ["introspective", "mystical", "intellectual", "shadow-aware", "depth-seeking"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Marilyn Monroe",
    description: "Aktorka, ikona kultury",
    birth_data: { date: "1926-06-01", time: "09:30", lat: 34.05, lon: -118.24, tz: "America/Los_Angeles" },
    expected_traits: ["vulnerable", "charismatic", "sensitive", "performative", "seeking-love"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Leonardo da Vinci",
    description: "Artysta i naukowiec renesansu",
    birth_data: { date: "1452-04-15", time: "22:00", lat: 43.78, lon: 10.92, tz: "Europe/Rome" },
    expected_traits: ["curious", "polymathic", "perfectionist", "observational", "unconventional"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Sigmund Freud",
    description: "Twórca psychoanalizy",
    birth_data: { date: "1856-05-06", time: "18:30", lat: 49.59, lon: 17.25, tz: "Europe/Prague" },
    expected_traits: ["analytical", "obsessive", "intellectually-driven", "sexual-focus", "authoritative"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Oprah Winfrey",
    description: "Dziennikarka, przedsiębiorczyni",
    birth_data: { date: "1954-01-29", time: "04:30", lat: 33.73, lon: -89.13, tz: "America/Chicago" },
    expected_traits: ["empathetic", "resilient", "communicative", "generous", "self-made"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Barack Obama",
    description: "44. Prezydent USA",
    birth_data: { date: "1961-08-04", time: "19:24", lat: 21.31, lon: -157.86, tz: "Pacific/Honolulu" },
    expected_traits: ["composed", "intellectual", "diplomatic", "inspirational", "private"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Pablo Picasso",
    description: "Malarz, twórca kubizmu",
    birth_data: { date: "1881-10-25", time: "23:15", lat: 36.72, lon: -4.42, tz: "Europe/Madrid" },
    expected_traits: ["creative", "prolific", "domineering", "transformative", "egocentric"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Mother Teresa",
    description: "Misjonarka, laureatka Pokojowej Nagrody Nobla",
    birth_data: { date: "1910-08-26", time: "14:25", lat: 41.99, lon: 21.43, tz: "Europe/Skopje" },
    expected_traits: ["selfless", "devoted", "compassionate", "determined", "austere"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Friedrich Nietzsche",
    description: "Filozof",
    birth_data: { date: "1844-10-15", time: "10:00", lat: 51.22, lon: 12.16, tz: "Europe/Berlin" },
    expected_traits: ["radical", "solitary", "transformative", "anti-conformist", "visionary"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Dalai Lama XIV",
    description: "Przywódca duchowy Tybetu",
    birth_data: { date: "1935-07-06", time: "04:38", lat: 31.68, lon: 83.92, tz: "Asia/Kolkata" },
    expected_traits: ["compassionate", "joyful", "disciplined", "philosophical", "grounded"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Elon Musk",
    description: "Przedsiębiorca, CEO Tesla i SpaceX",
    birth_data: { date: "1971-06-28", time: "07:30", lat: -25.75, lon: 28.19, tz: "Africa/Johannesburg" },
    expected_traits: ["driven", "risk-taking", "visionary", "volatile", "workaholic"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Princess Diana",
    description: "Księżna Walii",
    birth_data: { date: "1961-07-01", time: "19:45", lat: 52.83, lon: 0.5, tz: "Europe/London" },
    expected_traits: ["empathetic", "emotionally-intense", "public-serving", "vulnerable", "charismatic"],
    prompt_names: ["ai-natal"],
  },

  // ── Polish historical figures (15) ────────────────────────────────────────
  {
    name: "Lech Wałęsa",
    description: "Przywódca Solidarności, Prezydent RP",
    birth_data: { date: "1943-09-29", time: "03:00", lat: 53.57, lon: 18.8, tz: "Europe/Warsaw" },
    expected_traits: ["charismatic", "populist", "stubborn", "worker-identity", "faith-driven"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Jan Paweł II",
    description: "Papież, Karol Wojtyła",
    birth_data: { date: "1920-05-18", time: "17:30", lat: 49.98, lon: 19.83, tz: "Europe/Warsaw" },
    expected_traits: ["spiritual", "philosophical", "theatrical", "community-focused", "resilient"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Adam Mickiewicz",
    description: "Wieszcz narodowy, poeta",
    birth_data: { date: "1798-12-24", time: "12:00", lat: 53.6, lon: 26.03, tz: "Europe/Warsaw" },
    expected_traits: ["romantic", "nationalistic", "idealistic", "mystical", "passionate"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Fryderyk Chopin",
    description: "Kompozytor i pianista",
    birth_data: { date: "1810-03-01", time: "18:00", lat: 52.14, lon: 20.44, tz: "Europe/Warsaw" },
    expected_traits: ["sensitive", "melancholic", "perfectionist", "creative", "homesick"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Mikołaj Kopernik",
    description: "Astronom, twórca heliocentryzmu",
    birth_data: { date: "1473-02-19", time: "17:00", lat: 53.01, lon: 18.6, tz: "Europe/Warsaw" },
    expected_traits: ["revolutionary", "patient", "methodical", "independent-thinking", "cautious"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Wisława Szymborska",
    description: "Poetka, laureatka Nagrody Nobla",
    birth_data: { date: "1923-07-02", time: "00:00", lat: 52.14, lon: 17.0, tz: "Europe/Warsaw" },
    expected_traits: ["ironic", "philosophical", "observational", "humble", "intellectual"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Józef Piłsudski",
    description: "Marszałek, twórca II RP",
    birth_data: { date: "1867-12-05", time: "12:00", lat: 54.88, lon: 25.27, tz: "Europe/Warsaw" },
    expected_traits: ["authoritative", "strategic", "patriotic", "uncompromising", "visionary"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Stanisław Lem",
    description: "Pisarz science-fiction",
    birth_data: { date: "1921-09-12", time: "15:00", lat: 49.84, lon: 24.03, tz: "Europe/Warsaw" },
    expected_traits: ["intellectual", "skeptical", "futuristic", "satirical", "solitary"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Tadeusz Kościuszko",
    description: "Bohater narodowy, generał",
    birth_data: { date: "1746-02-04", time: "12:00", lat: 52.68, lon: 25.34, tz: "Europe/Warsaw" },
    expected_traits: ["courageous", "idealistic", "freedom-loving", "self-sacrificing", "strategic"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Helena Modrzejewska",
    description: "Aktorka, gwiazda teatru",
    birth_data: { date: "1840-10-12", time: "12:00", lat: 50.06, lon: 19.94, tz: "Europe/Warsaw" },
    expected_traits: ["dramatic", "ambitious", "resilient", "artistic", "socially-aware"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Władysław Reymont",
    description: "Pisarz, laureat Nagrody Nobla",
    birth_data: { date: "1867-05-07", time: "12:00", lat: 51.68, lon: 20.09, tz: "Europe/Warsaw" },
    expected_traits: ["observational", "earthy", "stoic", "rural-grounded", "epic-minded"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Henryk Sienkiewicz",
    description: "Pisarz, laureat Nagrody Nobla",
    birth_data: { date: "1846-05-05", time: "12:00", lat: 51.39, lon: 22.09, tz: "Europe/Warsaw" },
    expected_traits: ["nationalistic", "storytelling", "romantic", "moralistic", "prolific"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Roman Polański",
    description: "Reżyser filmowy",
    birth_data: { date: "1933-08-18", time: "11:15", lat: 48.87, lon: 2.33, tz: "Europe/Paris" },
    expected_traits: ["artistic", "survivor", "controversial", "precise", "dark-themes"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Andrzej Wajda",
    description: "Reżyser filmowy",
    birth_data: { date: "1926-03-06", time: "05:00", lat: 53.78, lon: 20.48, tz: "Europe/Warsaw" },
    expected_traits: ["historical-consciousness", "artistic", "socially-engaged", "melancholic", "legacy-focused"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Olga Tokarczuk",
    description: "Pisarka, laureatka Nagrody Nobla",
    birth_data: { date: "1962-01-29", time: "18:00", lat: 51.62, lon: 15.14, tz: "Europe/Warsaw" },
    expected_traits: ["philosophical", "empathetic", "feminist", "nature-connected", "boundary-dissolving"],
    prompt_names: ["ai-natal"],
  },

  // ── Contemporary celebrities (10) ─────────────────────────────────────────
  {
    name: "Taylor Swift",
    description: "Piosenkarka, autorka tekstów",
    birth_data: { date: "1989-12-13", time: "05:17", lat: 39.95, lon: -75.17, tz: "America/New_York" },
    expected_traits: ["storytelling", "strategic", "emotionally-expressive", "resilient", "perfectionist"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Billie Eilish",
    description: "Piosenkarka, autorka tekstów",
    birth_data: { date: "2001-12-18", time: "11:30", lat: 34.05, lon: -118.24, tz: "America/Los_Angeles" },
    expected_traits: ["unconventional", "anxious", "authentic", "dark-aesthetic", "vulnerable"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Cristiano Ronaldo",
    description: "Piłkarz",
    birth_data: { date: "1985-02-05", time: "05:25", lat: 32.65, lon: -16.91, tz: "Atlantic/Madeira" },
    expected_traits: ["driven", "narcissistic", "disciplined", "competitive", "family-oriented"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Angelina Jolie",
    description: "Aktorka, aktywistka humanitarna",
    birth_data: { date: "1975-06-04", time: "09:09", lat: 34.05, lon: -118.24, tz: "America/Los_Angeles" },
    expected_traits: ["intense", "humanitarian", "maternal", "rebellious", "transformative"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Keanu Reeves",
    description: "Aktor",
    birth_data: { date: "1964-09-02", time: "09:00", lat: 1.29, lon: 103.85, tz: "Asia/Singapore" },
    expected_traits: ["grounded", "stoic", "compassionate", "private", "resilient"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Rihanna",
    description: "Piosenkarka, przedsiębiorczyni",
    birth_data: { date: "1988-02-20", time: "08:50", lat: 13.1, lon: -59.62, tz: "America/Barbados" },
    expected_traits: ["bold", "sensual", "independent", "resilient", "entrepreneurial"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Kanye West",
    description: "Raper, producent muzyczny",
    birth_data: { date: "1977-06-08", time: "08:45", lat: 41.85, lon: -87.65, tz: "America/Chicago" },
    expected_traits: ["grandiose", "creative", "volatile", "visionary", "polarizing"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Beyoncé",
    description: "Piosenkarka, przedsiębiorczyni",
    birth_data: { date: "1981-09-04", time: "10:00", lat: 29.76, lon: -95.37, tz: "America/Chicago" },
    expected_traits: ["perfectionist", "powerful", "disciplined", "private", "ambitious"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Adele",
    description: "Piosenkarka",
    birth_data: { date: "1988-05-05", time: "08:19", lat: 51.5, lon: -0.12, tz: "Europe/London" },
    expected_traits: ["emotionally-honest", "earthy", "vulnerable", "humorous", "devoted"],
    prompt_names: ["ai-natal"],
  },
  {
    name: "Jeff Bezos",
    description: "Założyciel Amazon",
    birth_data: { date: "1964-01-12", time: "08:00", lat: 35.45, lon: -97.51, tz: "America/Chicago" },
    expected_traits: ["strategic", "customer-obsessed", "frugal-early", "growth-minded", "long-term"],
    prompt_names: ["ai-natal"],
  },

  // ── Edge cases (5) ────────────────────────────────────────────────────────
  {
    name: "Edge: Stellium 5 planet",
    description: "5 planet w jednym znaku — test stellium handling",
    birth_data: { date: "1962-02-05", time: "12:00", lat: 48.85, lon: 2.35, tz: "Europe/Paris" },
    expected_traits: ["concentrated-energy", "intense-focus", "one-area-dominance"],
    prompt_names: ["ai-natal"],
    notes: "Historyczny stellium w Wodniku (1962-02-05: Słońce, Merkury, Wenus, Mars, Saturn, Jowisz)",
  },
  {
    name: "Edge: Brak godziny urodzenia",
    description: "Test interpretacji bez godziny (Ascendent nieznany)",
    birth_data: { date: "1990-06-21", time: "12:00", lat: 52.23, lon: 21.01, tz: "Europe/Warsaw" },
    expected_traits: ["graceful-handling", "no-ascendant-claims"],
    prompt_names: ["ai-natal"],
    notes: "Weryfikuj że interpretacja NIE twierdzi Ascendentu i zaznacza jego brak",
  },
  {
    name: "Edge: Planeta na granicy znaku",
    description: "Księżyc 29°59' Barana — test granicy znaku",
    birth_data: { date: "1985-03-26", time: "23:45", lat: 50.06, lon: 19.94, tz: "Europe/Warsaw" },
    expected_traits: ["cusp-awareness", "two-sign-influence"],
    prompt_names: ["ai-natal"],
    notes: "Księżyc na granicy Baran/Byk — sprawdź czy model zaznacza dwa wpływy",
  },
  {
    name: "Edge: Wiele retrograde",
    description: "Urodzeni podczas Mercury + Mars + Saturn retrograde",
    birth_data: { date: "1988-09-01", time: "14:00", lat: 51.5, lon: -0.12, tz: "Europe/London" },
    expected_traits: ["internalized-energy", "revisionary"],
    prompt_names: ["ai-natal"],
    notes: "Sprawdź że model NIE używa słowa 'retrograde' w outputcie",
  },
  {
    name: "Edge: Wszystkie planety nad horyzontem",
    description: "Urodzeni gdy wszystkie planety są w domach 7-12",
    birth_data: { date: "1975-09-15", time: "06:00", lat: 40.71, lon: -74.01, tz: "America/New_York" },
    expected_traits: ["public-orientation", "external-focus", "social-awareness"],
    prompt_names: ["ai-natal"],
    notes: "Test interpretacji z ekstremalnym rozkładem planet",
  },
] as Array<{
  name: string;
  description: string;
  birth_data: object;
  expected_traits: string[];
  prompt_names: string[];
  notes?: string;
}>;

async function main() {
  console.log(`Seeding ${GOLDEN_CHARTS.length} golden charts...\n`);

  for (const chart of GOLDEN_CHARTS) {
    const { error } = await supabase.from("golden_test_charts").upsert(
      {
        name: chart.name,
        description: chart.description,
        birth_data: chart.birth_data,
        expected_traits: chart.expected_traits,
        prompt_names: chart.prompt_names,
        notes: chart.notes ?? null,
      },
      { onConflict: "name" }
    );

    if (error) {
      console.error(`✗  ${chart.name}: ${error.message}`);
    } else {
      console.log(`✓  ${chart.name}`);
    }
  }

  console.log(`\nDone. Run golden tests from /app/admin/golden.`);
}

main().catch(console.error);
