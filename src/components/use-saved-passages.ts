"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  EMPTY_SAVED_PASSAGES_SNAPSHOT,
  parseSavedPassages,
  SAVED_PASSAGES_CHANGE_EVENT,
  SAVED_PASSAGES_STORAGE_KEY,
  serializeSavedPassages,
  type SavedPassage,
} from "@/lib/saved-passages";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SAVED_PASSAGES_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SAVED_PASSAGES_CHANGE_EVENT, onStoreChange);
  };
}

function readSnapshot() {
  try {
    return window.localStorage.getItem(SAVED_PASSAGES_STORAGE_KEY) ?? EMPTY_SAVED_PASSAGES_SNAPSHOT;
  } catch {
    return EMPTY_SAVED_PASSAGES_SNAPSHOT;
  }
}

function readServerSnapshot() {
  return EMPTY_SAVED_PASSAGES_SNAPSHOT;
}

export function useSavedPassages() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot);
  return useMemo(() => parseSavedPassages(snapshot), [snapshot]);
}

export function readSavedPassages() {
  return parseSavedPassages(readSnapshot());
}

export function saveSavedPassages(passages: SavedPassage[]) {
  window.localStorage.setItem(SAVED_PASSAGES_STORAGE_KEY, serializeSavedPassages(passages));
  window.dispatchEvent(new Event(SAVED_PASSAGES_CHANGE_EVENT));
}
