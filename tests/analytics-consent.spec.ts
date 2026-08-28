import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const consentKey = "foxue:analytics-consent";

test.beforeEach(() => {
  test.skip(
    !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    "统计选择测试需要在构建时设置测试用 GA 测量 ID",
  );
});

test("首次统计选择在深浅主题与移动端均清楚可达且默认不加载统计", async ({ page }) => {
  await page.goto("/");

  const consent = page.getByRole("complementary", { name: "网站分析设置" });
  const accept = consent.getByRole("button", { name: "同意匿名统计" });
  const deny = consent.getByRole("button", { name: "暂不" });

  await expect(consent).toBeVisible();
  await expect(accept).toBeVisible();
  await expect(deny).toBeVisible();
  await expect(page.locator('script[src*="googletagmanager.com/gtag/js"]')).toHaveCount(0);
  expect(await page.evaluate((key) => window.localStorage.getItem(key), consentKey)).toBeNull();

  const accessibility = await new AxeBuilder({ page })
    .include(".analytics-consent")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(accessibility.violations.filter((item) =>
    item.impact === "serious" || item.impact === "critical",
  )).toEqual([]);

  await accept.hover();
  const hoverAccessibility = await new AxeBuilder({ page })
    .include(".analytics-consent")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(hoverAccessibility.violations.filter((item) =>
    item.impact === "serious" || item.impact === "critical",
  )).toEqual([]);

  await accept.focus();
  await expect(accept).toBeFocused();

  const bounds = await consent.boundingBox();
  const viewport = page.viewportSize();
  expect(bounds?.x ?? 0).toBeGreaterThanOrEqual(0);
  expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(viewport?.width ?? Infinity);

  await deny.click();
  await expect(consent).toBeHidden();
  expect(await page.evaluate((key) => window.localStorage.getItem(key), consentKey)).toBe("denied");
  await expect(page.locator('script[src*="googletagmanager.com/gtag/js"]')).toHaveCount(0);

  await page.reload();
  await expect(consent).toBeHidden();
  await page.getByRole("button", { name: "分析偏好" }).click();
  await expect(consent).toBeVisible();
  expect(await page.evaluate((key) => window.localStorage.getItem(key), consentKey)).toBeNull();
});
