export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      status: "ok",
      service: "foxue.ai",
      version: "0.2.0",
      capabilities: {
        reading: "available",
        citedAnswers: "prototype",
        generativeAI: "disabled",
        corpusRegistry: "v3.7.0-public-draft",
        corpusBackend: process.env.CORPUS_ASSET_BASE_URL
          ? "edge_with_local_fallback"
          : "local_controlled_assets",
      },
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
