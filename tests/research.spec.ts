import { expect, test } from "@playwright/test";
import { buildResearchResult } from "../src/lib/research";
import { PASSAGE_QUESTION_PROMPT, type QuestionSourceContext } from "../src/lib/question-session";

const sourceContext: QuestionSourceContext = {
  version: 1,
  id: "folio:yzzxzx",
  workTitle: "《般若波罗蜜多心经》",
  passageLabel: "所选经文",
  locator: "T0251.001.0848c08",
  quote: "異色，色即是空，空即是色；受、想、行、識，亦復如",
  quoteLang: "zh-Hant",
  sourceHref: "/jingzang/xinjing/001-0848c#T0251.001.0848c08",
  sourceName: "CBETA Online",
  responsibility: "唐玄奘译",
  canonRef: "大正藏 T08, no. 251",
  segmentCount: 1,
};

test("locked passage keywords route the initial passage prompt", () => {
  expect(buildResearchResult(` ${PASSAGE_QUESTION_PROMPT} `, sourceContext).concept?.slug).toBe("kong");
});

for (const question of ["无住是什么意思？", "量子计算是什么意思？"]) {
  test(`locked Heart Sutra preserves evidence while following: ${question}`, () => {
    const snapshot = { ...sourceContext };
    const result = buildResearchResult(question, sourceContext);
    const explicitResult = buildResearchResult(question);
    expect(result.query).toBe(question);
    expect(result.concept).toEqual(explicitResult.concept);
    expect(result.status).toBe(explicitResult.status);
    expect(result.evidence[0]).toEqual({
      label: sourceContext.workTitle,
      quote: sourceContext.quote,
      href: sourceContext.sourceHref,
      source: sourceContext.sourceName,
      locator: sourceContext.locator,
      relation: "直接",
    });
    expect(result.evidence.slice(1)).toEqual(explicitResult.evidence);
    expect(sourceContext).toEqual(snapshot);
  });
}
