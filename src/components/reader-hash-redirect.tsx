"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { folioHref, folioKeyFromSegmentId } from "@/lib/reader-routes";

type ReaderHashRedirectProps = {
  slug: string;
  aliases: Record<string, string>;
  segmentFolios?: Record<string, string>;
  currentFolio?: string;
};

export function ReaderHashRedirect({ slug, aliases, segmentFolios, currentFolio }: ReaderHashRedirectProps) {
  const router = useRouter();

  useEffect(() => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    if (!hash) return;
    const canonicalId = aliases[hash] ?? hash;
    const targetFolio = segmentFolios?.[canonicalId] ?? folioKeyFromSegmentId(canonicalId);
    if (!targetFolio || targetFolio === currentFolio) return;
    router.replace(folioHref(slug, targetFolio, hash));
  }, [aliases, currentFolio, router, segmentFolios, slug]);

  return null;
}
