import { MetadataRoute } from "next";
import { ROUTES } from "@/lib/routes";
import { getPublishedPosts } from "@/lib/blog";
import { getAllMoonSigns } from "@/lib/pseo/moonSigns";

const BASE_URL = "https://www.cosmo-gram.com";

const INDEXED_PUBLIC_ROUTES = [
  ROUTES.public.home,
  ROUTES.public.cosmogram,
  ROUTES.public.calendar,        // DODANE
  ROUTES.public.match,
  ROUTES.public.chatPublic,      // DODANE (/cosmo-chat)
  ROUTES.public.dailyHoroscope,
  ROUTES.public.forKids,
  ROUTES.public.pricing,
  ROUTES.public.blog,
  ROUTES.public.moonSigns,
  ROUTES.public.about,
  ROUTES.public.contact,
  ROUTES.public.howAiWorks,
  ROUTES.public.terms,
  ROUTES.public.privacy,
  ROUTES.public.cookies,
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = INDEXED_PUBLIC_ROUTES.map(route => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: (route.path === "/" ? "daily" : "weekly") as "daily" | "weekly",
    priority: route.path === "/" ? 1 : 0.7,
  }));

  const blogEntries = getPublishedPosts().map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.frontmatter.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const moonSignEntries = getAllMoonSigns().map((m) => ({
    url: `${BASE_URL}/ksiezyc-w-znaku/${m.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries, ...moonSignEntries];
}
