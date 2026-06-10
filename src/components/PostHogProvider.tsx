"use client";

import { useEffect, useCallback } from "react";
import posthog from "posthog-js";
import CookieConsent, { getStoredConsent, type ConsentValue } from "./CookieConsent";

let phInitialized = false;

function initPostHog() {
  if (phInitialized || typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
    person_profiles: "identified_only",
    capture_pageview: true,
    loaded: (ph) => { phInitialized = true; ph.capture("$pageview"); },
  });
  phInitialized = true;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const consent = getStoredConsent();
    if (consent === "accepted") initPostHog();
  }, []);

  const handleConsent = useCallback((value: ConsentValue) => {
    if (value === "accepted") initPostHog();
  }, []);

  return (
    <>
      {children}
      <CookieConsent onConsent={handleConsent} />
    </>
  );
}

// Helper — call from any client component
export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined" || !phInitialized) return;
  posthog.capture(event, properties);
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined" || !phInitialized) return;
  posthog.identify(userId, traits);
}
