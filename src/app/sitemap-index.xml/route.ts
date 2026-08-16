import { getSitemapIds } from "@/lib/sitemap-data";

export const revalidate = 86400;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.foxue.ai").replace(/\/+$/, "");
  const sitemapIds = await getSitemapIds();
  const sitemaps = sitemapIds
    .map(({ id }) => `<sitemap><loc>${escapeXml(`${baseUrl}/sitemap/${id}.xml`)}</loc></sitemap>`)
    .join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps}\n</sitemapindex>\n`,
    {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
      },
    },
  );
}
