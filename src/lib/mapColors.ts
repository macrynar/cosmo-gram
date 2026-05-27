import type { Planet } from "@/lib/astrocartography";

export const PLANET_LINE_COLORS: Record<Planet, string> = {
  Sun:     "#FFA500",
  Moon:    "#B0C4DE",
  Mercury: "#00C853",
  Venus:   "#E91E63",
  Mars:    "#F44336",
  Jupiter: "#9C27B0",
  Saturn:  "#795548",
  Uranus:  "#03A9F4",
  Neptune: "#009688",
  Pluto:   "#4A148C",
};

export const PLANET_GLYPHS: Record<Planet, string> = {
  Sun:     "☉",
  Moon:    "☽",
  Mercury: "☿",
  Venus:   "♀",
  Mars:    "♂",
  Jupiter: "♃",
  Saturn:  "♄",
  Uranus:  "♅",
  Neptune: "♆",
  Pluto:   "⯓",
};
