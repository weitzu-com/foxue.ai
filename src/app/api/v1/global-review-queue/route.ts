import { buildGlobalReviewWorkbenchPayload } from "@/lib/global-review-queue";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  return Response.json(
    buildGlobalReviewWorkbenchPayload(searchParams),
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}
