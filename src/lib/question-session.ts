export const QUESTION_SESSION_KEY = "foxue:pending-question";
export const QUESTION_MODE_KEY = "foxue:question-mode";
export const QUESTION_SOURCE_CONTEXT_KEY = "foxue:question-source-context:v1";
export const QUESTION_CHANGE_EVENT = "foxue:question-change";
export const QUESTION_MAX_LENGTH = 500;
export const PASSAGE_QUESTION_PROMPT = "这段经文是什么意思？";

const QUESTION_SOURCE_CONTEXT_VERSION = 1;
const MAX_SOURCE_QUOTE_LENGTH = 1_200;

export type QuestionSourceContext = {
  version: typeof QUESTION_SOURCE_CONTEXT_VERSION;
  id: string;
  workTitle: string;
  passageLabel: string;
  locator: string;
  quote: string;
  quoteLang: string;
  sourceHref: string;
  sourceName: string;
  responsibility: string;
  canonRef: string;
  segmentCount: number;
};

type QuestionSaveOptions = {
  preserveSourceContext?: boolean;
};

function normalizedString(value: unknown, maximumLength: number) {
  if (typeof value !== "string") return "";
  const normalized = value.trim();
  if (!normalized || [...normalized].length > maximumLength) return "";
  return normalized;
}

function normalizedSourceHref(value: unknown) {
  const candidate = normalizedString(value, 2_048);
  if (!candidate) return "";

  try {
    const url = new URL(candidate, "https://www.foxue.ai");
    if (
      url.origin !== "https://www.foxue.ai"
      || !url.pathname.startsWith("/jingzang/")
      || !url.hash.slice(1)
    ) {
      return "";
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "";
  }
}

export function parseQuestionSourceContext(value: string | null): QuestionSourceContext | null {
  if (!value) return null;

  try {
    const candidate: unknown = JSON.parse(value);
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;
    const record = candidate as Record<string, unknown>;
    const id = normalizedString(record.id, 160);
    const workTitle = normalizedString(record.workTitle, 240);
    const passageLabel = normalizedString(record.passageLabel, 320);
    const locator = normalizedString(record.locator, 320);
    const quote = normalizedString(record.quote, MAX_SOURCE_QUOTE_LENGTH);
    const quoteLang = normalizedString(record.quoteLang, 48);
    const sourceHref = normalizedSourceHref(record.sourceHref);
    const sourceName = normalizedString(record.sourceName, 320);
    const responsibility = normalizedString(record.responsibility, 320);
    const canonRef = normalizedString(record.canonRef, 240);
    const segmentCount = Number(record.segmentCount);

    if (
      record.version !== QUESTION_SOURCE_CONTEXT_VERSION
      || !id
      || !workTitle
      || !passageLabel
      || !locator
      || !quote
      || !quoteLang
      || !sourceHref
      || !sourceName
      || !responsibility
      || !canonRef
      || !Number.isInteger(segmentCount)
      || segmentCount < 1
      || segmentCount > 200
    ) {
      return null;
    }

    return {
      version: QUESTION_SOURCE_CONTEXT_VERSION,
      id,
      workTitle,
      passageLabel,
      locator,
      quote,
      quoteLang,
      sourceHref,
      sourceName,
      responsibility,
      canonRef,
      segmentCount,
    };
  } catch {
    return null;
  }
}

export function normalizeQuestion(value: string) {
  return value.trim().slice(0, QUESTION_MAX_LENGTH);
}

export function saveQuestionToSession(
  question: string,
  mode?: string,
  options: QuestionSaveOptions = {},
) {
  const normalized = normalizeQuestion(question);

  if (normalized) {
    window.sessionStorage.setItem(QUESTION_SESSION_KEY, normalized);
  } else {
    window.sessionStorage.removeItem(QUESTION_SESSION_KEY);
  }

  if (mode) {
    window.sessionStorage.setItem(QUESTION_MODE_KEY, mode);
  } else {
    window.sessionStorage.removeItem(QUESTION_MODE_KEY);
  }

  if (!options.preserveSourceContext) {
    window.sessionStorage.removeItem(QUESTION_SOURCE_CONTEXT_KEY);
  }

  window.dispatchEvent(new Event(QUESTION_CHANGE_EVENT));
  return normalized;
}

export function savePassageQuestionToSession(
  context: Omit<QuestionSourceContext, "version">,
) {
  const normalizedContext = parseQuestionSourceContext(JSON.stringify({
    ...context,
    version: QUESTION_SOURCE_CONTEXT_VERSION,
  }));
  if (!normalizedContext) {
    throw new Error("Invalid scripture source context");
  }

  window.sessionStorage.setItem(
    QUESTION_SOURCE_CONTEXT_KEY,
    JSON.stringify(normalizedContext),
  );
  window.sessionStorage.setItem(QUESTION_MODE_KEY, "passage");
  window.sessionStorage.setItem(QUESTION_SESSION_KEY, PASSAGE_QUESTION_PROMPT);
  window.dispatchEvent(new Event(QUESTION_CHANGE_EVENT));
  return normalizedContext;
}

export function clearQuestionSourceContextFromSession() {
  window.sessionStorage.removeItem(QUESTION_SOURCE_CONTEXT_KEY);
  if (window.sessionStorage.getItem(QUESTION_MODE_KEY) === "passage") {
    window.sessionStorage.removeItem(QUESTION_MODE_KEY);
  }
  window.dispatchEvent(new Event(QUESTION_CHANGE_EVENT));
}
