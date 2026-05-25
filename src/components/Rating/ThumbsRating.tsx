"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { track } from "@/components/PostHogProvider";
import { useAuth } from "@/components/AuthContext";

type Props = {
  readingId: string;
  className?: string;
};

export function ThumbsRating({ readingId, className = "" }: Props) {
  const { session } = useAuth();
  const [rated, setRated] = useState<"up" | "down" | null>(null);
  const [loading, setLoading] = useState(false);

  if (!session) return null;

  const handleRate = async (thumbs: 1 | -1) => {
    if (loading || rated) return;
    setLoading(true);
    try {
      await fetch("/api/rate-reading", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reading_id: readingId, thumbs }),
      });
      setRated(thumbs === 1 ? "up" : "down");
      track("reading_thumbs", { reading_id: readingId, thumbs });
    } catch {
      // silent fail — feedback is non-critical
    } finally {
      setLoading(false);
    }
  };

  if (rated) {
    return (
      <div className={`text-sm text-slate-500 mt-8 pt-6 border-t border-slate-800 ${className}`}>
        Dzięki za feedback ✨
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 mt-8 pt-6 border-t border-slate-800 ${className}`}
    >
      <span className="text-sm text-slate-500">Pomocna interpretacja?</span>
      <button
        onClick={() => handleRate(1)}
        disabled={loading}
        className="p-1.5 rounded-lg text-slate-500 hover:text-green-400 hover:bg-green-900/20 transition-colors disabled:opacity-40"
        title="Tak"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleRate(-1)}
        disabled={loading}
        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors disabled:opacity-40"
        title="Nie"
      >
        <ThumbsDown className="w-4 h-4" />
      </button>
    </div>
  );
}
