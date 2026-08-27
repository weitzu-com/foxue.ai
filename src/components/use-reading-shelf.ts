"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  EMPTY_READING_SHELF_SNAPSHOT,
  parseReadingShelf,
  READING_SHELF_CHANGE_EVENT,
  READING_SHELF_STORAGE_KEY,
  serializeReadingShelf,
  type ReadingShelfEntry,
} from "@/lib/reading-shelf";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(READING_SHELF_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(READING_SHELF_CHANGE_EVENT, onStoreChange);
  };
}

function readSnapshot() {
  try {
    return window.localStorage.getItem(READING_SHELF_STORAGE_KEY) ?? EMPTY_READING_SHELF_SNAPSHOT;
  } catch {
    return EMPTY_READING_SHELF_SNAPSHOT;
  }
}

function readServerSnapshot() {
  return EMPTY_READING_SHELF_SNAPSHOT;
}

export function useReadingShelf() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, readServerSnapshot);
  return useMemo(() => parseReadingShelf(snapshot), [snapshot]);
}

export function readReadingShelf() {
  return parseReadingShelf(readSnapshot());
}

export function saveReadingShelf(entries: ReadingShelfEntry[]) {
  try {
    window.localStorage.setItem(READING_SHELF_STORAGE_KEY, serializeReadingShelf(entries));
    window.dispatchEvent(new Event(READING_SHELF_CHANGE_EVENT));
  } catch {
    // Private browsing and quota policies may deny storage. Reading remains usable.
  }
}
