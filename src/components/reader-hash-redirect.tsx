"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { folioHref, folioKeyFromSegmentId, type SegmentFolioRange } from "@/lib/reader-routes";

type ReaderHashRedirectProps = {
  slug: string;
  aliases: Record<string, string>;
  segmentFolios?: Record<string, string>;
  segmentFolioRanges?: Record<string, SegmentFolioRange[]>;
  currentFolio?: string;
};

function numericSegmentParts(id: string) {
  const separator = id.indexOf(":");
  if (separator < 0) return null;
  const parts = id.slice(separator + 1).split(/[.-]/).map(Number);
  return parts.every(Number.isSafeInteger) ? parts : null;
}

function compareSegmentIds(left: string, right: string) {
  const leftParts = numericSegmentParts(left);
  const rightParts = numericSegmentParts(right);
  if (!leftParts || !rightParts) return null;
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? -1) - (rightParts[index] ?? -1);
    if (difference !== 0) return difference;
  }
  return 0;
}

export function ReaderHashRedirect({ slug, aliases, segmentFolios, segmentFolioRanges, currentFolio }: ReaderHashRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash) return;
    const canonicalId = aliases[hash] ?? hash;
    const prefix = canonicalId.includes(":")
      ? `${canonicalId.slice(0, canonicalId.indexOf(":"))}:*`
      : "";
    const rangePrefix = prefix.slice(0, -2);
    const matchingRange = segmentFolioRanges?.[rangePrefix]?.find((range) => {
      const afterFirst = compareSegmentIds(canonicalId, range.first);
      const beforeLast = compareSegmentIds(canonicalId, range.last);
      return afterFirst !== null && beforeLast !== null && afterFirst >= 0 && beforeLast <= 0;
    });
    const targetFolio = segmentFolios?.[canonicalId] ??
      (prefix ? segmentFolios?.[prefix] : undefined) ??
      matchingRange?.folio ??
      folioKeyFromSegmentId(canonicalId);
    if (!targetFolio || targetFolio === currentFolio) return;
    router.replace(folioHref(slug, targetFolio, hash));
  }, [aliases, currentFolio, router, segmentFolioRanges, segmentFolios, slug]);

  return null;
}
