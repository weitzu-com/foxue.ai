import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const criticalRoutes = ["/", "/wenjing", "/jingzang", "/fugai", "/touming"];

test("首页核心任务可见且没有水平溢出", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: /从问题/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "回到原典" })).toBeVisible();
  await expect(page.getByText("每条主张可追溯")).toBeVisible();

  const viewport = page.viewportSize();
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(viewport?.width ?? pageWidth);
});

test("问经结果同时展示结论、范围和原典证据", async ({ page }) => {
  await page.goto("/wenjing");
  const question = "佛教里的空是什么意思？";
  await page.getByLabel("输入佛学问题").fill(question);
  await page.getByRole("button", { name: "查找证据" }).click();

  await expect(page.getByText("有充分来源").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /“空”不是虚无/ })).toBeVisible();
  await expect(page.getByText("范围与提醒")).toBeVisible();
  await expect(page.getByRole("heading", { name: "证据", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /打开心经原文/ }).first()).toBeVisible();
  expect(new URL(page.url()).search).toBe("");
  expect(page.url()).not.toContain(encodeURIComponent(question));
});

test("旧查询参数不会被读取或显示", async ({ page }) => {
  await page.goto("/wenjing?q=这是不应进入页面的私密问题");

  await expect(page.getByLabel("输入佛学问题")).toHaveValue("");
  await expect(page.getByText("这是不应进入页面的私密问题")).toHaveCount(0);
});

test("覆盖登记册拒绝伪造全球百分比并公开可复算 API", async ({ page, request }) => {
  await page.goto("/fugai");

  await expect(page.getByRole("heading", { level: 1, name: /先把世界的佛典/ })).toBeVisible();
  await expect(page.getByText("尚不可声明")).toBeVisible();
  await expect(page.getByText("“—” 表示尚未测量，不表示 0。")).toBeVisible();
  await expect(page.getByText("5,005")).toBeVisible();
  await expect(page.getByText("7,584")).toBeVisible();

  const response = await request.get("/api/v1/corpus/coverage");
  expect(response.ok()).toBeTruthy();
  const coverage = await response.json();
  expect(coverage.claim.publishable).toBe(false);
  expect(coverage.globalDenominators.catalogWorks).toBeNull();
  expect(coverage.globalPercentages.catalog).toBeNull();
  expect(coverage.candidateInventory).toMatchObject({
    denominatorReady: false,
    totalSourceRecords: 12589,
  });
  expect(coverage.localHoldings).toMatchObject({
    registeredWorks: 3,
    fullSourceTextWorks: 2,
    stableSegments: 11,
  });
});

test("关键页面没有 serious 或 critical 级无障碍问题", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "自动无障碍扫描在桌面主题项目执行");

  for (const route of criticalRoutes) {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();

    const severe = results.violations.filter((item) =>
      item.impact === "serious" || item.impact === "critical",
    );
    expect(severe, `${route} 存在高严重度无障碍问题`).toEqual([]);
  }
});
