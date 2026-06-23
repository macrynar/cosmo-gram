import type { FC, SVGProps } from "react";

// Minimalistyczny zestaw ikon nawigacji Cosmogram.
// Jedna grubość kreski, currentColor — kolor i rozmiar sterujemy z zewnątrz
// (np. className="w-5 h-5" + style={{ color }}), dokładnie jak w lucide-react,
// więc są drop-in zamiennikiem w BottomNav.

type IconProps = SVGProps<SVGSVGElement>;

// Bez width/height — rozmiar dziedziczymy z className (np. w-5 h-5), jak lucide.
const base: IconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

// Kosmogram — orbita: koło natalne z planetą na obwodzie
export const KosmogramIcon: FC<IconProps> = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.1" />
    <circle cx="12" cy="3" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

// Prognoza — księżyc z małą wypełnioną gwiazdą w zagłębieniu półksiężyca
export const PrognozaIcon: FC<IconProps> = (props) => (
  <svg {...base} {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    <path
      d="M16.8 4.2 17.4 5.6 18.8 6.2 17.4 6.8 16.8 8.2 16.2 6.8 14.8 6.2 16.2 5.6Z"
      fill="currentColor"
      stroke="none"
    />
  </svg>
);

// Chat — dymek rozmowy
export const ChatIcon: FC<IconProps> = (props) => (
  <svg {...base} {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// Match — dwa splecione okręgi: połączenie dwóch kart
export const MatchIcon: FC<IconProps> = (props) => (
  <svg {...base} {...props}>
    <circle cx="9.3" cy="12" r="5.2" />
    <circle cx="14.7" cy="12" r="5.2" />
  </svg>
);

// Konto — sylwetka
export const KontoIcon: FC<IconProps> = (props) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
  </svg>
);
