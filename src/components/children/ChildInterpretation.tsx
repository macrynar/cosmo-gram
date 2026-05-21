"use client";

import { Sparkles, Loader2, Sun, Star, Heart, Briefcase, TrendingUp, Lightbulb } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  text: string;
  loading?: boolean;
  childName: string;
};

const SECTION_CONFIG = [
  { icon: Sun,        color: "text-emerald-400", border: "border-emerald-800/30", bg: "bg-emerald-900/10" },
  { icon: Star,       color: "text-green-400",   border: "border-green-800/25",   bg: "bg-green-900/8"   },
  { icon: Heart,      color: "text-teal-400",    border: "border-teal-800/30",    bg: "bg-teal-900/10"   },
  { icon: Briefcase,  color: "text-cyan-400",    border: "border-cyan-800/30",    bg: "bg-cyan-900/10"   },
  { icon: TrendingUp, color: "text-lime-400",    border: "border-lime-800/30",    bg: "bg-lime-900/10"   },
  { icon: Lightbulb,  color: "text-emerald-300", border: "border-emerald-800/25", bg: "bg-emerald-900/8" },
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
        strong: ({ children }) => <strong className="text-green-300 font-semibold">{children}</strong>,
        hr: () => <hr className="my-3 border-green-900/20" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function ChildInterpretation({ text, loading, childName }: Props) {
  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-10 text-center border border-green-900/20">
        <div className="w-12 h-12 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Czytam kartę {childName}…</p>
        <p className="text-slate-600 text-xs mt-1">Może potrwać do 30 sekund</p>
      </div>
    );
  }

  if (!text) return null;

  const sections = parseSections(text);
  const SKIP = /workflow|wstępny|sygnatury|krok\s*\d|top\s*\d/i;
  const intro = sections.find((s) => !s.header);
  const named = sections.filter((s) => s.header && !SKIP.test(s.header));

  return (
    <div className="glass-card rounded-2xl overflow-hidden border border-green-900/20">
      <div className="px-5 py-4 border-b border-green-900/25 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-green-400" />
        <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Analiza Cosmogram AI · {childName}</h3>
      </div>

      <div className="px-5 py-5 space-y-4">
        {intro?.body && (
          <div className="rounded-xl border border-green-900/25 bg-green-950/10 p-4">
            <MarkdownBlock content={intro.body} />
          </div>
        )}

        {named.length > 0 && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {named.map((section, i) => {
              const cfg = SECTION_CONFIG[i % SECTION_CONFIG.length];
              const Icon = cfg.icon;
              const isLastOdd = named.length % 2 !== 0 && i === named.length - 1;
              return (
                <div key={i} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4${isLastOdd ? " xl:col-span-2" : ""}`}>
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

        {named.length === 0 && intro?.body && null}
      </div>

      <div className="px-5 pb-4 text-xs text-slate-600 border-t border-green-900/15 pt-3">
        Obliczenia: astronomy-engine · Domy: Equal House · Interpretacja: Claude AI
      </div>
    </div>
  );
}
