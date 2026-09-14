"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  EMPTY_RESEARCH_WORKSPACE_SNAPSHOT,
  parseResearchWorkspace,
  RESEARCH_WORKSPACE_CHANGE_EVENT,
  RESEARCH_WORKSPACE_STORAGE_KEY,
  serializeResearchWorkspace,
  type ResearchWorkspace,
} from "@/lib/research-workspace";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(RESEARCH_WORKSPACE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(RESEARCH_WORKSPACE_CHANGE_EVENT, onStoreChange);
  };
}

function readSnapshot() {
  try {
    return window.localStorage.getItem(RESEARCH_WORKSPACE_STORAGE_KEY)
      ?? EMPTY_RESEARCH_WORKSPACE_SNAPSHOT;
  } catch {
    return EMPTY_RESEARCH_WORKSPACE_SNAPSHOT;
  }
}

function readServerSnapshot() {
  return EMPTY_RESEARCH_WORKSPACE_SNAPSHOT;
}

export function useResearchWorkspace() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot);
  return useMemo(() => parseResearchWorkspace(snapshot), [snapshot]);
}

export function saveResearchWorkspace(workspace: ResearchWorkspace) {
  window.localStorage.setItem(
    RESEARCH_WORKSPACE_STORAGE_KEY,
    serializeResearchWorkspace(workspace),
  );
  window.dispatchEvent(new Event(RESEARCH_WORKSPACE_CHANGE_EVENT));
}
