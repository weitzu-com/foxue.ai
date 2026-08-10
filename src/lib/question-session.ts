export const QUESTION_SESSION_KEY = "foxue:pending-question";
export const QUESTION_MODE_KEY = "foxue:question-mode";
export const QUESTION_CHANGE_EVENT = "foxue:question-change";
export const QUESTION_MAX_LENGTH = 500;

export function normalizeQuestion(value: string) {
  return value.trim().slice(0, QUESTION_MAX_LENGTH);
}

export function saveQuestionToSession(question: string, mode?: string) {
  const normalized = normalizeQuestion(question);

  if (normalized) {
    window.sessionStorage.setItem(QUESTION_SESSION_KEY, normalized);
  } else {
    window.sessionStorage.removeItem(QUESTION_SESSION_KEY);
  }

  if (mode) {
    window.sessionStorage.setItem(QUESTION_MODE_KEY, mode);
  }

  window.dispatchEvent(new Event(QUESTION_CHANGE_EVENT));
  return normalized;
}
