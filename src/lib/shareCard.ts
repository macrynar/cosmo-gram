// Canvas-based share card generator — 1080×1920 Story format
// Vanilla Canvas 2D API, no external libraries

export type NatalCardData = {
  oneLinerText: string;
  bigThree: {
    sun: { sign: string; house: number };
    moon: { sign: string; house: number };
    rising: { sign: string };
  };
};

export type MatchCardData = {
  nameA: string;
  nameB: string;
  scoreOverall: number;
  scoreLabel: string;
  scores: {
    communication: number;
    passion: number;
    values: number;
    challenges: number;
  };
};

const W = 1080;
const H = 1920;
const BG = "#1a1d3a";
const PAD = 80;

// Draw the CosmoIcon SVG logo onto the canvas
async function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="22 26 38 48" width="${size}" height="${size}">
    <g transform="translate(46,50)" fill="white" stroke="white" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M 12.67,-17.99 A 22,22 0 1,0 12.67,17.99 A 18,18 0 1,1 12.67,-17.99 Z"/>
      <circle cx="4" cy="0" r="4" stroke="none"/>
    </g>
  </svg>`;
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });
  ctx.drawImage(img, x, y, size, size);
  URL.revokeObjectURL(url);
}

// Wrap text to fit within maxWidth, return array of lines
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// Draw centered multi-line text, return final y
function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  startY: number,
  lineHeight: number,
): number {
  lines.forEach((line, i) => {
    ctx.fillText(line, W / 2, startY + i * lineHeight);
  });
  return startY + lines.length * lineHeight;
}

function scoreColor(score: number): string {
  if (score > 70) return "#4ade80";
  if (score >= 50) return "#facc15";
  return "#f87171";
}

export async function generateNatalCard(data: NatalCardData): Promise<Blob> {
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Subtle gradient overlay
  const grad = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, W * 0.8);
  grad.addColorStop(0, "rgba(100, 80, 180, 0.15)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Logo + wordmark (y=80)
  const logoSize = 60;
  await drawLogo(ctx, PAD, 80, logoSize);
  ctx.fillStyle = "#ffffff";
  ctx.font = "500 32px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("cosmogram", PAD + logoSize + 16, 80 + logoSize / 2);

  // One-liner quote — centered vertically in y=480–1200
  ctx.fillStyle = "#ffffff";
  ctx.font = "italic 54px Georgia, 'Times New Roman', serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  const quoteMaxW = W - PAD * 2;
  const quoteLines = wrapText(ctx, `"${data.oneLinerText}"`, quoteMaxW);
  const quoteLineH = 76;
  const quoteTotalH = quoteLines.length * quoteLineH;
  const quoteStartY = 480 + (720 - quoteTotalH) / 2;
  drawCenteredText(ctx, quoteLines, quoteStartY, quoteLineH);

  // Decorative line above Big Three
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, 1360);
  ctx.lineTo(W - PAD, 1360);
  ctx.stroke();

  // Big Three section (y=1400–1640)
  const bigThree = [
    { glyph: "☉", label: data.bigThree.sun.sign.toUpperCase(), sub: `dom ${data.bigThree.sun.house}` },
    { glyph: "☾", label: data.bigThree.moon.sign.toUpperCase(), sub: `dom ${data.bigThree.moon.house}` },
    { glyph: "↑", label: data.bigThree.rising.sign.toUpperCase(), sub: "Ascendent" },
  ];

  const colW = (W - PAD * 2) / 3;

  bigThree.forEach((item, i) => {
    const cx = PAD + colW * i + colW / 2;

    // Glyph
    ctx.fillStyle = "#ffffff";
    ctx.font = "64px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(item.glyph, cx, 1400);

    // Sign name
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(item.label, cx, 1500);

    // House label
    ctx.font = "18px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(item.sub, cx, 1560);
  });

  // Watermark
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("cosmogram.pl", W / 2, 1820);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")), "image/png");
  });
}

export async function generateMatchCard(data: MatchCardData): Promise<Blob> {
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  // Gradient overlay
  const grad = ctx.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, W);
  grad.addColorStop(0, "rgba(120, 60, 160, 0.15)");
  grad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Logo
  const logoSize = 60;
  await drawLogo(ctx, PAD, 80, logoSize);
  ctx.fillStyle = "#ffffff";
  ctx.font = "500 32px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("cosmogram", PAD + logoSize + 16, 80 + logoSize / 2);

  // Names (y=320)
  const names = `${data.nameA || "Osoba 1"} × ${data.nameB || "Osoba 2"}`;
  ctx.fillStyle = "#ffffff";
  ctx.font = "500 52px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  const nameLines = wrapText(ctx, names, W - PAD * 2);
  drawCenteredText(ctx, nameLines, 320, 70);

  // Big score (y=620)
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 240px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(String(data.scoreOverall), W / 2, 560);

  // "/100" (y=820)
  ctx.font = "64px Georgia, serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText("/100", W / 2, 810);

  // Score label (y=1000)
  ctx.font = "500 36px system-ui, sans-serif";
  ctx.fillStyle = "#c89968";
  ctx.fillText(data.scoreLabel, W / 2, 1000);

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, 1140);
  ctx.lineTo(W - PAD, 1140);
  ctx.stroke();

  // 2×2 grid of sub-scores (y=1180–1700)
  const categoryItems = [
    { emoji: "💬", label: "Komunikacja", score: data.scores.communication },
    { emoji: "🔥", label: "Namiętność", score: data.scores.passion },
    { emoji: "🌿", label: "Wartości", score: data.scores.values },
    { emoji: "⚡", label: "Wyzwania", score: data.scores.challenges },
  ];

  const cellW = (W - PAD * 2) / 2;
  const cellH = 210;
  const gridStartY = 1180;

  categoryItems.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = PAD + col * cellW + cellW / 2;
    const cy = gridStartY + row * cellH;

    // Cell background
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    const cellPad = 10;
    ctx.beginPath();
    ctx.roundRect(PAD + col * cellW + cellPad, cy + cellPad, cellW - cellPad * 2, cellH - cellPad * 2, 16);
    ctx.fill();

    // Emoji
    ctx.font = "40px system-ui, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(item.emoji, cx, cy + 30);

    // Label
    ctx.font = "24px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText(item.label, cx, cy + 82);

    // Score
    ctx.font = "bold 48px system-ui, sans-serif";
    ctx.fillStyle = scoreColor(item.score);
    ctx.fillText(String(item.score), cx, cy + 120);
  });

  // Watermark
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("cosmogram.pl", W / 2, 1820);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")), "image/png");
  });
}

// Extract short quote-like sentences from AI interpretation text
export function extractShareableQuotes(interpretation: string, count = 5): string[] {
  const clean = interpretation
    .replace(/^#{1,3}[^\n]+\n/gm, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/["""]/g, "")
    .replace(/^\s*[-•]\s+/gm, "");

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  const quotes = sentences.filter(s => {
    const words = s.split(/\s+/).filter(Boolean);
    return words.length >= 5 && words.length <= 18 &&
      !s.startsWith("Wyobraź") &&
      !s.startsWith("Oto") &&
      !s.startsWith("W tym") &&
      !s.startsWith("Bez");
  });

  // Sort: prefer shorter sentences (punchier)
  const sorted = [...quotes].sort((a, b) => a.split(/\s+/).length - b.split(/\s+/).length);
  return sorted.slice(0, count);
}

// Determine which house a planet (by ecliptic longitude) is in
export function getPlanetHouse(planetLong: number, houses: { house: number; longitude: number }[]): number {
  if (!houses || houses.length < 12) return 1;
  const lng = ((planetLong % 360) + 360) % 360;
  const sorted = [...houses]
    .map(h => ({ ...h, longitude: ((h.longitude % 360) + 360) % 360 }))
    .sort((a, b) => a.longitude - b.longitude);

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i].longitude;
    const next = sorted[(i + 1) % sorted.length].longitude;
    if (curr <= next) {
      if (lng >= curr && lng < next) return sorted[i].house;
    } else {
      if (lng >= curr || lng < next) return sorted[i].house;
    }
  }
  return sorted[0].house;
}

export function matchScoreLabel(score: number): string {
  if (score >= 80) return "Wysoka kompatybilność";
  if (score >= 60) return "Dobra kompatybilność";
  if (score >= 40) return "Umiarkowana kompatybilność";
  return "Wymagająca kompatybilność";
}
