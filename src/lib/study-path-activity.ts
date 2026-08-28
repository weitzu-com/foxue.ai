import { isStudyPathId, type StudyPathId } from "@/data/study-path-registry";

export const STUDY_PATH_ACTIVITY_STORAGE_KEY = "foxue:study-path-activity:v1";
export const STUDY_PATH_ACTIVITY_CHANGE_EVENT = "foxue:study-path-activity-change";
export const EMPTY_STUDY_PATH_ACTIVITY_SNAPSHOT = '{"version":1,"entries":[]}';

export type StudyPathDayStatus = "completed" | "skipped";

export type StudyPathActivityEntry = {
  id: StudyPathId;
  activeDay: number;
  completedDays: number[];
  skippedDays: number[];
  updatedAt: string;
};

type StudyPathActivityStore = {
  version: 1;
  entries: StudyPathActivityEntry[];
};

function validDay(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 7;
}

function normalizedDays(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(validDay))].sort((a, b) => a - b);
}

function validatedEntry(value: unknown): StudyPathActivityEntry | undefined {
  if (!value || typeof value !== "object") return undefined;
  const entry = value as Partial<StudyPathActivityEntry>;
  if (
    !isStudyPathId(entry.id)
    || !validDay(entry.activeDay)
    || typeof entry.updatedAt !== "string"
    || !Number.isFinite(Date.parse(entry.updatedAt))
  ) {
    return undefined;
  }

  const completedDays = normalizedDays(entry.completedDays);
  const completedSet = new Set(completedDays);
  const skippedDays = normalizedDays(entry.skippedDays)
    .filter((day) => !completedSet.has(day));

  return {
    id: entry.id,
    activeDay: entry.activeDay,
    completedDays,
    skippedDays,
    updatedAt: entry.updatedAt,
  };
}

export function normalizeStudyPathActivities(entries: StudyPathActivityEntry[]) {
  const unique = new Map<StudyPathId, StudyPathActivityEntry>();
  [...entries]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .forEach((entry) => {
      const validated = validatedEntry(entry);
      if (validated && !unique.has(validated.id)) unique.set(validated.id, validated);
    });
  return [...unique.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function parseStudyPathActivities(snapshot: string) {
  try {
    const store = JSON.parse(snapshot) as Partial<StudyPathActivityStore>;
    if (store.version !== 1 || !Array.isArray(store.entries)) return [];
    return normalizeStudyPathActivities(
      store.entries
        .map(validatedEntry)
        .filter((entry): entry is StudyPathActivityEntry => Boolean(entry)),
    );
  } catch {
    return [];
  }
}

export function serializeStudyPathActivities(entries: StudyPathActivityEntry[]) {
  return JSON.stringify({
    version: 1,
    entries: normalizeStudyPathActivities(entries),
  } satisfies StudyPathActivityStore);
}

export function upsertStudyPathActivity(
  entries: StudyPathActivityEntry[],
  input: {
    id: StudyPathId;
    activeDay: number;
    statuses: Record<string, StudyPathDayStatus>;
  },
  now: string,
) {
  const completedDays: number[] = [];
  const skippedDays: number[] = [];
  Object.entries(input.statuses).forEach(([day, status]) => {
    const dayNumber = Number(day);
    if (!validDay(dayNumber)) return;
    if (status === "completed") completedDays.push(dayNumber);
    if (status === "skipped") skippedDays.push(dayNumber);
  });

  return normalizeStudyPathActivities([
    {
      id: input.id,
      activeDay: validDay(input.activeDay) ? input.activeDay : 1,
      completedDays,
      skippedDays,
      updatedAt: now,
    },
    ...entries.filter((entry) => entry.id !== input.id),
  ]);
}

export function studyPathCoveredCount(entry: StudyPathActivityEntry) {
  return new Set([...entry.completedDays, ...entry.skippedDays]).size;
}

export function studyPathResumeDay(entry: StudyPathActivityEntry) {
  return studyPathCoveredCount(entry) >= 7 ? 1 : entry.activeDay;
}
