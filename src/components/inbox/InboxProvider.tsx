"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { useAuth } from "@/components/AuthContext";
import InboxOverlay from "@/components/inbox/InboxOverlay";

export interface InboxItemT {
  id: string;
  type: "letter" | "report" | "announcement" | "system" | "forecast";
  ref_id: string | null;
  title: string;
  preview: string | null;
  read_at: string | null;
  created_at: string;
}

export interface ActiveLetter {
  id: string;
  title: string;
  kind: "letter" | "report";
  tier: "free" | "premium" | "one_time";
  content_md: string;
  signature_label: string | null;
}

interface InboxCtx {
  items: InboxItemT[];
  unread: number;
  loading: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  refresh: () => Promise<void>;
  activeLetter: ActiveLetter | null;
  letterLoading: boolean;
  openItem: (item: InboxItemT) => Promise<void>;
  closeLetter: () => void;
}

const Ctx = createContext<InboxCtx | null>(null);

// Eksport kontekstu — pozwala podstawić mock w throwaway preview (weryfikacja UI).
export const InboxContext = Ctx;

export function useInbox(): InboxCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useInbox musi być w <InboxProvider>");
  return ctx;
}

export function InboxProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const token = session?.access_token;

  const [items, setItems] = useState<InboxItemT[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeLetter, setActiveLetter] = useState<ActiveLetter | null>(null);
  const [letterLoading, setLetterLoading] = useState(false);
  const autoOpened = useRef(false);

  const refresh = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch("/api/inbox", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setUnread(data.unread ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Pobierz przy wejściu / zmianie sesji
  useEffect(() => {
    if (token) refresh();
  }, [token, refresh]);

  const open = useCallback(() => { setIsOpen(true); refresh(); }, [refresh]);
  const close = useCallback(() => { setIsOpen(false); setActiveLetter(null); }, []);

  // Auto-otwarcie ze skrzynki z maila (?inbox=1)
  useEffect(() => {
    if (!autoOpened.current && token && new URLSearchParams(window.location.search).get("inbox") === "1") {
      autoOpened.current = true;
      open();
    }
  }, [token, open]);

  const openItem = useCallback(async (item: InboxItemT) => {
    if (!token) return;
    // Oznacz przeczytane (optymistycznie)
    if (!item.read_at) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read_at: new Date().toISOString() } : i)));
      setUnread((u) => Math.max(0, u - 1));
      fetch("/api/inbox/read", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      }).then((r) => r.ok && r.json()).then((d) => d && typeof d.unread === "number" && setUnread(d.unread)).catch(() => {});
    }

    if ((item.type === "letter" || item.type === "report") && item.ref_id) {
      setLetterLoading(true);
      try {
        const res = await fetch(`/api/letters?id=${item.ref_id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) setActiveLetter(await res.json());
      } finally {
        setLetterLoading(false);
      }
    }
  }, [token]);

  const closeLetter = useCallback(() => setActiveLetter(null), []);

  return (
    <Ctx.Provider value={{ items, unread, loading, isOpen, open, close, refresh, activeLetter, letterLoading, openItem, closeLetter }}>
      {children}
      <InboxOverlay />
    </Ctx.Provider>
  );
}
