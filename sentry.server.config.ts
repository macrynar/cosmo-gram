import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  enabled: !!process.env.SENTRY_DSN,

  tracesSampleRate: 0.1,

  beforeSend(event) {
    return scrubPii(event);
  },
});

function scrubPii(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
  }

  // Strip PII from request data
  if (event.request?.data && typeof event.request.data === "object") {
    const piiKeys = /birth_date|birth_time|lat|lng|email|place/i;
    const data = event.request.data as Record<string, unknown>;
    for (const key of Object.keys(data)) {
      if (piiKeys.test(key)) data[key] = "[Scrubbed]";
    }
  }

  return event;
}
