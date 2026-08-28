export const studyPathRegistry = {
  xinjing: {
    title: "《心经》七日慢读",
    shortTitle: "《心经》",
    href: "/xue/xinjing",
    tone: "cinnabar",
  },
  jingangjing: {
    title: "《金刚经》七日核读",
    shortTitle: "《金刚经》",
    href: "/xue/jingangjing",
    tone: "gold",
  },
  amituojing: {
    title: "《阿弥陀经》七日净读",
    shortTitle: "《阿弥陀经》",
    href: "/xue/amituojing",
    tone: "blue",
  },
} as const;

export type StudyPathId = keyof typeof studyPathRegistry;

export const studyPathIds = Object.keys(studyPathRegistry) as StudyPathId[];

export function isStudyPathId(value: unknown): value is StudyPathId {
  return typeof value === "string" && studyPathIds.includes(value as StudyPathId);
}
