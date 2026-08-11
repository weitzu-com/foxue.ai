import Link from "next/link";
import { ArrowUpRight, Quote } from "lucide-react";
import type { Evidence } from "@/lib/research";

export function EvidenceCard({ evidence, index }: { evidence: Evidence; index: number }) {
  return (
    <article className="evidence-card">
      <div className="evidence-card__meta">
        <span className="evidence-number">{String(index + 1).padStart(2, "0")}</span>
        <span>{evidence.relation}证据</span>
      </div>
      <Quote aria-hidden="true" size={20} />
      <blockquote>{evidence.quote}</blockquote>
      <div className="evidence-card__source">
        <div>
          <strong>{evidence.label}</strong>
          <span>{evidence.locator}</span>
        </div>
        <Link
          href={evidence.href}
          aria-label={`打开${evidence.label}原文`}
          data-analytics-event="source_opened"
          data-analytics-location="answer_evidence"
          data-analytics-content-id={evidence.locator}
          data-analytics-label={evidence.label}
        >
          看原文 <ArrowUpRight aria-hidden="true" size={14} />
        </Link>
      </div>
    </article>
  );
}
