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

  if ((viewport?.width ?? Infinity) <= 820) {
    const taskNavigationBounds = await page.locator("[data-mobile-task-nav]").boundingBox();
    expect(bounds?.y ?? Infinity).toBeGreaterThanOrEqual(0);
    expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(
      (taskNavigationBounds?.y ?? Infinity) - 11,
    );
  }

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

test("同意后每次导航只发送一次 page_view，问经事件不含原文", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "测量契约在桌面项目验收一次");
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
  const privateQuery = "private-question-not-for-ga4";
  expect(measurementId).toMatch(/^G-[A-Z0-9]+$/);
  expect(measurementId).not.toBe("G-3MWMWV1MQC");

  // Compile the destination once so the measured navigation can read its title
  // without waiting on a cold dev compilation.
  await page.goto("/wenjing");
  await expect(page).toHaveTitle(/证据问经/);

  const hits: Array<{ url: string; body: string }> = [];
  const recordHit = async (route: { request: () => { url: () => string; postData: () => string | null }; fulfill: (options: { status: number; body: string }) => Promise<void> }) => {
    const request = route.request();
    hits.push({ url: request.url(), body: request.postData() ?? "" });
    await route.fulfill({ status: 204, body: "" });
  };
  await page.route(/google-analytics\.com|analytics\.google\.com/, (route) => recordHit(route));

  await page.addInitScript(() => {
    const recorded: Array<{
      executable: boolean;
      isArray: boolean;
      name: string | null;
      second: string | null;
      third: Record<string, unknown> | null;
    }> = [];
    const dataLayer: unknown[] = [];
    const push = dataLayer.push.bind(dataLayer);
    dataLayer.push = (...entries: unknown[]) => {
      for (const entry of entries) {
        const isArgumentsObject = Object.prototype.toString.call(entry) === "[object Arguments]";
        const command = entry as { 0?: unknown; 1?: unknown; 2?: unknown };
        const third = command[2];
        recorded.push({
          executable: isArgumentsObject && ["config", "consent", "event", "get", "js", "set"].includes(String(command[0])),
          isArray: Array.isArray(entry),
          name: isArgumentsObject ? String(command[0]) : null,
          second: isArgumentsObject && typeof command[1] === "string" ? command[1] : null,
          third: isArgumentsObject && third && typeof third === "object" && !(third instanceof Date)
            ? JSON.parse(JSON.stringify(third)) as Record<string, unknown>
            : null,
        });
      }
      return push(...entries);
    };
    window.dataLayer = dataLayer;
    (window as Window & { __foxueGtagLog?: typeof recorded }).__foxueGtagLog = recorded;
  });

  await page.goto(`/?utm_source=newsletter&secret=${privateQuery}`);
  await expect(page.locator('meta[name="ga4-measurement-id"]')).toHaveAttribute("content", measurementId);
  await expect(page.locator('script[src*="googletagmanager.com/gtag/js"]')).toHaveCount(0);
  expect(hits).toEqual([]);

  await page.getByRole("button", { name: "同意匿名统计" }).click();

  const readLog = () => page.evaluate(() => (
    (window as Window & { __foxueGtagLog?: Array<{
      executable: boolean;
      isArray: boolean;
      name: string | null;
      second: string | null;
      third: Record<string, unknown> | null;
    }> }).__foxueGtagLog ?? []
  ));
  const pageViews = (log: Awaited<ReturnType<typeof readLog>>) => log.filter((entry) => (
    entry.executable && entry.name === "event" && entry.second === "page_view"
  ));
  const networkPageViews = () => hits.filter((hit) => {
    const payload = `${hit.url}&${hit.body}`;
    return payload.includes("en=page_view") && payload.includes(`tid=${measurementId}`);
  });

  await expect.poll(async () => pageViews(await readLog()).length).toBe(1);
  const firstView = pageViews(await readLog())[0];
  expect(firstView?.third).toMatchObject({
    page_path: "/",
    page_location: `${new URL(page.url()).origin}/?utm_source=newsletter`,
  });
  expect(JSON.stringify(firstView)).not.toContain(privateQuery);
  expect(JSON.stringify(await readLog())).not.toContain(privateQuery);

  const config = (await readLog()).find((entry) => entry.executable && entry.name === "config");
  expect(config).toMatchObject({
    second: measurementId,
    third: { send_page_view: false },
  });

  await expect.poll(() => networkPageViews().length, { timeout: 20_000 }).toBe(1);
  expect(networkPageViews()[0]?.url ?? "").not.toContain("G-3MWMWV1MQC");

  await page.locator(".desktop-nav").getByRole("link", { name: "问经" }).click();
  await page.waitForURL("/wenjing");
  await expect.poll(async () => pageViews(await readLog()).map((entry) => entry.third?.page_path), {
    timeout: 12_000,
  }).toEqual([
    "/",
    "/wenjing",
  ]);
  await expect.poll(() => networkPageViews().length, { timeout: 20_000 }).toBe(2);

  await page.goto("/");
  await expect.poll(async () => pageViews(await readLog()).map((entry) => entry.third?.page_path)).toEqual(["/"]);
  await expect.poll(() => networkPageViews().length, { timeout: 20_000 }).toBe(3);
  await page.getByLabel("输入佛学问题、经名、句子或术语").fill(privateQuery);
  await page.locator(".search-form").getByRole("button", { name: "回到原典" }).click();
  await page.waitForURL("/wenjing");

  await expect.poll(async () => {
    const log = await readLog();
    return log.filter((entry) => entry.executable && entry.name === "event" && entry.second === "question_started");
  }).toEqual([
    expect.objectContaining({
      third: {
        entry_point: "home",
        example_used: false,
        input_length: privateQuery.length,
        mode: "meaning",
      },
    }),
  ]);
  const logAfterQuestion = JSON.stringify(await readLog());
  expect(logAfterQuestion).not.toContain(privateQuery);
  await expect.poll(async () => pageViews(await readLog()).map((entry) => entry.third?.page_path), {
    timeout: 12_000,
  }).toEqual([
    "/",
    "/wenjing",
  ]);
  expect(pageViews(await readLog())[1]?.third?.page_title).toContain("证据问经");
  await expect.poll(() => networkPageViews().length, { timeout: 20_000 }).toBe(4);

  const networkPayload = hits.map((hit) => `${hit.url}&${hit.body}`).join("\n");
  expect(networkPayload).not.toContain(privateQuery);
  expect(networkPayload).not.toContain("G-3MWMWV1MQC");
  expect(networkPayload).toContain("en=question_started");
  const collectFields = (hit: { url: string; body: string }) => {
    const params = new URL(hit.url).searchParams;
    if (hit.body) {
      const bodyParams = new URLSearchParams(hit.body);
      for (const [key, value] of bodyParams) {
        if (!params.has(key)) params.set(key, value);
      }
    }
    return {
      en: params.get("en"),
      dp: params.get("dp"),
      dl: params.get("dl"),
      dt: params.get("dt"),
    };
  };
  const views = networkPageViews().map(collectFields);
  expect(views.map((hit) => hit.dp)).toEqual(["/", "/wenjing", "/", "/wenjing"]);
  expect(views[0]?.dt).toContain("佛经原典");
  expect(views[1]?.dt).toContain("证据问经");
  expect(views[2]?.dt).toContain("佛经原典");
  // router.push can still be transported with the previous document title in `dt`
  // while the queued page_title above is already the destination title.
  expect(views.filter((hit) => hit.dp === "/")).toHaveLength(2);
  expect(views.filter((hit) => hit.dp === "/wenjing")).toHaveLength(2);
});
