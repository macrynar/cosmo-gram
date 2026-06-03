"use client";

import { useEffect, useState } from "react";

const KEY = "cosmo_streak_v1";

type StreakData = {
  current: number;
  longest: number;
  lastDate: string;          // YYYY-MM-DD
  shownMilestones: number[]; // e.g. [7, 30]
};

const MILESTONES = [7, 30, 90, 180, 365];

function todayStr() { return new Date().toISOString().slice(0, 10); }
function yesterdayStr() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function load(): StreakData {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
    if (raw) return JSON.parse(raw) as StreakData;
  } catch { /* noop */ }
  return { current: 0, longest: 0, lastDate: "", shownMilestones: [] };
}

function save(d: StreakData) {
  try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* noop */ }
}

export type StreakResult = {
  current: number;
  longest: number;
  milestone: number | null;     // just-unlocked milestone (null if none)
  dismissMilestone: () => void;
};

export function useStreak(): StreakResult {
  const [data, setData]     = useState<StreakData>({ current: 0, longest: 0, lastDate: "", shownMilestones: [] });
  const [milestone, setMilestone] = useState<number | null>(null);

  useEffect(() => {
    const stored = load();
    const today  = todayStr();
    const yesterday = yesterdayStr();
    let next = { ...stored };

    if (stored.lastDate === today) {
      // already counted today — just hydrate state
    } else if (stored.lastDate === yesterday) {
      next.current  = stored.current + 1;
      next.longest  = Math.max(stored.longest, next.current);
      next.lastDate = today;
    } else if (stored.lastDate === "") {
      next.current  = 1;
      next.longest  = 1;
      next.lastDate = today;
    } else {
      // streak broken
      next.current  = 1;
      next.lastDate = today;
    }

    const newM = MILESTONES.find(m => next.current === m && !next.shownMilestones.includes(m));
    if (newM) {
      next.shownMilestones = [...next.shownMilestones, newM];
      setMilestone(newM);
    }

    save(next);
    setData(next);
  }, []);

  return {
    current:          data.current,
    longest:          data.longest,
    milestone,
    dismissMilestone: () => setMilestone(null),
  };
}
