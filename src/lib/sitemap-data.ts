import type { MetadataRoute } from "next";
import { sutras } from "@/data/sutras";
import { getSutraReading } from "@/lib/corpus-reading";
import { allConcepts } from "@/lib/concept-hubs";
import { libraryPageSize } from "@/lib/library-pagination";
import { folioHref } from "@/lib/reader-routes";
import { siteOrigin } from "@/lib/site-metadata";

export const sitemapChunkSize = 40_000;

let entriesPromise: Promise<MetadataRoute.Sitemap> | null = null;

export function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  entriesPromise ??= (async () => {
    const staticRoutes = [
      "",
      "/wenjing",
      "/jingzang",
      "/xue/xinjing",
      "/gainian",
      ...allConcepts.map((concept) => concept.href),
      "/fugai",
      "/fenmu",
      "/shenjiao",
      "/yuanze",
      "/touming",
    ];
    const libraryPaginationRoutes = Array.from(
      { length: Math.max(0, Math.ceil(sutras.length / libraryPageSize) - 1) },
      (_, index) => `/jingzang/page/${index + 2}`,
    );
    const readings = await Promise.all(
      sutras.map(async (sutra) => ({ sutra, reading: await getSutraReading(sutra) })),
    );
    const folioRoutes = readings.flatMap(({ sutra, reading }) =>
      reading.navigation.map((item) => ({
        url: `${siteOrigin}${folioHref(sutra.slug, item.key)}`,
        changeFrequency: "yearly" as const,
        priority: 0.6,
      })),
    );

    return [
      ...staticRoutes.map((path) => ({
        url: `${siteOrigin}${path}`,
        changeFrequency: path === "" ? ("weekly" as const) : ("monthly" as const),
        priority: path === "" ? 1 : 0.8,
      })),
      ...libraryPaginationRoutes.map((path) => ({
        url: `${siteOrigin}${path}`,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...sutras.map((sutra) => ({
        url: `${siteOrigin}/jingzang/${sutra.slug}`,
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
