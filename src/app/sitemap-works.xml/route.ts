import { getWorkSitemap, serializeSitemap } from "@/lib/sitemap-data";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  return new Response(serializeSitemap(await getWorkSitemap()), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
