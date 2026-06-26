import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Cosmogram — blog";

// Tokeny DS (src/styles/landing-tokens.css)
const C = {
  bg: "#0B0912",
  bgElevated: "#14101F",
  line: "#2B2540",
  textPrimary: "#F4F1EA",
  voice: "#E9DCC0",
  accent: "#FFAE3D",
  accentDeep: "#E0B566",
  ring: "rgba(224,181,102,",
  ember: "rgba(255,174,61,0.12)",
};

type FontEntry = { name: string; data: ArrayBuffer; weight: 600; style: "normal" };

/**
 * Pobiera font z Google Fonts jako ArrayBuffer(y). Stary User-Agent wymusza woff
 * (nie woff2 — satori go nie obsługuje). Bierzemy WSZYSTKIE podzbiory (latin +
 * latin-ext), bo polskie znaki (ł, ż, ą) są w latin-ext. Cichy fallback do [].
 */
async function loadGoogleFont(family: string, weight: 600): Promise<FontEntry[]> {
  try {
    const api = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`;
    const css = await fetch(api, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)" },
    }).then((r) => r.text());
    const urls = [...css.matchAll(/url\((https:\/\/[^)]+)\)/g)].map((m) => m[1]);
    const buffers = await Promise.all(
      urls.map((u) => fetch(u).then((r) => r.arrayBuffer()).catch(() => null)),
    );
    return buffers
      .filter((b): b is ArrayBuffer => b !== null)
      .map((data) => ({ name: family, data, weight, style: "normal" as const }));
  } catch {
    return [];
  }
}

/** Adaptacyjny rozmiar tytułu wg długości, by zmieścić ~3 linie. */
function titleSize(len: number): number {
  if (len <= 32) return 62;
  if (len <= 50) return 52;
  if (len <= 72) return 44;
  return 38;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  const [fraunces, montserrat] = await Promise.all([
    loadGoogleFont("Fraunces", 600),
    loadGoogleFont("Montserrat", 600),
  ]);

  const fonts = [...fraunces, ...montserrat];

  // Rodziny do fontFamily. Jeśli nic się nie załadowało → undefined i pomijamy
  // opcję `fonts` (next/og użyje wbudowanego domyślnego fontu, bez crasha).
  const serif = fraunces.length ? "Fraunces" : montserrat.length ? "Montserrat" : undefined;
  const sans = montserrat.length ? "Montserrat" : fraunces.length ? "Fraunces" : undefined;
  const imageOpts = fonts.length ? { ...size, fonts } : { ...size };

  // Motyw: koncentryczne pierścienie wycentrowane poza prawą krawędzią.
  const ringCx = 1040;
  const ringCy = 315;
  const rings = [
    { r: 330, a: 0.22 },
    { r: 256, a: 0.32 },
    { r: 184, a: 0.42 },
    { r: 112, a: 0.5 },
  ];
  const stars = [
    { x: 720, y: 120, s: 5 },
    { x: 1120, y: 200, s: 4 },
    { x: 980, y: 520, s: 6 },
    { x: 800, y: 470, s: 3 },
    { x: 1150, y: 420, s: 4 },
  ];

  // Fallback: brak posta → sam wordmark.
  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${C.bg}, ${C.bgElevated})`,
            color: C.voice,
            fontFamily: serif,
            fontSize: 64,
            letterSpacing: "0.02em",
          }}
        >
          Cosmogram
        </div>
      ),
      imageOpts,
    );
  }

  const fm = post.frontmatter;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          position: "relative",
          background: `linear-gradient(135deg, ${C.bg} 0%, ${C.bgElevated} 100%)`,
          overflow: "hidden",
        }}
      >
        {/* Ember glow za motywem */}
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -120,
            width: 760,
            height: 760,
            background: `radial-gradient(circle at center, ${C.ember} 0%, transparent 65%)`,
            display: "flex",
          }}
        />

        {/* Pierścienie */}
        {rings.map((ring) => (
          <div
            key={ring.r}
            style={{
              position: "absolute",
              left: ringCx - ring.r,
              top: ringCy - ring.r,
              width: ring.r * 2,
              height: ring.r * 2,
              borderRadius: ring.r,
              border: `1px solid ${C.ring}${ring.a})`,
              display: "flex",
            }}
          />
        ))}

        {/* Gwiazdy */}
        {stars.map((star, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: star.x,
              top: star.y,
              width: star.s,
              height: star.s,
              borderRadius: star.s,
              background: C.accentDeep,
              display: "flex",
            }}
          />
        ))}

        {/* Blok tekstu (lewa) */}
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            height: "100%",
            width: 720,
            padding: "0 0 0 72px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontFamily: sans,
              fontSize: 22,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: C.accentDeep,
              marginBottom: 26,
            }}
          >
            {fm.category}
          </div>

          <div
            style={{
              display: "flex",
              fontFamily: serif,
              fontSize: titleSize(fm.title.length),
              lineHeight: 1.1,
              color: C.textPrimary,
              maxWidth: 640,
            }}
          >
            {fm.title}
          </div>
        </div>

        {/* Wordmark + linia (dół) */}
        <div
          style={{
            position: "absolute",
            left: 72,
            bottom: 56,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", width: 560, height: 1, background: C.line }} />
          <div style={{ display: "flex", fontFamily: sans, fontSize: 22, letterSpacing: "0.04em", color: C.voice }}>
            Cosmogram
          </div>
        </div>
      </div>
    ),
    imageOpts,
  );
}
