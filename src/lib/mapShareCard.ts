// Canvas-based Cosmo Map share cards — 1080×1920 Story format
// No external libraries

import type { ActiveLine } from "@/lib/astrocartography";
import { PLANET_PL, PLANET_EMOJI, LINE_PL_SHORT } from "@/lib/astrocartography";

const W = 1080;
const H = 1920;
const PAD = 80;
const BG = "#0d0a1a";
const GOLD = "#c89968";

type CityShareItem = {
  city_name_pl: string;
  city_country_pl: string;
  lines: ActiveLine[];
  interpretation?: string;
};

function drawBg(ctx: CanvasRenderingContext2D, accentColor = "#4b2d8c") {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  const grad = ctx.createRadialGradient(W / 2, H * 0.25, 0, W / 2, H * 0.25, W * 0.9);
  grad.addColorStop(0, accentColor + "22");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

function drawHeader(ctx: CanvasRenderingContext2D, title: string, subtitle?: string) {
  // Logo wordmark
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "500 28px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("✦ Cosmo Map", PAD, 88);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 60px Georgia, 'Times New Roman', serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(title, W / 2, 200);

  if (subtitle) {
    ctx.font = "300 28px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(subtitle, W / 2, 282);
  }
}

function drawFooter(ctx: CanvasRenderingContext2D) {
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("cosmogram.pl", W / 2, H - 100);
}

function drawDivider(ctx: CanvasRenderingContext2D, y: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, y);
  ctx.lineTo(W - PAD, y);
  ctx.stroke();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// ── Typ 1: Pełna mapa (simplified — shows top lines as decorative arcs) ──────
export async function generateFullMapCard(
  scenarioLabel: string,
  topCities: CityShareItem[],
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  await document.fonts.ready;

  drawBg(ctx, "#2d1a6e");
  drawHeader(ctx, "Moja Mapa Mocy");

  // Decorative SVG-like world map silhouette (simplified as colored lines)
  const lineColors = ["#c89968", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];
  ctx.font = "500 30px system-ui, sans-serif";
  ctx.fillStyle = GOLD;
  ctx.textAlign = "center";
  ctx.fillText(`Scenariusz: ${scenarioLabel}`, W / 2, 360);

  // Draw decorative planetary line arcs
  ctx.save();
  const mapY = 440;
  const mapH = 640;
  const mapW = W - PAD * 2;

  // Draw world outline rectangle
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD, mapY, mapW, mapH);

  // Draw latitude grid lines
  for (let i = 0; i <= 4; i++) {
    const y = mapY + (i * mapH) / 4;
    ctx.beginPath();
    ctx.moveTo(PAD, y);
    ctx.lineTo(PAD + mapW, y);
    ctx.stroke();
  }
  for (let i = 0; i <= 6; i++) {
    const x = PAD + (i * mapW) / 6;
    ctx.beginPath();
    ctx.moveTo(x, mapY);
    ctx.lineTo(x, mapY + mapH);
    ctx.stroke();
  }

  // Draw decorative lines representing planetary lines
  topCities.slice(0, 6).forEach(({ lines }, idx) => {
    const top = lines[0];
    if (!top) return;
    const color = lineColors[idx % lineColors.length];
    ctx.strokeStyle = color + "cc";
    ctx.lineWidth = 3;
    ctx.setLineDash(top.type === "IC" || top.type === "DSC" ? [12, 8] : []);
    const x = PAD + ((top.distance_km / 20000) * mapW + idx * (mapW / 7));
    ctx.beginPath();
    ctx.moveTo(Math.min(PAD + mapW - 10, x % mapW + PAD), mapY + 10);
    ctx.lineTo(Math.min(PAD + mapW - 10, x % mapW + PAD), mapY + mapH - 10);
    ctx.stroke();
    ctx.setLineDash([]);
  });
  ctx.restore();

  drawDivider(ctx, 1120);

  // Top 3 cities
  const top3 = topCities.slice(0, 3);
  top3.forEach(({ city_name_pl, lines }, i) => {
    const top = lines[0];
    if (!top) return;
    const y = 1160 + i * 160;
    ctx.font = "700 48px Georgia, serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(`${PLANET_EMOJI[top.planet]} ${city_name_pl}`, W / 2, y);
    ctx.font = "300 28px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText(`${PLANET_PL[top.planet]} ${LINE_PL_SHORT[top.type]} · ${top.distance_km} km`, W / 2, y + 58);
  });

  drawFooter(ctx);

  return await new Promise<Blob>((res, rej) => {
    canvas.toBlob(b => b ? res(b) : rej(new Error("Canvas toBlob failed")), "image/png");
  });
}

// ── Typ 2: Top 5 miast mocy ───────────────────────────────────────────────────
export async function generateTop5Card(
  scenarioLabel: string,
  topCities: CityShareItem[],
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  await document.fonts.ready;

  drawBg(ctx, "#1a2d6e");
  drawHeader(ctx, "Moje 5 miast mocy");

  ctx.font = "300 28px system-ui, sans-serif";
  ctx.fillStyle = GOLD + "aa";
  ctx.textAlign = "center";
  ctx.fillText(scenarioLabel.toUpperCase(), W / 2, 296);

  const cities = topCities.slice(0, 5);
  const cardH = 200;
  const startY = 380;
  const cardPad = 16;

  cities.forEach(({ city_name_pl, city_country_pl, lines }, i) => {
    const top = lines[0];
    if (!top) return;
    const y = startY + i * (cardH + 12);

    // Card background
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    ctx.beginPath();
    ctx.roundRect(PAD, y, W - PAD * 2, cardH, 20);
    ctx.fill();

    // Planet emoji (left)
    ctx.font = "72px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(PLANET_EMOJI[top.planet], PAD + cardPad + 52, y + cardH / 2);

    // City name
    ctx.font = "600 44px Georgia, serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(city_name_pl, PAD + cardPad + 120, y + 36);

    // Country + planet line
    ctx.font = "300 24px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(`${city_country_pl} · ${PLANET_PL[top.planet]} ${LINE_PL_SHORT[top.type]}`, PAD + cardPad + 120, y + 98);

    // Distance (right)
    ctx.font = "700 32px system-ui, sans-serif";
    ctx.fillStyle = GOLD;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(`${top.distance_km} km`, W - PAD - cardPad, y + cardH / 2);
  });

  drawFooter(ctx);

  return await new Promise<Blob>((res, rej) => {
    canvas.toBlob(b => b ? res(b) : rej(new Error("Canvas toBlob failed")), "image/png");
  });
}

// ── Typ 3: Anty-mapa (Saturn + Pluto cities) ──────────────────────────────────
export async function generateAntiMapCard(
  hardCities: CityShareItem[],
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  await document.fonts.ready;

  drawBg(ctx, "#3d1010");
  drawHeader(ctx, "Miejsca które\nmogą cię wyzywać", "Saturn i Pluton — intensywna transformacja");

  const cities = hardCities.slice(0, 3);
  const cardH = 320;
  const startY = 380;

  cities.forEach(({ city_name_pl, city_country_pl, lines, interpretation }, i) => {
    const top = lines[0];
    if (!top) return;
    const y = startY + i * (cardH + 16);

    // Card bg
    ctx.fillStyle = "rgba(255,60,60,0.06)";
    ctx.beginPath();
    ctx.roundRect(PAD, y, W - PAD * 2, cardH, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,100,100,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // City name
    ctx.font = "700 52px Georgia, serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(city_name_pl, PAD + 24, y + 30);

    // Country
    ctx.font = "300 24px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText(city_country_pl, PAD + 24, y + 94);

    // Planet + type
    ctx.font = "400 28px system-ui, sans-serif";
    ctx.fillStyle = "#f87171";
    ctx.fillText(`${PLANET_EMOJI[top.planet]} ${PLANET_PL[top.planet]} ${LINE_PL_SHORT[top.type]}`, PAD + 24, y + 134);

    // Short interpretation (2 lines max)
    const desc = interpretation
      ? interpretation.replace(/#{1,3}[^\n]+\n/g, "").replace(/\*\*/g, "").trim().slice(0, 160)
      : "Intensywna energia transformacji — wzmaga napięcie i wewnętrzne wyzwania.";

    ctx.font = "italic 26px Georgia, serif";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    const descLines = wrapText(ctx, desc, W - PAD * 2 - 48);
    descLines.slice(0, 3).forEach((line, li) => {
      ctx.fillText(line, PAD + 24, y + 186 + li * 40);
    });
  });

  drawFooter(ctx);

  return await new Promise<Blob>((res, rej) => {
    canvas.toBlob(b => b ? res(b) : rej(new Error("Canvas toBlob failed")), "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
