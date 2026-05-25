"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/components/AuthContext";

type SubscriptionStatus = {
  isPro: boolean;
  status: string;
  currentPeriodEnd: string | null;
  isLoading: boolean;
  refresh: () => void;
};

const SubscriptionContext = createContext<SubscriptionStatus>({
  isPro: false,
  status: "free",
  currentPeriodEnd: null,
  isLoading: true,
  refresh: () => {},
});

type ApiResponse = {
  hasSubscription: boolean;
  status: string;
  currentPeriodEnd: string | null;
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [status, setStatus] = useState("free");
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      // 1. Check DB
      const res = await fetch("/api/subscription-status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json() as ApiResponse;

      if (data.hasSubscription) {
        setIsPro(true);
        setStatus(data.status);
        setCurrentPeriodEnd(data.currentPeriodEnd);
        return;
      }

      // 2. DB says no subscription — sync with Stripe directly (handles missed webhooks)
      const syncRes = await fetch("/api/sync-subscription", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const syncData = await syncRes.json() as ApiResponse & { synced?: boolean };
      setIsPro(syncData.hasSubscription ?? false);
      setStatus(syncData.status ?? "free");
      setCurrentPeriodEnd(syncData.currentPeriodEnd ?? null);
    } catch {
      setIsPro(false);
      setStatus("free");
      setCurrentPeriodEnd(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setIsPro(false);
      setStatus("free");
      setCurrentPeriodEnd(null);
      setIsLoading(false);
      return;
    }
    load(session.access_token);
  }, [session, authLoading, load]);

  const refresh = useCallback(() => {
    if (session) load(session.access_token);
  }, [session, load]);

  return (
    <SubscriptionContext.Provider value={{ isPro, status, currentPeriodEnd, isLoading, refresh }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
