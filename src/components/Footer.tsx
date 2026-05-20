import Image from "next/image";

export default function Footer() {
  const year = new Date().getFullYear();

  const links = [
    { label: "Funkcje", href: "#features" },
    { label: "Jak to działa", href: "#how-it-works" },
    { label: "Plany", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  const legal = [
    { label: "Polityka prywatności", href: "#" },
    { label: "Regulamin", href: "#" },
  ];

  return (
    <footer className="relative border-t border-amber-900/20 bg-[#03010d]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <a href="#" className="flex items-center gap-2 group">
              <Image src="/logo-b-refined.svg" alt="Cosmogram" width={132} height={33} className="h-8 w-auto [filter:brightness(0)_invert(1)]" />
            </a>
            <p className="text-xs text-slate-600 max-w-[260px] text-center md:text-left leading-relaxed">
              Kosmogram, relacje i astrologiczne wsparcie AI zaprojektowane dla współczesnych użytkowników.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-700 font-medium mb-1">Nawigacja</p>
            {links.map((link) => (
              <a key={link.label} href={link.href} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-700 font-medium mb-1">Informacje prawne</p>
            {legal.map((link) => (
              <a key={link.label} href={link.href} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div className="my-8 h-px bg-gradient-to-r from-transparent via-amber-900/30 to-transparent" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700">
          <p>© {year} Cosmogram. Wszelkie prawa zastrzeżone.</p>
          <p>Stworzone, by pomóc Ci lepiej zrozumieć siebie i bliskich.</p>
        </div>
      </div>
    </footer>
  );
}
