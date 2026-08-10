import type { MetadataRoute } from "next";
import { sutras } from "@/data/sutras";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://foxue.ai";
  const staticRoutes = ["", "/wenjing", "/jingzang", "/yuanze", "/touming"];
  return [
    ...staticRoutes.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: new Date("2026-08-11"),
      changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : 0.8,
    })),
    ...sutras.map((sutra) => ({
      url: `${baseUrl}/jingzang/${sutra.slug}`,
      lastModified: new Date("2026-08-11"),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
