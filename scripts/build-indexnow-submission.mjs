import { execFileSync } from "node:child_process";

const baseUrl = new URL(process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.foxue.ai");
const canonicalHost = baseUrl.host;
const manualInput = process.env.INDEXNOW_URLS_INPUT ?? "";
const targetShaInput = process.env.INDEXNOW_TARGET_SHA?.trim() || "HEAD";
const baseShaInput = process.env.INDEXNOW_BASE_SHA?.trim() || "";

const platformCluster = [
  "/",
  "/wenjing",
  "/gainian",
  "/gainian/kong",
  "/gainian/wuchang",
  "/gainian/wuwo",
  "/gainian/wuzhu",
  "/gainian/guanxin",
  "/jingzang",
  "/fugai",
  "/fenmu",
  "/shenjiao",
  "/touming",
  "/yuanze",
  "/llms.txt",
  "/llms-full.txt",
  "/ai.txt",
  "/robots.txt",
  "/sitemap-index.xml",
];

const catalogCluster = [
  "/jingzang",
  "/fugai",
  "/fenmu",
  "/shenjiao",
  "/touming",
  "/llms-full.txt",
  "/sitemap-index.xml",
];

const metadataCluster = [
  "/",
  "/wenjing",
  "/gainian",
  "/gainian/kong",
  "/gainian/wuchang",
  "/gainian/wuwo",
  "/gainian/wuzhu",
  "/gainian/guanxin",
  "/jingzang",
  "/fugai",
  "/fenmu",
  "/shenjiao",
  "/touming",
  "/yuanze",
  "/llms.txt",
  "/llms-full.txt",
];

function absoluteUrl(path) {
  return new URL(path, baseUrl).href;
}

function addUnique(target, values) {
  for (const value of values) {
    if (!target.includes(value)) target.push(value);
  }
}

function normalizeUrl(value) {
  const candidate = value.trim();
  if (!candidate) return null;
  if (candidate.startsWith("/")) return absoluteUrl(candidate);

  const parsed = new URL(candidate);
  if (parsed.hostname !== canonicalHost && !(parsed.hostname === "foxue.ai" && canonicalHost === "www.foxue.ai")) {
    throw new Error(`手动 URL 必须属于 ${canonicalHost}：${candidate}`);
  }
  return new URL(`${parsed.pathname}${parsed.search}`, baseUrl).href;
}

function parseManualUrls(input) {
  const urls = [];
  for (const line of input.split(/\r?\n/)) {
    const normalized = normalizeUrl(line);
    if (normalized) addUnique(urls, [normalized]);
  }
  return urls;
}

function runGit(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function resolveTargetSha() {
  return runGit(["rev-parse", targetShaInput]);
}

function resolveBaseSha(targetSha) {
  if (baseShaInput) return runGit(["rev-parse", baseShaInput]);
  try {
    return runGit(["rev-parse", `${targetSha}^`]);
  } catch {
    return "";
  }
}

function loadChangedFiles(targetSha, baseSha) {
  const command = baseSha
    ? ["diff", "--name-only", baseSha, targetSha]
    : ["diff-tree", "--no-commit-id", "--name-only", "-r", targetSha];
  const output = runGit(command);
  return output ? output.split("\n").map((line) => line.trim()).filter(Boolean) : [];
}

function deriveStaticPagePath(file) {
  if (!file.startsWith("src/app/") || !file.endsWith("/page.tsx")) return null;
  const relative = file.slice("src/app/".length, -"/page.tsx".length);
  if (!relative || relative.includes("[") || relative.includes("]")) return null;
  return `/${relative}`;
}

function deriveStaticRoutePath(file) {
  if (!file.startsWith("src/app/") || !file.endsWith("/route.ts")) return null;
  const relative = file.slice("src/app/".length, -"/route.ts".length);
  if (!relative || relative.includes("[") || relative.includes("]")) return null;
  return `/${relative}`;
}

function urlsForChangedFile(file) {
  const urls = [];

  if (
    file === "src/app/layout.tsx" ||
    file === "src/app/page.tsx" ||
    file === "src/app/opengraph-image.tsx" ||
    file === "src/app/manifest.ts" ||
    file === "src/lib/site-metadata.ts"
  ) {
    addUnique(urls, metadataCluster.map(absoluteUrl));
  }

  if (file === "src/app/robots.ts") {
    addUnique(urls, [absoluteUrl("/robots.txt"), absoluteUrl("/sitemap-index.xml")]);
  }

  if (
    file === "src/lib/llms.ts" ||
    file === "src/app/llms.txt/route.ts" ||
    file === "src/app/llms-full.txt/route.ts" ||
    file === "src/app/ai.txt/route.ts" ||
    file === "public/llms.txt" ||
    file === "public/llms-full.txt"
  ) {
    addUnique(urls, [absoluteUrl("/llms.txt"), absoluteUrl("/llms-full.txt"), absoluteUrl("/sitemap-index.xml")]);
  }

  if (file === "public/ai.txt" || file === "src/app/ai.txt/route.ts" || file === "src/lib/ai-policy.ts") {
    addUnique(urls, [absoluteUrl("/ai.txt")]);
  }

  if (
    file === ".github/workflows/google-integrations.yml" ||
    file === "scripts/verify-google-integrations.mjs"
  ) {
    addUnique(urls, platformCluster.map(absoluteUrl));
  }

  if (
    file.startsWith("src/app/jingzang/") ||
    file.startsWith("src/app/corpus-runtime/") ||
    file.startsWith("src/data/corpus-runtime-") ||
    file.startsWith("src/data/corpus-folio-index") ||
    file.startsWith("src/data/corpus-work-ledger") ||
    file.startsWith("src/data/corpus-work-catalog-") ||
    file.startsWith("src/data/corpus-sitemap-") ||
    file.startsWith("src/lib/sitemap-") ||
    file.startsWith("src/lib/corpus-work-catalog") ||
    file.startsWith("src/data/corpus-folio-locator") ||
    file.startsWith("src/lib/corpus-folio-locator") ||
    file === "src/proxy.ts" ||
    file === "next.config.ts" ||
    file === "src/data/sutras.ts" ||
    file.startsWith("src/lib/corpus-reading") ||
    file.startsWith("src/lib/corpus-folio-index") ||
    file.startsWith("src/lib/corpus-folio-proxy") ||
    file.startsWith("src/lib/corpus-folio-existence") ||
    file.startsWith("src/data/corpus-folio-existence") ||
    file.startsWith("src/lib/reader-routes") ||
    file.startsWith("data/corpus/")
  ) {
    addUnique(urls, catalogCluster.map(absoluteUrl));
  }

  if (file === "src/lib/sitemap-data.ts" || file.startsWith("src/app/sitemap")) {
    addUnique(urls, [absoluteUrl("/sitemap-index.xml"), absoluteUrl("/llms.txt"), absoluteUrl("/llms-full.txt")]);
  }

  if (file === "src/lib/research.ts") {
    addUnique(urls, [absoluteUrl("/wenjing")]);
  }

  if (file.startsWith("src/lib/concepts") || file === "src/lib/concept-hubs.ts" || file === "src/lib/concept-hubs-expanded.ts") {
    addUnique(urls, [
      absoluteUrl("/gainian"),
      absoluteUrl("/gainian/kong"),
      absoluteUrl("/gainian/wuchang"),
      absoluteUrl("/gainian/wuwo"),
      absoluteUrl("/gainian/wuzhu"),
      absoluteUrl("/gainian/guanxin"),
      absoluteUrl("/llms.txt"),
      absoluteUrl("/llms-full.txt"),
      absoluteUrl("/sitemap-index.xml"),
    ]);
  }

  const staticPagePath = deriveStaticPagePath(file);
  if (staticPagePath) addUnique(urls, [absoluteUrl(staticPagePath)]);

  const staticRoutePath = deriveStaticRoutePath(file);
  if (staticRoutePath) addUnique(urls, [absoluteUrl(staticRoutePath)]);

  return urls;
}

function buildAutomaticUrls(changedFiles) {
  const urls = [absoluteUrl("/sitemap-index.xml")];
  for (const file of changedFiles) addUnique(urls, urlsForChangedFile(file));
  return urls;
}

const manualUrls = parseManualUrls(manualInput);
let submissionUrls;

if (manualUrls.length > 0) {
  submissionUrls = manualUrls;
  console.error(`IndexNow manual mode：${submissionUrls.length} 个 URL`);
} else {
  const targetSha = resolveTargetSha();
  const baseSha = resolveBaseSha(targetSha);
  const changedFiles = loadChangedFiles(targetSha, baseSha);
  submissionUrls = buildAutomaticUrls(changedFiles);
  console.error(
    `IndexNow auto mode：${changedFiles.length} 个变更文件，生成 ${submissionUrls.length} 个 URL（target=${targetSha}${baseSha ? `, base=${baseSha}` : ""}）`,
  );
}

if (submissionUrls.length > 10_000) {
  throw new Error(`IndexNow 单次提交最多 10,000 个 URL，当前生成 ${submissionUrls.length} 个`);
}

console.log(JSON.stringify(submissionUrls, null, 2));
