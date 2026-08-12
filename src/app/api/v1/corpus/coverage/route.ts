import { buildCoverageSnapshot, corpusRegistry } from "@/lib/corpus-registry";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      ...buildCoverageSnapshot(),
      links: {
        human: "https://foxue.ai/fugai",
        registry: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/registry-v2.1.0.json",
        methodology: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/README.md",
        sourceSnapshot: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/source-snapshots-v0.2.1.json",
        chineseSutraInventory: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
      },
      sourceSnapshots: corpusRegistry.sourceSnapshots.map((source) => ({
        id: source.id,
        name: source.name,
        snapshot: source.snapshot,
        rightsStatus: source.rights.status,
      })),
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
