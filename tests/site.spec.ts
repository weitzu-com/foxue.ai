import AxeBuilder from "@axe-core/playwright";
import { expect, test, type APIRequestContext } from "@playwright/test";

async function readSitemaps(request: APIRequestContext) {
  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.ok()).toBeTruthy();
  const robots = await robotsResponse.text();
  const sitemapPaths = [...robots.matchAll(/^Sitemap:\s+https?:\/\/[^/]+(\/sitemap\/\d+\.xml)$/gm)]
    .map((match) => match[1]);
  expect(sitemapPaths.length).toBeGreaterThan(0);
  const responses = await Promise.all(sitemapPaths.map((path) => request.get(path)));
  expect(responses.every((response) => response.ok())).toBeTruthy();
  return (await Promise.all(responses.map((response) => response.text()))).join("\n");
}

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
  "/jingzang/taisho-t1429/001-1015a",
  "/jingzang/taisho-t1509/001-0057a",
  "/jingzang/taisho-t1564/001-0001a",
  "/jingzang/taisho-t1579/100-0882a",
  "/jingzang/taisho-t1583/001-1013c",
  "/jingzang/dhammapada-pali/001-dhp1-20",
  "/jingzang/digha-nikaya-dn1/001-dn1-0001-0120",
  "/jingzang/majjhima-nikaya-mn1/001-mn1-0001-0120",
  "/jingzang/samyutta-nikaya-sn1/001-sn1-1-0001-0020",
  "/jingzang/anguttara-nikaya-an1/001-an1-1-10-0001-0049",
  "/jingzang/khuddaka-nikaya-snp/001-snp1-1-0001-0071",
  "/jingzang/sanskrit-mahavadanasutra/001-sf36-0001-0120",
  "/jingzang/sanskrit-candrasutra/001-sf276-0001-0025",
  "/jingzang/patna-dharmapada/001-pdhp1-13-0001-0034",
  "/jingzang/pali-bhikkhu-patimokkha/001-pli-tv-bu-pm-0001-0120",
  "/jingzang/pali-dhammasangani/001-ds1-1-0001-0092",
  "/fugai",
  "/shenjiao",
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
  await expect(page.getByText("rKTs 核心编号候选连接")).toBeVisible();
  await expect(page.getByText("跨目录标识对齐")).toBeVisible();
  await expect(page.getByText("SuttaCentral 汉—巴平行证据")).toBeVisible();
  await expect(page.getByText("汉—巴作品裁决队列")).toBeVisible();
  await expect(page.getByText("梵文逐文件权利审计")).toBeVisible();
  await expect(page.getByText("梵文与俗语受控原文")).toBeVisible();
  await expect(page.getByText("巴利律藏受控原文")).toBeVisible();
  await expect(page.getByText("巴利论藏七论受控原文")).toBeVisible();

  const response = await request.get("/api/v1/corpus/coverage");
  expect(response.ok()).toBeTruthy();
  const coverage = await response.json();
  const healthResponse = await request.get("/api/health");
  expect(healthResponse.ok()).toBeTruthy();
  const health = await healthResponse.json();
  expect(health.capabilities.corpusRegistry).toBe(
    `v${coverage.generatedFrom.registryVersion}-public-draft`,
  );
  expect(coverage.claim.publishable).toBe(false);
  expect(coverage.globalDenominators.catalogWorks).toBeNull();
  expect(coverage.globalPercentages.catalog).toBeNull();
  expect(coverage.candidateInventory).toMatchObject({
    denominatorReady: false,
    totalSourceRecords: 29675,
  });
  expect(coverage.localHoldings).toMatchObject({
    registeredWorks: 2269,
    registeredExpressions: 2488,
    fullSourceTextWorks: 2242,
    fullSourceTextExpressions: 2445,
    stableSegments: 4849562,
    structureVerifiedWorks: 2269,
  });
  expect(coverage.candidateInventory.suttacentralIndicRoots).toMatchObject({
    controlledWorks: 3,
    controlledExpressions: 3,
    controlledRootRecords: 24,
    controlledRootBytes: 216385,
    stableSegments: 1909,
    filesApprovedForReadingAndRetrieval: 24,
    filesApprovedForModelTraining: 0,
    sanskritRootFiles: 2,
    prakritRootFiles: 22,
    omittedEmptyEditorialPlaceholderSegments: 1,
  });
  expect(coverage.candidateInventory.suttacentralPaliRootPilot).toMatchObject({
    denominator: 7288,
    controlled: 7288,
    percentage: 100,
    controlledBytes: 40689597,
    controlledWorks: 286,
  });
  expect(coverage.candidateInventory.suttacentralPaliAbhidhammaRoot).toMatchObject({
    denominator: 1102,
    controlled: 1102,
    percentage: 100,
    controlledBytes: 11192917,
    controlledWorks: 7,
    controlledExpressions: 7,
    stableSegments: 88414,
    omittedEmptySegments: 0,
    filesApprovedForReadingAndRetrieval: 1102,
    filesApprovedForModelTraining: 0,
  });
  expect(coverage.candidateInventory.chineseSutraRecordSubset).toMatchObject({
    denominator: 2213,
    controlled: 2213,
    percentage: 100,
    sourceBytes: 789383075,
    controlledBytes: 789383075,
    bytePercentage: 100,
    t22InventorySha256: "bdb1785232734284e3e10484ff8b2aa7aa0d092c4fa0faaa374f3ff84ac7196d",
    t23InventorySha256: "ebdf1dcea2dbb5cc16e8e1106d9d49e8c5836313a739efdc0f978cf8f44c53c8",
    t24InventorySha256: "3877b903a827bf8023699d63f54555f34aa77a2381aea35049fd0df631fb56b5",
    t25InventorySha256: "84355632ad64186d56ade349561028ac4bce2e3020e51d373a469df0fdafe391",
    t26InventorySha256: "006bedf4dd5b28ff0d1c2de5e87224f6bae7b93b187fb86e9b26cedef8a3ccf9",
    t27InventorySha256: "4154778df251623c7d3fed77a72307471d6e1d25db3b99e3a942e7410fd75907",
    t28InventorySha256: "33f6555b386a3afa17ab24cad128a3f2264c3373f25cd8ae18037a753fd23679",
    t29InventorySha256: "fbab8cbb8bb0770c128cce4e3d34749bbeb5dd53c47f6bb20a1e8948bb4b925e",
    t46InventorySha256: "bedc2a988c43e7af5889a62d743f4eabd622dfcd9c59cf35ff1e9e86c9c9b045",
    t47InventorySha256: "aa093ac59f8c91e8d8c6c5fc4e2dcc3d4b7b862b17a8e00a167dbc540e79a8f4",
    t48InventorySha256: "ad95ac51f6e32b0b0c5073306f7211b8a3bc800459a764125707c1653fa4002b",
    t49InventorySha256: "0f92e34f3ba4576e21c2ae4112c1930006cd301ec972ba3fe12e42c40f5fb1f4",
    t50InventorySha256: "66cfbfc0a258c4f893dec14577d0d62c891176686066e26643abba92851df7ad",
    t51InventorySha256: "aca7eb33bc36ea403998c747b70fec5c790c8e029c7bba83a61ce757b7892951",
    t52InventorySha256: "574dd7c466747a7777488fe40ecf8c2ddb2e1b71d0637bd49f73cdc23cd7916a",
    t53InventorySha256: "ebe99cb171dae4f820997ae20bc6b60a2760c3031757df7e78e0a1d47386dbf3",
    t30InventorySha256: "dda6b9612df5cb08b0900eca6a76726aa421c1a6c92923d612add7b3fccc2839",
    t31InventorySha256: "9efd4f5897ef47c36e5310b9263dfa515483fa6c713433555a899e12a63566ca",
    t32InventorySha256: "7f4aae2c0ab97ffdf872ec72705acf05f9ef6dcd0d42f12e9756c9465ca670f7",
    t33InventorySha256: "3556eb927dd4bbc00229fb5c8c45208f26c14a92838ddcfb7a33b7a20784e174",
    t34InventorySha256: "0e5bca400777a5f819f1d6809f5e803e1ce657dc699bfea37da15d2b83c7a8fb",
    t35InventorySha256: "ad6ba047693f8d7693df43e204d5c55c9d8924e825e1d54fb7924cafb6227697",
    t36InventorySha256: "5e9130fd3ab079deeb3300d411c23e2773ba9693c82e2742dee1340f489a3d72",
    t37InventorySha256: "7b66418c7d6b711a3ed9b2b9c0f0317c9278ba5de9b647151a6b7b8613df15e2",
    t38InventorySha256: "d19c39a8cbf41f9cc14293f439046a71ece59d5412087389cb4301e136b78359",
    t39InventorySha256: "7c71afa40dfe62b4c02367357445bf865f31a4456a20e01ea3737d2626451550",
    t40InventorySha256: "9476e7abcbc6ee6b90a6fc4be109e75a4ee4acf63b896e9754dafb52308b0abe",
    t41InventorySha256: "25e49bce89d1b992df7f9bb175a63878e323e97074b3b2bbb49e5c4b09867c39",
    t42InventorySha256: "c50fdc4104ec179a4fed2ceff6625f9fe189ebcc60a185dd2b48fc6f695c9c5f",
    t43InventorySha256: "9c6f95bc79ac5a33a807ad42e0e9bd160f57d3de74f751118bdd15c8b30b5a0e",
    t44InventorySha256: "930334ff7291ffdcfabf427fe3265d0983067ad731d7329d5b98da6a597da81e",
    t45InventorySha256: "023b2a63cc8c70d9f5c891054f7b1d6df9346bc362e746e11c0ed9f683531df8",
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
  expect(coverage.candidateInventory.chineseT18SourceRecords).toMatchObject({
    denominator: 76,
    controlled: 76,
    percentage: 100,
    fullSourceTexts: 74,
    partialSourceWitnesses: 2,
    verifiedEditionWitnesses: 9,
    attributionBoundaryRecords: 25,
  });
  expect(coverage.candidateInventory.chineseT19SourceRecords).toMatchObject({
    denominator: 126,
    controlled: 126,
    percentage: 100,
    fullSourceTexts: 120,
    partialSourceWitnesses: 6,
    verifiedEditionWitnesses: 8,
    attributionBoundaryRecords: 25,
  });
  expect(coverage.candidateInventory.chineseT20SourceRecords).toMatchObject({
    denominator: 184,
    controlled: 184,
    percentage: 100,
    fullSourceTexts: 179,
    partialSourceWitnesses: 5,
    verifiedEditionWitnesses: 14,
    attributionBoundaryRecords: 28,
  });
  expect(coverage.candidateInventory.chineseT21SourceRecords).toMatchObject({
    denominator: 228,
    controlled: 228,
    percentage: 100,
    fullSourceTexts: 222,
    partialSourceWitnesses: 6,
    verifiedEditionWitnesses: 12,
    attributionBoundaryRecords: 58,
  });
  expect(coverage.candidateInventory.chineseT22SourceRecords).toMatchObject({
    denominator: 15,
    controlled: 15,
    percentage: 100,
    fullSourceTexts: 15,
    partialSourceWitnesses: 0,
    verifiedEditionWitnesses: 2,
    attributionBoundaryRecords: 4,
  });
  expect(coverage.candidateInventory.chineseT23SourceRecords).toMatchObject({
    denominator: 13,
    controlled: 13,
    percentage: 100,
    fullSourceTexts: 13,
    partialSourceWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 4,
  });
  expect(coverage.candidateInventory.chineseT24SourceRecords).toMatchObject({
    denominator: 59,
    controlled: 59,
    percentage: 100,
    fullSourceTexts: 58,
    partialSourceWitnesses: 1,
    verifiedSameWorkExpressions: 2,
    verifiedEditionWitnesses: 4,
    attributionBoundaryRecords: 21,
  });
  expect(coverage.candidateInventory.chineseT25SourceRecords).toMatchObject({
    denominator: 15,
    controlled: 15,
    percentage: 100,
    fullSourceTexts: 15,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 4,
    verifiedEditionWitnesses: 2,
    attributionBoundaryRecords: 15,
  });
  expect(coverage.candidateInventory.chineseT26SourceRecords).toMatchObject({
    denominator: 26,
    controlled: 26,
    percentage: 100,
    fullSourceTexts: 26,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 6,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 26,
    relationAnnotatedRecords: 26,
  });
  expect(coverage.candidateInventory.chineseT27SourceRecords).toMatchObject({
    denominator: 1,
    controlled: 1,
    percentage: 100,
    fullSourceTexts: 1,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 1,
    relationAnnotatedRecords: 1,
  });
  expect(coverage.candidateInventory.chineseT28SourceRecords).toMatchObject({
    denominator: 12,
    controlled: 12,
    percentage: 100,
    fullSourceTexts: 11,
    partialSourceWitnesses: 1,
    verifiedSameWorkExpressions: 2,
    verifiedPartialWorkWitnesses: 1,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 12,
    relationAnnotatedRecords: 8,
    newWorks: 10,
    controlledWorks: 11,
  });
  expect(coverage.candidateInventory.chineseT29SourceRecords).toMatchObject({
    denominator: 6,
    controlled: 6,
    percentage: 100,
    fullSourceTexts: 5,
    partialSourceWitnesses: 1,
    verifiedSameWorkExpressions: 2,
    verifiedPartialWorkWitnesses: 1,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 6,
    relationAnnotatedRecords: 6,
    newWorks: 5,
    controlledWorks: 5,
  });
  expect(coverage.candidateInventory.chineseT30SourceRecords).toMatchObject({
    denominator: 21,
    controlled: 21,
    percentage: 100,
    fullSourceTexts: 15,
    partialSourceWitnesses: 6,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 6,
    verifiedSplitWorkWitnesses: 2,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 21,
    relationAnnotatedRecords: 20,
    newWorks: 20,
    controlledWorks: 20,
  });
  expect(coverage.candidateInventory.chineseT31SourceRecords).toMatchObject({
    denominator: 43,
    controlled: 43,
    percentage: 100,
    fullSourceTexts: 43,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 21,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 43,
    relationAnnotatedRecords: 38,
    newWorks: 31,
    controlledWorks: 31,
  });
  expect(coverage.candidateInventory.chineseT32SourceRecords).toMatchObject({
    denominator: 66,
    controlled: 66,
    percentage: 100,
    fullSourceTexts: 65,
    partialSourceWitnesses: 1,
    verifiedSameWorkExpressions: 13,
    verifiedPartialWorkWitnesses: 1,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 66,
    relationAnnotatedRecords: 27,
    newWorks: 59,
    controlledWorks: 59,
  });
  expect(coverage.candidateInventory.chineseT33SourceRecords).toMatchObject({
    denominator: 25,
    controlled: 25,
    percentage: 100,
    fullSourceTexts: 25,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 25,
    relationAnnotatedRecords: 25,
    newWorks: 25,
    controlledWorks: 25,
    subcommentaryGroups: 4,
  });
  expect(coverage.candidateInventory.chineseT34SourceRecords).toMatchObject({
    denominator: 13,
    controlled: 13,
    percentage: 100,
    fullSourceTexts: 13,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 13,
    relationAnnotatedRecords: 13,
    newWorks: 13,
    controlledWorks: 13,
    rootTreatiseCommentaryGroups: 3,
    subcommentaryGroups: 4,
    relatedDistinctWorkGroups: 3,
  });
  expect(coverage.candidateInventory.chineseT35SourceRecords).toMatchObject({
    denominator: 5,
    controlled: 5,
    percentage: 100,
    fullSourceTexts: 5,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 5,
    relationAnnotatedRecords: 5,
    newWorks: 5,
    controlledWorks: 5,
    rootTreatiseCommentaryGroups: 2,
    subcommentaryGroups: 1,
    relatedDistinctWorkGroups: 3,
  });
  expect(coverage.candidateInventory.chineseT36SourceRecords).toMatchObject({
    denominator: 8,
    controlled: 8,
    percentage: 100,
    fullSourceTexts: 8,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 8,
    relationAnnotatedRecords: 8,
    newWorks: 8,
    controlledWorks: 8,
    rootTreatiseCommentaryGroups: 2,
    subcommentaryGroups: 1,
    relatedDistinctWorkGroups: 2,
  });
  expect(coverage.candidateInventory.chineseT37SourceRecords).toMatchObject({
    denominator: 21,
    controlled: 21,
    percentage: 100,
    fullSourceTexts: 21,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 21,
    relationAnnotatedRecords: 21,
    newWorks: 21,
    controlledWorks: 21,
    rootTreatiseCommentaryGroups: 6,
    subcommentaryGroups: 1,
    relatedDistinctWorkGroups: 2,
  });
  expect(coverage.candidateInventory.chineseT38SourceRecords).toMatchObject({
    denominator: 18,
    controlled: 18,
    percentage: 100,
    fullSourceTexts: 18,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 18,
    relationAnnotatedRecords: 18,
    newWorks: 18,
    controlledWorks: 18,
    rootTreatiseCommentaryGroups: 6,
    subcommentaryGroups: 2,
    relatedDistinctWorkGroups: 3,
  });
  expect(coverage.candidateInventory.chineseT39SourceRecords).toMatchObject({
    denominator: 21,
    controlled: 21,
    percentage: 100,
    fullSourceTexts: 21,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 21,
    relationAnnotatedRecords: 21,
    newWorks: 21,
    controlledWorks: 21,
    rootTreatiseCommentaryGroups: 14,
    subcommentaryGroups: 3,
    relatedDistinctWorkGroups: 4,
  });
  expect(coverage.candidateInventory.chineseT40SourceRecords).toMatchObject({
    denominator: 17,
    controlled: 17,
    percentage: 100,
    fullSourceTexts: 17,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 17,
    relationAnnotatedRecords: 17,
    newWorks: 17,
    controlledWorks: 17,
    rootVinayaCommentaryGroups: 4,
    rootTreatiseCommentaryGroups: 5,
    subcommentaryGroups: 1,
    scopeBoundaryGroups: 3,
    relatedDistinctWorkGroups: 4,
  });
  expect(coverage.candidateInventory.chineseT41SourceRecords).toMatchObject({
    denominator: 3,
    controlled: 3,
    percentage: 100,
    fullSourceTexts: 3,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 3,
    relationAnnotatedRecords: 3,
    newWorks: 3,
    controlledWorks: 3,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 2,
    subcommentaryGroups: 0,
    scopeBoundaryGroups: 1,
    relatedDistinctWorkGroups: 1,
  });
  expect(coverage.candidateInventory.chineseT42SourceRecords).toMatchObject({
    denominator: 5,
    controlled: 5,
    percentage: 100,
    fullSourceTexts: 5,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 5,
    relationAnnotatedRecords: 5,
    newWorks: 5,
    controlledWorks: 5,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 4,
    subcommentaryGroups: 0,
    scopeBoundaryGroups: 1,
    relatedDistinctWorkGroups: 2,
  });
  expect(coverage.candidateInventory.chineseT43SourceRecords).toMatchObject({
    denominator: 6,
    controlled: 6,
    percentage: 100,
    fullSourceTexts: 6,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 6,
    relationAnnotatedRecords: 6,
    newWorks: 6,
    controlledWorks: 6,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 3,
    subcommentaryGroups: 2,
    scopeBoundaryGroups: 1,
    relatedDistinctWorkGroups: 3,
  });
  expect(coverage.candidateInventory.chineseT44SourceRecords).toMatchObject({
    denominator: 17,
    controlled: 17,
    percentage: 100,
    fullSourceTexts: 17,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 17,
    relationAnnotatedRecords: 17,
    newWorks: 17,
    controlledWorks: 17,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 7,
    rootEditionBoundaryGroups: 2,
    subcommentaryGroups: 1,
    scopeBoundaryGroups: 3,
    relatedDistinctWorkGroups: 6,
  });
  expect(coverage.candidateInventory.chineseT45SourceRecords).toMatchObject({
    denominator: 61,
    controlled: 61,
    percentage: 100,
    fullSourceTexts: 61,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 61,
    relationAnnotatedRecords: 61,
    unsignedResponsibilityRecords: 3,
    newWorks: 61,
    controlledWorks: 61,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 1,
    rootEditionBoundaryGroups: 0,
    subcommentaryGroups: 1,
    sameNumberBoundaryGroups: 2,
    layeredAttributionGroups: 5,
    scopeBoundaryGroups: 7,
    relatedDistinctWorkGroups: 8,
  });
  expect(coverage.candidateInventory.chineseT46SourceRecords).toMatchObject({
    denominator: 46,
    controlled: 46,
    percentage: 100,
    fullSourceTexts: 46,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 46,
    relationAnnotatedRecords: 46,
    unsignedResponsibilityRecords: 4,
    newWorks: 46,
    controlledWorks: 46,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 3,
    rootEditionBoundaryGroups: 0,
    subcommentaryGroups: 0,
    sameNumberBoundaryGroups: 0,
    layeredAttributionGroups: 2,
    scopeBoundaryGroups: 7,
    relatedDistinctWorkGroups: 6,
  });
  expect(coverage.candidateInventory.chineseT47SourceRecords).toMatchObject({
    denominator: 49,
    controlled: 49,
    percentage: 100,
    fullSourceTexts: 49,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 49,
    relationAnnotatedRecords: 49,
    unsignedResponsibilityRecords: 1,
    newWorks: 49,
    controlledWorks: 49,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 0,
    rootEditionBoundaryGroups: 0,
    subcommentaryGroups: 0,
    sameNumberBoundaryGroups: 5,
    layeredAttributionGroups: 4,
    scopeBoundaryGroups: 3,
    relatedDistinctWorkGroups: 12,
  });
  expect(coverage.candidateInventory.chineseT48SourceRecords).toMatchObject({
    denominator: 28,
    controlled: 28,
    percentage: 100,
    fullSourceTexts: 28,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 28,
    relationAnnotatedRecords: 28,
    unsignedResponsibilityRecords: 1,
    newWorks: 28,
    controlledWorks: 28,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 0,
    rootEditionBoundaryGroups: 0,
    subcommentaryGroups: 0,
    sameNumberBoundaryGroups: 3,
    layeredAttributionGroups: 3,
    scopeBoundaryGroups: 6,
    relatedDistinctWorkGroups: 12,
  });
  expect(coverage.candidateInventory.chineseT49SourceRecords).toMatchObject({
    denominator: 14,
    controlled: 14,
    percentage: 100,
    fullSourceTexts: 14,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 14,
    relationAnnotatedRecords: 14,
    unsignedResponsibilityRecords: 0,
    lostTranslatorResponsibilityRecords: 3,
    newWorks: 14,
    controlledWorks: 14,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 0,
    rootEditionBoundaryGroups: 0,
    subcommentaryGroups: 0,
    sameNumberBoundaryGroups: 0,
    layeredAttributionGroups: 2,
    scopeBoundaryGroups: 3,
    continuationBoundaryGroups: 1,
    catalogResponsibilityBoundaryGroups: 1,
    relatedDistinctWorkGroups: 7,
  });
  expect(coverage.candidateInventory.chineseT50SourceRecords).toMatchObject({
    denominator: 27,
    controlled: 27,
    percentage: 100,
    fullSourceTexts: 27,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 2,
    attributionBoundaryRecords: 27,
    relationAnnotatedRecords: 27,
    unsignedResponsibilityRecords: 2,
    lostTranslatorResponsibilityRecords: 1,
    newWorks: 26,
    controlledWorks: 26,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 0,
    rootEditionBoundaryGroups: 1,
    editionOrRecensionGroups: 1,
    subcommentaryGroups: 0,
    sameNumberBoundaryGroups: 1,
    layeredAttributionGroups: 2,
    scopeBoundaryGroups: 6,
    continuationBoundaryGroups: 1,
    sourceReuseBoundaryGroups: 2,
    relatedDistinctWorkGroups: 9,
  });
  expect(coverage.candidateInventory.chineseT51SourceRecords).toMatchObject({
    denominator: 36,
    controlled: 36,
    percentage: 100,
    fullSourceTexts: 36,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 36,
    relationAnnotatedRecords: 36,
    unsignedResponsibilityRecords: 5,
    lostTranslatorResponsibilityRecords: 0,
    newWorks: 36,
    controlledWorks: 36,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 0,
    rootEditionBoundaryGroups: 0,
    editionOrRecensionGroups: 0,
    subcommentaryGroups: 0,
    sameNumberBoundaryGroups: 0,
    layeredAttributionGroups: 2,
    scopeBoundaryGroups: 10,
    continuationBoundaryGroups: 2,
    sourceReuseBoundaryGroups: 5,
    sameAuthorCompanionWorkGroups: 1,
    relatedDistinctWorkGroups: 13,
  });
  expect(coverage.candidateInventory.chineseT52SourceRecords).toMatchObject({
    denominator: 19,
    controlled: 19,
    percentage: 100,
    fullSourceTexts: 19,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 0,
    verifiedSplitWorkWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 19,
    relationAnnotatedRecords: 19,
    unsignedResponsibilityRecords: 1,
    lostTranslatorResponsibilityRecords: 0,
    newWorks: 19,
    controlledWorks: 19,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 0,
    rootEditionBoundaryGroups: 0,
    editionOrRecensionGroups: 0,
    subcommentaryGroups: 0,
    sameNumberBoundaryGroups: 0,
    layeredAttributionGroups: 2,
    scopeBoundaryGroups: 2,
    continuationBoundaryGroups: 2,
    sourceReuseBoundaryGroups: 3,
    sameAuthorCompanionWorkGroups: 4,
    crossVolumeRelationGroups: 3,
    relatedDistinctWorkGroups: 12,
  });
  expect(coverage.links).toMatchObject({
    chineseEsotericT18Inventory: expect.stringContaining("cbeta-taisho-t18-inventory-v0.1.0.json"),
    chineseEsotericT18BoundaryAudit: expect.stringContaining("batch-v2.5.0.json"),
    chineseEsotericT19Inventory: expect.stringContaining("cbeta-taisho-t19-inventory-v0.1.0.json"),
    chineseEsotericT19BoundaryAudit: expect.stringContaining("batch-v2.6.0.json"),
    chineseEsotericT20Inventory: expect.stringContaining("cbeta-taisho-t20-inventory-v0.1.0.json"),
    chineseEsotericT20BoundaryAudit: expect.stringContaining("batch-v2.7.0.json"),
    chineseEsotericT21Inventory: expect.stringContaining("cbeta-taisho-t21-inventory-v0.1.0.json"),
    chineseEsotericT21BoundaryAudit: expect.stringContaining("batch-v2.8.0.json"),
    chineseVinayaT22Inventory: expect.stringContaining("cbeta-taisho-t22-inventory-v0.1.0.json"),
    chineseVinayaT22BoundaryAudit: expect.stringContaining("batch-v2.9.0.json"),
    chineseVinayaT23Inventory: expect.stringContaining("cbeta-taisho-t23-inventory-v0.1.0.json"),
    chineseVinayaT23BoundaryAudit: expect.stringContaining("batch-v3.0.0.json"),
    chineseVinayaT24Inventory: expect.stringContaining("cbeta-taisho-t24-inventory-v0.1.0.json"),
    chineseVinayaT24BoundaryAudit: expect.stringContaining("batch-v3.1.0.json"),
    chineseCommentaryT25Inventory: expect.stringContaining("cbeta-taisho-t25-inventory-v0.1.0.json"),
    chineseCommentaryT25BoundaryAudit: expect.stringContaining("batch-v3.2.0.json"),
    chineseCommentaryAbhidharmaT26Inventory: expect.stringContaining("cbeta-taisho-t26-inventory-v0.1.0.json"),
    chineseCommentaryAbhidharmaT26BoundaryAudit: expect.stringContaining("batch-v3.3.0.json"),
    chineseAbhidharmaCommentaryT27Inventory: expect.stringContaining("cbeta-taisho-t27-inventory-v0.1.0.json"),
    chineseAbhidharmaCommentaryT27BoundaryAudit: expect.stringContaining("batch-v3.4.0.json"),
    chineseAbhidharmaT28Inventory: expect.stringContaining("cbeta-taisho-t28-inventory-v0.1.0.json"),
    chineseAbhidharmaT28BoundaryAudit: expect.stringContaining("batch-v3.5.0.json"),
    chineseAbhidharmaT29Inventory: expect.stringContaining("cbeta-taisho-t29-inventory-v0.1.0.json"),
    chineseAbhidharmaT29BoundaryAudit: expect.stringContaining("batch-v3.6.0.json"),
    chineseMadhyamakaYogacaraT30Inventory: expect.stringContaining("cbeta-taisho-t30-inventory-v0.1.0.json"),
    chineseMadhyamakaYogacaraT30BoundaryAudit: expect.stringContaining("batch-v3.7.0.json"),
    chineseYogacaraT31Inventory: expect.stringContaining("cbeta-taisho-t31-inventory-v0.1.0.json"),
    chineseYogacaraT31BoundaryAudit: expect.stringContaining("batch-v3.8.0.json"),
    chineseSastraT32Inventory: expect.stringContaining("cbeta-taisho-t32-inventory-v0.1.0.json"),
    chineseSastraT32BoundaryAudit: expect.stringContaining("batch-v3.9.0.json"),
    chineseCommentaryT33Inventory: expect.stringContaining("cbeta-taisho-t33-inventory-v0.1.0.json"),
    chineseCommentaryT33BoundaryAudit: expect.stringContaining("batch-v4.0.0.json"),
    chineseCommentaryT34Inventory: expect.stringContaining("cbeta-taisho-t34-inventory-v0.1.0.json"),
    chineseCommentaryT34BoundaryAudit: expect.stringContaining("batch-v4.1.0.json"),
    chineseHuayanCommentaryT35Inventory: expect.stringContaining("cbeta-taisho-t35-inventory-v0.1.0.json"),
    chineseHuayanCommentaryT35BoundaryAudit: expect.stringContaining("batch-v4.2.0.json"),
    chineseHuayanCommentaryT36Inventory: expect.stringContaining("cbeta-taisho-t36-inventory-v0.1.0.json"),
    chineseHuayanCommentaryT36BoundaryAudit: expect.stringContaining("batch-v4.3.0.json"),
    chinesePureLandNirvanaCommentaryT37Inventory: expect.stringContaining("cbeta-taisho-t37-inventory-v0.1.0.json"),
    chinesePureLandNirvanaCommentaryT37BoundaryAudit: expect.stringContaining("batch-v4.4.0.json"),
    chineseNirvanaMedicineMaitreyaVimalakirtiCommentaryT38Inventory: expect.stringContaining("cbeta-taisho-t38-inventory-v0.1.0.json"),
    chineseNirvanaMedicineMaitreyaVimalakirtiCommentaryT38BoundaryAudit: expect.stringContaining("batch-v4.5.0.json"),
    chineseGoldenLightLankavataraEsotericCommentaryT39Inventory: expect.stringContaining("cbeta-taisho-t39-inventory-v0.1.0.json"),
    chineseGoldenLightLankavataraEsotericCommentaryT39BoundaryAudit: expect.stringContaining("batch-v4.6.0.json"),
    chineseVinayaBodhisattvaPreceptTreatiseCommentaryT40Inventory: expect.stringContaining("cbeta-taisho-t40-inventory-v0.1.0.json"),
    chineseVinayaBodhisattvaPreceptTreatiseCommentaryT40BoundaryAudit: expect.stringContaining("batch-v4.7.0.json"),
    chineseAbhidharmaKosaCommentaryT41Inventory: expect.stringContaining("cbeta-taisho-t41-inventory-v0.1.0.json"),
    chineseAbhidharmaKosaCommentaryT41BoundaryAudit: expect.stringContaining("batch-v4.8.0.json"),
    chineseMadhyamakaYogacaraCommentaryT42Inventory: expect.stringContaining("cbeta-taisho-t42-inventory-v0.1.0.json"),
    chineseMadhyamakaYogacaraCommentaryT42BoundaryAudit: expect.stringContaining("batch-v4.9.0.json"),
    chineseYogacaraCommentaryT43Inventory: expect.stringContaining("cbeta-taisho-t43-inventory-v0.1.0.json"),
    chineseYogacaraCommentaryT43BoundaryAudit: expect.stringContaining("batch-v4.10.0.json"),
    chineseTreatiseLogicAwakeningCommentaryT44Inventory: expect.stringContaining("cbeta-taisho-t44-inventory-v0.1.0.json"),
    chineseTreatiseLogicAwakeningCommentaryT44BoundaryAudit: expect.stringContaining("batch-v4.11.0.json"),
    chineseEastAsianSchoolsVinayaRitualsT45Inventory: expect.stringContaining("cbeta-taisho-t45-inventory-v0.1.0.json"),
    chineseEastAsianSchoolsVinayaRitualsT45BoundaryAudit: expect.stringContaining("batch-v4.12.0.json"),
    chineseTiantaiMeditationRitualsT46Inventory: expect.stringContaining("cbeta-taisho-t46-inventory-v0.1.0.json"),
    chineseTiantaiMeditationRitualsT46BoundaryAudit: expect.stringContaining("batch-v4.13.0.json"),
    chinesePureLandChanRecordsT47Inventory: expect.stringContaining("cbeta-taisho-t47-inventory-v0.1.0.json"),
    chinesePureLandChanRecordsT47BoundaryAudit: expect.stringContaining("batch-v4.14.0.json"),
    chineseChanKoansTreatisesRulesT48Inventory: expect.stringContaining("cbeta-taisho-t48-inventory-v0.1.0.json"),
    chineseChanKoansTreatisesRulesT48BoundaryAudit: expect.stringContaining("batch-v4.15.0.json"),
    chineseBuddhistHistoriesSectarianRecordsT49Inventory: expect.stringContaining("cbeta-taisho-t49-inventory-v0.1.0.json"),
    chineseBuddhistHistoriesSectarianRecordsT49BoundaryAudit: expect.stringContaining("batch-v4.16.0.json"),
    chineseBuddhistBiographiesHagiographiesT50Inventory: expect.stringContaining("cbeta-taisho-t50-inventory-v0.1.0.json"),
    chineseBuddhistBiographiesHagiographiesT50BoundaryAudit: expect.stringContaining("batch-v4.17.0.json"),
    chinesePilgrimageLineageTravelGazetteersT51Inventory: expect.stringContaining("cbeta-taisho-t51-inventory-v0.1.0.json"),
    chinesePilgrimageLineageTravelGazetteersT51BoundaryAudit: expect.stringContaining("batch-v4.18.0.json"),
    chineseBuddhistApologeticsDebateMemorialsT52Inventory: expect.stringContaining("cbeta-taisho-t52-inventory-v0.1.0.json"),
    chineseBuddhistApologeticsDebateMemorialsT52BoundaryAudit: expect.stringContaining("batch-v4.19.0.json"),
    chineseBuddhistEncyclopedicCompendiaT53Inventory: expect.stringContaining("cbeta-taisho-t53-inventory-v0.1.0.json"),
    chineseBuddhistEncyclopedicCompendiaT53BoundaryAudit: expect.stringContaining("batch-v4.20.0.json"),
  });
  expect(coverage.candidateInventory.suttacentralPaliRootPilot).toMatchObject({
    denominator: 7288,
    controlled: 7288,
    percentage: 100,
    controlledBytes: 40689597,
    controlledWorks: 286,
  });
  expect(coverage.candidateInventory.suttacentralPaliSuttaRoot).toMatchObject({
    denominator: 5764,
    controlled: 5764,
    percentage: 100,
  });
  expect(coverage.candidateInventory.suttacentralPaliVinayaRoot).toMatchObject({
    denominator: 422,
    controlled: 422,
    percentage: 100,
    controlledBytes: 6710444,
    controlledWorks: 6,
    controlledExpressions: 6,
    stableSegments: 71557,
    omittedEmptySegments: 8,
    filesApprovedForReadingAndRetrieval: 422,
    filesApprovedForModelTraining: 0,
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
  expect(coverage.candidateInventory.rktsKernelAlignment).toMatchObject({
    kernelItemRecords: 1570,
    kernelUniqueIds: 1562,
    duplicateKernelIdGroups: 1,
    exactKernelIds: 1143,
    exactKernelIdsInOneCatalog: 172,
    exactKernelIdsInTwoOrMoreCatalogs: 971,
    exactKernelIdsInEightOrMoreCatalogs: 819,
    unlinkedKernelIds: 419,
    unresolvedNormalizedIds: 8,
    denominatorImpact: "none",
  });
  expect(coverage.candidateInventory.sanskritCatalogs).toMatchObject({
    dsbcCatalogRecords: 486,
    dsbcSutrapitakaRecords: 111,
    dsbcVinayapitakaRecords: 15,
    dsbcSastrapitakaRecords: 360,
    gretilPhysicalFiles: 417,
    gretilBytes: 62432484,
    gretilRightsAuditedFiles: 417,
    gretilFilesMarkedReferenceOnly: 417,
    gretilFilesWithDsbcPermissionStatement: 179,
    gretilFilesWithExplicitCopyrightNotice: 26,
    gretilFilesWithExplicitOpenLicense: 0,
    gretilFilesApprovedForRepublication: 0,
    gretilFilesRestrictedToMetadataAndExternalLink: 417,
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
  expect(coverage.candidateInventory.suttacentralChineseParallelEvidence).toMatchObject({
    upstreamRows: 421159,
    relevantDirectedRows: 10596,
    deduplicatedParallelEdges: 5161,
    duplicateDirectionsRemoved: 5435,
    decisionClasses: {
      full_parallel_without_automatic_work_merge: 60,
      component_parallel_within_registered_work: 3345,
      resembling_or_partial_parallel: 1130,
      citation_or_mention_only: 626,
    },
    paliWorksReferenced: 246,
    chineseWorksReferenced: 147,
    directTaishoWorksReferenced: 141,
    agamaContainerWorksReferenced: 6,
    denominatorImpact: "none",
  });
  expect(coverage.candidateInventory.suttacentralParallelReviewQueue).toMatchObject({
    queueItems: 80,
    p0ScopeCaveatOrCounterevidence: 20,
    p1UpstreamFullStandalonePairs: 60,
    assignedItems: 0,
    completedIndependentReviews: 0,
    adjudicatedItems: 0,
    automaticMerges: 0,
    minimumIndependentReviews: 2,
    denominatorImpact: "none",
  });
  expect(coverage.links.suttacentralParallelP0EvidencePackets).toBe(
    "https://github.com/weitzu-com/foxue.ai/blob/main/data/gbcr/suttacentral-parallel-p0-evidence-packets-v0.1.0.json",
  );
});

test("汉巴作品审校台优先呈现反证并保持真人双重复核边界", async ({ page }) => {
  await page.goto("/shenjiao");

  await expect(page.getByRole("heading", { level: 1, name: /不是寻找相同/ })).toBeVisible();
  await expect(page.getByText("已完成人工作品裁决")).toBeVisible();
  await expect(page.getByText("只读工作台")).toBeVisible();
  await expect(page.locator(".review-case")).toHaveCount(80);

  await page.getByRole("button", { name: /先审反证/ }).click();
  await expect(page.locator(".review-case")).toHaveCount(20);
  await expect(page.locator(".review-machine-range")).toHaveCount(20);
  await expect(page.getByText("上游范围备注 / 反证").first()).toBeVisible();

  await page.getByRole("searchbox", { name: "检索 80 项证据" }).fill("MN 1");
  await expect(page.locator(".review-case").first()).toContainText("MN1");
  await expect(page.locator(".review-case").first()).toContainText("T0026.026.0596b09 → T0026.026.0596c17");
  await expect(page.getByRole("link", { name: "直达汉译范围" }).first()).toHaveAttribute(
    "href",
    "/jingzang/zhongahanjing#T0026.026.0596b09",
  );
  await expect(page.getByText("AI 可整理证据，但不能署名为真人复核者")).toBeVisible();
  await expect(page.getByRole("link", { name: /提交具名复核意见/ })).toHaveAttribute(
    "href",
    "https://github.com/weitzu-com/foxue.ai/issues/new?template=han-pali-review.yml",
  );
  const viewport = page.viewportSize();
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(viewport?.width ?? pageWidth);

  await page.getByRole("link", { name: "直达汉译范围" }).first().click();
  await page.waitForURL(/\/jingzang\/zhongahanjing\/026-0596b#T0026\.026\.0596b09$/);
  await expect(page.locator('[id="T0026.026.0596b09"]')).toContainText("想經");
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

  const sitemap = await readSitemaps(request);
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

  const sitemap = await readSitemaps(request);
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
  const sitemap = await readSitemaps(request);
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
  const sitemap = await readSitemaps(request);
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
  const sitemap = await readSitemaps(request);
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
  const sitemap = await readSitemaps(request);
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
  const sitemap = await readSitemaps(request);
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

  const sitemap = await readSitemaps(request);
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

  const sitemap = await readSitemaps(request);
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

  const sitemap = await readSitemaps(request);
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

  const sitemap = await readSitemaps(request);
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

  const sitemap = await readSitemaps(request);
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

  const sitemap = await readSitemaps(request);
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

  const sitemap = await readSitemaps(request);
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

  const sitemap = await readSitemaps(request);
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

  const sitemap = await readSitemaps(request);
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

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t0721/070-0417c");
  expect(sitemap).toContain("/jingzang/taisho-t0839/002-0910c");
  expect(sitemap).toContain("/jingzang/taisho-t0847/003-0963a");
});

test("汉译 T18 密教部完整受控并区分版本、局部见证与佛说归属", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t0852a/001-0108c");
  await expect(page.getByText(/大毘卢遮那胎藏仪轨 T0852 a\/b 版本见证组/)).toBeVisible();
  await expect(page.getByText(/不改写成佛陀亲说/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0863/001-0193a");
  await expect(page.getByText("局部见证 · 完整来源分页")).toBeVisible();
  await expect(page.getByText(/不冒充完整母作品/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0865/001-0207a");
  await expect(page.getByText(/T0865／T0874 同题异范围候选/)).toBeVisible();
  await expect(page.getByText(/保留独立作品/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0893c/003-0692a");
  await expect(page.getByText(/《苏悉地羯罗经》T0893 a\/b\/c 版本见证组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0917/001-0942b");
  await expect(page.getByRole("heading", { level: 1, name: "無畏三藏禪要" })).toBeVisible();
  await expect(page.getByText(/编撰或传授责任/)).toBeVisible();

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t0848/007-0055a");
  expect(sitemap).toContain("/jingzang/taisho-t0893c/003-0692a");
  expect(sitemap).toContain("/jingzang/taisho-t0917/001-0942b");
});

test("汉译 T19 密教部完整受控并保留版本、组件、争议署名与原始卷号", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t0924a/001-0029b");
  await expect(page.getByText(/《药师如来念诵仪轨》T0924 A\/B 版本见证组/)).toBeVisible();
  await expect(page.getByText(/不据题名或部类自动声称为佛陀逐字亲说/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0946/004-0165c");
  await expect(page.getByRole("heading", { level: 1, name: "大佛頂廣聚陀羅尼經" })).toBeVisible();
  await expect(page.getByText(/题记未载作者或译者/)).toBeVisible();

  await page.goto("/jingzang/taisho-t0983b/001-0441b");
  await expect(page.getByText("局部见证 · 完整来源分页")).toBeVisible();
  await expect(page.getByText(/撰、述、集、记、注、校、请来或口受/)).toBeVisible();

  await page.goto("/jingzang/lengyanjing/001-0105b");
  await expect(page.getByText(/现代研究对成书与翻译史存在争议/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1027b/001-0735a");
  await expect(page.getByText(/《金刚光焰止风雨陀罗尼经》T1027 a\/b 版本见证组/)).toBeVisible();

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t0924b/001-0030b");
  expect(sitemap).toContain("/jingzang/taisho-t0983b/001-0441b");
  expect(sitemap).toContain("/jingzang/taisho-t1029/001-0744a");
});

test("汉译 T20 密教部完整受控并保留版本、组件、注校与口受边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1057a/001-0083b");
  await expect(page.getByText(/千眼千臂观世音菩萨陀罗尼神咒经 T1057 a\/b 版本见证/)).toBeVisible();
  await expect(page.getByText(/不据题名或部类自动声称为佛陀逐字亲说/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1062b/001-0114b");
  await expect(page.getByText(/T1062 咒本与无署名陀罗尼组件候选/)).toBeVisible();
  await expect(page.getByText(/题记未载作者或译者/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1111/001-0489a");
  await expect(page.getByRole("heading", { level: 1, name: "青頸觀自在菩薩心陀羅尼經" })).toBeVisible();
  await expect(page.getByText(/注、校、请来或口受/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1120b/001-0520b");
  await expect(page.getByText("局部见证 · 完整来源分页")).toBeVisible();
  await expect(page.getByText(/T1120 大乐金刚萨埵仪轨与真言组件候选/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1156b/001-0650c");
  await expect(page.getByRole("heading", { level: 1, name: "宗叡僧正於唐國師所口受" })).toBeVisible();
  await expect(page.getByText("题名载口受传承", { exact: true })).toBeVisible();

  await page.goto("/jingzang/taisho-t1185b/001-0798a");
  await expect(page.getByText(/文殊师利法宝藏陀罗尼经 T1185 A\/B 版本见证/)).toBeVisible();

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1057a/001-0083b");
  expect(sitemap).toContain("/jingzang/taisho-t1120b/001-0520b");
  expect(sitemap).toContain("/jingzang/taisho-t1198/001-0940a");
});

test("汉译 T21 密教部完整受控并保留版本、品分、论造与译解边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1222a/001-0102a");
  await expect(page.getByText(/圣迦抳忿怒金刚童子成就仪轨经 T1222 a\/b 版本见证/)).toBeVisible();
  await expect(page.getByText(/不据题名或部类自动声称为佛陀逐字亲说/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1276/001-0325c");
  await expect(page.getByText("局部见证 · 完整来源分页")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "文殊師利菩薩根本大教王經金翅鳥王品" })).toBeVisible();

  await page.goto("/jingzang/taisho-t1361/001-0878b");
  await expect(page.getByRole("heading", { level: 1, name: "六門陀羅尼經論" })).toBeVisible();
  await expect(page.getByText(/造、将来或译解/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1383/001-0904b");
  await expect(page.getByText(/宿命智陀罗尼经题名候选/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1419/001-0936a");
  await expect(page.getByRole("heading", { level: 1, name: "佛說造像量度經解" })).toBeVisible();
  await expect(page.getByText("清 · 工布查布譯解", { exact: true })).toBeVisible();

  await page.goto("/jingzang/taisho-t1420/001-0956b");
  await expect(page.getByRole("heading", { level: 1, name: "龍樹五明論" })).toBeVisible();
  await expect(page.getByText("题名载龙树传统归属", { exact: true })).toBeVisible();

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1222a/001-0102a");
  expect(sitemap).toContain("/jingzang/taisho-t1276/001-0325c");
  expect(sitemap).toContain("/jingzang/taisho-t1420/002-0968c");
});

test("汉译 T22 律部完整受控并保留广律、戒本、羯磨与译编边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1421/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "彌沙塞部和醯五分律" })).toBeVisible();
  await expect(page.getByText("劉宋 · 佛陀什共竺道生等譯", { exact: true })).toBeVisible();
  await expect(page.getByText(/广律、戒本或羯磨的文本类型/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1422a/001-0194c");
  await expect(page.getByText(/弥沙塞五分戒本 T1422 a\/b 版本见证/)).toBeVisible();
  await expect(page.getByText(/共享作品实体并保留独立版本见证/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1429/001-1015a");
  await expect(page.getByRole("heading", { level: 1, name: "四分律比丘戒本" })).toBeVisible();
  await expect(page.getByText("後秦 · 佛陀耶舍譯；西太原寺沙門懷素集", { exact: true })).toBeVisible();
  await expect(page.getByText(/并列呈现译、集两层责任/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1431/001-1030c");
  await expect(page.getByText("後秦 · 佛陀耶舍譯；西太原寺沙門懷素集", { exact: true })).toBeVisible();
  await expect(page.getByText(/不把编集本简化为单一译经/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1432/001-1041a");
  await expect(page.getByRole("heading", { level: 1, name: "曇無德律部雜羯磨" })).toBeVisible();
  await expect(page.getByText(/四分律、戒本与羯磨文本家族/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1434/001-1065b");
  await expect(page.getByRole("heading", { level: 1, name: "四分比丘尼羯磨法" })).toBeVisible();

  const coverageResponse = await request.get("/api/v1/corpus/coverage");
  expect(coverageResponse.ok()).toBeTruthy();
  const coverage = await coverageResponse.json();
  expect(coverage.candidateInventory.chineseT22SourceRecords).toMatchObject({
    denominator: 15,
    controlled: 15,
    fullSourceTexts: 15,
    partialSourceWitnesses: 0,
    verifiedEditionWitnesses: 2,
    attributionBoundaryRecords: 4,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1421/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t1429/001-1015a");
  expect(sitemap).toContain("/jingzang/taisho-t1434/001-1072a");
});

test("汉译 T23 律部完整受控并保留十诵律、毘尼解释、事部组件与署名边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1435/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "十誦律" })).toBeVisible();
  await expect(page.getByText("後秦 · 弗若多羅共羅什譯", { exact: true })).toBeVisible();
  await expect(page.getByText(/十诵律、僧尼戒本与羯磨文本家族/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1437/001-0479a");
  await expect(page.getByText("劉宋 · 法顯集出", { exact: true })).toBeVisible();
  await expect(page.getByText(/集出或依律撰出/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1438/001-0489a");
  await expect(page.getByRole("heading", { level: 1, name: "大沙門百一羯磨法" })).toBeVisible();
  await expect(page.getByText("题记未载作者或译者", { exact: true })).toBeVisible();
  await expect(page.getByText(/不补造译者、编者、印度来源或佛陀逐字亲说归属/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1439/001-0496a");
  await expect(page.getByText("劉宋 · 僧璩撰出", { exact: true })).toBeVisible();

  await page.goto("/jingzang/taisho-t1440/009-0558c");
  await expect(page.getByRole("heading", { level: 1, name: "薩婆多毘尼毘婆沙" })).toBeVisible();
  await expect(page.getByText("失譯；西京東禪定沙門智首撰續序", { exact: true })).toBeVisible();
  await expect(page.getByText(/不把序文责任扩张到整部正文/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1442/001-0627a");
  await expect(page.getByText("唐 · 義淨譯", { exact: true })).toBeVisible();
  await expect(page.getByText(/根本说一切有部毘奈耶与事部文本家族/)).toBeVisible();
  await expect(page.getByText(/保留为平行候选而非版本见证/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1447/002-1057b");
  await expect(page.getByRole("heading", { level: 1, name: "根本說一切有部毘奈耶皮革事" })).toBeVisible();

  const coverageResponse = await request.get("/api/v1/corpus/coverage");
  expect(coverageResponse.ok()).toBeTruthy();
  const coverage = await coverageResponse.json();
  expect(coverage.candidateInventory.chineseT23SourceRecords).toMatchObject({
    denominator: 13,
    controlled: 13,
    fullSourceTexts: 13,
    partialSourceWitnesses: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 4,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1435/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t1440/009-0564c");
  expect(sitemap).toContain("/jingzang/taisho-t1447/002-1057b");
});

test("汉译 T24 律部完整受控并保留异本、异译、节出、疑伪与传统归属边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1448/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "根本說一切有部毘奈耶藥事" })).toBeVisible();
  await expect(page.getByText(/根本说一切有部毘奈耶及事部文本家族/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1467a/001-0910b");
  await expect(page.getByText("後漢 · 安世高譯", { exact: true })).toBeVisible();
  await expect(page.getByText(/传统译者题记，同时公开现代研究/)).toBeVisible();
  await expect(page.getByText(/T1467 a\/b 版本见证/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1467b/001-0911a");
  await expect(page.getByText("题记未载作者或译者", { exact: true })).toBeVisible();
  await expect(page.getByText(/不把该署名自动转移到本见证/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1482/001-0958a");
  await expect(page.getByRole("heading", { level: 1, name: "佛阿毘曇經出家相品" })).toBeVisible();
  await expect(page.getByText("局部见证 · 完整来源记录", { exact: true })).toBeVisible();

  await page.goto("/jingzang/taisho-t1483a/001-0972b");
  await expect(page.getByText("失譯；现存形态与中国编纂层有争议", { exact: true })).toBeVisible();
  await expect(page.getByText(/T1483 a\/b 版本见证/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1484/001-0997a");
  await expect(page.getByRole("heading", { level: 1, name: "梵網經" })).toBeVisible();
  await expect(page.getByText(/现代研究对译者归属、中国撰述层或形成年代的争议/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1489/001-1075c");
  await expect(page.getByText(/Paramārthasaṃvṛtisatyanirdeśa 汉译组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1501/001-1110b");
  await expect(page.getByText(/瑜伽行派菩萨戒羯磨与戒本文本家族/)).toBeVisible();

  const coverageResponse = await request.get("/api/v1/corpus/coverage");
  expect(coverageResponse.ok()).toBeTruthy();
  const coverage = await coverageResponse.json();
  expect(coverage.candidateInventory.chineseT24SourceRecords).toMatchObject({
    denominator: 59,
    controlled: 59,
    fullSourceTexts: 58,
    partialSourceWitnesses: 1,
    verifiedSameWorkExpressions: 2,
    verifiedEditionWitnesses: 4,
    attributionBoundaryRecords: 21,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1448/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t1484/001-0997a");
  expect(sitemap).toContain("/jingzang/taisho-t1501/001-1110b");
});

test("汉译 T25 释经论部完整受控并保留异译、异本、根本论复注与作者争议", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1505/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "四阿鋡暮抄解" })).toBeVisible();
  await expect(page.getByText("婆素跋陀造 · 符秦 · 鳩摩羅佛提等譯", { exact: true })).toBeVisible();
  await expect(page.getByText(/Tridharmakaśāstra.*《三法度论》汉译组/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1509/001-0057a");
  await expect(page.getByRole("heading", { level: 1, name: "大智度論" })).toBeVisible();
  await expect(page.getByText(/传统作者题记，同时公开现代研究/)).toBeVisible();
  await expect(page.getByText(/《摩诃般若波罗蜜经》与《大智度论》经论关系/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1510a/001-0757a");
  await expect(page.getByText(/无著《金刚般若论》T1510 a\/b 异本见证/)).toBeVisible();
  await expect(page.getByText(/共享一个作品实体，同时保留两套卷次与异文系统/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1512/001-0798a");
  await expect(page.getByRole("heading", { level: 1, name: "金剛仙論" })).toBeVisible();
  await expect(page.getByText(/传统作者与解释者题记，同时公开真伪或成书来源争议/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1513/001-0875a");
  await expect(page.getByText(/世亲《金刚般若论释》汉译组/)).toBeVisible();
  await expect(page.getByText(/无著论颂与世亲论释根本颂—复注关系/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1517/001-0900c");
  await expect(page.getByText(/《佛母般若圆集要义论》根本论与释论关系/)).toBeVisible();

  const coverageResponse = await request.get("/api/v1/corpus/coverage");
  expect(coverageResponse.ok()).toBeTruthy();
  const coverage = await coverageResponse.json();
  expect(coverage.candidateInventory.chineseT25SourceRecords).toMatchObject({
    denominator: 15,
    controlled: 15,
    fullSourceTexts: 15,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 4,
    verifiedEditionWitnesses: 2,
    attributionBoundaryRecords: 15,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1505/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t1509/100-0756c");
  expect(sitemap).toContain("/jingzang/taisho-t1518/001-0914a");
});

test("汉译 T26 释经论与毘昙部完整受控并保留异译、异传、根本经论和作者边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1519/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "妙法蓮華經憂波提舍" })).toBeVisible();
  await expect(page.getByText(/《法华论》两种汉译与《法华经》根本经关系/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1529/001-0283a");
  await expect(page.getByRole("heading", { level: 1, name: "遺教經論" })).toBeVisible();
  await expect(page.getByText(/归属边界：来源保留世亲造、真谛译.*很可能是汉地撰述/)).toBeVisible();
  await expect(page.getByText(/《佛遗教经》与《遗教经论》关系及来源争议/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1535/001-0364c");
  await expect(page.getByRole("heading", { level: 1, name: "大乘四法經釋" })).toBeVisible();
  await expect(page.getByText("敦煌遗书 · 无署名", { exact: true })).toBeVisible();
  await expect(page.getByText(/《大乘四法经》与敦煌无署名释题/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1541/001-0627a");
  await expect(page.getByText(/Prakaraṇapāda.*《品类足论》两种汉译/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1544/001-0918a");
  await expect(page.getByRole("heading", { level: 1, name: "阿毘達磨發智論" })).toBeVisible();
  await expect(page.getByText(/Jñānaprasthāna.*《发智论》两种汉译与异传/)).toBeVisible();
  await expect(page.getByText(/“六足一身”阿毗达磨文献家族/)).toBeVisible();

  const coverageResponse = await request.get("/api/v1/corpus/coverage");
  expect(coverageResponse.ok()).toBeTruthy();
  const coverage = await coverageResponse.json();
  expect(coverage.candidateInventory.chineseT26SourceRecords).toMatchObject({
    denominator: 26,
    controlled: 26,
    fullSourceTexts: 26,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 6,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 26,
    relationAnnotatedRecords: 26,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1519/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t1535/001-0364c");
  expect(sitemap).toContain("/jingzang/taisho-t1544/020-1031c");
});

test("汉译 T27《大毘婆沙论》完整受控并保留根本论、广释与传统集体归属边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1545/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "阿毘達磨大毘婆沙論" })).toBeVisible();
  await expect(page.getByText("五百大阿羅漢等造 · 唐 · 玄奘譯", { exact: true })).toBeVisible();
  await expect(page.getByText(/Jñānaprasthāna.*《发智论》与《大毘婆沙论》根本论—广释关系/)).toBeVisible();
  await expect(page.getByText(/归属边界：来源保存“五百大阿罗汉等造、玄奘译”.*独立广释作品/)).toBeVisible();

  const lastPage = await request.get("/jingzang/taisho-t1545/200-1004a");
  expect(lastPage.ok()).toBeTruthy();

  const coverageResponse = await request.get("/api/v1/corpus/coverage");
  expect(coverageResponse.ok()).toBeTruthy();
  const coverage = await coverageResponse.json();
  expect(coverage.candidateInventory.chineseT27SourceRecords).toMatchObject({
    denominator: 1,
    controlled: 1,
    percentage: 100,
    fullSourceTexts: 1,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 0,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 1,
    relationAnnotatedRecords: 1,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1545/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t1545/200-1004a");
});

test("汉译 T28 毘昙部完整受控并区分旧译残存见证、节要、同本异译与独立论释", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1546/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "阿毘曇毘婆沙論" })).toBeVisible();
  await expect(page.getByText(/《大毘婆沙论》玄奘译与残存旧译见证/)).toBeVisible();
  await expect(page.getByText(/归属边界：来源保存《大毘婆沙论》旧译现存六十卷.*不冒充完整译本/)).toBeVisible();

  const t1546LastPage = await request.get("/jingzang/taisho-t1546/060-0415a");
  expect(t1546LastPage.ok()).toBeTruthy();

  await page.goto("/jingzang/taisho-t1556/001-0995c");
  await expect(page.getByRole("heading", { level: 1, name: "薩婆多宗五事論" })).toBeVisible();
  await expect(page.getByText(/《五事论》同本异译、品类足组件与《五事毘婆沙》注释关系/)).toBeVisible();
  await expect(page.getByText(/归属边界：来源分开保存根本论.*不把不同作品、译本或论师撰述改写成佛陀逐字亲说/)).toBeVisible();

  const t1557LastPage = await request.get("/jingzang/taisho-t1557/001-1001b");
  expect(t1557LastPage.ok()).toBeTruthy();

  const coverageResponse = await request.get("/api/v1/corpus/coverage");
  expect(coverageResponse.ok()).toBeTruthy();
  const coverage = await coverageResponse.json();
  expect(coverage.candidateInventory.chineseT28SourceRecords).toMatchObject({
    denominator: 12,
    controlled: 12,
    percentage: 100,
    fullSourceTexts: 11,
    partialSourceWitnesses: 1,
    verifiedSameWorkExpressions: 2,
    verifiedPartialWorkWitnesses: 1,
    verifiedEditionWitnesses: 0,
    attributionBoundaryRecords: 12,
    relationAnnotatedRecords: 8,
    newWorks: 10,
    controlledWorks: 11,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1546/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t1546/060-0415a");
  expect(sitemap).toContain("/jingzang/taisho-t1557/001-1001b");
});

test("汉译 T29 毘昙部完整受控并区分俱舍释异译、本颂、注疏节本与众贤广略论", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1558/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "阿毘達磨俱舍論" })).toBeVisible();
  await expect(page.getByText(/《俱舍论释》同本异译与独立本颂关系/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1561/001-0325a");
  await expect(page.getByRole("heading", { level: 1, name: "俱舍論實義疏" })).toBeVisible();
  await expect(page.getByText(/安慧《俱舍论实义疏》极端节本见证/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1563/001-0777a");
  await expect(page.getByRole("heading", { level: 1, name: "阿毘達磨藏顯宗論" })).toBeVisible();
  await expect(page.getByText(/众贤《顺正理》广论与《显宗》略论关系/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1558/030-0159b",
    "/jingzang/taisho-t1561/005-0328a",
    "/jingzang/taisho-t1562/080-0775c",
    "/jingzang/taisho-t1563/040-0977c",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT29SourceRecords).toMatchObject({
    denominator: 6,
    controlled: 6,
    percentage: 100,
    fullSourceTexts: 5,
    partialSourceWitnesses: 1,
    verifiedSameWorkExpressions: 2,
    verifiedPartialWorkWitnesses: 1,
    relationAnnotatedRecords: 6,
    newWorks: 5,
    controlledWorks: 5,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1558/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t1561/005-0328a");
  expect(sitemap).toContain("/jingzang/taisho-t1563/040-0977c");
});

test("汉译 T30 中观与瑜伽部完整受控并区分根本论、注释、组成部分和分离见证", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1564/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "中論" })).toBeVisible();
  await expect(page.getByText(/《根本中頌》四種漢譯釋論的作品邊界/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1570/001-0182a");
  await expect(page.getByRole("heading", { level: 1, name: "廣百論本" })).toBeVisible();
  await expect(page.getByText(/提婆《百論》《四百論》後半、護法釋與《百字論》邊界/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1582/009-1013c");
  await expect(page.getByRole("heading", { level: 1, name: "菩薩善戒經" })).toBeVisible();
  await expect(page.getByText(/《菩薩善戒經》九卷本與分離受戒法/)).toBeVisible();
  await expect(page.getByText(/《菩薩地持經》與《菩薩善戒經》異譯或改編爭議/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1564/004-0039c",
    "/jingzang/taisho-t1567/009-0158c",
    "/jingzang/taisho-t1571/010-0250b",
    "/jingzang/taisho-t1579/100-0882a",
    "/jingzang/taisho-t1583/001-1013c",
    "/jingzang/taisho-t1583/001-1018b",
    "/jingzang/taisho-t1584/003-1035b",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT30SourceRecords).toMatchObject({
    denominator: 21,
    controlled: 21,
    percentage: 100,
    fullSourceTexts: 15,
    partialSourceWitnesses: 6,
    verifiedSameWorkExpressions: 0,
    verifiedPartialWorkWitnesses: 6,
    verifiedSplitWorkWitnesses: 2,
    relationAnnotatedRecords: 20,
    newWorks: 20,
    controlledWorks: 20,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1564/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t1579/100-0882a");
  expect(sitemap).toContain("/jingzang/taisho-t1583/001-1018b");
  expect(sitemap).toContain("/jingzang/taisho-t1584/003-1035b");
});

test("汉译 T31 瑜伽部完整受控并区分异译、根本论、释论、组成部分和异本", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1585/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "成唯識論" })).toBeVisible();
  await expect(page.getByText(/《唯识三十颂》异译与《成唯识论》复合注释边界/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1615/001-0855c");
  await expect(page.getByRole("heading", { level: 1, name: "王法正理論" })).toBeVisible();
  await expect(page.getByText(/《瑜伽师地论》卷六十一与《王法正理论》/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1619/001-0882c");
  await expect(page.getByRole("heading", { level: 1, name: "無相思塵論" })).toBeVisible();
  await expect(page.getByText(/陈那《观所缘缘论》两译与护法释/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1585/010-0060a",
    "/jingzang/taisho-t1595/015-0270b",
    "/jingzang/taisho-t1602/020-0583b",
    "/jingzang/taisho-t1606/016-0774a",
    "/jingzang/taisho-t1627/001-0896b",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT31SourceRecords).toMatchObject({
    denominator: 43,
    controlled: 43,
    percentage: 100,
    fullSourceTexts: 43,
    partialSourceWitnesses: 0,
    verifiedSameWorkExpressions: 21,
    relationAnnotatedRecords: 38,
    newWorks: 31,
    controlledWorks: 31,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1585/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t1595/015-0270b");
  expect(sitemap).toContain("/jingzang/taisho-t1602/020-0583b");
  expect(sitemap).toContain("/jingzang/taisho-t1627/001-0896b");
});

test("汉译 T32 论集部完整受控并区分异译、异本、音写、文类与归属", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1628/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "因明正理門論本" })).toBeVisible();
  await expect(page.getByText(/《因明正理门论》两译与《因明入正理论》边界/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1666/001-0575a");
  await expect(page.getByRole("heading", { level: 1, name: "大乘起信論" })).toBeVisible();
  await expect(page.getByText(/《大乘起信论》两版本、释论与汉地形成争议/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1677/001-0757a");
  await expect(page.getByRole("heading", { level: 1, name: "三身梵讚" })).toBeVisible();
  await expect(page.getByText(/《三身赞》的梵文音写见证与汉译/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1652/001-0486a",
    "/jingzang/taisho-t1669/020-0693b",
    "/jingzang/taisho-t1670a/002-0703c",
    "/jingzang/taisho-t1672/001-0748a",
    "/jingzang/taisho-t1685/001-0773b",
    "/jingzang/taisho-t1692/001-0790c",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT32SourceRecords).toMatchObject({
    denominator: 66,
    controlled: 66,
    percentage: 100,
    fullSourceTexts: 65,
    partialSourceWitnesses: 1,
    verifiedSameWorkExpressions: 13,
    verifiedPartialWorkWitnesses: 1,
    relationAnnotatedRecords: 27,
    newWorks: 59,
    controlledWorks: 59,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1628/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t1669/020-0693b");
  expect(sitemap).toContain("/jingzang/taisho-t1670a/002-0703c");
  expect(sitemap).toContain("/jingzang/taisho-t1677/001-0757a");
  expect(sitemap).toContain("/jingzang/taisho-t1692/001-0790c");
});

test("汉译 T33 经疏部完整受控并区分根本经、注疏、讲说记录与再注释", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1693/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "人本欲生經註" })).toBeVisible();
  await expect(page.getByText(/《人本欲生经》与道安注/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1702/001-0170a");
  await expect(page.getByRole("heading", { level: 1, name: "金剛經纂要刊定記" })).toBeVisible();
  await expect(page.getByText(/《金刚般若经疏论纂要》与《刊定记》/)).toBeVisible();
  await expect(page.getByText(/独立再注释作品/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1713/001-0555b");
  await expect(page.getByRole("heading", { level: 1, name: "般若心經略疏連珠記" })).toBeVisible();
  await expect(page.getByText(/法藏《心经略疏》与师会《连珠记》/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1717/020-0963c");
  await expect(page.getByRole("heading", { level: 1, name: "法華玄義釋籤" })).toBeVisible();
  await expect(page.getByText(/《法华玄义》与《法华玄义释籤》/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1701/002-0170a",
    "/jingzang/taisho-t1705/005-0286a",
    "/jingzang/taisho-t1706/004-0314a",
    "/jingzang/taisho-t1712/001-0552a",
    "/jingzang/taisho-t1716/010-0814a",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT33SourceRecords).toMatchObject({
    denominator: 25,
    controlled: 25,
    percentage: 100,
    fullSourceTexts: 25,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 25,
    attributionBoundaryRecords: 25,
    newWorks: 25,
    controlledWorks: 25,
    subcommentaryGroups: 4,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1693/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t1702/007-0228a");
  expect(sitemap).toContain("/jingzang/taisho-t1713/002-0568c");
  expect(sitemap).toContain("/jingzang/taisho-t1717/020-0963c");
});

test("汉译 T34 经疏部完整受控并保持章节、注释、再注释与争议根本经边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1718/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "妙法蓮華經文句" })).toBeVisible();
  await expect(page.getByText(/智顗《妙法莲华经文句》与湛然《法华文句记》/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1724/001-0854c");
  await expect(page.getByRole("heading", { level: 1, name: "法華玄贊義決" })).toBeVisible();
  await expect(page.getByText(/窺基《妙法莲华经玄赞》与慧沼《法华玄赞义决》/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1727/001-0892a");
  await expect(page.getByRole("heading", { level: 1, name: "觀音玄義記" })).toBeVisible();
  await expect(page.getByText(/智顗、灌顶《观音玄义》与知礼《观音玄义记》/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1730/001-0961a");
  await expect(page.getByRole("heading", { level: 1, name: "金剛三昧經論" })).toBeVisible();
  await expect(page.getByText(/《金刚三昧经》与元晓《金刚三昧经论》/)).toBeVisible();
  await expect(page.getByText(/不把注疏改写成经文表达或佛陀逐字亲说/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1719/010-0360a",
    "/jingzang/taisho-t1726/002-0892a",
    "/jingzang/taisho-t1728/002-0936a",
    "/jingzang/taisho-t1729/004-0960b",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT34SourceRecords).toMatchObject({
    denominator: 13,
    controlled: 13,
    percentage: 100,
    fullSourceTexts: 13,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 13,
    attributionBoundaryRecords: 13,
    newWorks: 13,
    controlledWorks: 13,
    rootTreatiseCommentaryGroups: 3,
    subcommentaryGroups: 4,
    relatedDistinctWorkGroups: 3,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1718/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t1719/010-0360a");
  expect(sitemap).toContain("/jingzang/taisho-t1724/001-0870c");
  expect(sitemap).toContain("/jingzang/taisho-t1729/004-0960b");
  expect(sitemap).toContain("/jingzang/taisho-t1730/003-1008a");
});

test("汉译 T35 华严经疏部完整受控并保持六十卷、八十卷根经及再注释边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1731/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "華嚴遊意" })).toBeVisible();
  await expect(page.getByText(/六十卷本《大方广佛华严经》与四部游意、搜玄、探玄及纲目/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1733/001-0107a");
  await expect(page.getByRole("heading", { level: 1, name: "華嚴經探玄記" })).toBeVisible();
  await expect(page.getByText(/法藏《华严经探玄记》与《花严经文义纲目》/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1735/001-0503a");
  await expect(page.getByRole("heading", { level: 1, name: "大方廣佛華嚴經疏" })).toBeVisible();
  await expect(page.getByText(/八十卷本《大方广佛华严经》、澄观疏与随疏演义钞/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1732/005-0106b",
    "/jingzang/taisho-t1733/020-0492b",
    "/jingzang/taisho-t1734/001-0492b",
    "/jingzang/taisho-t1735/060-0963a",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT35SourceRecords).toMatchObject({
    denominator: 5,
    controlled: 5,
    percentage: 100,
    fullSourceTexts: 5,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 5,
    attributionBoundaryRecords: 5,
    newWorks: 5,
    controlledWorks: 5,
    rootTreatiseCommentaryGroups: 2,
    subcommentaryGroups: 1,
    relatedDistinctWorkGroups: 3,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t1731/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t1732/005-0106b");
  expect(sitemap).toContain("/jingzang/taisho-t1733/020-0492b");
  expect(sitemap).toContain("/jingzang/taisho-t1734/001-0492b");
  expect(sitemap).toContain("/jingzang/taisho-t1735/060-0963a");
});

test("汉译 T36 华严疏钞论义完整受控并保持根经、经疏、再注释与同作者作品边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1736/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "大方廣佛華嚴經隨疏演義鈔" })).toBeVisible();
  await expect(page.getByText(/八十卷本《大方广佛华严经》、澄观疏与随疏演义钞/)).toBeVisible();
  await expect(page.getByText(/独立再注释作品/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1739/001-0721a");
  await expect(page.getByRole("heading", { level: 1, name: "新華嚴經論" })).toBeVisible();
  await expect(page.getByText(/李通玄《新华严经论》《卷卷大意略叙》与《修行次第决疑论》/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1743/001-1064c");
  await expect(page.getByRole("heading", { level: 1, name: "皇帝降誕日於麟德殿講大方廣佛華嚴經玄義一部" })).toBeVisible();
  await expect(page.getByText(/根本经、直接注疏、再注释、略策、章释、论、卷意、决疑论、观门骨目与宫廷讲义保持十个作品实体/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1736/090-0701a",
    "/jingzang/taisho-t1737/001-0701b",
    "/jingzang/taisho-t1738/001-0709c",
    "/jingzang/taisho-t1739/040-1008b",
    "/jingzang/taisho-t1740/001-1008c",
    "/jingzang/taisho-t1741/004-1049c",
    "/jingzang/taisho-t1742/002-1064c",
    "/jingzang/taisho-t1743/001-1066c",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT36SourceRecords).toMatchObject({
    denominator: 8,
    controlled: 8,
    percentage: 100,
    fullSourceTexts: 8,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 8,
    attributionBoundaryRecords: 8,
    newWorks: 8,
    controlledWorks: 8,
    rootTreatiseCommentaryGroups: 2,
    subcommentaryGroups: 1,
    relatedDistinctWorkGroups: 2,
  });

  const sitemap = await readSitemaps(request);
  for (const path of [
    "/jingzang/taisho-t1736/001-0001a",
    "/jingzang/taisho-t1737/001-0701b",
    "/jingzang/taisho-t1738/001-0709c",
    "/jingzang/taisho-t1739/001-0721a",
    "/jingzang/taisho-t1740/001-1008c",
    "/jingzang/taisho-t1741/001-1011c",
    "/jingzang/taisho-t1742/001-1049c",
    "/jingzang/taisho-t1743/001-1064c",
  ]) expect(sitemap).toContain(path);
});

test("汉译 T37 净土、胜鬘与涅槃经疏完整受控并保持根经、再注释、讲说集解与同题异作边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1745/001-0091a");
  await expect(page.getByRole("heading", { level: 1, name: "無量壽經義疏" })).toBeVisible();
  await expect(page.getByText(/慧远与吉藏两部《无量寿经义疏》/)).toBeVisible();
  await expect(page.getByText(/相同题名与共同根经不构成同一作品/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1751/001-0195a");
  await expect(page.getByRole("heading", { level: 1, name: "觀無量壽佛經疏妙宗鈔" })).toBeVisible();
  await expect(page.getByText(/《观无量寿佛经》、智顗说疏与知礼《妙宗钞》/)).toBeVisible();
  await expect(page.getByText(/根本经、讲说记录与再注释分层登记/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1763/001-0377a");
  await expect(page.getByRole("heading", { level: 1, name: "大般涅槃經集解" })).toBeVisible();
  await expect(page.getByText(/南本《大般涅槃经》与宝亮等《大般涅槃经集解》/)).toBeVisible();
  await expect(page.getByText(/独立注释作品，不是南本根经的另一表达/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1744/003-0090c",
    "/jingzang/taisho-t1748/003-0171a",
    "/jingzang/taisho-t1751/006-0233b",
    "/jingzang/taisho-t1754/003-0305c",
    "/jingzang/taisho-t1758/003-0348a",
    "/jingzang/taisho-t1762/001-0375a",
    "/jingzang/taisho-t1763/071-0611a",
    "/jingzang/taisho-t1764/010-0903c",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT37SourceRecords).toMatchObject({
    denominator: 21,
    controlled: 21,
    percentage: 100,
    fullSourceTexts: 21,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 21,
    attributionBoundaryRecords: 21,
    newWorks: 21,
    controlledWorks: 21,
    rootTreatiseCommentaryGroups: 6,
    subcommentaryGroups: 1,
    relatedDistinctWorkGroups: 2,
  });

  const sitemap = await readSitemaps(request);
  for (const id of Array.from({ length: 21 }, (_, index) => 1744 + index)) {
    expect(sitemap).toContain(`/jingzang/taisho-t${id}/`);
  }
});

test("汉译 T38 涅槃、药师、弥勒与维摩经疏完整受控并保持多根经、略疏、再注释及同作者异作边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1766/001-0015b");
  await expect(page.getByRole("heading", { level: 1, name: "涅槃玄義發源機要" })).toBeVisible();
  await expect(page.getByText(/《大般涅槃经》、灌顶《玄义》与智圆《发源机要》/)).toBeVisible();
  await expect(page.getByText(/根经、玄义与再注释分层登记/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1774/001-0303b");
  await expect(page.getByRole("heading", { level: 1, name: "三彌勒經疏" })).toBeVisible();
  await expect(page.getByText(/弥勒上生、下生成佛与大成佛三经及憬兴《三弥勒经疏》/)).toBeVisible();
  await expect(page.getByText(/多根经注疏仍是一个独立诠释作品/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1779/001-0711a");
  await expect(page.getByRole("heading", { level: 1, name: "維摩經略疏垂裕記" })).toBeVisible();
  await expect(page.getByText(/《维摩诘所说经》、智顗说湛然略疏与智圆《垂裕记》/)).toBeVisible();
  await expect(page.getByText(/根经、略疏和垂裕记分层登记/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1767/033-0230a",
    "/jingzang/taisho-t1775/010-0420a",
    "/jingzang/taisho-t1778/010-0710a",
    "/jingzang/taisho-t1779/010-0851c",
    "/jingzang/taisho-t1781/006-0991b",
    "/jingzang/taisho-t1782/006-1114b",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT38SourceRecords).toMatchObject({
    denominator: 18,
    controlled: 18,
    percentage: 100,
    fullSourceTexts: 18,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 18,
    attributionBoundaryRecords: 18,
    newWorks: 18,
    controlledWorks: 18,
    rootTreatiseCommentaryGroups: 6,
    subcommentaryGroups: 2,
    relatedDistinctWorkGroups: 3,
  });

  const sitemap = await readSitemaps(request);
  for (const id of Array.from({ length: 18 }, (_, index) => 1765 + index)) {
    expect(sitemap).toContain(`/jingzang/taisho-t${id}/`);
  }
});

test("汉译 T39 金光明、楞伽及显密经疏完整受控并保持再注释、范围与传统归属边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1784/001-0012b");
  await expect(page.getByRole("heading", { level: 1, name: "金光明經玄義拾遺記" })).toBeVisible();
  await expect(page.getByText(/《金光明经》、智顗说《玄义》与知礼《玄义拾遗记》/)).toBeVisible();
  await expect(page.getByText(/根经、玄义讲说记录与再注释分层登记/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1797/001-0790a");
  await expect(page.getByRole("heading", { level: 1, name: "大毘盧遮那經供養次第法疏" })).toBeVisible();
  await expect(page.getByText(/全经疏、卷七仪轨疏与根本经的范围和责任不同/)).toBeVisible();
  await expect(page.getByText(/T1797 只解释第七卷供养次第法/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1799/001-0823a");
  await expect(page.getByRole("heading", { level: 1, name: "首楞嚴義疏注經" })).toBeVisible();
  await expect(page.getByText(/存在注疏传统不能反向消除 T0945 的译者与成书争议/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1801/001-0977a");
  await expect(page.getByRole("heading", { level: 1, name: "請觀音經疏闡義鈔" })).toBeVisible();
  await expect(page.getByText(/根经、直接疏与再注释分层登记/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1783/002-0012a",
    "/jingzang/taisho-t1786/006-0160a",
    "/jingzang/taisho-t1791/010-0504c",
    "/jingzang/taisho-t1796/020-0789c",
    "/jingzang/taisho-t1803/002-1040c",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT39SourceRecords).toMatchObject({
    denominator: 21,
    controlled: 21,
    percentage: 100,
    fullSourceTexts: 21,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 21,
    attributionBoundaryRecords: 21,
    newWorks: 21,
    controlledWorks: 21,
    rootTreatiseCommentaryGroups: 14,
    subcommentaryGroups: 3,
    relatedDistinctWorkGroups: 4,
  });

  const sitemap = await readSitemaps(request);
  for (const id of Array.from({ length: 21 }, (_, index) => 1783 + index)) {
    expect(sitemap).toContain(`/jingzang/taisho-t${id}/`);
  }
});

test("汉译 T40 四分律、菩萨戒及经论疏完整受控并保持再注释、男女众范围与复合责任边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1805/001-0157a");
  await expect(page.getByRole("heading", { level: 1, name: "四分律行事鈔資持記" })).toBeVisible();
  await expect(page.getByText(/《四分律》、道宣《行事钞》与元照《资持记》/)).toBeVisible();
  await expect(page.getByText(/根本广律、律学行事钞和对行事钞的资持记分为三层作品/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1809/001-0511b");
  await expect(page.getByRole("heading", { level: 1, name: "僧羯磨" })).toBeVisible();
  await expect(page.getByText(/通用、僧众与尼众适用范围及编集责任不同/)).toBeVisible();
  await expect(page.getByText(/相似仪式语句不是同一作品证明/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1812/001-0580b");
  await expect(page.getByRole("heading", { level: 1, name: "天台菩薩戒疏" })).toBeVisible();
  await expect(page.getByText(/责任题记明确为明旷删补/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1817/001-0783a");
  await expect(page.getByRole("heading", { level: 1, name: "略明般若末後一頌讚述" })).toBeVisible();
  await expect(page.getByText(/其范围仅为末后一颂/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1820/001-0844c");
  await expect(page.getByRole("heading", { level: 1, name: "佛遺教經論疏節要" })).toBeVisible();
  await expect(page.getByText(/责任题记明确包含宋代节要和明代补注/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1804/003-0156c",
    "/jingzang/taisho-t1806/003-0463a",
    "/jingzang/taisho-t1810/003-0561c",
    "/jingzang/taisho-t1815/002-0718a",
    "/jingzang/taisho-t1819/002-0844b",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT40SourceRecords).toMatchObject({
    denominator: 17,
    controlled: 17,
    percentage: 100,
    fullSourceTexts: 17,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 17,
    attributionBoundaryRecords: 17,
    newWorks: 17,
    controlledWorks: 17,
    rootVinayaCommentaryGroups: 4,
    rootTreatiseCommentaryGroups: 5,
    subcommentaryGroups: 1,
    scopeBoundaryGroups: 3,
    relatedDistinctWorkGroups: 4,
  });

  const sitemap = await readSitemaps(request);
  for (const id of Array.from({ length: 17 }, (_, index) => 1804 + index)) {
    expect(sitemap).toContain(`/jingzang/taisho-t${id}/`);
  }
});

test("汉译 T41 俱舍论三部唐疏完整受控并保持平行注疏与颂疏范围边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1821/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "俱舍論記" })).toBeVisible();
  await expect(page.getByText(/玄奘译《阿毘达磨俱舍论》与普光《俱舍论记》、法宝《俱舍论疏》/)).toBeVisible();
  await expect(page.getByText(/具有独立作者责任、解释结构和全文边界/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1822/001-0453a");
  await expect(page.getByRole("heading", { level: 1, name: "俱舍論疏" })).toBeVisible();
  await expect(page.getByText(/共享引论不能据以合并/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1823/001-0813a");
  await expect(page.getByRole("heading", { level: 1, name: "俱舍論頌疏" })).toBeVisible();
  await expect(page.getByText(/圆晖疏以俱舍颂为组织核心/)).toBeVisible();
  await expect(page.getByText(/共同术语和三十卷规模不能消除注释对象与组织范围差异/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1821/030-0452b",
    "/jingzang/taisho-t1822/030-0812c",
    "/jingzang/taisho-t1823/030-0982a",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT41SourceRecords).toMatchObject({
    denominator: 3,
    controlled: 3,
    percentage: 100,
    fullSourceTexts: 3,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 3,
    attributionBoundaryRecords: 3,
    newWorks: 3,
    controlledWorks: 3,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 2,
    subcommentaryGroups: 0,
    scopeBoundaryGroups: 1,
    relatedDistinctWorkGroups: 1,
  });

  const sitemap = await readSitemaps(request);
  for (const id of [1821, 1822, 1823]) {
    expect(sitemap).toContain(`/jingzang/taisho-t${id}/`);
  }
});

test("汉译 T42 中观与瑜伽五部论疏完整受控并保持根本论、平行注疏与范围边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1824/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "中觀論疏" })).toBeVisible();
  await expect(page.getByText(/十卷隋代疏具有吉藏作者责任、独立解释结构和完整来源边界/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1825/001-0171a");
  await expect(page.getByRole("heading", { level: 1, name: "十二門論疏" })).toBeVisible();
  await expect(page.getByText(/两部注疏分别署吉藏与法藏/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1826/001-0212b");
  await expect(page.getByRole("heading", { level: 1, name: "十二門論宗致義記" })).toBeVisible();
  await expect(page.getByText(/共同根本论不能消除体例与范围差异/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1828/001-0311a");
  await expect(page.getByRole("heading", { level: 1, name: "瑜伽論記" })).toBeVisible();
  await expect(page.getByText(/不是百卷根本论的另一表达/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1824/010-0169b",
    "/jingzang/taisho-t1825/003-0212b",
    "/jingzang/taisho-t1826/002-0231a",
    "/jingzang/taisho-t1827/003-0309c",
    "/jingzang/taisho-t1828/024-0868b",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT42SourceRecords).toMatchObject({
    denominator: 5,
    controlled: 5,
    percentage: 100,
    fullSourceTexts: 5,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 5,
    attributionBoundaryRecords: 5,
    newWorks: 5,
    controlledWorks: 5,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 4,
    subcommentaryGroups: 0,
    scopeBoundaryGroups: 1,
    relatedDistinctWorkGroups: 2,
  });

  const sitemap = await readSitemaps(request);
  for (const id of [1824, 1825, 1826, 1827, 1828]) {
    expect(sitemap).toContain(`/jingzang/taisho-t${id}/`);
  }
});

test("汉译 T43 六部唯识论疏完整受控并保持根本论、再注释、平行注疏与范围边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1829/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "瑜伽師地論略纂" })).toBeVisible();
  await expect(page.getByText(/不是百卷根本论的另一表达/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1830/001-0229a");
  await expect(page.getByRole("heading", { level: 1, name: "成唯識論述記" })).toBeVisible();
  await expect(page.getByText(/不是窺基述记的同作品表达/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1831/001-0607a");
  await expect(page.getByRole("heading", { level: 1, name: "成唯識論掌中樞要" })).toBeVisible();
  await expect(page.getByText(/共同作者和根本论不能消除体例、篇幅与解释范围差异/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1832/001-0659a");
  await expect(page.getByRole("heading", { level: 1, name: "成唯識論了義燈" })).toBeVisible();
  await expect(page.getByText(/不是 T1830 的同作品表达/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1833/001-0811a");
  await expect(page.getByRole("heading", { level: 1, name: "成唯識論演祕" })).toBeVisible();
  await expect(page.getByText(/共同师承与术语不能据以合并/)).toBeVisible();

  await page.goto("/jingzang/taisho-t1834/001-0978c");
  await expect(page.getByRole("heading", { level: 1, name: "唯識二十論述記" })).toBeVisible();
  await expect(page.getByText(/不是世亲根本论或其玄奘译表达/)).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1829/016-0228b",
    "/jingzang/taisho-t1830/010-0606c",
    "/jingzang/taisho-t1831/002-0658a",
    "/jingzang/taisho-t1832/007-0810b",
    "/jingzang/taisho-t1833/007-0978c",
    "/jingzang/taisho-t1834/002-1009c",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT43SourceRecords).toMatchObject({
    denominator: 6,
    controlled: 6,
    percentage: 100,
    fullSourceTexts: 6,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 6,
    attributionBoundaryRecords: 6,
    newWorks: 6,
    controlledWorks: 6,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 3,
    subcommentaryGroups: 2,
    scopeBoundaryGroups: 1,
    relatedDistinctWorkGroups: 3,
  });

  const sitemap = await readSitemaps(request);
  for (const id of [1829, 1830, 1831, 1832, 1833, 1834]) {
    expect(sitemap).toContain(`/jingzang/taisho-t${id}/`);
  }
});

test("汉译 T44 十七部论疏、因明与大乘义章完整受控并保持责任、译本、再注释和范围边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1836/001-0046a");
  await expect(page.getByRole("heading", { level: 1, name: "大乘百法明門論解" })).toBeVisible();
  await expect(page.getByText(/窺基註解.*普泰增修/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t1848/001-0297a");
  await expect(page.getByRole("heading", { level: 1, name: "起信論疏筆削記" })).toBeVisible();
  await expect(page.getByText(/再注释|子璿/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t1851/001-0465a");
  await expect(page.getByRole("heading", { level: 1, name: "大乘義章" })).toBeVisible();
  await expect(page.getByText(/综合|義章|义章/).first()).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1835/003-0046a", "/jingzang/taisho-t1836/002-0052c",
    "/jingzang/taisho-t1837/002-0061a", "/jingzang/taisho-t1838/001-0076b",
    "/jingzang/taisho-t1839/001-0091b", "/jingzang/taisho-t1840/003-0143a",
    "/jingzang/taisho-t1841/001-0158b", "/jingzang/taisho-t1842/001-0174b",
    "/jingzang/taisho-t1843/002-0201c", "/jingzang/taisho-t1844/002-0226a",
    "/jingzang/taisho-t1845/001-0240c", "/jingzang/taisho-t1846/003-0287b",
    "/jingzang/taisho-t1847/001-0295c", "/jingzang/taisho-t1848/020-0409b",
    "/jingzang/taisho-t1849/001-0422b", "/jingzang/taisho-t1850/006-0464b",
    "/jingzang/taisho-t1851/020-0875c",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT44SourceRecords).toMatchObject({
    denominator: 17,
    controlled: 17,
    percentage: 100,
    fullSourceTexts: 17,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 17,
    attributionBoundaryRecords: 17,
    newWorks: 17,
    controlledWorks: 17,
    rootVinayaCommentaryGroups: 0,
    rootTreatiseCommentaryGroups: 7,
    rootEditionBoundaryGroups: 2,
    subcommentaryGroups: 1,
    scopeBoundaryGroups: 3,
    relatedDistinctWorkGroups: 6,
  });

  const sitemap = await readSitemaps(request);
  for (let id = 1835; id <= 1851; id += 1) {
    expect(sitemap).toContain(`/jingzang/taisho-t${id}/`);
  }
});

test("汉译 T45 六十一部东亚宗派、律仪与忏法著述完整受控且不误并根本、注疏和同经号文本", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1858/001-0150a");
  await expect(page.getByRole("heading", { level: 1, name: "肇論" })).toBeVisible();
  await expect(page.getByText(/僧肇作/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t1879b/001-0659b");
  await expect(page.getByRole("heading", { level: 1, name: "華嚴關脈義記" })).toBeVisible();
  await expect(page.getByText("传统责任题记未署名").first()).toBeVisible();

  await page.goto("/jingzang/taisho-t1887b/001-0716a");
  await expect(page.getByRole("heading", { level: 1, name: "法界圖記叢髓錄" })).toBeVisible();
  await expect(page.getByText("卷目录 · 2 卷")).toBeVisible();

  await page.goto("/jingzang/taisho-t1910/001-0967c");
  await expect(page.getByRole("heading", { level: 1, name: "慈悲水懺法" })).toBeVisible();
  await expect(page.getByText("卷目录 · 3 卷")).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1858/001-0150a", "/jingzang/taisho-t1858/001-0161b",
    "/jingzang/taisho-t1879a/001-0656a", "/jingzang/taisho-t1879a/001-0659b",
    "/jingzang/taisho-t1879b/001-0659b", "/jingzang/taisho-t1879b/001-0663a",
    "/jingzang/taisho-t1887a/001-0711a", "/jingzang/taisho-t1887a/001-0716a",
    "/jingzang/taisho-t1887b/001-0716a", "/jingzang/taisho-t1887b/002-0767c",
    "/jingzang/taisho-t1910/001-0967c", "/jingzang/taisho-t1910/003-0978b",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT45SourceRecords).toMatchObject({
    denominator: 61,
    controlled: 61,
    percentage: 100,
    fullSourceTexts: 61,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 61,
    attributionBoundaryRecords: 61,
    unsignedResponsibilityRecords: 3,
    newWorks: 61,
    controlledWorks: 61,
    rootTreatiseCommentaryGroups: 1,
    subcommentaryGroups: 1,
    sameNumberBoundaryGroups: 2,
    layeredAttributionGroups: 5,
    scopeBoundaryGroups: 7,
    relatedDistinctWorkGroups: 8,
  });

  const sitemap = await readSitemaps(request);
  const t45Slugs = Array.from({ length: 59 }, (_, index) => 1852 + index).flatMap((id) => {
    if (id === 1879 || id === 1887) return [`taisho-t${id}a`, `taisho-t${id}b`];
    return [`taisho-t${id}`];
  });
  expect(t45Slugs).toHaveLength(61);
  for (const slug of t45Slugs) expect(sitemap).toContain(`/jingzang/${slug}/`);
});

test("汉译 T46 四十六部天台止观、教观与仪轨完整受控且不因注疏链或文本复用误合并", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1911/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "摩訶止觀" })).toBeVisible();
  await expect(page.getByText(/智顗說/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t1943/001-0956c");
  await expect(page.getByRole("heading", { level: 1, name: "略法華三昧補助儀" })).toBeVisible();
  await expect(page.getByText("传统责任题记未署名").first()).toBeVisible();

  await page.goto("/jingzang/taisho-t1945/001-0957b");
  await expect(page.getByRole("heading", { level: 1, name: "金光明懺法補助儀" })).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1911/001-0001a", "/jingzang/taisho-t1911/010-0140c",
    "/jingzang/taisho-t1920/001-0584b", "/jingzang/taisho-t1920/001-0587b",
    "/jingzang/taisho-t1928/001-0704c", "/jingzang/taisho-t1928/002-0720a",
    "/jingzang/taisho-t1943/001-0956c", "/jingzang/taisho-t1945/001-0961c",
    "/jingzang/taisho-t1956/001-1007a", "/jingzang/taisho-t1956/001-1013b",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT46SourceRecords).toMatchObject({
    denominator: 46,
    controlled: 46,
    percentage: 100,
    fullSourceTexts: 46,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 46,
    attributionBoundaryRecords: 46,
    unsignedResponsibilityRecords: 4,
    newWorks: 46,
    controlledWorks: 46,
    rootTreatiseCommentaryGroups: 3,
    layeredAttributionGroups: 2,
    scopeBoundaryGroups: 7,
    relatedDistinctWorkGroups: 6,
  });

  const sitemap = await readSitemaps(request);
  const t46Slugs = Array.from({ length: 46 }, (_, index) => `taisho-t${1911 + index}`);
  for (const slug of t46Slugs) expect(sitemap).toContain(`/jingzang/${slug}/`);
});

test("汉译 T47 四十九部净土论著、礼赞仪轨与禅宗语录完整受控且不因同号或高重叠误合并", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t1957/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "略論安樂淨土義" })).toBeVisible();
  await expect(page.getByText(/曇鸞撰/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t1987a/001-0526b");
  await expect(page.getByRole("heading", { level: 1, name: "撫州曹山元證禪師語錄" })).toBeVisible();

  await page.goto("/jingzang/taisho-t1994b/001-0646a");
  await expect(page.getByRole("heading", { level: 1, name: "楊岐方會和尚後錄" })).toBeVisible();
  await expect(page.getByText("传统责任题记未署名").first()).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t1957/001-0001a", "/jingzang/taisho-t1957/001-0004a",
    "/jingzang/taisho-t1969a/001-0148a", "/jingzang/taisho-t1969a/005-0231b",
    "/jingzang/taisho-t1986a/001-0507a", "/jingzang/taisho-t1986b/001-0526b",
    "/jingzang/taisho-t1987a/001-0526b", "/jingzang/taisho-t1987b/002-0544c",
    "/jingzang/taisho-t1994b/001-0646a", "/jingzang/taisho-t1994b/001-0648c",
    "/jingzang/taisho-t2000/001-0984a", "/jingzang/taisho-t2000/010-1064b",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT47SourceRecords).toMatchObject({
    denominator: 49,
    controlled: 49,
    percentage: 100,
    fullSourceTexts: 49,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 49,
    attributionBoundaryRecords: 49,
    unsignedResponsibilityRecords: 1,
    newWorks: 49,
    controlledWorks: 49,
    sameNumberBoundaryGroups: 5,
    layeredAttributionGroups: 4,
    scopeBoundaryGroups: 3,
    relatedDistinctWorkGroups: 12,
  });

  const sitemap = await readSitemaps(request);
  const t47Slugs = Array.from({ length: 44 }, (_, index) => 1957 + index).flatMap((id) => {
    if ([1969, 1986, 1987, 1994, 1998].includes(id)) return [`taisho-t${id}a`, `taisho-t${id}b`];
    return [`taisho-t${id}`];
  });
  expect(t47Slugs).toHaveLength(49);
  for (const slug of t47Slugs) expect(sitemap).toContain(`/jingzang/${slug}/`);
});

test("汉译 T48 二十八部禅宗语录、公案、宗论与清规完整受控且保持传本和责任边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t2001/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "宏智禪師廣錄" })).toBeVisible();
  await expect(page.getByText(/集成等編/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t2007/001-0337a");
  await expect(page.getByRole("heading", { level: 1, name: "南宗頓教最上大乘摩訶般若波羅蜜經六祖惠能大師於韶州大梵寺施法壇經" })).toBeVisible();

  await page.goto("/jingzang/taisho-t2009/001-0365a");
  await expect(page.getByRole("heading", { level: 1, name: "少室六門" })).toBeVisible();
  await expect(page.getByText("传统责任题记未署名").first()).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t2001/001-0001a", "/jingzang/taisho-t2001/009-0121a",
    "/jingzang/taisho-t2002a/001-0121a", "/jingzang/taisho-t2002b/001-0137a",
    "/jingzang/taisho-t2007/001-0337a", "/jingzang/taisho-t2007/001-0345b",
    "/jingzang/taisho-t2008/001-0345b", "/jingzang/taisho-t2008/001-0365a",
    "/jingzang/taisho-t2009/001-0365a", "/jingzang/taisho-t2009/001-0376b",
    "/jingzang/taisho-t2012a/001-0379b", "/jingzang/taisho-t2012b/001-0387b",
    "/jingzang/taisho-t2016/001-0415a", "/jingzang/taisho-t2016/100-0957b",
    "/jingzang/taisho-t2019a/001-0999a", "/jingzang/taisho-t2019b/001-1005c",
    "/jingzang/taisho-t2025/001-1109c", "/jingzang/taisho-t2025/008-1160b",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT48SourceRecords).toMatchObject({
    denominator: 28,
    controlled: 28,
    percentage: 100,
    fullSourceTexts: 28,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 28,
    attributionBoundaryRecords: 28,
    unsignedResponsibilityRecords: 1,
    newWorks: 28,
    controlledWorks: 28,
    sameNumberBoundaryGroups: 3,
    layeredAttributionGroups: 3,
    scopeBoundaryGroups: 6,
    relatedDistinctWorkGroups: 12,
  });

  const sitemap = await readSitemaps(request);
  const t48Slugs = Array.from({ length: 25 }, (_, index) => 2001 + index).flatMap((id) => {
    if ([2002, 2012, 2019].includes(id)) return [`taisho-t${id}a`, `taisho-t${id}b`];
    return [`taisho-t${id}`];
  });
  expect(t48Slugs).toHaveLength(28);
  for (const slug of t48Slugs) expect(sitemap).toContain(`/jingzang/${slug}/`);
});

test("汉译 T49 十四部结集、部派论书与佛教史传完整受控且保持续集和责任边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t2026/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "撰集三藏及雜藏傳" })).toBeVisible();
  await expect(page.getByText("失譯").first()).toBeVisible();

  await page.goto("/jingzang/taisho-t2031/001-0015a");
  await expect(page.getByRole("heading", { level: 1, name: "異部宗輪論" })).toBeVisible();
  await expect(page.getByText(/世友菩薩造 · 唐 · 玄奘譯/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t2038/001-0903a");
  await expect(page.getByRole("heading", { level: 1, name: "釋鑑稽古略續集" })).toBeVisible();

  await page.goto("/jingzang/taisho-t2039/001-0953c");
  await expect(page.getByRole("heading", { level: 1, name: "三國遺事" })).toBeVisible();
  await expect(page.getByText(/高麗 · 一然撰/).first()).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t2026/001-0001a", "/jingzang/taisho-t2026/001-0004a",
    "/jingzang/taisho-t2027/001-0004b", "/jingzang/taisho-t2027/001-0007a",
    "/jingzang/taisho-t2028/001-0007a", "/jingzang/taisho-t2028/001-0009c",
    "/jingzang/taisho-t2029/001-0009c", "/jingzang/taisho-t2029/001-0012c",
    "/jingzang/taisho-t2030/001-0012c", "/jingzang/taisho-t2030/001-0014c",
    "/jingzang/taisho-t2031/001-0015a", "/jingzang/taisho-t2031/001-0017b",
    "/jingzang/taisho-t2032/001-0017b", "/jingzang/taisho-t2032/001-0019c",
    "/jingzang/taisho-t2033/001-0020a", "/jingzang/taisho-t2033/001-0022c",
    "/jingzang/taisho-t2034/001-0022c", "/jingzang/taisho-t2034/015-0127c",
    "/jingzang/taisho-t2035/001-0129a", "/jingzang/taisho-t2035/054-0475c",
    "/jingzang/taisho-t2036/001-0477a", "/jingzang/taisho-t2036/022-0735b",
    "/jingzang/taisho-t2037/001-0737a", "/jingzang/taisho-t2037/004-0902c",
    "/jingzang/taisho-t2038/001-0903a", "/jingzang/taisho-t2038/003-0953b",
    "/jingzang/taisho-t2039/001-0953c", "/jingzang/taisho-t2039/005-1019a",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT49SourceRecords).toMatchObject({
    denominator: 14,
    controlled: 14,
    percentage: 100,
    fullSourceTexts: 14,
    partialSourceWitnesses: 0,
    relationAnnotatedRecords: 14,
    attributionBoundaryRecords: 14,
    unsignedResponsibilityRecords: 0,
    lostTranslatorResponsibilityRecords: 3,
    newWorks: 14,
    controlledWorks: 14,
    sameNumberBoundaryGroups: 0,
    layeredAttributionGroups: 2,
    scopeBoundaryGroups: 3,
    continuationBoundaryGroups: 1,
    catalogResponsibilityBoundaryGroups: 1,
    relatedDistinctWorkGroups: 7,
  });

  const sitemap = await readSitemaps(request);
  const t49Slugs = Array.from({ length: 14 }, (_, index) => `taisho-t${2026 + index}`);
  for (const slug of t49Slugs) expect(sitemap).toContain(`/jingzang/${slug}/`);
});

test("汉译 T50 二十七份佛传与僧尼史传完整受控且保留龙树传双版本边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t2047a/001-0184a");
  await expect(page.getByRole("heading", { level: 1, name: "龍樹菩薩傳" })).toBeVisible();
  await expect(page.getByText(/姚秦 · 鳩摩羅什譯/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t2047b/001-0185b");
  await expect(page.getByRole("heading", { level: 1, name: "龍樹菩薩傳" })).toBeVisible();

  await page.goto("/jingzang/taisho-t2057/001-0294c");
  await expect(page.getByRole("heading", { level: 1, name: "大唐青龍寺三朝供奉大德行狀" })).toBeVisible();
  await expect(page.getByText("传统责任题记未署名").first()).toBeVisible();

  await page.goto("/jingzang/taisho-t2064/001-0948b");
  await expect(page.getByRole("heading", { level: 1, name: "神僧傳" })).toBeVisible();
  await expect(page.getByText("传统责任题记未署名").first()).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t2040/001-0001a", "/jingzang/taisho-t2040/005-0084b",
    "/jingzang/taisho-t2041/001-0084b", "/jingzang/taisho-t2041/001-0099a",
    "/jingzang/taisho-t2042/001-0099a", "/jingzang/taisho-t2042/007-0131a",
    "/jingzang/taisho-t2043/001-0131b", "/jingzang/taisho-t2043/010-0170a",
    "/jingzang/taisho-t2044/001-0170a", "/jingzang/taisho-t2044/001-0172a",
    "/jingzang/taisho-t2045/001-0172a", "/jingzang/taisho-t2045/001-0183a",
    "/jingzang/taisho-t2046/001-0183a", "/jingzang/taisho-t2046/001-0184a",
    "/jingzang/taisho-t2047a/001-0184a", "/jingzang/taisho-t2047a/001-0185b",
    "/jingzang/taisho-t2047b/001-0185b", "/jingzang/taisho-t2047b/001-0186c",
    "/jingzang/taisho-t2048/001-0186c", "/jingzang/taisho-t2048/001-0188a",
    "/jingzang/taisho-t2049/001-0188a", "/jingzang/taisho-t2049/001-0191a",
    "/jingzang/taisho-t2050/001-0191a", "/jingzang/taisho-t2050/001-0198a",
    "/jingzang/taisho-t2051/001-0198a", "/jingzang/taisho-t2051/003-0213b",
    "/jingzang/taisho-t2052/001-0214a", "/jingzang/taisho-t2052/001-0220c",
    "/jingzang/taisho-t2053/001-0220c", "/jingzang/taisho-t2053/010-0280a",
    "/jingzang/taisho-t2054/001-0280a", "/jingzang/taisho-t2054/001-0289c",
    "/jingzang/taisho-t2055/001-0290a", "/jingzang/taisho-t2055/001-0292a",
    "/jingzang/taisho-t2056/001-0292b", "/jingzang/taisho-t2056/001-0294c",
    "/jingzang/taisho-t2057/001-0294c", "/jingzang/taisho-t2057/001-0296a",
    "/jingzang/taisho-t2058/001-0297a", "/jingzang/taisho-t2058/006-0322b",
    "/jingzang/taisho-t2059/001-0322c", "/jingzang/taisho-t2059/014-0423a",
    "/jingzang/taisho-t2060/001-0425a", "/jingzang/taisho-t2060/030-0707a",
    "/jingzang/taisho-t2061/001-0709a", "/jingzang/taisho-t2061/030-0900a",
    "/jingzang/taisho-t2062/001-0901a", "/jingzang/taisho-t2062/008-0934a",
    "/jingzang/taisho-t2063/001-0934a", "/jingzang/taisho-t2063/004-0948a",
    "/jingzang/taisho-t2064/001-0948b", "/jingzang/taisho-t2064/009-1015a",
    "/jingzang/taisho-t2065/001-1015a", "/jingzang/taisho-t2065/002-1023a",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT50SourceRecords).toMatchObject({
    denominator: 27,
    controlled: 27,
    percentage: 100,
    fullSourceTexts: 27,
    partialSourceWitnesses: 0,
    verifiedEditionWitnesses: 2,
    relationAnnotatedRecords: 27,
    attributionBoundaryRecords: 27,
    unsignedResponsibilityRecords: 2,
    lostTranslatorResponsibilityRecords: 1,
    newWorks: 26,
    controlledWorks: 26,
    rootEditionBoundaryGroups: 1,
    editionOrRecensionGroups: 1,
    sameNumberBoundaryGroups: 1,
    layeredAttributionGroups: 2,
    scopeBoundaryGroups: 6,
    continuationBoundaryGroups: 1,
    sourceReuseBoundaryGroups: 2,
    relatedDistinctWorkGroups: 9,
  });

  const sitemap = await readSitemaps(request);
  const t50Slugs = Array.from({ length: 26 }, (_, index) => 2040 + index).flatMap((id) =>
    id === 2047 ? ["taisho-t2047a", "taisho-t2047b"] : [`taisho-t${id}`]);
  expect(t50Slugs).toHaveLength(27);
  for (const slug of t50Slugs) expect(sitemap).toContain(`/jingzang/${slug}/`);
});

test("汉译 T51 三十六份求法传、灯录、游记与方志完整受控且保留责任和续修边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t2068/001-0048b");
  await expect(page.getByRole("heading", { level: 1, name: "法華傳記" })).toBeVisible();
  await expect(page.getByText(/唐 · 僧詳撰/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t2070/001-0104a");
  await expect(page.getByRole("heading", { level: 1, name: "往生西方淨土瑞應傳" })).toBeVisible();
  await expect(page.getByText("传统责任题记未署名").first()).toBeVisible();

  await page.goto("/jingzang/taisho-t2087/001-0867b");
  await expect(page.getByRole("heading", { level: 1, name: "大唐西域記" })).toBeVisible();
  await expect(page.getByText(/唐 · 玄奘譯．辯機撰/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t2090/001-0996a");
  await expect(page.getByRole("heading", { level: 1, name: "釋迦牟尼如來像法滅盡之記" })).toBeVisible();
  await expect(page.getByText(/唐 · 法成譯/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t2098/001-1092c");
  await expect(page.getByRole("heading", { level: 1, name: "古清涼傳" })).toBeVisible();
  await page.goto("/jingzang/taisho-t2100/001-1127a");
  await expect(page.getByRole("heading", { level: 1, name: "續清涼傳" })).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t2066/001-0001a", "/jingzang/taisho-t2066/002-0012b",
    "/jingzang/taisho-t2067/001-0012b", "/jingzang/taisho-t2067/010-0048b",
    "/jingzang/taisho-t2068/001-0048b", "/jingzang/taisho-t2068/010-0097a",
    "/jingzang/taisho-t2069/001-0097a", "/jingzang/taisho-t2069/001-0103c",
    "/jingzang/taisho-t2070/001-0104a", "/jingzang/taisho-t2070/001-0108b",
    "/jingzang/taisho-t2071/001-0108b", "/jingzang/taisho-t2071/003-0126b",
    "/jingzang/taisho-t2072/001-0126b", "/jingzang/taisho-t2072/003-0153a",
    "/jingzang/taisho-t2073/001-0153a", "/jingzang/taisho-t2073/005-0173a",
    "/jingzang/taisho-t2074/001-0173b", "/jingzang/taisho-t2074/001-0178b",
    "/jingzang/taisho-t2075/001-0179a", "/jingzang/taisho-t2075/001-0196b",
    "/jingzang/taisho-t2076/001-0196b", "/jingzang/taisho-t2076/030-0467a",
    "/jingzang/taisho-t2077/001-0469a", "/jingzang/taisho-t2077/036-0714c",
    "/jingzang/taisho-t2078/001-0715a", "/jingzang/taisho-t2078/009-0768c",
    "/jingzang/taisho-t2079/001-0768c", "/jingzang/taisho-t2079/001-0773b",
    "/jingzang/taisho-t2080/001-0773c", "/jingzang/taisho-t2080/002-0783c",
    "/jingzang/taisho-t2081/001-0783c", "/jingzang/taisho-t2081/002-0787b",
    "/jingzang/taisho-t2082/001-0787b", "/jingzang/taisho-t2082/003-0802a",
    "/jingzang/taisho-t2083/001-0802a", "/jingzang/taisho-t2083/002-0826a",
    "/jingzang/taisho-t2084/001-0826a", "/jingzang/taisho-t2084/003-0856c",
    "/jingzang/taisho-t2085/001-0857a", "/jingzang/taisho-t2085/001-0866c",
    "/jingzang/taisho-t2086/001-0866c", "/jingzang/taisho-t2086/001-0867b",
    "/jingzang/taisho-t2087/001-0867b", "/jingzang/taisho-t2087/012-0947c",
    "/jingzang/taisho-t2088/001-0948a", "/jingzang/taisho-t2088/002-0975a",
    "/jingzang/taisho-t2089/001-0975a", "/jingzang/taisho-t2089/001-0995c",
    "/jingzang/taisho-t2090/001-0996a", "/jingzang/taisho-t2090/001-0997b",
    "/jingzang/taisho-t2091/001-0997c", "/jingzang/taisho-t2091/001-0998b",
    "/jingzang/taisho-t2092/001-0999a", "/jingzang/taisho-t2092/005-1022b",
    "/jingzang/taisho-t2093/001-1022b", "/jingzang/taisho-t2093/001-1024a",
    "/jingzang/taisho-t2094/001-1024a", "/jingzang/taisho-t2094/001-1024b",
    "/jingzang/taisho-t2095/001-1024c", "/jingzang/taisho-t2095/005-1052a",
    "/jingzang/taisho-t2096/001-1052a", "/jingzang/taisho-t2096/001-1055c",
    "/jingzang/taisho-t2097/001-1055c", "/jingzang/taisho-t2097/003-1092b",
    "/jingzang/taisho-t2098/001-1092c", "/jingzang/taisho-t2098/002-1100c",
    "/jingzang/taisho-t2099/001-1101a", "/jingzang/taisho-t2099/003-1127a",
    "/jingzang/taisho-t2100/001-1127a", "/jingzang/taisho-t2100/002-1135a",
    "/jingzang/taisho-t2101/001-1135a", "/jingzang/taisho-t2101/001-1140b",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT51SourceRecords).toMatchObject({
    denominator: 36,
    controlled: 36,
    percentage: 100,
    fullSourceTexts: 36,
    partialSourceWitnesses: 0,
    verifiedEditionWitnesses: 0,
    relationAnnotatedRecords: 36,
    attributionBoundaryRecords: 36,
    unsignedResponsibilityRecords: 5,
    lostTranslatorResponsibilityRecords: 0,
    newWorks: 36,
    controlledWorks: 36,
    layeredAttributionGroups: 2,
    scopeBoundaryGroups: 10,
    continuationBoundaryGroups: 2,
    sourceReuseBoundaryGroups: 5,
    sameAuthorCompanionWorkGroups: 1,
    relatedDistinctWorkGroups: 13,
  });

  const sitemap = await readSitemaps(request);
  const t51Slugs = Array.from({ length: 36 }, (_, index) => `taisho-t${2066 + index}`);
  for (const slug of t51Slugs) expect(sitemap).toContain(`/jingzang/${slug}/`);
});

test("汉译 T52 十九份护法论辩、感通录与表制文书完整受控且保留续编、材料复用和跨卷边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t2102/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "弘明集" })).toBeVisible();
  await expect(page.getByText(/梁 · 僧祐撰/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t2103/001-0097a");
  await expect(page.getByRole("heading", { level: 1, name: "廣弘明集" })).toBeVisible();
  await expect(page.getByText(/唐 · 道宣撰/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t2113/001-0573a");
  await expect(page.getByRole("heading", { level: 1, name: "北山錄" })).toBeVisible();
  await expect(page.getByText(/唐 · 神清撰．慧寶注/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t2119/001-0818a");
  await expect(page.getByRole("heading", { level: 1, name: "寺沙門玄奘上表記" })).toBeVisible();
  await expect(page.getByText("传统责任题记未署名").first()).toBeVisible();

  await page.goto("/jingzang/taisho-t2120/001-0826c");
  await expect(page.getByRole("heading", { level: 1, name: "代宗朝贈司空大辨正廣智三藏和上表制集" })).toBeVisible();
  await expect(page.getByText(/唐 · 圓照集/).first()).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t2102/001-0001a", "/jingzang/taisho-t2102/014-0096b",
    "/jingzang/taisho-t2103/001-0097a", "/jingzang/taisho-t2103/030-0361a",
    "/jingzang/taisho-t2104/001-0363a", "/jingzang/taisho-t2104/004-0397b",
    "/jingzang/taisho-t2105/001-0397b", "/jingzang/taisho-t2105/001-0404a",
    "/jingzang/taisho-t2106/001-0404a", "/jingzang/taisho-t2106/003-0435a",
    "/jingzang/taisho-t2107/001-0435a", "/jingzang/taisho-t2107/001-0442b",
    "/jingzang/taisho-t2108/001-0443a", "/jingzang/taisho-t2108/006-0474c",
    "/jingzang/taisho-t2109/001-0474c", "/jingzang/taisho-t2109/002-0489c",
    "/jingzang/taisho-t2110/001-0489c", "/jingzang/taisho-t2110/008-0550c",
    "/jingzang/taisho-t2111/001-0551a", "/jingzang/taisho-t2111/003-0559b",
    "/jingzang/taisho-t2112/001-0559c", "/jingzang/taisho-t2112/003-0571c",
    "/jingzang/taisho-t2113/001-0573a", "/jingzang/taisho-t2113/010-0636c",
    "/jingzang/taisho-t2114/001-0637a", "/jingzang/taisho-t2114/001-0646c",
    "/jingzang/taisho-t2115/001-0646c", "/jingzang/taisho-t2115/019-0750c",
    "/jingzang/taisho-t2116/001-0751a", "/jingzang/taisho-t2116/005-0781a",
    "/jingzang/taisho-t2117/001-0781a", "/jingzang/taisho-t2117/002-0794b",
    "/jingzang/taisho-t2118/001-0794b", "/jingzang/taisho-t2118/005-0817c",
    "/jingzang/taisho-t2119/001-0818a", "/jingzang/taisho-t2119/001-0826c",
    "/jingzang/taisho-t2120/001-0826c", "/jingzang/taisho-t2120/006-0860c",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT52SourceRecords).toMatchObject({
    denominator: 19,
    controlled: 19,
    percentage: 100,
    fullSourceTexts: 19,
    partialSourceWitnesses: 0,
    verifiedEditionWitnesses: 0,
    relationAnnotatedRecords: 19,
    attributionBoundaryRecords: 19,
    unsignedResponsibilityRecords: 1,
    lostTranslatorResponsibilityRecords: 0,
    newWorks: 19,
    controlledWorks: 19,
    layeredAttributionGroups: 2,
    scopeBoundaryGroups: 2,
    continuationBoundaryGroups: 2,
    sourceReuseBoundaryGroups: 3,
    sameAuthorCompanionWorkGroups: 4,
    crossVolumeRelationGroups: 3,
    relatedDistinctWorkGroups: 12,
  });

  const sitemap = await readSitemaps(request);
  const t52Slugs = Array.from({ length: 19 }, (_, index) => `taisho-t${2102 + index}`);
  for (const slug of t52Slugs) expect(sitemap).toContain(`/jingzang/${slug}/`);
});

test("汉译 T53 两部佛教类书完整受控且保留引文复用与分层责任边界", async ({ page, request }) => {
  await page.goto("/jingzang/taisho-t2121/001-0001a");
  await expect(page.getByRole("heading", { level: 1, name: "經律異相" })).toBeVisible();
  await expect(page.getByText(/梁 · 寶唱等集/).first()).toBeVisible();

  await page.goto("/jingzang/taisho-t2122/001-0269a");
  await expect(page.getByRole("heading", { level: 1, name: "法苑珠林" })).toBeVisible();
  await expect(page.getByText(/唐 · 道世撰/).first()).toBeVisible();

  for (const path of [
    "/jingzang/taisho-t2121/001-0001a",
    "/jingzang/taisho-t2121/050-0268c",
    "/jingzang/taisho-t2122/001-0269a",
    "/jingzang/taisho-t2122/100-1030a",
  ]) expect((await request.get(path)).ok()).toBeTruthy();

  const coverage = await (await request.get("/api/v1/corpus/coverage")).json();
  expect(coverage.candidateInventory.chineseT53SourceRecords).toMatchObject({
    denominator: 2,
    controlled: 2,
    percentage: 100,
    fullSourceTexts: 2,
    partialSourceWitnesses: 0,
    verifiedEditionWitnesses: 0,
    relationAnnotatedRecords: 2,
    attributionBoundaryRecords: 2,
    unsignedResponsibilityRecords: 0,
    lostTranslatorResponsibilityRecords: 0,
    newWorks: 2,
    controlledWorks: 2,
    layeredAttributionGroups: 2,
    scopeBoundaryGroups: 1,
    continuationBoundaryGroups: 0,
    sourceReuseBoundaryGroups: 1,
    sameAuthorCompanionWorkGroups: 0,
    crossVolumeRelationGroups: 0,
    relatedDistinctWorkGroups: 5,
  });

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/taisho-t2121/001-0001a");
  expect(sitemap).toContain("/jingzang/taisho-t2121/050-0268c");
  expect(sitemap).toContain("/jingzang/taisho-t2122/001-0269a");
  expect(sitemap).toContain("/jingzang/taisho-t2122/100-1030a");
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
  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/dhammapada-pali/026-dhp410-423");
});

test("巴利长部三十四经保留 Bilara 原生锚点并受控分页", async ({ page, request }) => {
  await page.goto("/jingzang/digha-nikaya-dn1#dn1:1.1.1");
  await page.waitForURL(/\/jingzang\/digha-nikaya-dn1\/001-dn1-0001-0120#dn1:1\.1\.1$/);
  await expect(page.locator('[id="dn1:1.1.1"]')).toContainText("Evaṁ me sutaṁ");
  await expect(page.getByText(/全经 662 稳定段落/)).toBeVisible();
  await expect(page.getByText("跨传统证据")).toBeVisible();
  await expect(page.getByText("2 条可审计关系")).toBeVisible();
  await expect(page.getByText("梵網六十二見經")).toBeVisible();
  await expect(page.getByText("dn1 ↔ t21")).toBeVisible();
  await expect(page.getByText("不自动合并作品，也不声称当前版页已经逐段或逐句对齐。", { exact: false })).toBeVisible();

  await page.goto("/jingzang/digha-nikaya-dn1#dn1:3.74.7");
  await page.waitForURL(/\/jingzang\/digha-nikaya-dn1\/006-dn1-0601-0662#dn1:3\.74\.7$/);
  await expect(page.locator('[id="dn1:3.74.7"]')).toContainText("Brahmajālasuttaṁ niṭṭhitaṁ");

  const directory = await request.get("/jingzang/digha-nikaya-dn1");
  const finalUnit = await request.get("/jingzang/digha-nikaya-dn1/006-dn1-0601-0662");
  expect(directory.ok()).toBeTruthy();
  expect(finalUnit.ok()).toBeTruthy();
  expect((await directory.body()).byteLength).toBeLessThan(300_000);
  expect((await finalUnit.body()).byteLength).toBeLessThan(300_000);
  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/digha-nikaya-dn34");
});

test("巴利中部一百五十二经保留 Bilara 原生锚点并受控分页", async ({ page, request }) => {
  await page.goto("/jingzang/majjhima-nikaya-mn1#mn1:1.1");
  await page.waitForURL(/\/jingzang\/majjhima-nikaya-mn1\/001-mn1-0001-0120#mn1:1\.1$/);
  await expect(page.locator('[id="mn1:1.1"]')).toContainText("Evaṁ me sutaṁ");
  await expect(page.getByText(/全经 334 稳定段落/)).toBeVisible();
  await expect(page.getByText("3 条可审计关系")).toBeVisible();
  await expect(page.getByText("中阿含經")).toBeVisible();
  await expect(page.getByText("mn1 ↔ ma106")).toBeVisible();
  await expect(page.getByText("近似或部分平行 · 上游附范围备注")).toBeVisible();

  await page.goto("/jingzang/majjhima-nikaya-mn1#mn1:194.10");
  await page.waitForURL(/\/jingzang\/majjhima-nikaya-mn1\/003-mn1-0241-0334#mn1:194\.10$/);
  await expect(page.locator('[id="mn1:194.10"]')).toContainText("Mūlapariyāyasuttaṁ niṭṭhitaṁ");

  const directory = await request.get("/jingzang/majjhima-nikaya-mn1");
  const finalUnit = await request.get("/jingzang/majjhima-nikaya-mn1/003-mn1-0241-0334");
  expect(directory.ok()).toBeTruthy();
  expect(finalUnit.ok()).toBeTruthy();
  expect((await directory.body()).byteLength).toBeLessThan(300_000);
  expect((await finalUnit.body()).byteLength).toBeLessThan(300_000);
  const sitemap = await readSitemaps(request);
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
  const sitemap = await readSitemaps(request);
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
  const sitemap = await readSitemaps(request);
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
  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/khuddaka-nikaya-snp");
  expect(sitemap).toContain("/jingzang/khuddaka-nikaya-thig");
});

test("梵文与俗语原典保留稳定锚点并安全显示编辑标记", async ({ page, request }) => {
  await page.goto("/jingzang/sanskrit-mahavadanasutra/001-sf36-0001-0120#sf36:1.1");
  await expect(page.locator('[id="sf36:1.1"]')).toContainText("evaṃ mayā [ś]r[utam]");
  await expect(page.getByRole("link", { name: "Mahāvadānasūtra", exact: true })).toBeVisible();

  await page.goto("/jingzang/sanskrit-candrasutra/001-sf276-0001-0025#sf276:1.2");
  await expect(page.locator('[id="sf276:1.2"]')).toContainText("ekasama[yaṃ bhagavāñ]");

  await page.goto("/jingzang/patna-dharmapada/001-pdhp1-13-0001-0034#pdhp1:1");
  await expect(page.locator('[id="pdhp1:1"]')).toContainText("manopūrvvaṁgamā dhammā");
  await expect(page.getByRole("article").getByText(
    "第 1 阅读页 · PDHP1-13 · 1. Jama",
    { exact: true },
  ).first()).toBeVisible();

  await page.goto("/jingzang/patna-dharmapada/022-pdhp398-414-0001-0040#pdhp398:1");
  await expect(page.locator('[id="pdhp398:1"]')).toContainText("yo nā ’jjhagamī bhavesu sāraṁ");
  await expect(page.getByRole("article").getByText(
    "第 22 阅读页 · PDHP398-414 · 22. ⟨Uraga?⟩",
    { exact: true },
  ).first()).toBeVisible();
  await expect(page.locator("body")).not.toContainText("<unclear>");

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/sanskrit-mahavadanasutra/008-sf36-0842-0943");
  expect(sitemap).toContain("/jingzang/sanskrit-candrasutra/001-sf276-0001-0025");
  expect(sitemap).toContain("/jingzang/patna-dharmapada/022-pdhp398-414-0001-0040");
});

test("巴利律藏六个书级表达按正典次序阅读并保留原生锚点", async ({ page, request }) => {
  await page.goto("/jingzang/pali-bhikkhu-patimokkha#pli-tv-bu-pm:0.1");
  await page.waitForURL(/\/jingzang\/pali-bhikkhu-patimokkha\/001-pli-tv-bu-pm-0001-0120#pli-tv-bu-pm:0\.1$/);
  await expect(page.locator('[id="pli-tv-bu-pm:0.1"]')).toContainText("Dvemātikāpāḷi");
  await expect(page.getByText(/全书 754 稳定段落/)).toBeVisible();

  await page.goto("/jingzang/pali-vinaya-khandhaka#pli-tv-kd1:0.1");
  await page.waitForURL(/\/jingzang\/pali-vinaya-khandhaka\/001-pli-tv-kd1-0001-0120#pli-tv-kd1:0\.1$/);
  await expect(page.locator('[id="pli-tv-kd1:0.1"]')).toContainText("Theravāda Vinayapiṭaka");
  await expect(page.getByText(/全书 29212 稳定段落/)).toBeVisible();

  await page.goto("/jingzang/pali-vinaya-parivara#pli-tv-pvr21:87.6");
  await page.waitForURL(/\/jingzang\/pali-vinaya-parivara\/138-pli-tv-pvr21-0241-0352#pli-tv-pvr21:87\.6$/);
  await expect(page.locator('[id="pli-tv-pvr21:87.6"]')).toContainText("parivārena sobhatīti");

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/pali-bhikkhu-patimokkha");
  expect(sitemap).toContain("/jingzang/pali-vinaya-khandhaka");
  expect(sitemap).toContain("/jingzang/pali-vinaya-parivara");
});

test("巴利论藏七论按书级边界阅读并保留首尾原生锚点", async ({ page, request }) => {
  await page.goto("/jingzang/pali-dhammasangani#ds1.1:0.1");
  await page.waitForURL(/\/jingzang\/pali-dhammasangani\/001-ds1-1-0001-0092#ds1\.1:0\.1$/);
  await expect(page.locator('[id="ds1.1:0.1"]')).toContainText("Dhammasaṅgaṇī");
  await expect(page.getByText(/全书 7777 稳定段落/)).toBeVisible();
  await expect(page.getByText(/不据此标作佛陀逐字亲说/)).toBeVisible();

  await page.goto("/jingzang/pali-patthana#patthana24.22:23.1");
  await page.waitForURL(/\/jingzang\/pali-patthana\/892-patthana24-22-0001-0034#patthana24\.22:23\.1$/);
  await expect(page.locator('[id="patthana24.22:23.1"]')).toBeVisible();

  const sitemap = await readSitemaps(request);
  expect(sitemap).toContain("/jingzang/pali-dhammasangani/001-ds1-1-0001-0092");
  expect(sitemap).toContain("/jingzang/pali-patthana/892-patthana24-22-0001-0034");
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
