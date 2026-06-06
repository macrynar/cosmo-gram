"use client";

import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  text: string;
  loading?: boolean;
  childName: string;
};

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
        p:      ({ children }) => <p className="text-slate-300 text-sm leading-relaxed mb-3 mt-0">{children}</p>,
        ul:     ({ children }) => <ul className="list-disc pl-5 text-slate-300 text-sm space-y-1 mb-3">{children}</ul>,
        ol:     ({ children }) => <ol className="list-decimal pl-5 text-slate-300 text-sm space-y-1 mb-3">{children}</ol>,
        li:     ({ children }) => <li>{children}</li>,
        strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
        hr:     () => <hr className="my-3" style={{ borderColor: "rgba(212,175,55,0.12)" }} />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function ChildInterpretation({ text, loading, childName }: Props) {
  if (loading) {
    return (
      <div
        className="rounded-2xl p-10 text-center"
        style={{ background: "rgba(5,4,14,0.65)", border: "0.5px solid rgba(212,175,55,0.14)", backdropFilter: "blur(18px)" }}
      >
        <div
          className="w-12 h-12 rounded-full animate-spin border-2 mx-auto mb-4"
          style={{ borderColor: "rgba(212,175,55,0.12)", borderTopColor: "#D4AF37" }}
        />
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
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.45)" }}>
          Karta Dziecka · {childName}
        </p>
      </div>

      {intro?.body && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl p-5"
          style={{ background: "rgba(5,4,14,0.65)", border: "0.5px solid rgba(212,175,55,0.14)", backdropFilter: "blur(18px)" }}
        >
          <MarkdownBlock content={intro.body} />
        </motion.div>
      )}

      {named.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {named.map((section, i) => {
            const isLastOdd = named.length % 2 !== 0 && i === named.length - 1;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-2xl p-5 sm:p-6${isLastOdd ? " xl:col-span-2" : ""}`}
                style={{
                  background:     "rgba(5,4,14,0.65)",
                  border:         "0.5px solid rgba(212,175,55,0.18)",
                  backdropFilter: "blur(18px)",
                }}
              >
                <p
                  className="text-xl sm:text-2xl text-white/90 italic leading-snug mb-3"
                  style={{ fontFamily: "var(--font-cormorant), serif" }}
                >
                  {section.header}
                </p>
                <div
                  className="h-px mb-4"
                  style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.18), transparent)" }}
                />
                <MarkdownBlock content={section.body} />
              </motion.div>
            );
          })}
        </div>
      )}

      <p className="text-center text-[10px] text-slate-700 pt-1">
        Obliczenia: astronomy-engine · Domy: Equal House · Interpretacja: Claude AI
      </p>
    </div>
  );
}
