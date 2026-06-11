import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,

  // Strip PII before any event is sent
  beforeSend(event) {
    return scrubPii(event);
  },
});

function scrubPii(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  // Remove user email and IP from Sentry payload
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }

  // Drop all breadcrumbs — they may contain PII in XHR request bodies
  delete event.breadcrumbs;

  return event;
}
