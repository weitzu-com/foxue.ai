export const READING_SHELF_STORAGE_KEY = "foxue:reading-shelf:v1";
export const READING_SHELF_CHANGE_EVENT = "foxue:reading-shelf-change";
export const EMPTY_READING_SHELF_SNAPSHOT = '{"version":1,"entries":[]}';
export const READING_RESUME_HASH_PREFIX = "foxue-resume=";

const MAX_PINNED_ENTRIES = 50;
const MAX_RECENT_ENTRIES = 12;

export type ReadingShelfSeed = {
  id: string;
  slug: string;
  folioKey: string;
  workTitle: string;
  passageLabel: string;
  quoteLang: string;
  languageLabel: string;
  pageHref: string;
};

export type ReadingShelfEntry = ReadingShelfSeed & {
  resumeHref: string;
  locator: string;
  preview: string;
  pinned: boolean;
  firstReadAt: string;
  lastReadAt: string;
};

type ReadingShelfStore = {
  version: 1;
  entries: ReadingShelfEntry[];
};

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isLanguageTag(value: unknown): value is string {
  return isString(value)
    && value.length <= 35
    && /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/u.test(value);
}

function isInternalReadingHref(value: unknown): value is string {
  return isString(value)
    && value.startsWith("/jingzang/")
    && !value.includes("\\")
    && !value.includes("..")
    && !/\s/u.test(value)
    && value.length <= 900;
}

function isIsoDate(value: unknown): value is string {
  return isString(value)
    && value.length <= 40
    && Number.isFinite(Date.parse(value));
}

function validatedEntry(value: unknown): ReadingShelfEntry | undefined {
  if (!value || typeof value !== "object") return undefined;
  const entry = value as Partial<ReadingShelfEntry>;
  if (
    !isString(entry.id)
    || !isString(entry.slug)
    || !isString(entry.folioKey)
    || !isString(entry.workTitle)
    || !isString(entry.passageLabel)
    || !isLanguageTag(entry.quoteLang)
    || !isString(entry.languageLabel)
    || !isInternalReadingHref(entry.pageHref)
    || !isInternalReadingHref(entry.resumeHref)
    || !isString(entry.locator)
    || !isString(entry.preview)
    || typeof entry.pinned !== "boolean"
    || !isIsoDate(entry.firstReadAt)
    || !isIsoDate(entry.lastReadAt)
  ) {
    return undefined;
  }

  if (!entry.id || !entry.slug || !entry.folioKey || !entry.workTitle) return undefined;

  return {
    id: entry.id.slice(0, 220),
    slug: entry.slug.slice(0, 120),
    folioKey: entry.folioKey.slice(0, 180),
    workTitle: entry.workTitle.slice(0, 180),
    passageLabel: entry.passageLabel.slice(0, 180),
    quoteLang: entry.quoteLang,
    languageLabel: entry.languageLabel.slice(0, 80),
    pageHref: entry.pageHref,
    resumeHref: entry.resumeHref,
    locator: entry.locator.slice(0, 300),
    preview: entry.preview.trim().slice(0, 240),
    pinned: entry.pinned,
    firstReadAt: entry.firstReadAt,
    lastReadAt: entry.lastReadAt,
  };
}

export function normalizeReadingShelf(entries: ReadingShelfEntry[]) {
  const unique = new Map<string, ReadingShelfEntry>();
  [...entries]
    .sort((a, b) => b.lastReadAt.localeCompare(a.lastReadAt))
    .forEach((entry) => {
      const validated = validatedEntry(entry);
      if (validated && !unique.has(validated.id)) unique.set(validated.id, validated);
    });

  const sorted = [...unique.values()].sort((a, b) => b.lastReadAt.localeCompare(a.lastReadAt));
  const retainedIds = new Set([
    ...sorted.filter((entry) => entry.pinned).slice(0, MAX_PINNED_ENTRIES),
    ...sorted.filter((entry) => !entry.pinned).slice(0, MAX_RECENT_ENTRIES),
  ].map((entry) => entry.id));

  return sorted.filter((entry) => retainedIds.has(entry.id));
}

export function parseReadingShelf(snapshot: string): ReadingShelfEntry[] {
  try {
    const store = JSON.parse(snapshot) as Partial<ReadingShelfStore>;
    if (store.version !== 1 || !Array.isArray(store.entries)) return [];
    return normalizeReadingShelf(
      store.entries
        .map(validatedEntry)
        .filter((entry): entry is ReadingShelfEntry => Boolean(entry)),
    );
  } catch {
    return [];
  }
}

export function serializeReadingShelf(entries: ReadingShelfEntry[]) {
  return JSON.stringify({ version: 1, entries: normalizeReadingShelf(entries) } satisfies ReadingShelfStore);
}

export function readingResumeHref(pageHref: string, locator: string) {
  return `${pageHref}#${READING_RESUME_HASH_PREFIX}${encodeURIComponent(locator)}`;
}

export function readingResumeLocator(hash: string) {
  try {
    const decoded = decodeURIComponent(hash.replace(/^#/u, ""));
    if (!decoded.startsWith(READING_RESUME_HASH_PREFIX)) return "";
    return decoded.slice(READING_RESUME_HASH_PREFIX.length).slice(0, 300);
  } catch {
    return "";
  }
}

export function recordReadingVisit(
  entries: ReadingShelfEntry[],
  seed: ReadingShelfSeed,
  now: string,
) {
  const existing = entries.find((entry) => entry.id === seed.id);
  const next: ReadingShelfEntry = existing
    ? {
        ...existing,
        ...seed,
        lastReadAt: now,
      }
    : {
        ...seed,
        resumeHref: seed.pageHref,
        locator: "",
        preview: "",
        pinned: false,
        firstReadAt: now,
        lastReadAt: now,
      };

  return normalizeReadingShelf([next, ...entries.filter((entry) => entry.id !== seed.id)]);
}

export function recordReadingLocation(
  entries: ReadingShelfEntry[],
  id: string,
  location: { resumeHref: string; locator: string; preview: string },
  now: string,
) {
  if (!isInternalReadingHref(location.resumeHref)) return entries;
  return normalizeReadingShelf(entries.map((entry) => (
    entry.id === id
      ? {
          ...entry,
          resumeHref: location.resumeHref,
          locator: location.locator.slice(0, 300),
          preview: location.preview.trim().slice(0, 240),
          lastReadAt: now,
        }
      : entry
  )));
}

export function setReadingPinned(entries: ReadingShelfEntry[], id: string, pinned: boolean) {
  return normalizeReadingShelf(entries.map((entry) => (
    entry.id === id ? { ...entry, pinned } : entry
  )));
}

export function removeReadingEntry(entries: ReadingShelfEntry[], id: string) {
  return entries.filter((entry) => entry.id !== id);
}
