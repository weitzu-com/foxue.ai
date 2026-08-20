'use client'

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { GlobalReviewWorkbenchPayload } from "@/lib/global-review-queue";
import GlobalReviewWorkbench from "./global-review-workbench";

function normalizeSearchParams(searchParams: URLSearchParams) {
  const params = new URLSearchParams();

  for (const key of ["q", "priority", "source", "decision", "reviewPage"]) {
    const value = searchParams.get(key);
    if (value) params.set(key, value);
  }

  return params;
}

function buildHref(params: URLSearchParams) {
  const suffix = params.toString();
  return `/fenmu${suffix ? `?${suffix}` : ""}#global-review-queue`;
}

export default function GlobalReviewWorkbenchClient({
  initialPayload,
}: {
  initialPayload: GlobalReviewWorkbenchPayload;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const normalizedSearchParams = useMemo(() => normalizeSearchParams(searchParams), [searchParams]);
  const requestKey = normalizedSearchParams.toString();
  const [payload, setPayload] = useState(initialPayload);
  const [settledKey, setSettledKey] = useState(() => (requestKey ? "" : requestKey));

  useEffect(() => {
    if (!requestKey) return;

    const controller = new AbortController();

    fetch(`/api/v1/global-review-queue?${requestKey}`, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`global review queue API returned ${response.status}`);
        const nextPayload = await response.json() as GlobalReviewWorkbenchPayload;
        setPayload(nextPayload);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error(error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSettledKey(requestKey);
      });

    return () => controller.abort();
  }, [requestKey]);

  const activePayload = requestKey ? payload : initialPayload;
  const activeLoading = Boolean(requestKey) && settledKey !== requestKey;

  return (
    <GlobalReviewWorkbench
      key={`${activePayload.rawQuery}|${activePayload.priority}|${activePayload.source}|${activePayload.decision}|${activePayload.currentPage}`}
      payload={activePayload}
      isLoading={activeLoading}
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const params = new URLSearchParams();

        for (const key of ["q", "priority", "source", "decision"]) {
          const value = formData.get(key);
          if (typeof value === "string" && value.trim()) params.set(key, value.trim());
        }

        router.push(buildHref(params), { scroll: false });
      }}
    />
  );
}
