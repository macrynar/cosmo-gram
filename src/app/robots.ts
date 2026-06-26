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
          // trasy-duplikaty /horoskop-dzienny i /children mają trwały 301 w next.config.ts (T5)
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
