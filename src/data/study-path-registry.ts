export const studyPathRegistry = {
  xinjing: {
    title: "《心经》七日慢读",
    shortTitle: "《心经》",
    href: "/xue/xinjing",
    tone: "cinnabar",
    unitLabel: "天",
    cycleLabel: "七日",
    journeyLabel: "七日路径",
  },
  jingangjing: {
    title: "《金刚经》七日核读",
    shortTitle: "《金刚经》",
    href: "/xue/jingangjing",
    tone: "gold",
    unitLabel: "天",
    cycleLabel: "七日",
    journeyLabel: "七日路径",
  },
  amituojing: {
    title: "《阿弥陀经》七日净读",
    shortTitle: "《阿弥陀经》",
    href: "/xue/amituojing",
    tone: "blue",
    unitLabel: "天",
    cycleLabel: "七日",
    journeyLabel: "七日路径",
  },
  fahuajing: {
    title: "《法华经》七关研读",
    shortTitle: "《法华经》",
    href: "/xue/fahuajing",
    tone: "lotus",
    unitLabel: "关",
    cycleLabel: "七关",
    journeyLabel: "七关路径",
  },
} as const;

export type StudyPathId = keyof typeof studyPathRegistry;

export const studyPathIds = Object.keys(studyPathRegistry) as StudyPathId[];

export function isStudyPathId(value: unknown): value is StudyPathId {
  return typeof value === "string" && studyPathIds.includes(value as StudyPathId);
}
