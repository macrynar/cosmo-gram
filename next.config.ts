import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // CSP in Report-Only mode — tighten after 1 week without reports
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      // Supabase
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://eu.i.posthog.com https://eu-assets.i.posthog.com https://*.ingest.sentry.io",
      // Stripe JS
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "frame-src https://js.stripe.com",
      // Images: self + data URIs + Supabase Storage
      "img-src 'self' data: https://*.supabase.co",
      // Fonts
      "font-src 'self' data:",
      // PostHog analytics (proxied via /ingest)
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  async redirects() {
    return [
      // Trasy-duplikaty bez własnego SEO — trwały redirect na kanoniczne odpowiedniki (T5).
      // permanent:true → 308 (Google traktuje jak 301 dla SEO).
      { source: "/horoskop-dzienny", destination: "/daily-horoscope", permanent: true },
      { source: "/children", destination: "/for-kids", permanent: true },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      // Sentry tunnel — avoids ad-blocker interference
      {
        source: "/monitoring/:path*",
        destination: "https://o0.ingest.sentry.io/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default withSentryConfig(nextConfig, {
  // DSN only needed at build time for source maps upload
  silent: true,
  // Don't upload source maps in CI without SENTRY_AUTH_TOKEN
  disableLogger: true,
  widenClientFileUpload: false,
  // Tunnel via /monitoring to bypass ad-blockers
  tunnelRoute: "/monitoring",
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
});
