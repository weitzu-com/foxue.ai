export const SAVED_PASSAGES_STORAGE_KEY = "foxue:saved-passages:v1";
export const SAVED_PASSAGES_CHANGE_EVENT = "foxue:saved-passages-change";
export const EMPTY_SAVED_PASSAGES_SNAPSHOT = '{"version":1,"passages":[]}';
export const SAVED_PASSAGES_CANONICAL_ORIGIN = "https://www.foxue.ai";

const MAX_SAVED_PASSAGES = 500;
const MAX_SEGMENTS_PER_PASSAGE = 200;

export type SavedPassageSeed = {
  id: string;
  slug: string;
  folioKey: string;
  workTitle: string;
  passageLabel: string;
  locator: string;
  quote: string;
  quoteLang: string;
  sourceHref: string;
  segmentIds: string[];
};

export type SavedPassage = SavedPassageSeed & {
  savedAt: string;
};

type SavedPassageStore = {
  version: 1;
  passages: SavedPassage[];
};

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isLanguageTag(value: unknown): value is string {
  return isString(value)
    && value.length <= 35
    && /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/u.test(value);
}

function isInternalSourceHref(value: unknown): value is string {
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

function validatedPassage(value: unknown): SavedPassage | undefined {
  if (!value || typeof value !== "object") return undefined;
  const passage = value as Partial<SavedPassage>;
  if (
    !isString(passage.id)
    || !isString(passage.slug)
    || !isString(passage.folioKey)
    || !isString(passage.workTitle)
    || !isString(passage.passageLabel)
    || !isString(passage.locator)
    || !isString(passage.quote)
    || !isLanguageTag(passage.quoteLang)
    || !isInternalSourceHref(passage.sourceHref)
    || !Array.isArray(passage.segmentIds)
    || !isIsoDate(passage.savedAt)
  ) {
    return undefined;
  }

  const segmentIds = [...new Set(passage.segmentIds
    .filter(isString)
    .map((segmentId) => segmentId.trim().slice(0, 300))
    .filter(Boolean))]
    .slice(0, MAX_SEGMENTS_PER_PASSAGE);
  const quote = passage.quote.trim().slice(0, 4_000);
  if (
    !passage.id
    || !passage.slug
    || !passage.folioKey
    || !passage.workTitle
    || !passage.locator
    || !quote
    || segmentIds.length === 0
  ) {
    return undefined;
  }

  return {
    id: passage.id.slice(0, 180),
    slug: passage.slug.slice(0, 120),
    folioKey: passage.folioKey.slice(0, 180),
    workTitle: passage.workTitle.slice(0, 180),
    passageLabel: passage.passageLabel.slice(0, 180),
    locator: passage.locator.slice(0, 600),
    quote,
    quoteLang: passage.quoteLang,
    sourceHref: passage.sourceHref,
    segmentIds,
    savedAt: passage.savedAt,
  };
}

export function normalizeSavedPassages(passages: SavedPassage[]) {
  const unique = new Map<string, SavedPassage>();
  [...passages]
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
    .forEach((passage) => {
      const validated = validatedPassage(passage);
      if (validated && !unique.has(validated.id)) unique.set(validated.id, validated);
    });
  return [...unique.values()].slice(0, MAX_SAVED_PASSAGES);
}

export function parseSavedPassages(snapshot: string): SavedPassage[] {
  try {
    const store = JSON.parse(snapshot) as Partial<SavedPassageStore>;
    if (store.version !== 1 || !Array.isArray(store.passages)) return [];
    return normalizeSavedPassages(
      store.passages
        .map(validatedPassage)
        .filter((passage): passage is SavedPassage => Boolean(passage)),
    );
  } catch {
    return [];
  }
}

export function serializeSavedPassages(passages: SavedPassage[]) {
  return JSON.stringify({
    version: 1,
    passages: normalizeSavedPassages(passages),
  } satisfies SavedPassageStore);
}

export function savePassage(
  passages: SavedPassage[],
  seed: SavedPassageSeed,
  now: string,
) {
  const existing = passages.find((passage) => passage.id === seed.id);
  return normalizeSavedPassages([
    {
      ...seed,
      savedAt: existing?.savedAt ?? now,
    },
    ...passages.filter((passage) => passage.id !== seed.id),
  ]);
}

export function removeSavedPassage(passages: SavedPassage[], id: string) {
  return passages.filter((passage) => passage.id !== id);
}

function absoluteSourceUrl(path: string, origin: string) {
  return new URL(path, origin).toString();
}

export function formatSavedPassageMarkdown(passage: SavedPassage, origin: string) {
  const quote = passage.quote
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
  return [
    `## ${passage.workTitle} · ${passage.passageLabel}`,
    "",
    `- 稳定坐标：${passage.locator}`,
    `- 原典：${absoluteSourceUrl(passage.sourceHref, origin)}`,
    `- 收藏时间：${passage.savedAt}`,
    "",
    quote,
  ].join("\n");
}

export function formatSavedPassagesMarkdown(
  passages: SavedPassage[],
  origin: string,
  exportedAt: string,
) {
  const sorted = [...passages].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  return [
    "# foxue.ai 本地选文",
    "",
    `导出时间：${exportedAt}`,
    "",
    "> 以下引文按稳定段号保存；请打开原典链接核对上下文、版本与权利说明。",
    "",
    ...sorted.flatMap((passage, index) => [
      formatSavedPassageMarkdown(passage, origin),
      ...(index < sorted.length - 1 ? ["", "---", ""] : []),
    ]),
    "",
  ].join("\n");
}
