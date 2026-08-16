import type { MetadataRoute } from "next";
import { sutras } from "@/data/sutras";
import { getSutraReading } from "@/lib/corpus-reading";
import { folioHref } from "@/lib/reader-routes";

export const sitemapChunkSize = 40_000;

let entriesPromise: Promise<MetadataRoute.Sitemap> | null = null;

export function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  entriesPromise ??= (async () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://foxue.ai";
    const staticRoutes = ["", "/wenjing", "/jingzang", "/gainian/kong", "/fugai", "/fenmu", "/shenjiao", "/yuanze", "/touming"];
    const readings = await Promise.all(
      sutras.map(async (sutra) => ({ sutra, reading: await getSutraReading(sutra) })),
    );
    const folioRoutes = readings.flatMap(({ sutra, reading }) =>
      reading.navigation.map((item) => ({
        url: `${baseUrl}${folioHref(sutra.slug, item.key)}`,
        lastModified: new Date("2026-08-14"),
        changeFrequency: "yearly" as const,
        priority: 0.6,
      })),
    );

    return [
      ...staticRoutes.map((path) => ({
        url: `${baseUrl}${path}`,
        lastModified: new Date("2026-08-14"),
        changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
        priority: path === "" ? 1 : 0.8,
      })),
      ...sutras.map((sutra) => ({
        url: `${baseUrl}/jingzang/${sutra.slug}`,
        lastModified: new Date("2026-08-14"),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...folioRoutes,
    ];
  })();
  return entriesPromise;
}

export async function getSitemapIds() {
  const entries = await getSitemapEntries();
  return Array.from(
    { length: Math.ceil(entries.length / sitemapChunkSize) },
    (_, id) => ({ id: String(id) }),
  );
}
