import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://foxue.ai";
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: [`${baseUrl}/sitemap/0.xml`, `${baseUrl}/sitemap/1.xml`, `${baseUrl}/sitemap/2.xml`],
    host: baseUrl,
  };
}
