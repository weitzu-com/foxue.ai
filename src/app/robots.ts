import type { MetadataRoute } from "next";
import { getSitemapIds } from "@/lib/sitemap-data";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.foxue.ai";
  const sitemapIds = await getSitemapIds();
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "Claude-Web", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Perplexity-User", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Bingbot", allow: "/" },
      { userAgent: "Slurp", allow: "/" },
      { userAgent: "DuckDuckBot", allow: "/" },
      { userAgent: "Baiduspider", allow: "/" },
      { userAgent: "YandexBot", allow: "/" },
      { userAgent: "Bytespider", allow: "/" },
      { userAgent: "Amazonbot", allow: "/" },
      { userAgent: "Applebot", allow: "/" },
      { userAgent: "CCBot", allow: "/" },
      { userAgent: "DeepSeekBot", allow: "/" },
      { userAgent: "Kimi-Spider", allow: "/" },
    ],
    sitemap: sitemapIds.map(({ id }) => `${baseUrl}/sitemap/${id}.xml`),
    host: baseUrl,
  };
}
