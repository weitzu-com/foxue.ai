import { buildCoverageSnapshot, corpusRegistry } from "@/lib/corpus-registry";

export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      ...buildCoverageSnapshot(),
      links: {
        human: "https://foxue.ai/fugai",
        registry: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/registry-v4.4.0.json",
        methodology: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/README.md",
        sourceSnapshot: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/source-snapshots-v1.4.0.json",
        chineseSutraInventory: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
        chineseEsotericT18Inventory: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t18-inventory-v0.1.0.json",
        chineseEsotericT18BoundaryAudit: "https://github.com/weitzu-com/foxue.ai/blob/main/data/corpus/cbeta/batch-v2.5.0.json",
        chineseEsotericT19Inventory: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t19-inventory-v0.1.0.json",
        chineseEsotericT19BoundaryAudit: "https://github.com/weitzu-com/foxue.ai/blob/main/data/corpus/cbeta/batch-v2.6.0.json",
        chineseEsotericT20Inventory: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t20-inventory-v0.1.0.json",
        chineseEsotericT20BoundaryAudit: "https://github.com/weitzu-com/foxue.ai/blob/main/data/corpus/cbeta/batch-v2.7.0.json",
        chineseEsotericT21Inventory: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t21-inventory-v0.1.0.json",
        chineseEsotericT21BoundaryAudit: "https://github.com/weitzu-com/foxue.ai/blob/main/data/corpus/cbeta/batch-v2.8.0.json",
        chineseVinayaT22Inventory: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t22-inventory-v0.1.0.json",
        chineseVinayaT22BoundaryAudit: "https://github.com/weitzu-com/foxue.ai/blob/main/data/corpus/cbeta/batch-v2.9.0.json",
        chineseVinayaT23Inventory: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t23-inventory-v0.1.0.json",
        chineseVinayaT23BoundaryAudit: "https://github.com/weitzu-com/foxue.ai/blob/main/data/corpus/cbeta/batch-v3.0.0.json",
        chineseVinayaT24Inventory: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t24-inventory-v0.1.0.json",
        chineseVinayaT24BoundaryAudit: "https://github.com/weitzu-com/foxue.ai/blob/main/data/corpus/cbeta/batch-v3.1.0.json",
        chineseCommentaryT25Inventory: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t25-inventory-v0.1.0.json",
        chineseCommentaryT25BoundaryAudit: "https://github.com/weitzu-com/foxue.ai/blob/main/data/corpus/cbeta/batch-v3.2.0.json",
        chineseCommentaryAbhidharmaT26Inventory: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cbeta-taisho-t26-inventory-v0.1.0.json",
        chineseCommentaryAbhidharmaT26BoundaryAudit: "https://github.com/weitzu-com/foxue.ai/blob/main/data/corpus/cbeta/batch-v3.3.0.json",
        dergeKangyurInventory: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/bdrc-derge-kangyur-inventory-v0.3.0.json",
        rights84000: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/84000-rights-policy-v0.3.0.json",
        sanskritSourceSnapshot: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/dsbc-gretil-source-snapshot-v0.4.0.json",
        sanskritRights: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/sanskrit-rights-policy-v0.4.0.json",
        gretilFileRightsAudit: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/gretil-sanskrit-file-rights-audit-v0.7.0.json",
        suttacentralIndicRightsAudit: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/suttacentral-indic-root-rights-audit-v0.8.0.json",
        suttacentralVinayaRightsAudit: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/suttacentral-vinaya-root-rights-audit-v0.9.0.json",
        suttacentralAbhidhammaRightsAudit: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/suttacentral-abhidhamma-root-rights-audit-v1.0.0.json",
        suttacentralChineseParallels: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/suttacentral-chinese-parallels-v0.7.0.json",
        suttacentralParallelReviewQueue: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/suttacentral-parallel-review-queue-v0.1.0.json",
        suttacentralParallelP0EvidencePackets: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/suttacentral-parallel-p0-evidence-packets-v0.1.0.json",
        crossCatalogAlignments: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/cross-catalog-alignments-v0.5.0.json",
        rktsKangyurCatalogs: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/rkts-kangyur-catalog-snapshot-v0.5.0.json",
        rktsKernelAlignments: "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/rkts-kernel-alignment-audit-v0.6.0.json",
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
