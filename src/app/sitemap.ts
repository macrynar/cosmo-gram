import { MetadataRoute } from "next";
import { ROUTES } from "@/lib/routes";

const BASE_URL = "https://www.cosmo-gram.com";

const INDEXED_PUBLIC_ROUTES = [
  ROUTES.public.home,
  ROUTES.public.cosmogram,
  ROUTES.public.dailyHoroscope,
  ROUTES.public.match,
  ROUTES.public.forKids,
  ROUTES.public.pricing,
  ROUTES.public.blog,
  ROUTES.public.about,
  ROUTES.public.contact,
  ROUTES.public.howAiWorks,
  ROUTES.public.terms,
  ROUTES.public.privacy,
  ROUTES.public.cookies,
];

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXED_PUBLIC_ROUTES.map(route => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.path === "/" ? "daily" : "weekly",
    priority: route.path === "/" ? 1 : 0.7,
  }));
}
