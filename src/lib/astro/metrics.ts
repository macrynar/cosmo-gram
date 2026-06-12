import type { NatalData } from "@/lib/moduleSpecs";
import type { ModuleId, ComputedMetric } from "@/lib/schemas/astroModule";

// ─── Sign scoring tables ───────────────────────────────────────────────────────
// Each sign gets a score 10-28 per category. Average = ~15.
// These represent how strongly a sign expresses the category's themes.

const SG: Record<string, Record<string, number>> = {
  action:  { Baran:28, Byk:12, "Bliźnięta":16, Rak:12, Lew:24, Panna:14, Waga:12, Skorpion:20, Strzelec:22, Koziorożec:18, Wodnik:15, Ryby:11 },
  emotion: { Baran:12, Byk:17, "Bliźnięta":10, Rak:28, Lew:16, Panna:13, Waga:14, Skorpion:27, Strzelec:11, Koziorożec:13, Wodnik:11, Ryby:26 },
  mind:    { Baran:14, Byk:13, "Bliźnięta":28, Rak:14, Lew:16, Panna:26, Waga:22, Skorpion:20, Strzelec:19, Koziorożec:17, Wodnik:26, Ryby:13 },
  soul:    { Baran:12, Byk:16, "Bliźnięta":11, Rak:23, Lew:15, Panna:15, Waga:18, Skorpion:27, Strzelec:18, Koziorożec:13, Wodnik:22, Ryby:28 },
  social:  { Baran:13, Byk:16, "Bliźnięta":25, Rak:18, Lew:23, Panna:12, Waga:28, Skorpion:15, Strzelec:19, Koziorożec:13, Wodnik:22, Ryby:18 },
};

type Cat = "action" | "emotion" | "mind" | "soul" | "social";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function sg(sign: string | null, cat: Cat): number {
  return sign ? (SG[cat][sign] ?? 15) : 15;
}

function signOf(d: NatalData, planet: string): string | null {
  return d.placements.find(p => p.planet === planet)?.sign ?? null;
}

function houseOf(d: NatalData, planet: string): number | null {
  return d.placements.find(p => p.planet === planet)?.house ?? null;
}

// Returns aspect score: trine/sextile positive, square/opposition negative, conjunction neutral-positive.
function av(d: NatalData, pa: string, pb: string): number {
  const a = d.aspects.find(x =>
    (x.planet_a === pa && x.planet_b === pb) ||
    (x.planet_a === pb && x.planet_b === pa)
  );
  if (!a) return 0;
  const V: Record<string, number> = { trine: 12, sextile: 8, conjunction: 5, square: -8, opposition: -10 };
  return V[a.type] ?? 0;
}

// Normalize sign score around 0 (average → 0)
function n(score: number): number { return score - 15; }

function clamp(v: number): number {
  return Math.max(30, Math.min(95, Math.round(v)));
}

// ─── Metric definitions ────────────────────────────────────────────────────────

type MetricDef = {
  id:      string;
  label:   string;
  cat:     Cat;
  pool:    ModuleId;
  compute: (d: NatalData) => number;
};

const METRICS: MetricDef[] = [

  // ── CORE ──────────────────────────────────────────────────────────────────

  {
    id: "core_sun_expression", label: "Siła wyrazu Słońca", cat: "action", pool: "core",
    compute: (d) => clamp(50 + n(sg(signOf(d,"Słońce"),"action")) + av(d,"Słońce","Jowisz")*0.6 + av(d,"Słońce","Mars")*0.5),
  },
  {
    id: "core_emotional_depth", label: "Głębokość emocjonalna", cat: "emotion", pool: "core",
    compute: (d) => clamp(50 + n(sg(signOf(d,"Księżyc"),"emotion")) + av(d,"Księżyc","Pluton")*0.8 + av(d,"Księżyc","Neptun")*0.5),
  },
  {
    id: "core_identity_coherence", label: "Spójność tożsamości", cat: "soul", pool: "core",
    compute: (d) => {
      const E: Record<string,string> = {
        Baran:"F",Lew:"F",Strzelec:"F",Byk:"E",Panna:"E",Koziorożec:"E",
        "Bliźnięta":"A",Waga:"A",Wodnik:"A",Rak:"W",Skorpion:"W",Ryby:"W",
      };
      const sun = signOf(d,"Słońce"); const moon = signOf(d,"Księżyc"); const asc = signOf(d,"Ascendent");
      const bonus = (sun && moon && E[sun]===E[moon] ? 14 : 0) + (sun && asc && E[sun]===E[asc] ? 7 : 0);
      return clamp(52 + bonus + av(d,"Słońce","Księżyc")*0.7);
    },
  },
  {
    id: "core_willpower", label: "Siła woli", cat: "action", pool: "core",
    compute: (d) => clamp(50 + n(sg(signOf(d,"Słońce"),"action"))*0.7 + n(sg(signOf(d,"Mars"),"action"))*0.5 + av(d,"Słońce","Mars")*0.8 + av(d,"Słońce","Saturn")*0.3),
  },
  {
    id: "core_self_awareness", label: "Autorefleksja", cat: "mind", pool: "core",
    compute: (d) => clamp(50 + n(sg(signOf(d,"Merkury"),"mind"))*0.6 + n(sg(signOf(d,"Księżyc"),"mind"))*0.4 + av(d,"Merkury","Księżyc")),
  },
  {
    id: "core_resilience", label: "Odporność wewnętrzna", cat: "soul", pool: "core",
    compute: (d) => clamp(50 + n(sg(signOf(d,"Saturn"),"action"))*0.5 + n(sg(signOf(d,"Słońce"),"soul"))*0.4 + av(d,"Słońce","Saturn")*0.6 + av(d,"Księżyc","Saturn")*0.4),
  },

  // ── SUPERPOWERS ───────────────────────────────────────────────────────────

  {
    id: "sp_natural_leadership", label: "Zdolność przywództwa", cat: "action", pool: "superpowers",
    compute: (d) => {
      const sun = signOf(d,"Słońce"); const mar = signOf(d,"Mars");
      const sunBonus: Record<string,number> = { Baran:5, Lew:8, Koziorożec:6, Skorpion:4 };
      return clamp(50 + n(sg(sun,"action"))*0.6 + n(sg(mar,"action"))*0.4 + av(d,"Słońce","Mars")*0.6 + av(d,"Słońce","Jowisz")*0.4 + (sunBonus[sun!]??0) + (houseOf(d,"Słońce")===10?8:0));
    },
  },
  {
    id: "sp_creative_power", label: "Moc twórcza", cat: "emotion", pool: "superpowers",
    compute: (d) => {
      const ven = signOf(d,"Wenus");
      const creBonus: Record<string,number> = { Lew:8, Baran:4, "Bliźnięta":4, Waga:4, Strzelec:4 };
      return clamp(50 + n(sg(ven,"emotion"))*0.7 + av(d,"Wenus","Jowisz")*0.6 + av(d,"Słońce","Wenus")*0.4 + (creBonus[ven!]??0) + (houseOf(d,"Wenus")===5?8:0));
    },
  },
  {
    id: "sp_communication_power", label: "Siła komunikacji", cat: "mind", pool: "superpowers",
    compute: (d) => clamp(50 + n(sg(signOf(d,"Merkury"),"mind")) + av(d,"Merkury","Jowisz")*0.7 + av(d,"Merkury","Mars")*0.5),
  },
  {
    id: "sp_strategic_thinking", label: "Myślenie strategiczne", cat: "mind", pool: "superpowers",
    compute: (d) => {
      const mer = signOf(d,"Merkury");
      const strBonus: Record<string,number> = { Koziorożec:6, Skorpion:5, Panna:4, Wodnik:4, "Bliźnięta":3 };
      return clamp(50 + n(sg(mer,"mind"))*0.6 + n(sg(signOf(d,"Saturn"),"mind"))*0.4 + av(d,"Merkury","Saturn")*0.7 + (strBonus[mer!]??0));
    },
  },
  {
    id: "sp_magnetic_presence", label: "Magnetyczna obecność", cat: "social", pool: "superpowers",
    compute: (d) => {
      const asc = signOf(d,"Ascendent"); const ven = signOf(d,"Wenus");
      const magBonus: Record<string,number> = { Skorpion:6, Lew:5, Waga:4, Baran:4, Strzelec:4 };
      return clamp(50 + n(sg(asc,"social"))*0.6 + n(sg(ven,"social"))*0.4 + av(d,"Wenus","Mars")*0.4 + (magBonus[asc!]??0));
    },
  },
  {
    id: "sp_jupiter_abundance", label: "Potencjał ekspansji", cat: "soul", pool: "superpowers",
    compute: (d) => {
      const jup = signOf(d,"Jowisz");
      const jupBonus: Record<string,number> = { Strzelec:8, Ryby:7, Rak:6, Lew:5, Baran:5, Waga:4 };
      return clamp(50 + n(sg(jup,"soul"))*0.8 + av(d,"Jowisz","Słońce")*0.6 + (jupBonus[jup!]??0) + (houseOf(d,"Jowisz")===1?6:0));
    },
  },

  // ── CHILDHOOD ─────────────────────────────────────────────────────────────

  {
    id: "ch_emotional_security", label: "Poczucie bezpieczeństwa emocjonalnego", cat: "emotion", pool: "childhood",
    compute: (d) => {
      const moon = signOf(d,"Księżyc");
      const secBonus: Record<string,number> = { Byk:7, Rak:6, Waga:4, Ryby:4, Koziorożec:3, Baran:-3, Skorpion:-2, Wodnik:-3 };
      return clamp(50 + n(sg(moon,"emotion"))*0.7 + av(d,"Księżyc","Wenus")*0.5 + av(d,"Księżyc","Saturn")*0.6 + (secBonus[moon!]??0) + (houseOf(d,"Księżyc")===4?6:0));
    },
  },
  {
    id: "ch_family_pattern_depth", label: "Głębokość wzorców rodzinnych", cat: "soul", pool: "childhood",
    compute: (d) => clamp(50 + n(sg(signOf(d,"Księżyc"),"soul"))*0.7 + av(d,"Księżyc","Saturn") + av(d,"Księżyc","Pluton")*0.6),
  },
  {
    id: "ch_early_adaptability", label: "Wczesna zdolność adaptacji", cat: "action", pool: "childhood",
    compute: (d) => {
      const moon = signOf(d,"Księżyc"); const mer = signOf(d,"Merkury");
      const mut: Record<string,number> = { "Bliźnięta":6, Panna:4, Strzelec:5, Ryby:4 };
      return clamp(50 + n(sg(moon,"action"))*0.5 + av(d,"Księżyc","Merkury")*0.8 + av(d,"Księżyc","Uran")*0.5 + (mut[moon!]??0) + (mut[mer!]??0)*0.5);
    },
  },
  {
    id: "ch_inner_child_vitality", label: "Żywotność wewnętrznego dziecka", cat: "emotion", pool: "childhood",
    compute: (d) => clamp(50 + n(sg(signOf(d,"Księżyc"),"emotion"))*0.6 + av(d,"Księżyc","Słońce")*0.7 + av(d,"Księżyc","Jowisz")*0.5),
  },
  {
    id: "ch_boundary_capacity", label: "Zdolność wyznaczania granic", cat: "action", pool: "childhood",
    compute: (d) => {
      const sat = signOf(d,"Saturn");
      const bndBonus: Record<string,number> = { Koziorożec:7, Baran:5, Waga:3, Ryby:-3, Rak:-2 };
      return clamp(50 + n(sg(sat,"action"))*0.7 + av(d,"Saturn","Księżyc")*0.5 + av(d,"Saturn","Mars")*0.4 + (bndBonus[sat!]??0));
    },
  },
  {
    id: "ch_emotional_memory", label: "Głębokość pamięci emocjonalnej", cat: "mind", pool: "childhood",
    compute: (d) => {
      const moon = signOf(d,"Księżyc");
      const depBonus: Record<string,number> = { Rak:6, Skorpion:5, Ryby:4, Byk:3, Baran:-2, "Bliźnięta":-2 };
      return clamp(50 + n(sg(moon,"mind"))*0.6 + n(sg(moon,"emotion"))*0.3 + av(d,"Księżyc","Pluton")*0.6 + (depBonus[moon!]??0));
    },
  },

  // ── LOVE ──────────────────────────────────────────────────────────────────

  {
    id: "lv_venus_depth", label: "Głębokość uczuciowa", cat: "emotion", pool: "love",
    compute: (d) => {
      const ven = signOf(d,"Wenus");
      const depBonus: Record<string,number> = { Skorpion:8, Rak:7, Byk:5, Ryby:5, Waga:3, Baran:-2, Wodnik:-2 };
      return clamp(50 + n(sg(ven,"emotion"))*0.8 + av(d,"Wenus","Pluton")*0.5 + av(d,"Wenus","Neptun")*0.4 + (depBonus[ven!]??0));
    },
  },
  {
    id: "lv_passion_intensity", label: "Intensywność namiętności", cat: "action", pool: "love",
    compute: (d) => {
      const mar = signOf(d,"Mars"); const ven = signOf(d,"Wenus");
      const intBonus: Record<string,number> = { Skorpion:8, Baran:7, Lew:5, Byk:4, Koziorożec:4 };
      return clamp(50 + n(sg(mar,"action"))*0.6 + n(sg(ven,"action"))*0.3 + av(d,"Wenus","Mars") + (intBonus[mar!]??0) + (intBonus[ven!]??0)*0.5);
    },
  },
  {
    id: "lv_romantic_idealism", label: "Idealizm miłosny", cat: "soul", pool: "love",
    compute: (d) => {
      const ven = signOf(d,"Wenus");
      const ideBonus: Record<string,number> = { Ryby:8, Strzelec:5, Waga:4, Rak:4, Lew:3, Koziorożec:-3 };
      return clamp(50 + n(sg(ven,"soul"))*0.6 + av(d,"Wenus","Neptun") + av(d,"Wenus","Jowisz")*0.5 + (ideBonus[ven!]??0));
    },
  },
  {
    id: "lv_attachment_security", label: "Poczucie bezpieczeństwa w relacji", cat: "emotion", pool: "love",
    compute: (d) => {
      const moon = signOf(d,"Księżyc"); const ven = signOf(d,"Wenus");
      const secBonus: Record<string,number> = { Byk:7, Rak:6, Waga:4, Ryby:4, Baran:-3, Wodnik:-3 };
      return clamp(50 + n(sg(moon,"emotion"))*0.5 + n(sg(ven,"emotion"))*0.4 + av(d,"Księżyc","Wenus")*0.8 + (secBonus[moon!]??0) + (secBonus[ven!]??0)*0.5);
    },
  },
  {
    id: "lv_sensuality", label: "Zmysłowość", cat: "action", pool: "love",
    compute: (d) => {
      const ven = signOf(d,"Wenus"); const mar = signOf(d,"Mars");
      const senBonus: Record<string,number> = { Byk:8, Skorpion:7, Waga:4, Lew:4, Rak:3, Wodnik:-3 };
      return clamp(50 + n(sg(ven,"action"))*0.6 + n(sg(mar,"action"))*0.3 + av(d,"Wenus","Mars")*0.7 + (senBonus[ven!]??0) + (senBonus[mar!]??0)*0.5);
    },
  },
  {
    id: "lv_relationship_stamina", label: "Wytrwałość w relacji", cat: "social", pool: "love",
    compute: (d) => {
      const sat = signOf(d,"Saturn"); const ven = signOf(d,"Wenus");
      const staBonus: Record<string,number> = { Koziorożec:7, Byk:6, Skorpion:5, Ryby:3, Baran:-3, "Bliźnięta":-2 };
      return clamp(50 + n(sg(sat,"action"))*0.5 + n(sg(ven,"social"))*0.4 + av(d,"Wenus","Saturn")*0.7 + (staBonus[sat!]??0) + (staBonus[ven!]??0)*0.5);
    },
  },

  // ── CAREER ────────────────────────────────────────────────────────────────

  {
    id: "ca_ambition_drive", label: "Siła ambicji", cat: "action", pool: "career",
    compute: (d) => {
      const sat = signOf(d,"Saturn"); const mar = signOf(d,"Mars");
      const ambBonus: Record<string,number> = { Koziorożec:8, Baran:6, Skorpion:5, Lew:4, Panna:3 };
      return clamp(50 + n(sg(sat,"action"))*0.5 + n(sg(mar,"action"))*0.4 + av(d,"Saturn","Mars")*0.5 + (ambBonus[sat!]??0) + (ambBonus[mar!]??0)*0.5 + (houseOf(d,"Saturn")===10?8:0));
    },
  },
  {
    id: "ca_jupiter_domain", label: "Naturalna domena sukcesu", cat: "mind", pool: "career",
    compute: (d) => {
      const jup = signOf(d,"Jowisz");
      const domBonus: Record<string,number> = { Strzelec:8, Ryby:7, Rak:5, Lew:5, Baran:4, Byk:4 };
      return clamp(50 + n(sg(jup,"mind"))*0.8 + av(d,"Jowisz","Merkury")*0.5 + av(d,"Jowisz","Słońce")*0.4 + (domBonus[jup!]??0));
    },
  },
  {
    id: "ca_financial_instinct", label: "Instynkt finansowy", cat: "action", pool: "career",
    compute: (d) => {
      const ven = signOf(d,"Wenus"); const sat = signOf(d,"Saturn");
      const finBonus: Record<string,number> = { Byk:8, Koziorożec:6, Lew:4, Panna:4, Waga:3, Ryby:-2 };
      return clamp(50 + n(sg(ven,"action"))*0.5 + n(sg(sat,"action"))*0.4 + av(d,"Wenus","Saturn")*0.4 + av(d,"Jowisz","Wenus")*0.3 + (finBonus[ven!]??0) + (finBonus[sat!]??0)*0.5 + (houseOf(d,"Wenus")===2?6:0));
    },
  },
  {
    id: "ca_innovative_capacity", label: "Zdolność innowacji", cat: "mind", pool: "career",
    compute: (d) => {
      const ura = signOf(d,"Uran"); const mer = signOf(d,"Merkury");
      const innBonus: Record<string,number> = { Wodnik:8, Baran:5, "Bliźnięta":5, Strzelec:4, Waga:3 };
      return clamp(50 + n(sg(ura,"mind"))*0.5 + n(sg(mer,"mind"))*0.4 + av(d,"Uran","Merkury") + (innBonus[ura!]??0) + (innBonus[mer!]??0)*0.5);
    },
  },
  {
    id: "ca_leadership_authority", label: "Autorytet przywódczy", cat: "social", pool: "career",
    compute: (d) => {
      const sun = signOf(d,"Słońce");
      const authBonus: Record<string,number> = { Lew:8, Koziorożec:6, Baran:5, Skorpion:4, Waga:3 };
      return clamp(50 + n(sg(sun,"social"))*0.6 + n(sg(signOf(d,"Saturn"),"action"))*0.4 + av(d,"Słońce","Saturn")*0.4 + (authBonus[sun!]??0) + (houseOf(d,"Słońce")===10?8:0));
    },
  },
  {
    id: "ca_work_resilience", label: "Wytrwałość zawodowa", cat: "action", pool: "career",
    compute: (d) => {
      const sat = signOf(d,"Saturn");
      const resBonus: Record<string,number> = { Koziorożec:7, Byk:6, Skorpion:5, Baran:-2, "Bliźnięta":-2, Ryby:-2 };
      return clamp(50 + n(sg(sat,"action"))*0.8 + av(d,"Saturn","Mars")*0.5 + av(d,"Saturn","Słońce")*0.4 + (resBonus[sat!]??0));
    },
  },

  // ── SHADOWS ───────────────────────────────────────────────────────────────

  {
    id: "sh_control_tendency", label: "Tendencja do kontroli", cat: "soul", pool: "shadows",
    compute: (d) => {
      const plu = signOf(d,"Pluton"); const sat = signOf(d,"Saturn");
      const ctlBonus: Record<string,number> = { Skorpion:7, Koziorożec:5, Baran:4, Lew:3 };
      const aspMar = av(d,"Mars","Pluton") < 0 ? Math.abs(av(d,"Mars","Pluton"))*0.5 : 0;
      return clamp(50 + n(sg(plu,"soul"))*0.5 + n(sg(sat,"action"))*0.3 + av(d,"Saturn","Pluton")*(-0.4) + aspMar + (ctlBonus[plu!]??0) + (ctlBonus[sat!]??0)*0.5);
    },
  },
  {
    id: "sh_perfectionism_level", label: "Poziom perfekcjonizmu", cat: "mind", pool: "shadows",
    compute: (d) => {
      const mer = signOf(d,"Merkury"); const sat = signOf(d,"Saturn");
      const perBonus: Record<string,number> = { Panna:8, Koziorożec:6, Waga:4, Baran:-2 };
      const aspSatMer = av(d,"Saturn","Merkury");
      const aspBonus = aspSatMer < 0 ? Math.abs(aspSatMer)*0.5 : aspSatMer*0.3;
      return clamp(50 + n(sg(mer,"mind"))*0.5 + n(sg(sat,"action"))*0.4 + aspBonus + (perBonus[mer!]??0) + (perBonus[sat!]??0)*0.5);
    },
  },
  {
    id: "sh_self_sabotage_risk", label: "Wzorzec autosabotażu", cat: "emotion", pool: "shadows",
    compute: (d) => {
      const nep = signOf(d,"Neptun");
      const sabBonus: Record<string,number> = { Ryby:6, Rak:4, Skorpion:4, Koziorożec:-3 };
      const aspNepMoon = av(d,"Neptun","Księżyc");
      const aspNepSun  = av(d,"Neptun","Słońce");
      const aspBonus = (aspNepMoon < 0 ? Math.abs(aspNepMoon)*0.5 : 0) + (aspNepSun < 0 ? Math.abs(aspNepSun)*0.4 : 0);
      return clamp(50 + n(sg(nep,"soul"))*0.5 + aspBonus + (sabBonus[nep!]??0));
    },
  },
  {
    id: "sh_anger_patterns", label: "Wzorce reaktywności", cat: "action", pool: "shadows",
    compute: (d) => {
      const mar = signOf(d,"Mars");
      const angBonus: Record<string,number> = { Baran:7, Skorpion:5, Lew:4, Koziorożec:3, Byk:-2, Ryby:-2, Waga:-2 };
      const aspMarSat = av(d,"Mars","Saturn");
      const aspMarPlu = av(d,"Mars","Pluton");
      const aspBonus = (aspMarSat < 0 ? Math.abs(aspMarSat)*0.5 : 0) + (aspMarPlu < 0 ? Math.abs(aspMarPlu)*0.4 : 0);
      return clamp(50 + n(sg(mar,"action"))*0.7 + aspBonus + (angBonus[mar!]??0));
    },
  },
  {
    id: "sh_vulnerability_armor", label: "Unikanie wrażliwości", cat: "emotion", pool: "shadows",
    compute: (d) => {
      const moon = signOf(d,"Księżyc");
      const armBonus: Record<string,number> = { Koziorożec:7, Wodnik:6, Baran:4, Panna:3, "Bliźnięta":3, Rak:-5, Ryby:-3, Skorpion:-2 };
      const aspSatMoon = av(d,"Saturn","Księżyc");
      const aspBonus = aspSatMoon < 0 ? Math.abs(aspSatMoon)*0.6 : aspSatMoon*(-0.3);
      return clamp(50 + n(sg(moon,"emotion"))*(-0.5) + aspBonus + (armBonus[moon!]??0));
    },
  },
  {
    id: "sh_integration_readiness", label: "Gotowość do integracji cienia", cat: "soul", pool: "shadows",
    compute: (d) => {
      const plu = signOf(d,"Pluton");
      const intBonus: Record<string,number> = { Waga:5, Strzelec:4, Rak:4, Lew:3, Ryby:4 };
      const aspPluSun  = av(d,"Pluton","Słońce");
      const aspPluMoon = av(d,"Pluton","Księżyc");
      const aspBonus = (aspPluSun > 0 ? aspPluSun*0.5 : 0) + (aspPluMoon > 0 ? aspPluMoon*0.4 : 0);
      return clamp(52 + n(sg(plu,"soul"))*0.4 + aspBonus + (intBonus[plu!]??0));
    },
  },

  // ── ROOTS ─────────────────────────────────────────────────────────────────

  {
    id: "ro_ancestral_depth", label: "Głębokość połączenia z przodkami", cat: "soul", pool: "roots",
    compute: (d) => {
      const moon = signOf(d,"Księżyc"); const nn = d.nodes.north_node_sign;
      const depBonus: Record<string,number> = { Rak:8, Skorpion:6, Ryby:5, Byk:4, Koziorożec:3 };
      const nnBonus: Record<string,number> = { Rak:5, Koziorożec:4, Ryby:3 };
      return clamp(50 + n(sg(moon,"soul"))*0.7 + av(d,"Księżyc","Saturn")*0.4 + (depBonus[moon!]??0) + (houseOf(d,"Księżyc")===4?7:0) + (nnBonus[nn]??0));
    },
  },
  {
    id: "ro_south_node_pull", label: "Siła Węzła Południowego", cat: "soul", pool: "roots",
    compute: (d) => {
      const sn = d.nodes.south_node_sign;
      const pullBonus: Record<string,number> = { Rak:7, Ryby:6, Byk:5, Skorpion:5, Koziorożec:4, Lew:4 };
      return clamp(50 + n(sg(sn,"soul"))*0.7 + (pullBonus[sn]??0));
    },
  },
  {
    id: "ro_spiritual_receptivity", label: "Otwartość duchowa", cat: "soul", pool: "roots",
    compute: (d) => {
      const nep = signOf(d,"Neptun"); const jup = signOf(d,"Jowisz");
      const spiBonus: Record<string,number> = { Ryby:8, Strzelec:6, Rak:5, Skorpion:5, Waga:3, Koziorożec:-2 };
      const h12 = (houseOf(d,"Neptun")===12 || houseOf(d,"Księżyc")===12) ? 6 : 0;
      return clamp(50 + n(sg(nep,"soul"))*0.7 + av(d,"Neptun","Księżyc")*0.5 + av(d,"Jowisz","Neptun")*0.4 + (spiBonus[nep!]??0) + (spiBonus[jup!]??0)*0.4 + h12);
    },
  },
  {
    id: "ro_karmic_awareness", label: "Świadomość karmiczna", cat: "mind", pool: "roots",
    compute: (d) => {
      const sat = signOf(d,"Saturn"); const nn = d.nodes.north_node_sign;
      const karBonus: Record<string,number> = { Koziorożec:6, Skorpion:5, Ryby:5, Baran:-2, Lew:-2 };
      const nnKar: Record<string,number> = { Koziorożec:6, Ryby:5, Rak:4, Skorpion:4, Waga:3 };
      return clamp(50 + n(sg(sat,"mind"))*0.6 + av(d,"Saturn","Węzeł Północny")*0.7 + (karBonus[sat!]??0) + (nnKar[nn]??0));
    },
  },
  {
    id: "ro_family_bond_strength", label: "Siła więzi rodzinnych", cat: "social", pool: "roots",
    compute: (d) => {
      const moon = signOf(d,"Księżyc");
      const bonBonus: Record<string,number> = { Rak:8, Byk:5, Ryby:4, Panna:3, Waga:3, Baran:-3, Wodnik:-3 };
      const h4 = (houseOf(d,"Księżyc")===4 || houseOf(d,"Słońce")===4) ? 6 : 0;
      return clamp(50 + n(sg(moon,"social"))*0.7 + av(d,"Księżyc","Wenus")*0.5 + av(d,"Księżyc","Saturn")*0.3 + (bonBonus[moon!]??0) + h4);
    },
  },
  {
    id: "ro_groundedness", label: "Zakorzenienie", cat: "action", pool: "roots",
    compute: (d) => {
      const EARTH: Record<string,number> = { Byk:1, Panna:1, Koziorożec:1 };
      const earthCount = d.placements.filter(p => EARTH[p.sign]).length;
      const sat = signOf(d,"Saturn");
      const gndBonus: Record<string,number> = { Byk:6, Koziorożec:7, Panna:5, Baran:-3, Strzelec:-2 };
      return clamp(50 + earthCount*3 + n(sg(sat,"action"))*0.5 + (gndBonus[sat!]??0));
    },
  },

  // ── PURPOSE ───────────────────────────────────────────────────────────────

  {
    id: "pu_north_node_pull", label: "Siła powołania", cat: "soul", pool: "purpose",
    compute: (d) => {
      const nn = d.nodes.north_node_sign;
      const purBonus: Record<string,number> = { Strzelec:7, Lew:6, Baran:6, Wodnik:5, Waga:5, "Bliźnięta":4 };
      return clamp(50 + n(sg(nn,"soul"))*0.8 + av(d,"Słońce","Węzeł Północny")*0.7 + (purBonus[nn]??0));
    },
  },
  {
    id: "pu_life_direction_clarity", label: "Klarowność kierunku życia", cat: "mind", pool: "purpose",
    compute: (d) => {
      const sun = signOf(d,"Słońce"); const jup = signOf(d,"Jowisz");
      const claBonus: Record<string,number> = { Strzelec:7, Koziorożec:6, Lew:5, Baran:5, Panna:4 };
      return clamp(50 + n(sg(sun,"mind"))*0.5 + n(sg(jup,"mind"))*0.3 + av(d,"Słońce","Jowisz")*0.7 + av(d,"Słońce","Węzeł Północny")*0.5 + (claBonus[sun!]??0) + (claBonus[jup!]??0)*0.5);
    },
  },
  {
    id: "pu_social_impact_potential", label: "Potencjał wpływu społecznego", cat: "social", pool: "purpose",
    compute: (d) => {
      const jup = signOf(d,"Jowisz");
      const impBonus: Record<string,number> = { Wodnik:8, Waga:6, Strzelec:5, Lew:4, "Bliźnięta":4, Koziorożec:3 };
      const h11 = (houseOf(d,"Jowisz")===11 || houseOf(d,"Słońce")===11) ? 7 : 0;
      return clamp(50 + n(sg(jup,"social"))*0.7 + av(d,"Jowisz","Uran")*0.5 + av(d,"Jowisz","Słońce")*0.4 + (impBonus[jup!]??0) + h11);
    },
  },
  {
    id: "pu_teaching_gift", label: "Dar nauczania i dzielenia się wiedzą", cat: "social", pool: "purpose",
    compute: (d) => {
      const mer = signOf(d,"Merkury"); const jup = signOf(d,"Jowisz");
      const teaBonus: Record<string,number> = { Strzelec:8, "Bliźnięta":6, Wodnik:5, Waga:4, Lew:4, Koziorożec:3 };
      const h9 = (houseOf(d,"Merkury")===9 || houseOf(d,"Jowisz")===9) ? 6 : 0;
      return clamp(50 + n(sg(mer,"social"))*0.5 + n(sg(jup,"social"))*0.4 + av(d,"Merkury","Jowisz") + (teaBonus[mer!]??0) + (teaBonus[jup!]??0)*0.5 + h9);
    },
  },
  {
    id: "pu_transformation_power", label: "Moc transformacji", cat: "soul", pool: "purpose",
    compute: (d) => {
      const plu = signOf(d,"Pluton");
      const traBonus: Record<string,number> = { Skorpion:7, Ryby:5, Lew:4, Koziorożec:4, Baran:3 };
      return clamp(50 + n(sg(plu,"soul"))*0.7 + av(d,"Pluton","Słońce")*0.6 + av(d,"Pluton","Księżyc")*0.5 + (traBonus[plu!]??0));
    },
  },
  {
    id: "pu_legacy_capacity", label: "Zdolność budowania dziedzictwa", cat: "action", pool: "purpose",
    compute: (d) => {
      const sat = signOf(d,"Saturn"); const nn = d.nodes.north_node_sign;
      const legBonus: Record<string,number> = { Koziorożec:8, Byk:5, Lew:5, Skorpion:4, Strzelec:3 };
      const nnLeg: Record<string,number> = { Koziorożec:5, Lew:4, Strzelec:3 };
      return clamp(50 + n(sg(sat,"action"))*0.7 + av(d,"Saturn","Słońce")*0.4 + av(d,"Saturn","Jowisz")*0.3 + (legBonus[sat!]??0) + (houseOf(d,"Saturn")===10?7:0) + (nnLeg[nn]??0));
    },
  },
];

// ─── Public API ────────────────────────────────────────────────────────────────

// Returns the 3 most distinctive metrics for a module (highest absolute deviation from 50).
export function computeModuleMetrics(data: NatalData, moduleId: ModuleId): ComputedMetric[] {
  return METRICS
    .filter(m => m.pool === moduleId)
    .map((m): ComputedMetric => ({ id: m.id, label: m.label, value: m.compute(data), category: m.cat }))
    .sort((a, b) => Math.abs(b.value - 50) - Math.abs(a.value - 50))
    .slice(0, 3);
}
