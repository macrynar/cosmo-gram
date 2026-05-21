"use client";

import posthog from "posthog-js";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// Helper — call from any client component
export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  posthog.identify(userId, traits);
}
