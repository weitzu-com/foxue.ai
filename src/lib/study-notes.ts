export const STUDY_NOTES_STORAGE_KEY = "foxue:study-notes:v1";
export const STUDY_NOTES_CHANGE_EVENT = "foxue:study-notes-change";
export const EMPTY_STUDY_NOTES_SNAPSHOT = '{"version":1,"notes":[]}';
export const STUDY_NOTES_CANONICAL_ORIGIN = "https://www.foxue.ai";

export const studyNoteKindLabels = {
  practice: "观照",
  understanding: "理解",
  verify: "求证",
} as const;

export type StudyNoteKind = keyof typeof studyNoteKindLabels;

export type StudyNoteSeed = {
  id: string;
  workTitle: string;
  passageLabel: string;
  locator: string;
  quote: string;
  quoteLang: string;
  sourceHref: string;
  studyHref: string;
  defaultKind: StudyNoteKind;
};

export type StudyNote = Omit<StudyNoteSeed, "defaultKind"> & {
  kind: StudyNoteKind;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type StudyNoteStore = {
  version: 1;
  notes: StudyNote[];
};

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStudyNoteKind(value: unknown): value is StudyNoteKind {
  return value === "practice" || value === "understanding" || value === "verify";
}

function isLanguageTag(value: unknown): value is string {
  return isString(value)
    && value.length <= 35
    && /^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/u.test(value);
}

function validatedNote(value: unknown): StudyNote | undefined {
  if (!value || typeof value !== "object") return undefined;
  const note = value as Partial<StudyNote>;
  if (
    !isString(note.id)
    || !isString(note.workTitle)
    || !isString(note.passageLabel)
    || !isString(note.locator)
    || !isString(note.quote)
    || !isLanguageTag(note.quoteLang)
    || !isString(note.sourceHref)
    || !isString(note.studyHref)
    || !isStudyNoteKind(note.kind)
    || !isString(note.body)
    || !isString(note.createdAt)
    || !isString(note.updatedAt)
  ) {
    return undefined;
  }

  const body = note.body.trim().slice(0, 2_000);
  if (!note.id || !body || !note.sourceHref.startsWith("/") || !note.studyHref.startsWith("/")) {
    return undefined;
  }

  return {
    id: note.id.slice(0, 180),
    workTitle: note.workTitle.slice(0, 180),
    passageLabel: note.passageLabel.slice(0, 180),
    locator: note.locator.slice(0, 240),
    quote: note.quote.slice(0, 4_000),
    quoteLang: note.quoteLang,
    sourceHref: note.sourceHref.slice(0, 800),
    studyHref: note.studyHref.slice(0, 800),
    kind: note.kind,
    body,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

export function parseStudyNotes(snapshot: string): StudyNote[] {
  try {
    const store = JSON.parse(snapshot) as Partial<StudyNoteStore>;
    if (store.version !== 1 || !Array.isArray(store.notes)) return [];
    return store.notes
      .map(validatedNote)
      .filter((note): note is StudyNote => Boolean(note))
      .slice(0, 500);
  } catch {
    return [];
  }
}

export function serializeStudyNotes(notes: StudyNote[]) {
  return JSON.stringify({ version: 1, notes } satisfies StudyNoteStore);
}

function absoluteStudyUrl(path: string, origin: string) {
  return new URL(path, origin).toString();
}

export function formatStudyNoteMarkdown(note: StudyNote, origin: string) {
  const quote = note.quote
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");

  return [
    `## ${note.workTitle} · ${note.passageLabel}`,
    "",
    `- 研读方式：${studyNoteKindLabels[note.kind]}`,
    `- 稳定坐标：${note.locator}`,
    `- 原典：${absoluteStudyUrl(note.sourceHref, origin)}`,
    `- 研读现场：${absoluteStudyUrl(note.studyHref, origin)}`,
    `- 最后修改：${note.updatedAt}`,
    "",
    quote,
    "",
    note.body,
  ].join("\n");
}

export function formatStudyNotebookMarkdown(notes: StudyNote[], origin: string, exportedAt: string) {
  const sortedNotes = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return [
    "# foxue.ai 研读笺",
    "",
    `导出时间：${exportedAt}`,
    "",
    "> 以下内容是读者的个人观照、理解或待求证问题，不是经文、注疏或本站权威解释。每则笔记保留保存时的引文快照与原典链接。",
    "",
    ...sortedNotes.flatMap((note, index) => [
      formatStudyNoteMarkdown(note, origin),
      ...(index < sortedNotes.length - 1 ? ["", "---", ""] : []),
    ]),
    "",
  ].join("\n");
}
