import { CORPUS_REGISTRY_VERSION } from "@/lib/corpus-registry-metadata";

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
        corpusRegistry: `v${CORPUS_REGISTRY_VERSION}-public-draft`,
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
