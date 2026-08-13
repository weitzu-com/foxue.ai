import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const criticalRoutes = [
  "/",
  "/wenjing",
  "/jingzang",
  "/jingzang/fajujing",
  "/jingzang/fajujing/001-0559a",
  "/jingzang/taisho-t0002",
  "/jingzang/taisho-t0002/001-0150a",
  "/jingzang/taisho-t0152/001-0001a",
  "/jingzang/taisho-t0221/001-0001a",
  "/jingzang/taisho-t0265/001-0197a",
  "/jingzang/taisho-t0273/001-0365c",
  "/jingzang/taisho-t0294/001-0851c",
  "/jingzang/taisho-t0315a/001-0770c",
  "/jingzang/taisho-t0326/001-0042c",
  "/jingzang/taisho-t0364/001-0326c",
  "/jingzang/taisho-t0377/001-0900a",
  "/jingzang/taisho-t0388/001-1107b",
  "/jingzang/taisho-t0417/001-0897c",
  "/jingzang/taisho-t0469/001-0509b",
  "/jingzang/taisho-t0677/001-0711b",
  "/jingzang/taisho-t0686/001-0780a",
  "/jingzang/dhammapada-pali/001-dhp1-20",
  "/jingzang/digha-nikaya-dn1/001-dn1-0001-0120",
  "/jingzang/majjhima-nikaya-mn1/001-mn1-0001-0120",
  "/jingzang/samyutta-nikaya-sn1/001-sn1-1-0001-0020",
  "/jingzang/anguttara-nikaya-an1/001-an1-1-10-0001-0049",
  "/jingzang/khuddaka-nikaya-snp/001-snp1-1-0001-0071",
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
  await expect(page.getByText("1,114").first()).toBeVisible();
  await expect(page.getByText("486").first()).toBeVisible();
  await expect(page.getByText("417").first()).toBeVisible();
  await expect(page.getByText("15,069").first()).toBeVisible();
  await expect(page.getByText("藏文多版本目录")).toBeVisible();
  await expect(page.getByText("跨目录标识对齐")).toBeVisible();

  const response = await request.get("/api/v1/corpus/coverage");
  expect(response.ok()).toBeTruthy();
  const coverage = await response.json();
  expect(coverage.claim.publishable).toBe(false);
  expect(coverage.globalDenominators.catalogWorks).toBeNull();
  expect(coverage.globalPercentages.catalog).toBeNull();
  expect(coverage.candidateInventory).toMatchObject({
    denominatorReady: false,
    totalSourceRecords: 29675,
  });
  expect(coverage.localHoldings).toMatchObject({
    registeredWorks: 978,
    registeredExpressions: 1141,
    fullSourceTextWorks: 977,
    fullSourceTextExpressions: 1127,
    stableSegments: 1683984,
    structureVerifiedWorks: 978,
  });
  expect(coverage.candidateInventory.chineseSutraRecordSubset).toMatchObject({
    denominator: 881,
    controlled: 881,
    percentage: 100,
    sourceBytes: 247280257,
    controlledBytes: 247280257,
    bytePercentage: 100,
  });
  expect(coverage.candidateInventory.chineseAgamaSourceRecords).toMatchObject({
    denominator: 155,
    controlled: 155,
    percentage: 100,
  });
  expect(coverage.candidateInventory.chineseBenyuanSourceRecords).toMatchObject({
    denominator: 72,
    controlled: 72,
    percentage: 100,
  });
  expect(coverage.candidateInventory.chinesePrajnaparamitaSourceRecords).toMatchObject({
    denominator: 57,
    controlled: 57,
    percentage: 100,
  });
  expect(coverage.candidateInventory.chineseLotusSourceRecords).toMatchObject({
    denominator: 17,
    controlled: 17,
    percentage: 100,
  });
  expect(coverage.candidateInventory.chineseAvatamsakaSourceRecords).toMatchObject({
    denominator: 31,
    controlled: 31,
    percentage: 100,
  });
  expect(coverage.candidateInventory.chineseRatnakutaSourceRecords).toMatchObject({
    denominator: 12,
    controlled: 12,
    percentage: 100,
  });
  expect(coverage.candidateInventory.chineseT12SourceRecords).toMatchObject({
    denominator: 76,
    controlled: 76,
    percentage: 100,
  });
  expect(coverage.candidateInventory.chineseT13SourceRecords).toMatchObject({
    denominator: 28,
    controlled: 28,
    percentage: 100,
  });
  expect(coverage.candidateInventory.chineseT14SourceRecords).toMatchObject({
    denominator: 166,
    controlled: 166,
    percentage: 100,
  });
  expect(coverage.candidateInventory.chineseT15SourceRecords).toMatchObject({
    denominator: 71,
    controlled: 71,
    percentage: 100,
  });
  expect(coverage.candidateInventory.chineseT16SourceRecords).toMatchObject({
    denominator: 65,
    controlled: 65,
    percentage: 100,
  });
  expect(coverage.candidateInventory.chineseT17SourceRecords).toMatchObject({
    denominator: 131,
    controlled: 131,
    percentage: 100,
  });
  expect(coverage.candidateInventory.suttacentralPaliRootPilot).toMatchObject({
    denominator: 7288,
    controlled: 5764,
    percentage: 79.09,
    controlledBytes: 22786236,
    controlledWorks: 273,
  });
  expect(coverage.candidateInventory.suttacentralPaliSuttaRoot).toMatchObject({
    denominator: 5764,
    controlled: 5764,
    percentage: 100,
  });
  expect(coverage.candidateInventory.dergeKangyurEdition).toMatchObject({
    catalogRecords: 1122,
    candidateExpressions: 1114,
    excludedCatalogOnlyRecords: 8,
    nestedTextParts: 71,
    dergeIdentifiers: 1193,
    linkedAbstractWorkIds: 844,
    volumeManifests: 103,
  });
  expect(coverage.candidateInventory.multiEditionTibetanCatalogs).toMatchObject({
    configuredCatalogs: 20,
    availableCatalogs: 19,
    missingConfiguredCatalogs: 1,
    itemRecords: 15069,
    sourceBytes: 15544576,
    license: "CC0-1.0",
  });
  expect(coverage.candidateInventory.sanskritCatalogs).toMatchObject({
    dsbcCatalogRecords: 486,
    dsbcSutrapitakaRecords: 111,
    dsbcVinayapitakaRecords: 15,
    dsbcSastrapitakaRecords: 360,
    gretilPhysicalFiles: 417,
    gretilBytes: 62432484,
  });
  expect(coverage.candidateInventory.crossCatalogAlignment).toMatchObject({
    curatedRelationGroups: 29,
    curatedRelationGroupsWithIdentifierJoin: 23,
    relationGroupsRequiringManualReview: 6,
    gbcrWorksReferenced: 57,
    cbetaCitationIdentifiers: 92,
    tohCitationIdentifiers: 31,
    uniqueTohBaseIdentifiers: 29,
    matchedDergeExpressions: 29,
    matchedBdrcAbstractWorkIds: 29,
    unmatchedTohBaseIdentifiers: 0,
    denominatorImpact: "none",
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
  test.setTimeout(60_000);
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

test("汉译阿含部 T01–T02 固定来源记录完整并保留页栏行锚点", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t0002#T0002.001.0150a07");
  await page.waitForURL(/\/jingzang\/taisho-t0002\/001-0150a#T0002\.001\.0150a07$/);
  await expect(page.locator('[id="T0002.001.0150a07"]')).toContainText("如是我聞");
  await expect(page.getByText(/全经 376 稳定行段/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0100#T0100.001.0374a07");
  await page.waitForURL(/\/jingzang\/taisho-t0100\/001-0374a#T0100\.001\.0374a07$/);
  await expect(page.locator('[id="T0100.001.0374a07"]')).toContainText("如是我聞");
  await expect(page.getByText(/全经 10216 稳定行段/)).toBeVisible();

  const directory = await request.get("/jingzang/taisho-t0100");
  const finalFolio = await request.get("/jingzang/taisho-t0151/001-0884b");
  expect(directory.ok()).toBeTruthy();
  expect(finalFolio.ok()).toBeTruthy();
  expect((await directory.body()).byteLength).toBeLessThan(400_000);
  expect((await finalFolio.body()).byteLength).toBeLessThan(300_000);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/taisho-t0002/001-0150a");
  expect(sitemap).toContain("/jingzang/taisho-t0151/001-0884b");
});

test("汉译本缘部 T03–T04 固定来源完整并公开关系边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t0152#T0152.001.0001a07");
  await page.waitForURL(/\/jingzang\/taisho-t0152\/001-0001a#T0152\.001\.0001a07$/);
  await expect(page.locator('[id="T0152.001.0001a07"]')).toContainText("聞如是");
  await expect(page.getByText(/全经 4441 稳定行段/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0198#T0198.001.0174b12");
  await page.waitForURL(/\/jingzang\/taisho-t0198\/001-0174b#T0198\.001\.0174b12$/);
  await expect(page.locator('[id="T0198.001.0174b12"]')).toContainText("聞如是");
  await expect(page.getByText(/全经 1348 稳定行段/)).toBeVisible();
  await expect(page.getByText("书目关系边界：")).toBeVisible();
  await expect(page.getByText(/Sn\. Aṭṭhaka-vagga/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0213/001-0777a");
  await expect(page.getByText("归属边界：")).toBeVisible();
  await expect(page.getByText(/不将其标作佛陀亲说/)).toBeVisible();

  const directory = await request.get("/jingzang/taisho-t0152");
  const finalFolio = await request.get("/jingzang/taisho-t0213/004-0799c");
  expect(directory.ok()).toBeTruthy();
  expect(finalFolio.ok()).toBeTruthy();
  expect((await directory.body()).byteLength).toBeLessThan(400_000);
  expect((await finalFolio.body()).byteLength).toBeLessThan(300_000);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/taisho-t0152/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t0213/004-0799c");
});

test("汉译般若部 T05–T08 完整受控并保留作品、署名与读诵见证边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t0221#T0221.001.0001a02");
  await page.waitForURL(/\/jingzang\/taisho-t0221\/001-0001a#T0221\.001\.0001a02$/);
  await expect(page.locator('[id="T0221.001.0001a02"]')).toBeVisible();
  await expect(page.getByText("书目关系边界：")).toBeVisible();

  await page.goto("/jingzang/taisho-t0236b/001-0757a");
  await expect(page.getByText("归属边界：")).toBeVisible();
  await expect(page.getByText(/归属边界：目录保留传统译者署名/)).toBeVisible();
  await expect(page.getByText(/金刚般若经.*汉译组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0250/001-0847c");
  await expect(page.getByText(/归属边界：目录保留传统译者署名/)).toBeVisible();
  await expect(page.getByText(/般若心经.*长短本组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0256/001-0851a");
  await expect(page.getByText(/梵汉对音与读诵见证/)).toBeVisible();

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/taisho-t0221/020-0146c");
  expect(sitemap).toContain("/jingzang/taisho-t0256/001-0851a");
});

test("汉译法华部 T09 完整受控并区分全译、节译、仪轨组合与成书争议", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t0263#T0263.010.0134b20");
  await page.waitForURL(/\/jingzang\/taisho-t0263\/010-0134b#T0263\.010\.0134b20$/);
  await expect(page.locator('[id="T0263.010.0134b20"]')).toBeVisible();
  await expect(page.getByText(/法华经.*汉译组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0265/001-0197a");
  await expect(page.getByText("节译见证 · 完整来源分页")).toBeVisible();
  await expect(page.getByText(/只对应规范作品的部分章节/).first()).toBeVisible();
  await expect(page.getByText(/薩曇分陀利经.*节译见证/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0273/001-0365c");
  await expect(page.getByText(/现代研究提出东亚本土成书可能/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0276/001-0383b");
  await expect(page.getByText(/三部法华经仪轨组合/)).toBeVisible();

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/taisho-t0265/001-0197a");
  expect(sitemap).toContain("/jingzang/taisho-t0277/001-0389b");
});

test("汉译华严部 T10 完整受控并区分全经、单品、同作品译本与节译见证", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t0285#T0285.005.0497b29");
  await page.waitForURL(/\/jingzang\/taisho-t0285\/005-0497b#T0285\.005\.0497b29$/);
  await expect(page.locator('[id="T0285.005.0497b29"]')).toBeVisible();
  await expect(page.getByText(/Daśabhūmika.*《十地经》汉译组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0294/001-0851c");
  await expect(page.getByText("节译见证 · 完整来源分页")).toBeVisible();
  await expect(page.getByText(/只对应规范作品的部分章节/).first()).toBeVisible();
  await expect(page.getByText(/Gaṇḍavyūha.*《入法界品》汉译与节译见证/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0296/001-0878c");
  await expect(page.getByText(/Bhadracaryāpraṇidhāna.*普贤行愿汉译组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0300/001-0905a");
  await expect(page.getByText(/不思议佛境界相关译本候选/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0302/001-0912a");
  await expect(page.getByText(/来源目录题记为失译/)).toBeVisible();
  await expect(page.getByText(/Tathāgataguṇajñānācintyaviṣayāvatāra 汉译组/)).toBeVisible();

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/taisho-t0285/005-0497b");
  expect(sitemap).toContain("/jingzang/taisho-t0295/001-0876b");
  expect(sitemap).toContain("/jingzang/taisho-t0304/001-0924b");
});

test("汉译宝积部 T11 完整受控并区分合集组件、同作品译本与版本见证", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t0311#T0311.003.0704b09");
  await page.waitForURL(/\/jingzang\/taisho-t0311\/003-0704b#T0311\.003\.0704b09$/);
  await expect(page.locator('[id="T0311.003.0704b09"]')).toBeVisible();
  await expect(page.getByText(/《大宝积经》合集会与独立流通译本/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0315a/001-0770c");
  await expect(page.getByText(/同经号另一版本共享规范作品/)).toBeVisible();
  await expect(page.getByText(/Samantamukhaparivarta.*《普门品经》版本见证组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0318#T0318.002.0902a28");
  await page.waitForURL(/\/jingzang\/taisho-t0318\/002-0902a#T0318\.002\.0902a28$/);
  await expect(page.locator('[id="T0318.002.0902a28"]')).toBeVisible();
  await expect(page.getByText(/Mañjuśrībuddhakṣetraguṇavyūha.*文殊师利佛土庄严汉译组/)).toBeVisible();

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/taisho-t0315b/001-0777b");
  expect(sitemap).toContain("/jingzang/taisho-t0319/003-0918c");
  expect(sitemap).toContain("/jingzang/taisho-t0320/020-0977a");
});

test("汉译 T12 完整受控并区分异译、校辑本、后分与残篇候选", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t0326/001-0042c");
  await expect(page.getByText("节译见证 · 完整来源分页")).toBeVisible();
  await expect(page.getByText(/优波离所问汉译与礼忏节译见证/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0364/001-0326c");
  await expect(page.getByText(/后世据多种旧译校辑的合成本/)).toBeVisible();
  await expect(page.getByText(/《无量寿经》汉译与校辑见证组/)).toBeVisible();

  await page.goto("/jingzang/nanben-dabanniepanjing/001-0605a");
  await expect(page.getByText(/依据既有译本加治编定的版本见证/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0377/001-0900a");
  await expect(page.getByText("后分见证 · 完整来源分页")).toBeVisible();
  await expect(page.getByText(/规范作品的后分或续接见证/)).toBeVisible();
  await expect(page.getByText(/大乘《大般涅槃经》汉译、校订本与后分见证/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0388/001-1107b");
  await expect(page.getByText("残篇候选 · 完整来源分页")).toBeVisible();
  await expect(page.getByText(/只存一卷或一章/)).toBeVisible();
  await expect(page.getByText(/《大云经》汉文文本家族待考/)).toBeVisible();

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/taisho-t0326/001-0042c");
  expect(sitemap).toContain("/jingzang/taisho-t0364/002-0340b");
  expect(sitemap).toContain("/jingzang/taisho-t0377/002-0912a");
  expect(sitemap).toContain("/jingzang/taisho-t0388/001-1110c");
});

test("汉译 T13 大集部完整受控并区分合集、异译、节本与署名争议", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t0397/001-0001a");
  await expect(page.getByText(/多个时代、多个译者材料汇成的合集见证/)).toBeVisible();
  await expect(page.getByText(/《大方等大集经》合集与独立流通译本/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0407/001-0662a");
  await expect(page.getByText(/现代研究对实际译者或成书路径存在争议/)).toBeVisible();
  await expect(page.getByText(/《虚空藏菩萨经》汉译组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0412/001-0777c");
  await expect(page.getByText(/东亚本土成书可能/)).toBeVisible();
  await expect(page.getByText(/《地藏菩萨本愿经》译者与成书地争议/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0417/001-0897c");
  await expect(page.getByText("节本见证 · 完整来源分页")).toBeVisible();
  await expect(page.getByText(/同作品完整传本的后出节本见证/)).toBeVisible();
  await expect(page.getByText(/《般舟三昧经》汉译与节本见证组/)).toBeVisible();

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/taisho-t0397/060-0407a");
  expect(sitemap).toContain("/jingzang/taisho-t0417/001-0902c");
  expect(sitemap).toContain("/jingzang/taisho-t0424/005-0998a");
});

test("汉译 T14 经集部完整受控并区分异译、版本、部分译出与范围边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t0450/001-0404c");
  await expect(page.getByText(/《药师如来本愿经》汉译组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0451/001-0409a");
  await expect(page.getByText(/药师如来本愿与七佛本愿相关文本组/)).toBeVisible();
  await expect(page.getByText(/不在范围差异未经逐章校勘前强行合并/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0446a/001-0364c");
  await expect(page.getByText(/同经号另一版本共享规范作品/)).toBeVisible();
  await expect(page.getByText(/《过去庄严劫千佛名经》版本见证组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0469/001-0509b");
  await expect(page.getByText("节译见证 · 完整来源分页")).toBeVisible();
  await expect(page.getByText(/规范作品的部分章节/)).toBeVisible();
  await expect(page.getByText(/字母品独立译出见证/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0474/001-0519a");
  await expect(page.getByText(/《维摩诘经》汉译组/)).toBeVisible();

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/taisho-t0446b/001-0371a");
  expect(sitemap).toContain("/jingzang/taisho-t0469/001-0510a");
  expect(sitemap).toContain("/jingzang/taisho-t0476/006-0588a");
});

test("汉译 T15 经集部完整受控并区分异译、局部译出、撰述与范围候选", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t0586/001-0033a");
  await expect(page.getByText(/《思益梵天所问经》汉译组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0606/001-0181c");
  await expect(page.getByText(/不将其标作佛陀亲说/)).toBeVisible();
  await expect(page.getByText(/《修行道地》相关文本家族/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0629/001-0449a");
  await expect(page.getByText("节译见证 · 完整来源分页")).toBeVisible();
  await expect(page.getByText(/《阿阇世王经》汉译与别品译出组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0640/001-0620a");
  await expect(page.getByText("节译见证 · 完整来源分页")).toBeVisible();
  await expect(page.getByText(/《月灯三昧经》与独立译出见证/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0641/001-0623b");
  await expect(page.getByText(/同题同译者范围待定组/)).toBeVisible();
  await expect(page.getByText(/不把 T0641 计作已验证同作品表达或版本/)).toBeVisible();

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/taisho-t0586/004-0062a");
  expect(sitemap).toContain("/jingzang/taisho-t0639/010-0620a");
  expect(sitemap).toContain("/jingzang/taisho-t0652/003-0782c");
});

test("汉译 T16 经集部完整受控并区分异译、合部、单品译出与短本", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t0664/001-0359b");
  await expect(page.getByText("合部见证 · 完整原文")).toBeVisible();
  await expect(page.getByText(/《金光明经》译本与合部见证组/)).toBeVisible();
  await expect(page.getByText(/不将其冒充单一古代译本/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0677/001-0711b");
  await expect(page.getByText("节译见证 · 完整来源记录")).toBeVisible();
  await expect(page.getByText(/《解深密经》全译与单品译出组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0686/001-0780a");
  await expect(page.getByText("短本见证 · 完整来源记录")).toBeVisible();
  await expect(page.getByText(/《盂兰盆经》完整文本与短本见证组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0710/001-0819a");
  await expect(page.getByText(/Śālistambasūtra.*《稻芉经》汉译组/)).toBeVisible();

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/taisho-t0664/008-0402a");
  expect(sitemap).toContain("/jingzang/taisho-t0677/001-0714c");
  expect(sitemap).toContain("/jingzang/taisho-t0712/001-0826a");
});

test("汉译 T17 经集部完整受控并区分版本、候选关系与来源归属", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t0751a/001-0573a");
  await expect(page.getByText(/《五无反复经》版本与经号见证组/)).toBeVisible();
  await expect(page.getByText(/与同经号另一版本共享规范作品/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0821/001-0837b");
  await expect(page.getByText(/Tathāgatagarbha 相关文本候选/)).toBeVisible();
  await expect(page.getByText(/保持独立暂定作品/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0839/001-0901c");
  await expect(page.getByText(/东亚本土成书可能/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0847/001-0935a");
  await expect(page.getByText(/造、撰、集或论类文本/)).toBeVisible();

  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/taisho-t0721/070-0417c");
  expect(sitemap).toContain("/jingzang/taisho-t0839/002-0910c");
  expect(sitemap).toContain("/jingzang/taisho-t0847/003-0963a");
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

test("巴利增支部十一集保留逐经与范围锚点并受控分页", async ({ page, request }) => {
  await page.goto("/jingzang/anguttara-nikaya-an1#an1.1:1.1");
  await page.waitForURL(/\/jingzang\/anguttara-nikaya-an1\/001-an1-1-10-0001-0049#an1\.1:1\.1$/);
  await expect(page.locator('[id="an1.1:1.1"]')).toContainText("Evaṁ me sutaṁ");
  await expect(page.getByText(/全经 1288 稳定段落/)).toBeVisible();

  await page.goto("/jingzang/anguttara-nikaya-an3#an3.70:41.4");
  await page.waitForURL(/\/jingzang\/anguttara-nikaya-an3\/071-an3-70-0121-0238#an3\.70:41\.4$/);
  await expect(page.locator('[id="an3.70:41.4"]')).toContainText("titthiyamūluposathoti");

  const largeDirectory = await request.get("/jingzang/anguttara-nikaya-an4");
  const finalUnit = await request.get("/jingzang/anguttara-nikaya-an11/036-an11-992-1151-0001-0038");
  expect(largeDirectory.ok()).toBeTruthy();
  expect(finalUnit.ok()).toBeTruthy();
  expect((await largeDirectory.body()).byteLength).toBeLessThan(300_000);
  expect((await finalUnit.body()).byteLength).toBeLessThan(300_000);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/anguttara-nikaya-an11");
});

test("巴利小部二十书的固定经藏目录完整受控并区分书级作品与物理记录", async ({ page, request }) => {
  await page.goto("/jingzang/khuddaka-nikaya-kp#kp1:1.1");
  await page.waitForURL(/\/jingzang\/khuddaka-nikaya-kp\/001-kp1-0001-0013#kp1:1\.1$/);
  await expect(page.locator('[id="kp1:1.1"]')).toContainText("Namo tassa Bhagavato");
  await expect(page.getByText(/全经 368 稳定段落/)).toBeVisible();

  await page.goto("/jingzang/khuddaka-nikaya-snp#snp1.1:1.1");
  await page.waitForURL(/\/jingzang\/khuddaka-nikaya-snp\/001-snp1-1-0001-0071#snp1\.1:1\.1$/);
  await expect(page.locator('[id="snp1.1:1.1"]')).toContainText("Yo uppatitaṁ vineti kodhaṁ");

  await page.goto("/jingzang/khuddaka-nikaya-ja#ja547:803.1");
  await page.waitForURL(/\/jingzang\/khuddaka-nikaya-ja\/680-ja547-3361-3382#ja547:803\.1$/);
  await expect(page.locator('[id="ja547:803.1"]')).toContainText("Jātakapāḷi niṭṭhitā");

  const largeDirectory = await request.get("/jingzang/khuddaka-nikaya-ja");
  const laterText = await request.get("/jingzang/khuddaka-nikaya-mil/256-mil8-0001-0032");
  expect(largeDirectory.ok()).toBeTruthy();
  expect(laterText.ok()).toBeTruthy();
  expect((await largeDirectory.body()).byteLength).toBeLessThan(400_000);
  expect((await laterText.body()).byteLength).toBeLessThan(300_000);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("/jingzang/khuddaka-nikaya-snp");
  expect(sitemap).toContain("/jingzang/khuddaka-nikaya-thig");
});

test.describe("桌面无障碍扫描", () => {
  // 在创建页面上下文前排除移动端项目，避免无意义地启动第三个浏览器上下文。
  test.skip(({ isMobile }) => isMobile, "自动无障碍扫描在桌面主题项目执行");

  test("关键页面没有 serious 或 critical 级无障碍问题", async ({ page }) => {
    // 两个桌面主题扫描各页面形态与来源角色的固定代表集；语料完整性由登记册和逐来源测试覆盖。
    test.setTimeout(360_000);

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
});
