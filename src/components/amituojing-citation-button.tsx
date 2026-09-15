"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

type CitationItem = {
  label: string;
  locator: string;
  href: string;
};

export function AmituojingCitationButton({
  className,
  locusId,
  title,
  items,
}: {
  className: string;
  locusId: string;
  title: string;
  items: CitationItem[];
}) {
  const [feedback, setFeedback] = useState("");

  async function copyCitation() {
    const citations = items.map((item) =>
      `- ${item.label}，${item.locator}：${new URL(item.href, window.location.origin)}`,
    );
    const text = [`《阿弥陀经》双译对读｜${title}`, ...citations].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setFeedback("已复制两个版本的坐标与链接");
      trackEvent("scripture_comparison_citation_copied", {
        comparison_id: "amituo-sutra-reading-loci",
        locus_id: locusId,
      });
    } catch {
      setFeedback("浏览器未允许复制，可分别打开行号引用");
    }
  }

  return (
    <div className={className}>
      <button type="button" onClick={copyCitation}>
        {feedback.startsWith("已复制") ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        复制本关口引用
      </button>
      <span role="status" aria-live="polite">{feedback}</span>
    </div>
  );
}
