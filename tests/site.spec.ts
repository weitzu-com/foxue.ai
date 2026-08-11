import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const criticalRoutes = [
  "/",
  "/wenjing",
  "/jingzang",
  "/jingzang/fajujing",
  "/jingzang/fajujing/001-0559a",
  "/jingzang/dhammapada-pali",
  "/jingzang/dhammapada-pali/001-dhp1-20",
  "/jingzang/digha-nikaya-dn1",
  "/jingzang/digha-nikaya-dn1/001-dn1-0001-0120",
  "/jingzang/majjhima-nikaya-mn1",
  "/jingzang/majjhima-nikaya-mn1/001-mn1-0001-0120",
  "/jingzang/samyutta-nikaya-sn1",
  "/jingzang/samyutta-nikaya-sn1/001-sn1-1-0001-0020",
  "/fugai",
  "/touming",
];

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
  const sourceLink = page.getByRole("link", { name: /打开心经原文/ }).first();
  await expect(sourceLink).toBeVisible();
  await expect(sourceLink).toHaveAttribute("href", /\/jingzang\/xinjing\/001-0848c#/);
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
    registeredWorks: 264,
    registeredExpressions: 268,
    fullSourceTextWorks: 264,
    fullSourceTextExpressions: 268,
    stableSegments: 692328,
    structureVerifiedWorks: 264,
  });
  expect(coverage.candidateInventory.chineseSutraRecordSubset).toMatchObject({
    denominator: 881,
    controlled: 38,
    percentage: 4.31,
    sourceBytes: 247280257,
    controlledBytes: 87649399,
    bytePercentage: 35.45,
  });
  expect(coverage.candidateInventory.suttacentralPaliRootPilot).toMatchObject({
    denominator: 7288,
    controlled: 2031,
    percentage: 27.87,
    controlledBytes: 8757707,
    controlledWorks: 243,
  });
});

test("完整原文使用母版行号并兼容旧锚点", async ({ page }) => {
  await page.goto("/jingzang/jingangjing#T0235.001.0749c22");
  await page.waitForURL(/\/jingzang\/jingangjing\/001-0749c#T0235\.001\.0749c22$/);
  await expect(page.getByText("完整原文 · 分页阅读").first()).toBeVisible();
  await expect(page.locator('[id="T0235.001.0749c22"]')).toContainText("應無所");
  await expect(page.getByText(/全经 340 稳定行段/)).toBeVisible();

  await page.goto("/jingzang/jingangjing#T0235.001.0752c17");
  await page.waitForURL(/\/jingzang\/jingangjing\/001-0749c#T0235\.001\.0752c17$/);
  await expect(page.locator('[id="T0235.001.0752c17"]')).toHaveCount(1);

  await page.goto("/jingzang/fajujing#T0210.002.0567a03");
  await page.waitForURL(/\/jingzang\/fajujing\/002-0567a#T0210\.002\.0567a03$/);
  await expect(page.locator('[id="T0210.002.0567a03"]')).toContainText("法句經卷下");
  await expect(page.getByText(/全经 1400 稳定行段/)).toBeVisible();

  await page.goto("/jingzang/fajujing#T0210.004.0562a16");
  await page.waitForURL(/\/jingzang\/fajujing\/001-0562a#T0210\.004\.0562a16$/);
  await expect(page.locator('[id="T0210.004.0562a16"]')).toHaveCount(1);
});

test("长经按版页加载，不再输出整部巨型 HTML", async ({ page, request }) => {
  await page.goto("/jingzang/fajujing/001-0559a");
  const visibleSegments = page.locator(".sutra-segment");
  await expect(visibleSegments.first()).toBeVisible();
  expect(await visibleSegments.count()).toBeLessThan(40);
  await expect(page.getByRole("link", { name: /下一版页/ }).first()).toBeVisible();
  const viewport = page.viewportSize();
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(viewport?.width ?? pageWidth);

  const landing = await request.get("/jingzang/fajujing");
  const folio = await request.get("/jingzang/fajujing/001-0559a");
  expect(landing.ok()).toBeTruthy();
  expect(folio.ok()).toBeTruthy();
  expect((await landing.body()).byteLength).toBeLessThan(300_000);
  expect((await folio.body()).byteLength).toBeLessThan(300_000);

  const missing = await request.get("/jingzang/fajujing/999-9999z");
  expect(missing.status()).toBe(404);

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/fajujing/002-0567a");
  expect(sitemap).toContain("/jingzang/fahuajing/007-0062c");
});

test("新增法华经完整原文可分页阅读并保留稳定锚点", async ({ page }) => {
  await page.goto("/jingzang/fahuajing#T0262.007.0062c14");
  await page.waitForURL(/\/jingzang\/fahuajing\/007-0062c#T0262\.007\.0062c14$/);
  await expect(page.locator('[id="T0262.007.0062c14"]')).toBeVisible();
  await expect(page.getByText(/全经 5343 稳定行段/)).toBeVisible();
});

test("新增维摩诘经完整原文可分页阅读并保留末卷锚点", async ({ page, request }) => {
  await page.goto("/jingzang/weimojiejing#T0475.003.0557b26");
  await page.waitForURL(/\/jingzang\/weimojiejing\/003-0557b#T0475\.003\.0557b26$/);
  await expect(page.locator('[id="T0475.003.0557b26"]')).toBeVisible();
  await expect(page.getByText(/全经 1786 稳定行段/)).toBeVisible();

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/weimojiejing/003-0557b");
  expect(sitemap).toContain("/jingzang/dasheng-ru-lengqiejing/007-0640c");
});

test("四部阿含全本可分页阅读并保持超长经稳定锚点", async ({ page, request }) => {
  await page.goto("/jingzang/zhongahanjing#T0026.060.0809c14");
  await page.waitForURL(/\/jingzang\/zhongahanjing\/060-0809c#T0026\.060\.0809c14$/);
  await expect(page.locator('[id="T0026.060.0809c14"]')).toBeVisible();
  await expect(page.getByText(/全经 33424 稳定行段/)).toBeVisible();

  const folio = await request.get("/jingzang/zaahanjing/050-0373b");
  expect(folio.ok()).toBeTruthy();
  expect((await folio.body()).byteLength).toBeLessThan(300_000);
  const directory = await request.get("/jingzang/zaahanjing");
  expect(directory.ok()).toBeTruthy();
  expect((await directory.body()).byteLength).toBeLessThan(300_000);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/changahanjing/022-0149c");
  expect(sitemap).toContain("/jingzang/zengyiahanjing/051-0830b");
});

test("般若华严宝积涅槃大部经典可分页阅读且保持作品级去重", async ({ page, request }) => {
  await page.goto("/jingzang/dabaojijing#T0310.120.0685a25");
  await page.waitForURL(/\/jingzang\/dabaojijing\/120-0685a#T0310\.120\.0685a25$/);
  await expect(page.locator('[id="T0310.120.0685a25"]')).toBeVisible();
  await expect(page.getByText(/全经 58977 稳定行段/)).toBeVisible();

  const folio = await request.get("/jingzang/bashi-huayanjing/080-0444c");
  expect(folio.ok()).toBeTruthy();
  expect((await folio.body()).byteLength).toBeLessThan(300_000);
  const directory = await request.get("/jingzang/bashi-huayanjing");
  expect(directory.ok()).toBeTruthy();
  expect((await directory.body()).byteLength).toBeLessThan(300_000);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/liushi-huayanjing/060-0788b");
  expect(sitemap).toContain("/jingzang/nanben-dabanniepanjing/036-0852b");
});

test("六百卷大般若经作为一个文本表达跨十五个来源资产完整阅读", async ({ page, request }) => {
  await page.goto("/jingzang/daboruo-jing#T0220.600.1110b04");
  await page.waitForURL(/\/jingzang\/daboruo-jing\/600-1110b#T0220\.600\.1110b04$/);
  await expect(page.locator('[id="T0220.600.1110b04"]')).toBeVisible();
  await expect(page.getByText(/全经 279477 稳定行段/)).toBeVisible();

  const directory = await request.get("/jingzang/daboruo-jing");
  const folio = await request.get("/jingzang/daboruo-jing/600-1110b");
  expect(directory.ok()).toBeTruthy();
  expect(folio.ok()).toBeTruthy();
  expect((await directory.body()).byteLength).toBeLessThan(400_000);
  expect((await folio.body()).byteLength).toBeLessThan(300_000);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/daboruo-jing/600-1110b");
});

test("巴利法句经保留二十六品与 Bilara 原生稳定段落", async ({ page, request }) => {
  await page.goto("/jingzang/dhammapada-pali#dhp1:1");
  await page.waitForURL(/\/jingzang\/dhammapada-pali\/001-dhp1-20#dhp1:1$/);
  await expect(page.locator('[id="dhp1:1"]')).toContainText("Manopubbaṅgamā dhammā");
  await expect(page.getByText(/全经 2234 稳定段落/)).toBeVisible();

  await page.goto("/jingzang/dhammapada-pali#dhp423:57");
  await page.waitForURL(/\/jingzang\/dhammapada-pali\/026-dhp410-423#dhp423:57$/);
  await expect(page.locator('[id="dhp423:57"]')).toContainText("Dhammapadapāḷi samattā");

  const directory = await request.get("/jingzang/dhammapada-pali");
  const chapter = await request.get("/jingzang/dhammapada-pali/026-dhp410-423");
  expect(directory.ok()).toBeTruthy();
  expect(chapter.ok()).toBeTruthy();
  expect((await directory.body()).byteLength).toBeLessThan(300_000);
  expect((await chapter.body()).byteLength).toBeLessThan(300_000);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/dhammapada-pali/026-dhp410-423");
});

test("巴利长部三十四经保留 Bilara 原生锚点并受控分页", async ({ page, request }) => {
  await page.goto("/jingzang/digha-nikaya-dn1#dn1:1.1.1");
  await page.waitForURL(/\/jingzang\/digha-nikaya-dn1\/001-dn1-0001-0120#dn1:1\.1\.1$/);
  await expect(page.locator('[id="dn1:1.1.1"]')).toContainText("Evaṁ me sutaṁ");
  await expect(page.getByText(/全经 662 稳定段落/)).toBeVisible();

  await page.goto("/jingzang/digha-nikaya-dn1#dn1:3.74.7");
  await page.waitForURL(/\/jingzang\/digha-nikaya-dn1\/006-dn1-0601-0662#dn1:3\.74\.7$/);
  await expect(page.locator('[id="dn1:3.74.7"]')).toContainText("Brahmajālasuttaṁ niṭṭhitaṁ");

  const directory = await request.get("/jingzang/digha-nikaya-dn1");
  const finalUnit = await request.get("/jingzang/digha-nikaya-dn1/006-dn1-0601-0662");
  expect(directory.ok()).toBeTruthy();
  expect(finalUnit.ok()).toBeTruthy();
  expect((await directory.body()).byteLength).toBeLessThan(300_000);
  expect((await finalUnit.body()).byteLength).toBeLessThan(300_000);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/digha-nikaya-dn34");
});

test("巴利中部一百五十二经保留 Bilara 原生锚点并受控分页", async ({ page, request }) => {
  await page.goto("/jingzang/majjhima-nikaya-mn1#mn1:1.1");
  await page.waitForURL(/\/jingzang\/majjhima-nikaya-mn1\/001-mn1-0001-0120#mn1:1\.1$/);
  await expect(page.locator('[id="mn1:1.1"]')).toContainText("Evaṁ me sutaṁ");
  await expect(page.getByText(/全经 334 稳定段落/)).toBeVisible();

  await page.goto("/jingzang/majjhima-nikaya-mn1#mn1:194.10");
  await page.waitForURL(/\/jingzang\/majjhima-nikaya-mn1\/003-mn1-0241-0334#mn1:194\.10$/);
  await expect(page.locator('[id="mn1:194.10"]')).toContainText("Mūlapariyāyasuttaṁ niṭṭhitaṁ");

  const directory = await request.get("/jingzang/majjhima-nikaya-mn1");
  const finalUnit = await request.get("/jingzang/majjhima-nikaya-mn1/003-mn1-0241-0334");
  expect(directory.ok()).toBeTruthy();
  expect(finalUnit.ok()).toBeTruthy();
  expect((await directory.body()).byteLength).toBeLessThan(300_000);
  expect((await finalUnit.body()).byteLength).toBeLessThan(300_000);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/majjhima-nikaya-mn152");
});

test("巴利相应部五十六个相应保留原生锚点、范围记录与受控分页", async ({ page, request }) => {
  await page.goto("/jingzang/samyutta-nikaya-sn1#sn1.1:1.1");
  await page.waitForURL(/\/jingzang\/samyutta-nikaya-sn1\/001-sn1-1-0001-0020#sn1\.1:1\.1$/);
  await expect(page.locator('[id="sn1.1:1.1"]')).toContainText("Evaṁ me sutaṁ");
  await expect(page.getByText(/全经 1605 稳定段落/)).toBeVisible();

  await page.goto("/jingzang/samyutta-nikaya-sn42#sn42.13:33.5");
  await page.waitForURL(/\/jingzang\/samyutta-nikaya-sn42\/016-sn42-13-0241-0300#sn42\.13:33\.5$/);
  await expect(page.locator('[id="sn42.13:33.5"]')).toContainText("Gāmaṇisaṁyuttaṁ samattaṁ");

  const largeDirectory = await request.get("/jingzang/samyutta-nikaya-sn35");
  const finalUnit = await request.get("/jingzang/samyutta-nikaya-sn56/109-sn56-131-0001-0029");
  expect(largeDirectory.ok()).toBeTruthy();
  expect(finalUnit.ok()).toBeTruthy();
  expect((await largeDirectory.body()).byteLength).toBeLessThan(300_000);
  expect((await finalUnit.body()).byteLength).toBeLessThan(300_000);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/samyutta-nikaya-sn56");
});

test("关键页面没有 serious 或 critical 级无障碍问题", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
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
