import Link from "next/link";
import { ExternalLink, GitCompareArrows } from "lucide-react";
import {
  getParallelEvidence,
  parallelEvidenceMetadata,
  type ParallelDecisionClass,
} from "@/lib/parallel-evidence";

const decisionLabels: Record<ParallelDecisionClass, string> = {
  full_parallel_without_automatic_work_merge: "整经级平行",
  component_parallel_within_registered_work: "合集或作品内部组件",
  resembling_or_partial_parallel: "近似或部分平行",
  citation_or_mention_only: "引用或提及",
};

export function ParallelEvidencePanel({ slug }: { slug: string }) {
  const evidence = getParallelEvidence(slug);
  if (!evidence) return null;

  return (
    <section className="parallel-evidence" aria-labelledby={`parallel-evidence-${slug}`}>
      <GitCompareArrows aria-hidden="true" />
      <div>
        <p className="eyebrow">跨传统证据</p>
        <h3 id={`parallel-evidence-${slug}`}>
          {evidence.edgeCount.toLocaleString("zh-CN")} 条可审计关系
        </h3>
        <p className="parallel-evidence__scope">
          涉及 {evidence.counterpartWorks.toLocaleString("zh-CN")} 个对应文本。关系来自固定 SuttaCentral 证据表；
          不自动合并作品，也不声称当前版页已经逐段或逐句对齐。
        </p>
        <div className="parallel-evidence__counts" aria-label="关系类型统计">
          {(Object.entries(evidence.decisionClasses) as Array<[ParallelDecisionClass, number]>).map(([decisionClass, count]) => (
            <span key={decisionClass}>{decisionLabels[decisionClass]} · {count.toLocaleString("zh-CN")}</span>
          ))}
        </div>
        <ul className="parallel-evidence__examples">
          {evidence.examples.map((example) => (
            <li key={example.id}>
              <Link href={`/jingzang/${example.counterpartSlug}`} prefetch={false}>
                <strong>{example.counterpartTitle}</strong>
                <span>{example.currentReference} ↔ {example.counterpartReference}</span>
                <small>
                  {decisionLabels[example.decisionClass]}
                  {example.hasUpstreamRemark ? " · 上游附范围备注" : ""}
                </small>
              </Link>
            </li>
          ))}
        </ul>
        <a
          className="parallel-evidence__ledger"
          href="https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/suttacentral-chinese-parallels-v0.7.0.json"
          target="_blank"
          rel="noreferrer"
        >
          查看 {parallelEvidenceMetadata.completeLedgerEdges.toLocaleString("zh-CN")} 条完整账本
          <ExternalLink aria-hidden="true" size={12} />
        </a>
      </div>
    </section>
  );
}
