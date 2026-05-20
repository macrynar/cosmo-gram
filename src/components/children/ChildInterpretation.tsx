"use client";

import ReactMarkdown from "react-markdown";
import { Loader2 } from "lucide-react";

type Props = {
  text: string;
  loading?: boolean;
  childName: string;
};

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

  return (
    <div className="glass-card rounded-2xl p-6 border border-green-900/20">
      <div className="max-w-none">
        <ReactMarkdown
          components={{
            h2: ({ children }) => (
              <h2 className="text-base font-bold text-white mt-10 mb-4 pb-2 border-b border-green-900/30 first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-semibold text-slate-200 mt-6 mb-2">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-slate-300 text-sm leading-7 mb-4">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="text-green-300 font-semibold">{children}</strong>
            ),
            ul: ({ children }) => (
              <ul className="my-3 space-y-2 pl-4 list-disc marker:text-green-700">{children}</ul>
            ),
            li: ({ children }) => (
              <li className="text-slate-300 text-sm leading-7">{children}</li>
            ),
            em: ({ children }) => (
              <em className="text-slate-400 not-italic">{children}</em>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}
