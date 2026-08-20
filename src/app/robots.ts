import type { MetadataRoute } from "next";
import { getSitemapIds } from "@/lib/sitemap-data";
import { siteOrigin } from "@/lib/site-metadata";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const sitemapIds = await getSitemapIds();

  return {
    rules: [
      // Tier 1: AI Answer Engines (ChatGPT, Perplexity, Claude, Gemini)
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Perplexity-User", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Claude-SearchBot", allow: "/" },
      { userAgent: "Claude-User", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      // Tier 2: Major Platform AI Crawlers
      { userAgent: "Bytespider", allow: "/" },
      { userAgent: "Amazonbot", allow: "/" },
      { userAgent: "Applebot", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
      // Tier 3: Country-Specific AI Crawlers
      { userAgent: "DeepSeekBot", allow: "/" },
      // Tier 4: Traditional Search (powers AI RAG pipelines)
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Bingbot", allow: "/" },
      // General: allow everything
      { userAgent: "*", allow: "/" },
    ],
    sitemap: sitemapIds.map(({ id }) => `${siteOrigin}/sitemap/${id}.xml`),
    host: siteOrigin,
  };
}
