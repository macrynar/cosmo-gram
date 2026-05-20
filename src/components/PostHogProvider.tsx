"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

const PH_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const PH_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!PH_KEY || PH_KEY.includes("WKLEJ")) return;
    posthog.init(PH_KEY, {
      api_host: PH_HOST,
      person_profiles: "identified_only",
      capture_pageview: true,
      capture_pageleave: true,
    });
  }, []);

  return <>{children}</>;
}

// Helper — call from any client component
const isActive = () => typeof window !== "undefined" && !!PH_KEY && !PH_KEY.includes("WKLEJ");

export function track(event: string, properties?: Record<string, unknown>) {
  if (!isActive()) return;
  posthog.capture(event, properties);
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (!isActive()) return;
  posthog.identify(userId, traits);
}
