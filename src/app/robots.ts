import { MetadataRoute } from "next";

const BASE_URL = "https://www.cosmo-gram.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/app/", "/login", "/signup", "/forgot-password", "/reset-password", "/auth/", "/api/",
          // /children — żywa trasa feature'a Kosmogram Dziecka (jeszcze poza nawigacją), ale duplikat
          // /app/library bez własnego SEO → blokujemy indeksację, NIE redirectujemy (back-link by się psuł).
          "/children",
          // /horoskop-dzienny ma trwały 301 → /daily-horoscope w next.config.ts (nie listujemy redirectów).
        ],
      },
      {
        userAgent: [
          "GPTBot", "OAI-SearchBot", "ChatGPT-User",
          "PerplexityBot", "Perplexity-User",
          "ClaudeBot", "Claude-Web",
          "Google-Extended",
        ],
        allow: "/",
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
