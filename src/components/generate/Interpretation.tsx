"use client";

import { Sparkles, Loader2, Sun, Star, Heart, Briefcase, TrendingUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  text: string;
  loading: boolean;
}

const SECTION_CONFIG = [
  { icon: Sun,         color: "text-amber-400",  border: "border-amber-800/30",  bg: "bg-amber-900/10"  },
  { icon: Star,        color: "text-amber-300",  border: "border-amber-800/25",  bg: "bg-amber-900/8"   },
  { icon: Heart,       color: "text-pink-400",   border: "border-pink-800/30",   bg: "bg-pink-900/10"   },
  { icon: Briefcase,   color: "text-blue-400",   border: "border-blue-800/30",   bg: "bg-blue-900/10"   },
  { icon: TrendingUp,  color: "text-green-400",  border: "border-green-800/30",  bg: "bg-green-900/10"  },
];

interface Section {
  header: string | null;
  body: string;
}

function parseSections(text: string): Section[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const sections: Section[] = [];
  let currentHeader: string | null = null;
  let currentBody: string[] = [];

  const pushCurrent = () => {
    const body = currentBody.join("\n").trim();
    if (currentHeader || body) {
      sections.push({ header: currentHeader, body });
    }
  };

  for (const line of lines) {
    const heading = line.match(/^##\s+(.+)$/);
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
        hr: () => <hr className="my-3 border-amber-900/20" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function Interpretation({ text, loading }: Props) {
  const sections = text ? parseSections(text) : [];

  // Separate intro (no header) from named sections; strip AI workflow leakage
  const SKIP = /workflow|wstępny|sygnatury|krok\s*\d|top\s*\d/i;
  const intro = sections.find((s) => !s.header);
  const named = sections.filter((s) => s.header && !SKIP.test(s.header));
  const hasMissingSections = named.length > 0 && named.length < 7;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Panel header */}
      <div className="px-5 py-4 border-b border-amber-900/25 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Analiza Cosmogram AI</h3>
      </div>

      <div className="px-5 py-5">
        {loading ? (
          <div className="flex items-center gap-3 text-slate-400 py-12 justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            <span className="text-sm">AI analizuje Twój kosmogram…</span>
          </div>
        ) : text ? (
          <div className="space-y-4">
            {/* Intro paragraph (if any) */}
            {intro?.body && (
              <div className="rounded-xl border border-amber-900/25 bg-amber-950/10 p-4">
                <MarkdownBlock content={intro.body} />
              </div>
            )}

            {hasMissingSections && (
              <div className="rounded-xl border border-amber-700/40 bg-amber-900/10 px-4 py-3 text-amber-300 text-xs">
                Wygenerowano {named.length}/7 sekcji interpretacji. Spróbuj wygenerować ponownie, aby uzyskać pełny raport.
              </div>
            )}

            {/* Named sections grid */}
            {named.length > 0 && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {named.map((section, i) => {
                  const cfg = SECTION_CONFIG[i % SECTION_CONFIG.length];
                  const Icon = cfg.icon;
                  const isLastOdd = named.length % 2 !== 0 && i === named.length - 1;
                  return (
                    <div
                      key={i}
                      className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4${isLastOdd ? " xl:col-span-2" : ""}`}
                    >
                      <div className={`flex items-center gap-2 mb-2 ${cfg.color}`}>
                        <Icon className="w-4 h-4 shrink-0" />
                        <h4 className="text-sm font-semibold">{section.header}</h4>
                      </div>
                      <MarkdownBlock content={section.body} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="px-5 pb-4 text-xs text-slate-600 border-t border-amber-900/15 pt-3">
        Obliczenia: astronomy-engine · Domy: Equal House · Interpretacja: Claude AI
      </div>
    </div>
  );
}
