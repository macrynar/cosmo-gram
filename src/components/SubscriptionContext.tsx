"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/components/AuthContext";

type SubscriptionContextType = {
  isPro: boolean;
  isLoading: boolean;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPro: false,
  isLoading: true,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setIsPro(false);
      setIsLoading(false);
      return;
    }

    fetch("/api/subscription-status", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then((data: { hasSubscription: boolean }) => {
        setIsPro(data.hasSubscription ?? false);
      })
      .catch(() => setIsPro(false))
      .finally(() => setIsLoading(false));
  }, [session, authLoading]);

  return (
    <SubscriptionContext.Provider value={{ isPro, isLoading }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
