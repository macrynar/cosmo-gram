export type City = {
  slug: string;
  name_pl: string;
  name_en: string;
  country_pl: string;
  country_en: string;
  lat: number;
  lon: number;
  population: number;
};

export const CITIES: City[] = [
  // === POLSKA ===
  { slug: "warszawa",      name_pl: "Warszawa",      name_en: "Warsaw",       country_pl: "Polska",      country_en: "Poland",         lat: 52.23,  lon: 21.01,  population: 1800000 },
  { slug: "krakow",        name_pl: "Kraków",         name_en: "Krakow",       country_pl: "Polska",      country_en: "Poland",         lat: 50.06,  lon: 19.94,  population: 800000  },
  { slug: "lodz",          name_pl: "Łódź",           name_en: "Lodz",         country_pl: "Polska",      country_en: "Poland",         lat: 51.77,  lon: 19.46,  population: 660000  },
  { slug: "wroclaw",       name_pl: "Wrocław",        name_en: "Wroclaw",      country_pl: "Polska",      country_en: "Poland",         lat: 51.11,  lon: 17.04,  population: 640000  },
  { slug: "poznan",        name_pl: "Poznań",         name_en: "Poznan",       country_pl: "Polska",      country_en: "Poland",         lat: 52.41,  lon: 16.93,  population: 540000  },
  { slug: "gdansk",        name_pl: "Gdańsk",         name_en: "Gdansk",       country_pl: "Polska",      country_en: "Poland",         lat: 54.35,  lon: 18.65,  population: 480000  },
  { slug: "szczecin",      name_pl: "Szczecin",       name_en: "Szczecin",     country_pl: "Polska",      country_en: "Poland",         lat: 53.43,  lon: 14.55,  population: 400000  },
  { slug: "bydgoszcz",     name_pl: "Bydgoszcz",      name_en: "Bydgoszcz",   country_pl: "Polska",      country_en: "Poland",         lat: 53.12,  lon: 18.01,  population: 350000  },
  { slug: "lublin",        name_pl: "Lublin",         name_en: "Lublin",       country_pl: "Polska",      country_en: "Poland",         lat: 51.25,  lon: 22.57,  population: 340000  },
  { slug: "katowice",      name_pl: "Katowice",       name_en: "Katowice",     country_pl: "Polska",      country_en: "Poland",         lat: 50.27,  lon: 19.02,  population: 290000  },
  { slug: "bialystok",     name_pl: "Białystok",      name_en: "Bialystok",    country_pl: "Polska",      country_en: "Poland",         lat: 53.13,  lon: 23.16,  population: 300000  },
  { slug: "gdynia",        name_pl: "Gdynia",         name_en: "Gdynia",       country_pl: "Polska",      country_en: "Poland",         lat: 54.52,  lon: 18.53,  population: 250000  },
  { slug: "czestochowa",   name_pl: "Częstochowa",    name_en: "Czestochowa",  country_pl: "Polska",      country_en: "Poland",         lat: 50.81,  lon: 19.12,  population: 220000  },
  { slug: "radom",         name_pl: "Radom",          name_en: "Radom",        country_pl: "Polska",      country_en: "Poland",         lat: 51.40,  lon: 21.15,  population: 210000  },
  { slug: "sosnowiec",     name_pl: "Sosnowiec",      name_en: "Sosnowiec",    country_pl: "Polska",      country_en: "Poland",         lat: 50.29,  lon: 19.13,  population: 195000  },
  { slug: "torun",         name_pl: "Toruń",          name_en: "Torun",        country_pl: "Polska",      country_en: "Poland",         lat: 53.01,  lon: 18.60,  population: 200000  },
  { slug: "rzeszow",       name_pl: "Rzeszów",        name_en: "Rzeszow",      country_pl: "Polska",      country_en: "Poland",         lat: 50.04,  lon: 22.00,  population: 200000  },
  { slug: "kielce",        name_pl: "Kielce",         name_en: "Kielce",       country_pl: "Polska",      country_en: "Poland",         lat: 50.87,  lon: 20.63,  population: 190000  },
  { slug: "gliwice",       name_pl: "Gliwice",        name_en: "Gliwice",      country_pl: "Polska",      country_en: "Poland",         lat: 50.29,  lon: 18.67,  population: 180000  },
  { slug: "zabrze",        name_pl: "Zabrze",         name_en: "Zabrze",       country_pl: "Polska",      country_en: "Poland",         lat: 50.33,  lon: 18.79,  population: 170000  },
  { slug: "olsztyn",       name_pl: "Olsztyn",        name_en: "Olsztyn",      country_pl: "Polska",      country_en: "Poland",         lat: 53.78,  lon: 20.49,  population: 170000  },
  { slug: "opole",         name_pl: "Opole",          name_en: "Opole",        country_pl: "Polska",      country_en: "Poland",         lat: 50.67,  lon: 17.93,  population: 130000  },
  { slug: "zielona-gora",  name_pl: "Zielona Góra",   name_en: "Zielona Gora", country_pl: "Polska",      country_en: "Poland",         lat: 51.94,  lon: 15.50,  population: 140000  },
  { slug: "gorzow",        name_pl: "Gorzów Wlkp.",   name_en: "Gorzow",       country_pl: "Polska",      country_en: "Poland",         lat: 52.73,  lon: 15.23,  population: 120000  },
  { slug: "walbrzych",     name_pl: "Wałbrzych",      name_en: "Walbrzych",    country_pl: "Polska",      country_en: "Poland",         lat: 50.77,  lon: 16.28,  population: 110000  },
  { slug: "koszalin",      name_pl: "Koszalin",       name_en: "Koszalin",     country_pl: "Polska",      country_en: "Poland",         lat: 54.19,  lon: 16.17,  population: 105000  },
  { slug: "zakopane",      name_pl: "Zakopane",       name_en: "Zakopane",     country_pl: "Polska",      country_en: "Poland",         lat: 49.30,  lon: 19.95,  population:  27000  },
  // === EUROPA ZACHODNIA ===
  { slug: "londyn",        name_pl: "Londyn",         name_en: "London",       country_pl: "Wielka Brytania", country_en: "United Kingdom", lat: 51.51, lon: -0.13, population: 8982000 },
  { slug: "berlin",        name_pl: "Berlin",         name_en: "Berlin",       country_pl: "Niemcy",      country_en: "Germany",        lat: 52.52,  lon: 13.41,  population: 3769000 },
  { slug: "paryż",         name_pl: "Paryż",          name_en: "Paris",        country_pl: "Francja",     country_en: "France",         lat: 48.85,  lon: 2.35,   population: 2161000 },
  { slug: "madryt",        name_pl: "Madryt",         name_en: "Madrid",       country_pl: "Hiszpania",   country_en: "Spain",          lat: 40.42,  lon: -3.70,  population: 3223000 },
  { slug: "barcelona",     name_pl: "Barcelona",      name_en: "Barcelona",    country_pl: "Hiszpania",   country_en: "Spain",          lat: 41.39,  lon: 2.15,   population: 1620000 },
  { slug: "rzym",          name_pl: "Rzym",           name_en: "Rome",         country_pl: "Włochy",      country_en: "Italy",          lat: 41.90,  lon: 12.49,  population: 2860000 },
  { slug: "mediolan",      name_pl: "Mediolan",       name_en: "Milan",        country_pl: "Włochy",      country_en: "Italy",          lat: 45.47,  lon: 9.19,   population: 1378000 },
  { slug: "amsterdam",     name_pl: "Amsterdam",      name_en: "Amsterdam",    country_pl: "Holandia",    country_en: "Netherlands",    lat: 52.37,  lon: 4.90,   population: 821000  },
  { slug: "bruksela",      name_pl: "Bruksela",       name_en: "Brussels",     country_pl: "Belgia",      country_en: "Belgium",        lat: 50.85,  lon: 4.35,   population: 1209000 },
  { slug: "wiedeń",        name_pl: "Wiedeń",         name_en: "Vienna",       country_pl: "Austria",     country_en: "Austria",        lat: 48.21,  lon: 16.37,  population: 1897000 },
  { slug: "zurich",        name_pl: "Zurych",         name_en: "Zurich",       country_pl: "Szwajcaria",  country_en: "Switzerland",    lat: 47.38,  lon: 8.54,   population: 415000  },
  { slug: "genewa",        name_pl: "Genewa",         name_en: "Geneva",       country_pl: "Szwajcaria",  country_en: "Switzerland",    lat: 46.20,  lon: 6.14,   population: 201000  },
  { slug: "lizbona",       name_pl: "Lizbona",        name_en: "Lisbon",       country_pl: "Portugalia",  country_en: "Portugal",       lat: 38.72,  lon: -9.14,  population: 505000  },
  { slug: "porto",         name_pl: "Porto",          name_en: "Porto",        country_pl: "Portugalia",  country_en: "Portugal",       lat: 41.16,  lon: -8.63,  population: 237000  },
  { slug: "ateny",         name_pl: "Ateny",          name_en: "Athens",       country_pl: "Grecja",      country_en: "Greece",         lat: 37.98,  lon: 23.73,  population: 664000  },
  { slug: "kopenhaga",     name_pl: "Kopenhaga",      name_en: "Copenhagen",   country_pl: "Dania",       country_en: "Denmark",        lat: 55.68,  lon: 12.57,  population: 794000  },
  { slug: "oslo",          name_pl: "Oslo",           name_en: "Oslo",         country_pl: "Norwegia",    country_en: "Norway",         lat: 59.91,  lon: 10.75,  population: 693000  },
  { slug: "sztokholm",     name_pl: "Sztokholm",      name_en: "Stockholm",    country_pl: "Szwecja",     country_en: "Sweden",         lat: 59.33,  lon: 18.07,  population: 975000  },
  { slug: "helsinki",      name_pl: "Helsinki",       name_en: "Helsinki",     country_pl: "Finlandia",   country_en: "Finland",        lat: 60.17,  lon: 24.94,  population: 655000  },
  { slug: "dublin",        name_pl: "Dublin",         name_en: "Dublin",       country_pl: "Irlandia",    country_en: "Ireland",        lat: 53.33,  lon: -6.25,  population: 553000  },
  { slug: "edinburgh",     name_pl: "Edynburg",       name_en: "Edinburgh",    country_pl: "Wielka Brytania", country_en: "United Kingdom", lat: 55.95, lon: -3.19, population: 524000 },
  { slug: "manchester",    name_pl: "Manchester",     name_en: "Manchester",   country_pl: "Wielka Brytania", country_en: "United Kingdom", lat: 53.48, lon: -2.24, population: 553000 },
  { slug: "hamburg",       name_pl: "Hamburg",        name_en: "Hamburg",      country_pl: "Niemcy",      country_en: "Germany",        lat: 53.57,  lon: 10.02,  population: 1841000 },
  { slug: "monachium",     name_pl: "Monachium",      name_en: "Munich",       country_pl: "Niemcy",      country_en: "Germany",        lat: 48.14,  lon: 11.58,  population: 1472000 },
  { slug: "frankfurt",     name_pl: "Frankfurt",      name_en: "Frankfurt",    country_pl: "Niemcy",      country_en: "Germany",        lat: 50.11,  lon: 8.68,   population: 753000  },
  { slug: "kolonia",       name_pl: "Kolonia",        name_en: "Cologne",      country_pl: "Niemcy",      country_en: "Germany",        lat: 50.94,  lon: 6.96,   population: 1084000 },
  { slug: "bukareszt",     name_pl: "Bukareszt",      name_en: "Bucharest",    country_pl: "Rumunia",     country_en: "Romania",        lat: 44.43,  lon: 26.10,  population: 2161000 },
  { slug: "sofia",         name_pl: "Sofia",          name_en: "Sofia",        country_pl: "Bułgaria",    country_en: "Bulgaria",       lat: 42.70,  lon: 23.32,  population: 1307000 },
  { slug: "belgrad",       name_pl: "Belgrad",        name_en: "Belgrade",     country_pl: "Serbia",      country_en: "Serbia",         lat: 44.80,  lon: 20.46,  population: 1688000 },
  { slug: "zagrzeb",       name_pl: "Zagrzeb",        name_en: "Zagreb",       country_pl: "Chorwacja",   country_en: "Croatia",        lat: 45.81,  lon: 15.98,  population: 800000  },
  { slug: "praga",         name_pl: "Praga",          name_en: "Prague",       country_pl: "Czechy",      country_en: "Czech Republic", lat: 50.07,  lon: 14.43,  population: 1309000 },
  { slug: "bratysława",    name_pl: "Bratysława",     name_en: "Bratislava",   country_pl: "Słowacja",    country_en: "Slovakia",       lat: 48.15,  lon: 17.11,  population: 475000  },
  { slug: "budapest",      name_pl: "Budapeszt",      name_en: "Budapest",     country_pl: "Węgry",       country_en: "Hungary",        lat: 47.50,  lon: 19.04,  population: 1752000 },
  { slug: "wilno",         name_pl: "Wilno",          name_en: "Vilnius",      country_pl: "Litwa",       country_en: "Lithuania",      lat: 54.69,  lon: 25.28,  population: 580000  },
  { slug: "ryga",          name_pl: "Ryga",           name_en: "Riga",         country_pl: "Łotwa",       country_en: "Latvia",         lat: 56.95,  lon: 24.11,  population: 614000  },
  { slug: "tallinn",       name_pl: "Tallinn",        name_en: "Tallinn",      country_pl: "Estonia",     country_en: "Estonia",        lat: 59.44,  lon: 24.75,  population: 445000  },
  { slug: "lwow",          name_pl: "Lwów",           name_en: "Lviv",         country_pl: "Ukraina",     country_en: "Ukraine",        lat: 49.84,  lon: 24.03,  population: 721000  },
  { slug: "kijow",         name_pl: "Kijów",          name_en: "Kyiv",         country_pl: "Ukraina",     country_en: "Ukraine",        lat: 50.45,  lon: 30.52,  population: 2884000 },
  { slug: "walencja",      name_pl: "Walencja",       name_en: "Valencia",     country_pl: "Hiszpania",   country_en: "Spain",          lat: 39.47,  lon: -0.38,  population: 800000  },
  { slug: "sewilla",       name_pl: "Sewilla",        name_en: "Seville",      country_pl: "Hiszpania",   country_en: "Spain",          lat: 37.39,  lon: -5.99,  population: 684000  },
  { slug: "malaga",        name_pl: "Malaga",         name_en: "Malaga",       country_pl: "Hiszpania",   country_en: "Spain",          lat: 36.72,  lon: -4.42,  population: 574000  },
  { slug: "palma",         name_pl: "Palma de Mallorca", name_en: "Palma",    country_pl: "Hiszpania",   country_en: "Spain",          lat: 39.57,  lon: 2.65,   population: 416000  },
  { slug: "neapol",        name_pl: "Neapol",         name_en: "Naples",       country_pl: "Włochy",      country_en: "Italy",          lat: 40.85,  lon: 14.27,  population: 960000  },
  { slug: "florencja",     name_pl: "Florencja",      name_en: "Florence",     country_pl: "Włochy",      country_en: "Italy",          lat: 43.77,  lon: 11.25,  population: 366000  },
  { slug: "wenecja",       name_pl: "Wenecja",        name_en: "Venice",       country_pl: "Włochy",      country_en: "Italy",          lat: 45.44,  lon: 12.33,  population: 255000  },
  { slug: "tuluza",        name_pl: "Tuluza",         name_en: "Toulouse",     country_pl: "Francja",     country_en: "France",         lat: 43.60,  lon: 1.44,   population: 479000  },
  { slug: "marsylia",      name_pl: "Marsylia",       name_en: "Marseille",    country_pl: "Francja",     country_en: "France",         lat: 43.30,  lon: 5.38,   population: 861000  },
  { slug: "nicea",         name_pl: "Nicea",          name_en: "Nice",         country_pl: "Francja",     country_en: "France",         lat: 43.71,  lon: 7.26,   population: 342000  },
  { slug: "lyon",          name_pl: "Lyon",           name_en: "Lyon",         country_pl: "Francja",     country_en: "France",         lat: 45.75,  lon: 4.83,   population: 515000  },
  // === EUROPA WSCHODNIA / AZJA ŚRODKOWA ===
  { slug: "moskwa",        name_pl: "Moskwa",         name_en: "Moscow",       country_pl: "Rosja",       country_en: "Russia",         lat: 55.75,  lon: 37.62,  population: 12500000 },
  { slug: "sankt-petersburg", name_pl: "Sankt Petersburg", name_en: "St. Petersburg", country_pl: "Rosja", country_en: "Russia",      lat: 59.95,  lon: 30.32,  population: 5383000 },
  { slug: "mińsk",         name_pl: "Mińsk",          name_en: "Minsk",        country_pl: "Białoruś",    country_en: "Belarus",        lat: 53.90,  lon: 27.57,  population: 1996000 },
  { slug: "tbilisi",       name_pl: "Tbilisi",        name_en: "Tbilisi",      country_pl: "Gruzja",      country_en: "Georgia",        lat: 41.69,  lon: 44.83,  population: 1108000 },
  { slug: "erewan",        name_pl: "Erewan",         name_en: "Yerevan",      country_pl: "Armenia",     country_en: "Armenia",        lat: 40.18,  lon: 44.51,  population: 1093000 },
  { slug: "baku",          name_pl: "Baku",           name_en: "Baku",         country_pl: "Azerbejdżan", country_en: "Azerbaijan",     lat: 40.41,  lon: 49.87,  population: 2300000 },
  // === BLISKI WSCHÓD ===
  { slug: "istanbul",      name_pl: "Stambuł",        name_en: "Istanbul",     country_pl: "Turcja",      country_en: "Turkey",         lat: 41.01,  lon: 28.95,  population: 15462000 },
  { slug: "ankara",        name_pl: "Ankara",         name_en: "Ankara",       country_pl: "Turcja",      country_en: "Turkey",         lat: 39.93,  lon: 32.86,  population: 5503000 },
  { slug: "dubaj",         name_pl: "Dubaj",          name_en: "Dubai",        country_pl: "ZEA",         country_en: "UAE",            lat: 25.20,  lon: 55.27,  population: 3267000 },
  { slug: "abu-dhabi",     name_pl: "Abu Dhabi",      name_en: "Abu Dhabi",    country_pl: "ZEA",         country_en: "UAE",            lat: 24.47,  lon: 54.37,  population: 1483000 },
  { slug: "tel-awiw",      name_pl: "Tel Awiw",       name_en: "Tel Aviv",     country_pl: "Izrael",      country_en: "Israel",         lat: 32.08,  lon: 34.78,  population: 460000  },
  { slug: "jerozolima",    name_pl: "Jerozolima",     name_en: "Jerusalem",    country_pl: "Izrael",      country_en: "Israel",         lat: 31.77,  lon: 35.22,  population: 936000  },
  { slug: "bejrut",        name_pl: "Bejrut",         name_en: "Beirut",       country_pl: "Liban",       country_en: "Lebanon",        lat: 33.89,  lon: 35.50,  population: 2200000 },
  { slug: "amman",         name_pl: "Amman",          name_en: "Amman",        country_pl: "Jordania",    country_en: "Jordan",         lat: 31.95,  lon: 35.94,  population: 4007000 },
  { slug: "rijad",         name_pl: "Rijad",          name_en: "Riyadh",       country_pl: "Arabia Saudyjska", country_en: "Saudi Arabia", lat: 24.69, lon: 46.72, population: 7676000 },
  { slug: "teheran",       name_pl: "Teheran",        name_en: "Tehran",       country_pl: "Iran",        country_en: "Iran",           lat: 35.69,  lon: 51.42,  population: 9134000 },
  { slug: "bagdad",        name_pl: "Bagdad",         name_en: "Baghdad",      country_pl: "Irak",        country_en: "Iraq",           lat: 33.34,  lon: 44.40,  population: 7711000 },
  { slug: "kair",          name_pl: "Kair",           name_en: "Cairo",        country_pl: "Egipt",       country_en: "Egypt",          lat: 30.06,  lon: 31.25,  population: 10100000 },
  // === AZJA WSCHODNIA ===
  { slug: "tokio",         name_pl: "Tokio",          name_en: "Tokyo",        country_pl: "Japonia",     country_en: "Japan",          lat: 35.69,  lon: 139.69, population: 13960000 },
  { slug: "osaka",         name_pl: "Osaka",          name_en: "Osaka",        country_pl: "Japonia",     country_en: "Japan",          lat: 34.69,  lon: 135.50, population: 2666000 },
  { slug: "kioto",         name_pl: "Kioto",          name_en: "Kyoto",        country_pl: "Japonia",     country_en: "Japan",          lat: 35.01,  lon: 135.77, population: 1464000 },
  { slug: "seul",          name_pl: "Seul",           name_en: "Seoul",        country_pl: "Korea Płd.",  country_en: "South Korea",    lat: 37.57,  lon: 126.98, population: 9776000 },
  { slug: "pekin",         name_pl: "Pekin",          name_en: "Beijing",      country_pl: "Chiny",       country_en: "China",          lat: 39.91,  lon: 116.39, population: 21542000 },
  { slug: "szanghaj",      name_pl: "Szanghaj",       name_en: "Shanghai",     country_pl: "Chiny",       country_en: "China",          lat: 31.23,  lon: 121.47, population: 26317000 },
  { slug: "kanton",        name_pl: "Kanton",         name_en: "Guangzhou",    country_pl: "Chiny",       country_en: "China",          lat: 23.13,  lon: 113.26, population: 15304000 },
  { slug: "shenzhen",      name_pl: "Shenzhen",       name_en: "Shenzhen",     country_pl: "Chiny",       country_en: "China",          lat: 22.54,  lon: 114.06, population: 12528000 },
  { slug: "hongkong",      name_pl: "Hongkong",       name_en: "Hong Kong",    country_pl: "Chiny",       country_en: "China",          lat: 22.32,  lon: 114.17, population: 7482000 },
  { slug: "taipei",        name_pl: "Tajpej",         name_en: "Taipei",       country_pl: "Tajwan",      country_en: "Taiwan",         lat: 25.04,  lon: 121.56, population: 2646000 },
  { slug: "singapur",      name_pl: "Singapur",       name_en: "Singapore",    country_pl: "Singapur",    country_en: "Singapore",      lat: 1.35,   lon: 103.82, population: 5850000 },
  { slug: "bangkok",       name_pl: "Bangkok",        name_en: "Bangkok",      country_pl: "Tajlandia",   country_en: "Thailand",       lat: 13.75,  lon: 100.52, population: 10539000 },
  { slug: "kuala-lumpur",  name_pl: "Kuala Lumpur",   name_en: "Kuala Lumpur", country_pl: "Malezja",     country_en: "Malaysia",       lat: 3.14,   lon: 101.69, population: 1809000 },
  { slug: "dżakarta",      name_pl: "Dżakarta",       name_en: "Jakarta",      country_pl: "Indonezja",   country_en: "Indonesia",      lat: -6.21,  lon: 106.85, population: 10770000 },
  { slug: "manila",        name_pl: "Manila",         name_en: "Manila",       country_pl: "Filipiny",    country_en: "Philippines",    lat: 14.60,  lon: 120.98, population: 1846000 },
  { slug: "ho-chi-minh",   name_pl: "Ho Chi Minh",    name_en: "Ho Chi Minh City", country_pl: "Wietnam", country_en: "Vietnam",       lat: 10.82,  lon: 106.63, population: 8993000 },
  { slug: "hanoi",         name_pl: "Hanoi",          name_en: "Hanoi",        country_pl: "Wietnam",     country_en: "Vietnam",        lat: 21.03,  lon: 105.85, population: 8053000 },
  // === AZJA POŁUDNIOWA ===
  { slug: "mumbaj",        name_pl: "Mumbaj",         name_en: "Mumbai",       country_pl: "Indie",       country_en: "India",          lat: 19.08,  lon: 72.88,  population: 20667000 },
  { slug: "delhi",         name_pl: "Delhi",          name_en: "Delhi",        country_pl: "Indie",       country_en: "India",          lat: 28.66,  lon: 77.22,  population: 32226000 },
  { slug: "bangalore",     name_pl: "Bangalore",      name_en: "Bangalore",    country_pl: "Indie",       country_en: "India",          lat: 12.97,  lon: 77.59,  population: 12765000 },
  { slug: "kolkata",       name_pl: "Kalkuta",        name_en: "Kolkata",      country_pl: "Indie",       country_en: "India",          lat: 22.57,  lon: 88.36,  population: 14974000 },
  { slug: "karachi",       name_pl: "Karaczi",        name_en: "Karachi",      country_pl: "Pakistan",    country_en: "Pakistan",       lat: 24.86,  lon: 67.01,  population: 16093000 },
  { slug: "lahore",        name_pl: "Lahore",         name_en: "Lahore",       country_pl: "Pakistan",    country_en: "Pakistan",       lat: 31.56,  lon: 74.35,  population: 13095000 },
  { slug: "dhaka",         name_pl: "Dhaka",          name_en: "Dhaka",        country_pl: "Bangladesz",  country_en: "Bangladesh",     lat: 23.72,  lon: 90.41,  population: 21006000 },
  { slug: "kolombo",       name_pl: "Kolombo",        name_en: "Colombo",      country_pl: "Sri Lanka",   country_en: "Sri Lanka",      lat: 6.93,   lon: 79.85,  population: 752000  },
  { slug: "katmandu",      name_pl: "Katmandu",       name_en: "Kathmandu",    country_pl: "Nepal",       country_en: "Nepal",          lat: 27.71,  lon: 85.32,  population: 1030000 },
  // === AZJA CENTRALNA ===
  { slug: "taszkent",      name_pl: "Taszkent",       name_en: "Tashkent",     country_pl: "Uzbekistan",  country_en: "Uzbekistan",     lat: 41.30,  lon: 69.24,  population: 2507000 },
  { slug: "ałmaty",        name_pl: "Ałmaty",         name_en: "Almaty",       country_pl: "Kazachstan",  country_en: "Kazakhstan",     lat: 43.26,  lon: 76.93,  population: 1977000 },
  { slug: "nur-sultan",    name_pl: "Astana",         name_en: "Astana",       country_pl: "Kazachstan",  country_en: "Kazakhstan",     lat: 51.18,  lon: 71.45,  population: 1136000 },
  // === AFRYKA ===
  { slug: "lagos",         name_pl: "Lagos",          name_en: "Lagos",        country_pl: "Nigeria",     country_en: "Nigeria",        lat: 6.46,   lon: 3.38,   population: 14862000 },
  { slug: "kinszasa",      name_pl: "Kinszasa",       name_en: "Kinshasa",     country_pl: "DR Kongo",    country_en: "DR Congo",       lat: -4.32,  lon: 15.32,  population: 14970000 },
  { slug: "johannesburg",  name_pl: "Johannesburg",   name_en: "Johannesburg", country_pl: "Afryka Płd.", country_en: "South Africa",   lat: -26.20, lon: 28.04,  population: 5783000 },
  { slug: "kapsztad",      name_pl: "Kapsztad",       name_en: "Cape Town",    country_pl: "Afryka Płd.", country_en: "South Africa",   lat: -33.93, lon: 18.42,  population: 4618000 },
  { slug: "nairobi",       name_pl: "Nairobi",        name_en: "Nairobi",      country_pl: "Kenia",       country_en: "Kenya",          lat: -1.29,  lon: 36.82,  population: 4397000 },
  { slug: "addis-abeba",   name_pl: "Addis Abeba",    name_en: "Addis Ababa",  country_pl: "Etiopia",     country_en: "Ethiopia",       lat: 9.02,   lon: 38.75,  population: 3352000 },
  { slug: "akkra",         name_pl: "Akra",           name_en: "Accra",        country_pl: "Ghana",       country_en: "Ghana",          lat: 5.56,   lon: -0.20,  population: 2514000 },
  { slug: "dakar",         name_pl: "Dakar",          name_en: "Dakar",        country_pl: "Senegal",     country_en: "Senegal",        lat: 14.71,  lon: -17.45, population: 3137000 },
  { slug: "casablanca",    name_pl: "Casablanca",     name_en: "Casablanca",   country_pl: "Maroko",      country_en: "Morocco",        lat: 33.59,  lon: -7.62,  population: 3752000 },
  { slug: "tunis",         name_pl: "Tunis",          name_en: "Tunis",        country_pl: "Tunezja",     country_en: "Tunisia",        lat: 36.82,  lon: 10.17,  population: 2291000 },
  { slug: "algier",        name_pl: "Algier",         name_en: "Algiers",      country_pl: "Algieria",    country_en: "Algeria",        lat: 36.74,  lon: 3.06,   population: 2364000 },
  { slug: "luanda",        name_pl: "Luanda",         name_en: "Luanda",       country_pl: "Angola",      country_en: "Angola",         lat: -8.84,  lon: 13.23,  population: 8330000 },
  { slug: "dar-es-salaam", name_pl: "Dar es Salaam",  name_en: "Dar es Salaam", country_pl: "Tanzania",   country_en: "Tanzania",       lat: -6.79,  lon: 39.21,  population: 6702000 },
  // === AMERYKA PÓŁNOCNA ===
  { slug: "nowy-jork",     name_pl: "Nowy Jork",      name_en: "New York",     country_pl: "USA",         country_en: "USA",            lat: 40.71,  lon: -74.01, population: 8336817 },
  { slug: "los-angeles",   name_pl: "Los Angeles",    name_en: "Los Angeles",  country_pl: "USA",         country_en: "USA",            lat: 34.05,  lon: -118.24, population: 3979576 },
  { slug: "chicago",       name_pl: "Chicago",        name_en: "Chicago",      country_pl: "USA",         country_en: "USA",            lat: 41.85,  lon: -87.65, population: 2693976 },
  { slug: "houston",       name_pl: "Houston",        name_en: "Houston",      country_pl: "USA",         country_en: "USA",            lat: 29.76,  lon: -95.37, population: 2304580 },
  { slug: "miami",         name_pl: "Miami",          name_en: "Miami",        country_pl: "USA",         country_en: "USA",            lat: 25.77,  lon: -80.19, population: 442241  },
  { slug: "san-francisco", name_pl: "San Francisco",  name_en: "San Francisco", country_pl: "USA",        country_en: "USA",            lat: 37.77,  lon: -122.42, population: 883305 },
  { slug: "seattle",       name_pl: "Seattle",        name_en: "Seattle",      country_pl: "USA",         country_en: "USA",            lat: 47.61,  lon: -122.33, population: 724745 },
  { slug: "las-vegas",     name_pl: "Las Vegas",      name_en: "Las Vegas",    country_pl: "USA",         country_en: "USA",            lat: 36.17,  lon: -115.14, population: 641903 },
  { slug: "boston",        name_pl: "Boston",         name_en: "Boston",       country_pl: "USA",         country_en: "USA",            lat: 42.36,  lon: -71.06, population: 692600  },
  { slug: "washington",    name_pl: "Waszyngton",     name_en: "Washington DC", country_pl: "USA",        country_en: "USA",            lat: 38.91,  lon: -77.04, population: 689545  },
  { slug: "atlanta",       name_pl: "Atlanta",        name_en: "Atlanta",      country_pl: "USA",         country_en: "USA",            lat: 33.75,  lon: -84.39, population: 498715  },
  { slug: "phoenix",       name_pl: "Phoenix",        name_en: "Phoenix",      country_pl: "USA",         country_en: "USA",            lat: 33.45,  lon: -112.07, population: 1608139},
  { slug: "denver",        name_pl: "Denver",         name_en: "Denver",       country_pl: "USA",         country_en: "USA",            lat: 39.74,  lon: -104.98, population: 715522 },
  { slug: "minneapolis",   name_pl: "Minneapolis",    name_en: "Minneapolis",  country_pl: "USA",         country_en: "USA",            lat: 44.98,  lon: -93.27, population: 429954  },
  { slug: "portland",      name_pl: "Portland",       name_en: "Portland",     country_pl: "USA",         country_en: "USA",            lat: 45.52,  lon: -122.68, population: 652503 },
  { slug: "toronto",       name_pl: "Toronto",        name_en: "Toronto",      country_pl: "Kanada",      country_en: "Canada",         lat: 43.70,  lon: -79.42, population: 2731571 },
  { slug: "vancouver",     name_pl: "Vancouver",      name_en: "Vancouver",    country_pl: "Kanada",      country_en: "Canada",         lat: 49.25,  lon: -123.12, population: 675218 },
  { slug: "montreal",      name_pl: "Montreal",       name_en: "Montreal",     country_pl: "Kanada",      country_en: "Canada",         lat: 45.51,  lon: -73.57, population: 1762949 },
  { slug: "calgary",       name_pl: "Calgary",        name_en: "Calgary",      country_pl: "Kanada",      country_en: "Canada",         lat: 51.05,  lon: -114.07, population: 1239220},
  { slug: "ottawa",        name_pl: "Ottawa",         name_en: "Ottawa",       country_pl: "Kanada",      country_en: "Canada",         lat: 45.42,  lon: -75.69, population: 934243  },
  { slug: "meksyk",        name_pl: "Meksyk",         name_en: "Mexico City",  country_pl: "Meksyk",      country_en: "Mexico",         lat: 19.43,  lon: -99.13, population: 9209944 },
  { slug: "guadalajara",   name_pl: "Guadalajara",    name_en: "Guadalajara",  country_pl: "Meksyk",      country_en: "Mexico",         lat: 20.66,  lon: -103.35, population: 1495189},
  { slug: "monterrey",     name_pl: "Monterrey",      name_en: "Monterrey",    country_pl: "Meksyk",      country_en: "Mexico",         lat: 25.67,  lon: -100.31, population: 1135512},
  { slug: "hawana",        name_pl: "Hawana",         name_en: "Havana",       country_pl: "Kuba",        country_en: "Cuba",           lat: 23.13,  lon: -82.38, population: 2141993 },
  // === AMERYKA POŁUDNIOWA ===
  { slug: "sao-paulo",     name_pl: "São Paulo",      name_en: "Sao Paulo",    country_pl: "Brazylia",    country_en: "Brazil",         lat: -23.55, lon: -46.63, population: 12252023 },
  { slug: "rio-de-janeiro",name_pl: "Rio de Janeiro", name_en: "Rio de Janeiro", country_pl: "Brazylia", country_en: "Brazil",         lat: -22.91, lon: -43.17, population: 6748000 },
  { slug: "brasilia",      name_pl: "Brasilia",       name_en: "Brasilia",     country_pl: "Brazylia",    country_en: "Brazil",         lat: -15.78, lon: -47.93, population: 3094325 },
  { slug: "buenos-aires",  name_pl: "Buenos Aires",   name_en: "Buenos Aires", country_pl: "Argentyna",   country_en: "Argentina",      lat: -34.60, lon: -58.38, population: 3054300 },
  { slug: "cordoba",       name_pl: "Córdoba",        name_en: "Cordoba",      country_pl: "Argentyna",   country_en: "Argentina",      lat: -31.42, lon: -64.18, population: 1317298 },
  { slug: "santiago",      name_pl: "Santiago",       name_en: "Santiago",     country_pl: "Chile",       country_en: "Chile",          lat: -33.46, lon: -70.65, population: 5614000 },
  { slug: "bogota",        name_pl: "Bogota",         name_en: "Bogota",       country_pl: "Kolumbia",    country_en: "Colombia",       lat: 4.71,   lon: -74.07, population: 7413000 },
  { slug: "lima",          name_pl: "Lima",           name_en: "Lima",         country_pl: "Peru",        country_en: "Peru",           lat: -12.05, lon: -77.04, population: 10272000 },
  { slug: "caracas",       name_pl: "Caracas",        name_en: "Caracas",      country_pl: "Wenezuela",   country_en: "Venezuela",      lat: 10.48,  lon: -66.88, population: 2896000 },
  { slug: "quito",         name_pl: "Quito",          name_en: "Quito",        country_pl: "Ekwador",     country_en: "Ecuador",        lat: -0.23,  lon: -78.52, population: 1621974 },
  { slug: "montevideo",    name_pl: "Montevideo",     name_en: "Montevideo",   country_pl: "Urugwaj",     country_en: "Uruguay",        lat: -34.90, lon: -56.19, population: 1382000 },
  { slug: "la-paz",        name_pl: "La Paz",         name_en: "La Paz",       country_pl: "Boliwia",     country_en: "Bolivia",        lat: -16.50, lon: -68.15, population: 812799  },
  // === AUSTRALIA / OCEANIA ===
  { slug: "sydney",        name_pl: "Sydney",         name_en: "Sydney",       country_pl: "Australia",   country_en: "Australia",      lat: -33.87, lon: 151.21, population: 5312000 },
  { slug: "melbourne",     name_pl: "Melbourne",      name_en: "Melbourne",    country_pl: "Australia",   country_en: "Australia",      lat: -37.81, lon: 144.96, population: 5078000 },
  { slug: "brisbane",      name_pl: "Brisbane",       name_en: "Brisbane",     country_pl: "Australia",   country_en: "Australia",      lat: -27.47, lon: 153.02, population: 2462000 },
  { slug: "perth",         name_pl: "Perth",          name_en: "Perth",        country_pl: "Australia",   country_en: "Australia",      lat: -31.95, lon: 115.86, population: 2082000 },
  { slug: "auckland",      name_pl: "Auckland",       name_en: "Auckland",     country_pl: "Nowa Zelandia", country_en: "New Zealand", lat: -36.87, lon: 174.77, population: 1657000 },
  { slug: "wellington",    name_pl: "Wellington",     name_en: "Wellington",   country_pl: "Nowa Zelandia", country_en: "New Zealand", lat: -41.29, lon: 174.78, population: 418500  },
  // === POPULARNE DESTYNACJE ===
  { slug: "bali",          name_pl: "Bali (Denpasar)", name_en: "Bali",        country_pl: "Indonezja",   country_en: "Indonesia",      lat: -8.65,  lon: 115.22, population: 897300  },
  { slug: "phuket",        name_pl: "Phuket",         name_en: "Phuket",       country_pl: "Tajlandia",   country_en: "Thailand",       lat: 7.88,   lon: 98.39,  population: 76000   },
  { slug: "tulum",         name_pl: "Tulum",          name_en: "Tulum",        country_pl: "Meksyk",      country_en: "Mexico",         lat: 20.21,  lon: -87.46, population: 50000   },
  { slug: "reykjavik",     name_pl: "Reykjavik",      name_en: "Reykjavik",    country_pl: "Islandia",    country_en: "Iceland",        lat: 64.14,  lon: -21.94, population: 134000  },
  { slug: "marrakesz",     name_pl: "Marrakesz",      name_en: "Marrakech",    country_pl: "Maroko",      country_en: "Morocco",        lat: 31.63,  lon: -8.00,  population: 928850  },
  { slug: "kappadocja",    name_pl: "Kappadocja (Göreme)", name_en: "Cappadocia", country_pl: "Turcja",  country_en: "Turkey",         lat: 38.64,  lon: 34.83,  population: 2000    },
  { slug: "santorini",     name_pl: "Santorini",      name_en: "Santorini",    country_pl: "Grecja",      country_en: "Greece",         lat: 36.39,  lon: 25.46,  population: 15000   },
  { slug: "maldywy",       name_pl: "Malé (Malediwy)", name_en: "Male",        country_pl: "Malediwy",    country_en: "Maldives",       lat: 4.18,   lon: 73.51,  population: 133412  },
  { slug: "dubrownik",     name_pl: "Dubrownik",      name_en: "Dubrovnik",    country_pl: "Chorwacja",   country_en: "Croatia",        lat: 42.65,  lon: 18.09,  population: 41562   },
  { slug: "kotor",         name_pl: "Kotor",          name_en: "Kotor",        country_pl: "Czarnogóra",  country_en: "Montenegro",     lat: 42.42,  lon: 18.77,  population: 22601   },
  { slug: "tbilisi-winery",name_pl: "Batumi",         name_en: "Batumi",       country_pl: "Gruzja",      country_en: "Georgia",        lat: 41.64,  lon: 41.64,  population: 190000  },
  { slug: "chiang-mai",    name_pl: "Chiang Mai",     name_en: "Chiang Mai",   country_pl: "Tajlandia",   country_en: "Thailand",       lat: 18.79,  lon: 98.98,  population: 131090  },
];

export type CityRegion = "europa" | "azja" | "bliski-wschod" | "afryka" | "ameryki" | "oceania";

export type CityContinent = "europe" | "asia" | "middle_east" | "africa" | "north_america" | "south_america" | "oceania";

export const REGION_LABELS: Record<CityRegion | "global", string> = {
  global:         "Globalnie",
  europa:         "Europa",
  azja:           "Azja",
  "bliski-wschod":"Bliski Wschód",
  ameryki:        "Ameryki",
  afryka:         "Afryka",
  oceania:        "Oceania",
};

const SLUG_TO_REGION: Record<string, CityRegion> = {
  // Polska
  "warszawa":"europa","krakow":"europa","lodz":"europa","wroclaw":"europa","poznan":"europa",
  "gdansk":"europa","szczecin":"europa","bydgoszcz":"europa","lublin":"europa","katowice":"europa",
  "bialystok":"europa","gdynia":"europa","czestochowa":"europa","radom":"europa","sosnowiec":"europa",
  "torun":"europa","rzeszow":"europa","kielce":"europa","gliwice":"europa","zabrze":"europa",
  "olsztyn":"europa","opole":"europa","zielona-gora":"europa","gorzow":"europa",
  "walbrzych":"europa","koszalin":"europa","zakopane":"europa",
  // Europa Zachodnia + Wschodnia
  "londyn":"europa","berlin":"europa","paryż":"europa","madryt":"europa","barcelona":"europa",
  "rzym":"europa","mediolan":"europa","amsterdam":"europa","bruksela":"europa","wiedeń":"europa",
  "zurych":"europa","genewa":"europa","lizbona":"europa","porto":"europa","ateny":"europa",
  "kopenhaga":"europa","oslo":"europa","sztokholm":"europa","helsinki":"europa","dublin":"europa",
  "edinburgh":"europa","manchester":"europa","hamburg":"europa","monachium":"europa",
  "frankfurt":"europa","kolonia":"europa","bukareszt":"europa","sofia":"europa","belgrad":"europa",
  "zagrzeb":"europa","praga":"europa","bratysława":"europa","budapest":"europa","wilno":"europa",
  "ryga":"europa","tallinn":"europa","lwow":"europa","kijow":"europa","walencja":"europa",
  "sewilla":"europa","malaga":"europa","palma":"europa","neapol":"europa","florencja":"europa",
  "wenecja":"europa","tuluza":"europa","marsylia":"europa","nicea":"europa","lyon":"europa",
  "moskwa":"europa","sankt-petersburg":"europa","mińsk":"europa",
  "dubrownik":"europa","kotor":"europa","santorini":"europa","reykjavik":"europa",
  // Bliski Wschód (incl. Turkey, Egypt)
  "istanbul":"bliski-wschod","ankara":"bliski-wschod","dubaj":"bliski-wschod",
  "abu-dhabi":"bliski-wschod","tel-awiw":"bliski-wschod","jerozolima":"bliski-wschod",
  "bejrut":"bliski-wschod","amman":"bliski-wschod","rijad":"bliski-wschod",
  "teheran":"bliski-wschod","bagdad":"bliski-wschod","kair":"bliski-wschod",
  "kappadocja":"bliski-wschod",
  // Azja
  "tbilisi":"azja","erewan":"azja","baku":"azja","taszkent":"azja","ałmaty":"azja","nur-sultan":"azja",
  "tokio":"azja","osaka":"azja","kioto":"azja","seul":"azja","pekin":"azja","szanghaj":"azja",
  "kanton":"azja","shenzhen":"azja","hongkong":"azja","taipei":"azja","singapur":"azja",
  "bangkok":"azja","kuala-lumpur":"azja","dżakarta":"azja","manila":"azja",
  "ho-chi-minh":"azja","hanoi":"azja","mumbaj":"azja","delhi":"azja","bangalore":"azja",
  "kolkata":"azja","karachi":"azja","lahore":"azja","dhaka":"azja","kolombo":"azja",
  "katmandu":"azja","bali":"azja","phuket":"azja","chiang-mai":"azja","maldywy":"azja",
  "tbilisi-winery":"azja",
  // Afryka
  "lagos":"afryka","kinszasa":"afryka","johannesburg":"afryka","kapsztad":"afryka",
  "nairobi":"afryka","addis-abeba":"afryka","akkra":"afryka","dakar":"afryka",
  "casablanca":"afryka","tunis":"afryka","algier":"afryka","luanda":"afryka",
  "dar-es-salaam":"afryka","marrakesz":"afryka",
  // Ameryki
  "nowy-jork":"ameryki","los-angeles":"ameryki","chicago":"ameryki","houston":"ameryki",
  "miami":"ameryki","san-francisco":"ameryki","seattle":"ameryki","las-vegas":"ameryki",
  "boston":"ameryki","washington":"ameryki","atlanta":"ameryki","phoenix":"ameryki",
  "denver":"ameryki","minneapolis":"ameryki","portland":"ameryki","toronto":"ameryki",
  "vancouver":"ameryki","montreal":"ameryki","calgary":"ameryki","ottawa":"ameryki",
  "meksyk":"ameryki","guadalajara":"ameryki","monterrey":"ameryki","hawana":"ameryki",
  "sao-paulo":"ameryki","rio-de-janeiro":"ameryki","brasilia":"ameryki","buenos-aires":"ameryki",
  "cordoba":"ameryki","santiago":"ameryki","bogota":"ameryki","lima":"ameryki",
  "caracas":"ameryki","quito":"ameryki","montevideo":"ameryki","la-paz":"ameryki",
  "tulum":"ameryki",
  // Oceania
  "sydney":"oceania","melbourne":"oceania","brisbane":"oceania","perth":"oceania",
  "auckland":"oceania","wellington":"oceania",
};

export function getCityRegion(slug: string): CityRegion {
  return SLUG_TO_REGION[slug] ?? "europa";
}

export function searchCities(query: string, limit = 8): City[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  const results: Array<{ city: City; score: number }> = [];
  for (const city of CITIES) {
    const nameLower = city.name_pl.toLowerCase();
    const nameEnLower = city.name_en.toLowerCase();
    const countryLower = city.country_pl.toLowerCase();
    if (nameLower.startsWith(q) || nameEnLower.startsWith(q)) {
      results.push({ city, score: 100 + Math.log(city.population) });
    } else if (nameLower.includes(q) || nameEnLower.includes(q) || countryLower.includes(q)) {
      results.push({ city, score: 50 + Math.log(city.population) });
    }
  }
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.city);
}

export function getCityBySlug(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug);
}

// ── Continent ─────────────────────────────────────────────────────────────────
const SOUTH_AMERICA_SLUGS = new Set([
  "sao-paulo","rio-de-janeiro","brasilia","buenos-aires","cordoba",
  "santiago","bogota","lima","caracas","quito","montevideo","la-paz",
]);

export function getCityContinent(slug: string): CityContinent {
  const region = getCityRegion(slug);
  if (region === "ameryki") {
    return SOUTH_AMERICA_SLUGS.has(slug) ? "south_america" : "north_america";
  }
  const MAP: Record<CityRegion, CityContinent> = {
    "europa":        "europe",
    "azja":          "asia",
    "bliski-wschod": "middle_east",
    "afryka":        "africa",
    "ameryki":       "north_america",
    "oceania":       "oceania",
  };
  return MAP[region];
}

// ── Flight hours from WAW (approximate) ──────────────────────────────────────
const FLIGHT_HOURS: Record<string, number> = {
  // Poland — no flight
  "warszawa":0,"krakow":0.5,"lodz":0.5,"wroclaw":0.5,"poznan":0.5,"gdansk":0.5,
  "szczecin":0.5,"bydgoszcz":0.5,"lublin":0.5,"katowice":0.5,"bialystok":0.5,
  "gdynia":0.5,"czestochowa":0.5,"radom":0.5,"sosnowiec":0.5,"torun":0.5,
  "rzeszow":0.5,"kielce":0.5,"gliwice":0.5,"zabrze":0.5,"olsztyn":0.5,
  "opole":0.5,"zielona-gora":0.5,"gorzow":0.5,"walbrzych":0.5,"koszalin":0.5,
  "zakopane":0.5,
  // Central Europe — 1.5h
  "praga":1.5,"bratysława":1.5,"budapest":1.5,"wiedeń":1.5,
  // Germany — 2h
  "berlin":2,"hamburg":2,"monachium":2,"frankfurt":2,"kolonia":2,
  // W/N/S Europe — 2.5-3.5h
  "londyn":2.5,"edinburgh":3,"manchester":2.5,"dublin":2.5,
  "paryż":2.5,"tuluza":2.5,"marsylia":3,"nicea":3,"lyon":2.5,
  "amsterdam":2,"bruksela":2,"zurych":2.5,"genewa":2.5,
  "madryt":3,"barcelona":3,"walencja":3,"sewilla":3.5,"malaga":3.5,"palma":3,
  "rzym":2.5,"mediolan":2,"neapol":3,"florencja":2.5,"wenecja":2.5,
  "lizbona":3,"porto":3,
  "kopenhaga":2,"oslo":2.5,"sztokholm":2.5,"helsinki":2.5,"reykjavik":3.5,
  // E Europe — 2-3h
  "ateny":3.5,"santorini":4,
  "bukareszt":2.5,"sofia":2.5,"belgrad":2.5,"zagrzeb":2,"dubrownik":3,"kotor":3,
  "wilno":1.5,"ryga":2,"tallinn":2,
  "lwow":1.5,"kijow":2,
  "moskwa":3.5,"sankt-petersburg":3.5,"mińsk":2,
  "tbilisi":4,"erewan":4,"baku":4,
  // Middle East
  "istanbul":3.5,"ankara":3.5,"kappadocja":4,
  "dubaj":5.5,"abu-dhabi":5.5,
  "tel-awiw":4.5,"jerozolima":4.5,
  "bejrut":4.5,"amman":4.5,"rijad":5.5,
  "teheran":5.5,"bagdad":5.5,"kair":4,
  // Africa
  "casablanca":3.5,"tunis":3.5,"algier":3.5,"marrakesz":4,
  "lagos":8,"kinszasa":10,"johannesburg":11,"kapsztad":11,
  "nairobi":9,"addis-abeba":8,"akkra":7,"dakar":7,"luanda":9,"dar-es-salaam":9,
  // Asia — South
  "mumbaj":8,"delhi":8,"bangalore":8.5,"kolkata":9,
  "karachi":7.5,"lahore":7.5,"dhaka":9,"kolombo":10,"katmandu":8.5,
  // Asia — Central
  "taszkent":6,"ałmaty":7,"nur-sultan":7,
  // Asia — East
  "tokio":11,"osaka":11,"kioto":11,"seul":11,
  "pekin":10,"szanghaj":10,"kanton":11,"shenzhen":11,"hongkong":11,"taipei":11,
  "singapur":12,
  // Asia — SE
  "bangkok":10,"kuala-lumpur":11,"dżakarta":12,"manila":12,
  "ho-chi-minh":11,"hanoi":11,"bali":12,"phuket":11,"chiang-mai":11,
  "maldywy":10,"tbilisi-winery":4,
  // Americas — North
  "nowy-jork":10,"boston":10,"washington":11,"chicago":11,"houston":12,
  "miami":11,"san-francisco":12,"seattle":12,"las-vegas":12,"atlanta":11,
  "phoenix":12,"denver":12,"minneapolis":11,"portland":12,
  "toronto":10,"montreal":10,"ottawa":10,"vancouver":12,"calgary":12,
  "meksyk":12,"guadalajara":12,"monterrey":12,"hawana":12,"tulum":13,
  // Americas — South
  "sao-paulo":14,"rio-de-janeiro":14,"brasilia":14,"buenos-aires":15,
  "cordoba":15,"santiago":15,"bogota":13,"lima":15,"caracas":13,
  "quito":14,"montevideo":15,"la-paz":15,
  // Oceania
  "sydney":21,"melbourne":21,"brisbane":21,"perth":18,
  "auckland":23,"wellington":23,
};

export function getCityFlightHours(slug: string): number {
  return FLIGHT_HOURS[slug] ?? 12;
}

// ── Price tier ────────────────────────────────────────────────────────────────
const PRICE_TIER_MAP: Record<string, "low" | "mid" | "high"> = {
  // Poland — low
  "warszawa":"low","krakow":"low","lodz":"low","wroclaw":"low","poznan":"low","gdansk":"low",
  "szczecin":"low","bydgoszcz":"low","lublin":"low","katowice":"low","bialystok":"low",
  "gdynia":"low","czestochowa":"low","radom":"low","sosnowiec":"low","torun":"low",
  "rzeszow":"low","kielce":"low","gliwice":"low","zabrze":"low","olsztyn":"low",
  "opole":"low","zielona-gora":"low","gorzow":"low","walbrzych":"low","koszalin":"low",
  "zakopane":"low",
  // Eastern Europe — low/mid
  "praga":"mid","bratysława":"low","budapest":"low","bukareszt":"low","sofia":"low",
  "belgrad":"low","zagrzeb":"low","dubrownik":"mid","kotor":"low",
  "wilno":"low","ryga":"low","tallinn":"mid",
  "lwow":"low","kijow":"low","mińsk":"low",
  "tbilisi":"low","erewan":"low","baku":"low","tbilisi-winery":"low",
  "moskwa":"mid","sankt-petersburg":"mid",
  // Central Europe — mid
  "wiedeń":"mid","berlin":"mid","hamburg":"mid","monachium":"mid","frankfurt":"mid","kolonia":"mid",
  "amsterdam":"high","bruksela":"mid",
  // W Europe — mid/high
  "londyn":"high","edinburgh":"high","manchester":"high","dublin":"high",
  "paryż":"high","tuluza":"mid","marsylia":"mid","nicea":"mid","lyon":"mid",
  "zurych":"high","genewa":"high",
  "madryt":"mid","barcelona":"mid","walencja":"mid","sewilla":"mid","malaga":"mid","palma":"mid",
  "rzym":"mid","mediolan":"mid","neapol":"mid","florencja":"mid","wenecja":"mid",
  "lizbona":"mid","porto":"mid",
  "kopenhaga":"high","oslo":"high","sztokholm":"high","helsinki":"high","reykjavik":"high",
  "ateny":"mid","santorini":"mid",
  // Middle East
  "istanbul":"low","ankara":"low","kappadocja":"low",
  "dubaj":"high","abu-dhabi":"high",
  "tel-awiw":"high","jerozolima":"high",
  "bejrut":"mid","amman":"low","rijad":"mid",
  "teheran":"low","bagdad":"low","kair":"low",
  // Africa
  "casablanca":"low","tunis":"low","algier":"low","marrakesz":"low",
  "lagos":"low","kinszasa":"low","johannesburg":"mid","kapsztad":"mid",
  "nairobi":"low","addis-abeba":"low","akkra":"low","dakar":"low","luanda":"low","dar-es-salaam":"low",
  // Asia — South
  "mumbaj":"low","delhi":"low","bangalore":"low","kolkata":"low",
  "karachi":"low","lahore":"low","dhaka":"low","kolombo":"low","katmandu":"low",
  // Asia — Central
  "taszkent":"low","ałmaty":"low","nur-sultan":"low",
  // Asia — East
  "tokio":"high","osaka":"high","kioto":"high","seul":"mid",
  "pekin":"mid","szanghaj":"mid","kanton":"mid","shenzhen":"mid",
  "hongkong":"high","taipei":"mid","singapur":"high",
  // Asia — SE
  "bangkok":"low","kuala-lumpur":"low","dżakarta":"low","manila":"low",
  "ho-chi-minh":"low","hanoi":"low","bali":"low","phuket":"low","chiang-mai":"low",
  "maldywy":"high",
  // Americas — North
  "nowy-jork":"high","boston":"high","washington":"high","chicago":"high",
  "houston":"mid","miami":"high","san-francisco":"high","seattle":"high",
  "las-vegas":"mid","atlanta":"mid","phoenix":"mid","denver":"mid",
  "minneapolis":"mid","portland":"mid",
  "toronto":"high","montreal":"high","ottawa":"high","vancouver":"high","calgary":"high",
  "meksyk":"mid","guadalajara":"mid","monterrey":"mid","hawana":"mid","tulum":"mid",
  // Americas — South
  "sao-paulo":"mid","rio-de-janeiro":"mid","brasilia":"mid","buenos-aires":"mid",
  "cordoba":"low","santiago":"mid","bogota":"low","lima":"low",
  "caracas":"low","quito":"low","montevideo":"mid","la-paz":"low",
  // Oceania
  "sydney":"high","melbourne":"high","brisbane":"mid","perth":"mid",
  "auckland":"high","wellington":"high",
};

export function getCityPriceTier(slug: string): "low" | "mid" | "high" {
  return PRICE_TIER_MAP[slug] ?? "mid";
}
