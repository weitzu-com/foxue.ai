import parallelReaderIndexDocument from "../../data/gbcr/suttacentral-chinese-parallel-reader-index-v0.1.0.json";

export type ParallelDecisionClass =
  | "full_parallel_without_automatic_work_merge"
  | "component_parallel_within_registered_work"
  | "resembling_or_partial_parallel"
  | "citation_or_mention_only";

export type ParallelReaderExample = {
  id: string;
  decisionClass: ParallelDecisionClass;
  currentReference: string;
  counterpartReference: string;
  counterpartTitle: string;
  counterpartSlug: string;
  counterpartWorkId: string;
  counterpartLanguage: string;
  hasUpstreamRemark: boolean;
  upstreamType: string;
};

export type ParallelReaderRecord = {
  edgeCount: number;
  counterpartWorks: number;
  decisionClasses: Partial<Record<ParallelDecisionClass, number>>;
  examples: ParallelReaderExample[];
};

const records = parallelReaderIndexDocument.records as unknown as Record<string, ParallelReaderRecord>;

export const parallelEvidenceMetadata = {
  version: parallelReaderIndexDocument.version,
  sourceCommit: parallelReaderIndexDocument.generatedFrom.sourceCommit,
  completeLedgerEdges: parallelReaderIndexDocument.summary.completeLedgerEdges,
  automaticWorkMerge: parallelReaderIndexDocument.policy.automaticWorkMerge,
  segmentAlignmentAsserted: parallelReaderIndexDocument.policy.segmentAlignmentAsserted,
};

export function getParallelEvidence(slug: string) {
  return records[slug] ?? null;
}
