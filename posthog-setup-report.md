<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Cosmogram. The project already had `posthog-js` installed and basic tracking in place; this integration upgraded the initialization approach, added server-side tracking via `posthog-node`, added a reverse proxy for reliable event delivery, and expanded event coverage across all key user journeys.

## Summary of changes

| File | Change |
|------|--------|
| `instrumentation-client.ts` | Created — Next.js 15.3+ client-side PostHog init (replaces useEffect-based init in PostHogProvider) |
| `src/components/PostHogProvider.tsx` | Removed `posthog.init()` call; now a thin passthrough wrapper + `track()`/`identify()` helpers |
| `next.config.ts` | Added `/ingest/*` reverse proxy rewrites for reliable EU PostHog ingestion |
| `src/lib/posthog-server.ts` | Created — singleton `posthog-node` client for server-side event capture |
| `src/components/PaywallModal.tsx` | Added `paywall_shown` and `checkout_initiated` events |
| `src/app/horoskop-dzienny/page.tsx` | Added `daily_reading_generated` event |
| `src/app/children/page.tsx` | Added `child_chart_added` event |
| `src/app/chat/page.tsx` | Added `chat_paywall_hit` event |
| `src/app/api/stripe-webhook/route.ts` | Added server-side `subscription_activated` and `subscription_cancelled` events |
| `src/app/api/waitlist/route.ts` | Added server-side `waitlist_joined` event (SHA-256 hashed distinct ID, no PII) |

## Event tracking table

| Event | Description | File |
|-------|-------------|------|
| `signup` | User signs in / registers (existing) | `src/components/AuthContext.tsx` |
| `first_natal_view` | First natal chart generated (existing) | `src/app/generate/page.tsx` |
| `first_chat` | First chat message sent (existing) | `src/app/chat/page.tsx` |
| `first_match` | First compatibility match run (existing) | `src/app/astro-match/page.tsx` |
| `trial_started` | Subscription success page visited (existing) | `src/app/subscription/success/page.tsx` |
| `paywall_shown` | Paywall modal displayed to user | `src/components/PaywallModal.tsx` |
| `checkout_initiated` | User clicked monthly or yearly checkout button | `src/components/PaywallModal.tsx` |
| `daily_reading_generated` | Daily horoscope successfully generated | `src/app/horoskop-dzienny/page.tsx` |
| `child_chart_added` | Child natal chart added and saved | `src/app/children/page.tsx` |
| `chat_paywall_hit` | User hit free message limit in chat | `src/app/chat/page.tsx` |
| `subscription_activated` | Stripe checkout completed, subscription stored | `src/app/api/stripe-webhook/route.ts` |
| `subscription_cancelled` | Stripe subscription deleted webhook received | `src/app/api/stripe-webhook/route.ts` |
| `waitlist_joined` | Email submitted to waitlist | `src/app/api/waitlist/route.ts` |

## Next steps

We've built a dashboard and five insights to monitor user behavior based on the newly instrumented events:

- [Analytics basics dashboard](/dashboard/697310)
- [New Signups Over Time](/insights/EGvJsjKN) — daily signup trend
- [Paywall → Checkout → Subscription Funnel](/insights/zGPXr8G9) — conversion funnel with drop-off visibility
- [Core Feature Engagement](/insights/v25e2rAg) — weekly active users per core feature
- [Paywall Hit Rate (Chat vs. Match)](/insights/kuSyXjwg) — where users hit upgrade friction
- [Subscription Events (Activated vs Cancelled)](/insights/1Fbnt6mr) — monthly net subscription delta

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
