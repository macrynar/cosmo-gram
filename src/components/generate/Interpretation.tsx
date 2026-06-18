"use client";

import { motion } from "framer-motion";
import { Sparkles, Sun, Star, Heart, Briefcase, TrendingUp, Moon, Flame, Compass } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import GeneratingLoader from "@/components/GeneratingLoader";

interface Props {
  text: string;
  loading: boolean;
}

const SECTION_CONFIG = [
  { icon: Sun,        color: "#D4AF37",  border: "rgba(212,175,55,0.20)",  bg: "rgba(212,175,55,0.06)"  },
  { icon: Moon,       color: "#93c5fd",  border: "rgba(147,197,253,0.18)", bg: "rgba(59,130,246,0.06)"  },
  { icon: Star,       color: "#c4b5fd",  border: "rgba(196,181,253,0.20)", bg: "rgba(124,58,237,0.06)"  },
  { icon: Heart,      color: "#f9a8d4",  border: "rgba(249,168,212,0.20)", bg: "rgba(236,72,153,0.06)"  },
  { icon: Briefcase,  color: "#67e8f9",  border: "rgba(103,232,249,0.18)", bg: "rgba(6,182,212,0.06)"   },
  { icon: Flame,      color: "#fca5a5",  border: "rgba(252,165,165,0.20)", bg: "rgba(239,68,68,0.06)"   },
  { icon: Compass,    color: "#a5b4fc",  border: "rgba(165,180,252,0.18)", bg: "rgba(99,102,241,0.06)"  },
  { icon: TrendingUp, color: "#C5A059",  border: "rgba(197,160,89,0.20)",  bg: "rgba(197,160,89,0.06)"  },
];

interface Section {
  header: string | null;
  body: string;
}

function parseSections(text: string): Section[] {
  const firstHeading = text.search(/^#{1,4}\s+/m);
  const body = firstHeading >= 0 ? text.slice(firstHeading) : text;
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const sections: Section[] = [];
  let currentHeader: string | null = null;
  let currentBody: string[] = [];

  const pushCurrent = () => {
    const b = currentBody.join("\n").trim();
    if (currentHeader || b) sections.push({ header: currentHeader, body: b });
  };

  for (const line of lines) {
    const heading = line.match(/^#{1,4}\s+(.+)$/);
    if (heading) {
      pushCurrent();
      currentHeader = heading[1].trim();
      currentBody = [];
      continue;
    }
    currentBody.push(line);
  }
  pushCurrent();
  return sections;
}

function MarkdownBlock({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="text-slate-300 text-sm leading-relaxed mb-3">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 text-slate-300 text-sm space-y-1 mb-3">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 text-slate-300 text-sm space-y-1 mb-3">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        strong: ({ children }) => <strong className="text-slate-100 font-semibold">{children}</strong>,
        hr: () => <hr className="my-3" style={{ borderColor: "rgba(212,175,55,0.15)" }} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function Interpretation({ text, loading }: Props) {
  const sections = text ? parseSections(text) : [];

  const SKIP = /workflow|wstępny|sygnatury|krok\s*\d|top\s*\d/i;
  const intro = sections.find((s) => !s.header);
  const named = sections.filter((s) => s.header && !SKIP.test(s.header));
  const hasMissingSections = named.length > 0 && named.length < 8;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(5,4,14,0.65)",
        border: "0.5px solid rgba(212,175,55,0.18)",
        backdropFilter: "blur(18px)",
      }}
    >
      {/* Panel header */}
      <div
        className="px-5 py-4 flex items-center gap-2"
        style={{ borderBottom: "0.5px solid rgba(212,175,55,0.14)" }}
      >
        <Sparkles className="w-4 h-4" style={{ color: "#D4AF37" }} />
        <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Analiza Cosmogram AI</h3>
      </div>

      <div className="px-5 py-5">
        {loading ? (
          <GeneratingLoader
            phrases={[
              "Odczytuję pozycje planet…",
              "Mierzę kąty między ciałami niebieskimi…",
              "Analizuję aspekty i domy…",
              "Splatam wątki Twojej historii…",
              "Dobieram właściwe słowa…",
            ]}
          />
        ) : text ? (
          <div className="space-y-4">
            {intro?.body && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="rounded-xl p-4"
                style={{
                  background: "rgba(212,175,55,0.06)",
                  border: "0.5px solid rgba(212,175,55,0.18)",
                }}
              >
                <MarkdownBlock content={intro.body} />
              </motion.div>
            )}

            {hasMissingSections && (
              <div
                className="rounded-xl px-4 py-3 text-xs"
                style={{
                  background: "rgba(212,175,55,0.08)",
                  border: "0.5px solid rgba(212,175,55,0.30)",
                  color: "#F3E5AB",
                }}
              >
                Wygenerowano {named.length}/8 sekcji interpretacji. Spróbuj wygenerować ponownie, aby uzyskać pełny raport.
              </div>
            )}

            {named.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {named.map((section, i) => {
                  const cfg = SECTION_CONFIG[i % SECTION_CONFIG.length];
                  const Icon = cfg.icon;
                  const isLastOdd = named.length % 2 !== 0 && i === named.length - 1;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      className={`rounded-xl p-4${isLastOdd ? " lg:col-span-2" : ""}`}
                      style={{
                        background: cfg.bg,
                        border: `0.5px solid ${cfg.border}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2" style={{ color: cfg.color }}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <h4 className="text-sm font-semibold">{section.header}</h4>
                      </div>
                      <MarkdownBlock content={section.body} />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div
        className="px-5 pb-4 text-xs text-slate-600 pt-3"
        style={{ borderTop: "0.5px solid rgba(212,175,55,0.10)" }}
      >
        Obliczenia: astronomy-engine · Domy: Equal House · Interpretacja: Claude AI
      </div>
    </div>
  );
}
