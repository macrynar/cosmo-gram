"use client";

import { CalendarDays, Loader2, SunMedium } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  text: string;
  loading: boolean;
  dateLabel: string;
}

export default function DailyReading({ text, loading, dateLabel }: Props) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-purple-900/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SunMedium className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Dzienny Horoskop AI</h3>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
          <CalendarDays className="w-3.5 h-3.5" />
          {dateLabel}
        </span>
      </div>

      <div className="px-5 py-5">
        {loading ? (
          <div className="flex items-center gap-3 text-slate-400 py-10 justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            <span className="text-sm">AI układa Twój dzienny horoskop…</span>
          </div>
        ) : text ? (
          <div className="prose prose-invert prose-sm max-w-none prose-headings:text-slate-100 prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-slate-100 prose-hr:border-purple-900/40">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {text}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Dzienny horoskop pojawi się tutaj po wygenerowaniu kosmogramu.
          </p>
        )}
      </div>
    </div>
  );
}
