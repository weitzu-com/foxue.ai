import { readFile } from "node:fs/promises";

const failures = [];

function requirePattern(workflow, description, pattern) {
  if (!pattern.test(workflow)) failures.push(description);
}

function requirePinnedActions(workflow, label) {
  const actions = [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s*#.*)?$/gm)].map(([, action]) => action);
  for (const action of actions) {
    const revision = action.slice(action.lastIndexOf("@") + 1);
    if (!/^[a-f0-9]{40}$/.test(revision)) failures.push(`${label} Action 未固定到完整 SHA：${action}`);
  }
}

const indexNowWorkflowPath = ".github/workflows/geo-auto-submit.yml";
const indexNowWorkflow = await readFile(indexNowWorkflowPath, "utf8");

if (/pull_request_target:/.test(indexNowWorkflow)) failures.push("IndexNow workflow 禁止使用 pull_request_target");
requirePattern(indexNowWorkflow, "IndexNow workflow 根权限必须只读", /permissions:\n\s+contents: read/);
requirePinnedActions(indexNowWorkflow, "IndexNow workflow");
requirePattern(indexNowWorkflow, "workflow_dispatch 必须保留 urls 手动输入", /workflow_dispatch:\n\s+inputs:\n\s+urls:/);
requirePattern(indexNowWorkflow, "IndexNow workflow 必须 checkout 当前部署提交", /ref:\s*\$\{\{\s*github\.event_name == 'deployment_status' && github\.event\.deployment\.sha \|\| github\.sha\s*\}\}/);
requirePattern(indexNowWorkflow, "IndexNow workflow 必须 fetch 至少两个提交用于 diff", /fetch-depth:\s*2/);
requirePattern(indexNowWorkflow, "IndexNow workflow 必须传递手动 URLs 输入", /INDEXNOW_URLS_INPUT:\s*\$\{\{\s*github\.event\.inputs\.urls\s*\}\}/);
requirePattern(indexNowWorkflow, "IndexNow workflow 必须把部署 SHA 传给批次生成脚本", /INDEXNOW_TARGET_SHA:\s*\$\{\{\s*github\.event_name == 'deployment_status' && github\.event\.deployment\.sha \|\| github\.sha\s*\}\}/);
requirePattern(indexNowWorkflow, "IndexNow workflow 必须通过脚本生成提交批次", /node scripts\/build-indexnow-submission\.mjs > urls\.json/);
requirePattern(indexNowWorkflow, "IndexNow workflow 必须对缺失密钥失败", /INDEXNOW_KEY secret is missing/);
requirePattern(indexNowWorkflow, "IndexNow workflow 必须将 200 与 202 视为成功", /case "\$HTTP_CODE" in[\s\S]*200\|202\)/);
requirePattern(indexNowWorkflow, "IndexNow workflow 必须复用同一份 urls.json 进行 Wayback 保存", /jq -r '\.\[\]' urls\.json/);

const googleWorkflowPath = ".github/workflows/google-integrations.yml";
const googleWorkflow = await readFile(googleWorkflowPath, "utf8");
const nextConfig = await readFile("next.config.ts", "utf8");
const googleVerifier = await readFile("scripts/verify-google-integrations.mjs", "utf8");
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const corpusRuntimeRouting = JSON.parse(
  await readFile("src/data/corpus-runtime-routing.generated.json", "utf8"),
);
const corpusRuntimeTracing = JSON.parse(
  await readFile("src/data/corpus-runtime-tracing.generated.json", "utf8"),
);

if (/pull_request_target:/.test(googleWorkflow)) failures.push("Google integrations workflow 禁止使用 pull_request_target");
requirePattern(googleWorkflow, "Google integrations workflow 根权限必须只读", /permissions:\n\s+contents: read/);
requirePinnedActions(googleWorkflow, "Google integrations workflow");
requirePattern(googleWorkflow, "Google integrations workflow 必须保留 deployment_status 触发", /on:\n\s+deployment_status:/);
requirePattern(googleWorkflow, "Google integrations workflow 必须保留 workflow_dispatch 触发", /workflow_dispatch:/);
requirePattern(googleWorkflow, "Google integrations workflow 必须保留 schedule 触发", /schedule:\n\s+- cron:/);
requirePattern(googleWorkflow, "Google integrations workflow 必须受开关变量控制", /vars\.GOOGLE_INTEGRATIONS_ENABLED == 'true'/);
requirePattern(googleWorkflow, "Google integrations workflow 必须在部署成功后触发", /github\.event\.deployment_status\.state == 'success'/);
requirePattern(
  googleWorkflow,
  "Google integrations workflow 只应在生产域名或生产环境部署成功后自动验收",
  /startsWith\(github\.event\.deployment_status\.environment_url, 'https:\/\/www\.foxue\.ai'\)[\s\S]*github\.event\.deployment\.environment == 'production'[\s\S]*github\.event\.deployment\.environment == 'Production'/,
);
requirePattern(googleWorkflow, "Google integrations workflow 必须 checkout 当前待验收提交", /ref:\s*\$\{\{\s*github\.event_name == 'deployment_status' && github\.event\.deployment\.sha \|\| github\.sha\s*\}\}/);
requirePattern(googleWorkflow, "Google integrations workflow 必须写入 step summary", /GITHUB_STEP_SUMMARY/);
requirePattern(googleWorkflow, "Google integrations workflow 必须校验正式域名", /node scripts\/verify-google-integrations\.mjs https:\/\/www\.foxue\.ai/);
requirePattern(googleWorkflow, "Google integrations workflow 必须传递 GA4 衡量 ID", /EXPECTED_GA4_MEASUREMENT_ID:\s*G-3MWMWV1MQC/);
requirePattern(googleWorkflow, "Google integrations workflow 必须在 deployment_status 验收时传递期望 source commit SHA", /EXPECTED_SOURCE_COMMIT_SHA:\s*\$\{\{\s*github\.event_name == 'deployment_status' && github\.event\.deployment\.sha \|\| ''\s*\}\}/);
requirePattern(googleWorkflow, "Google integrations workflow 必须在 deployment_status 验收时传递期望 source commit ref", /EXPECTED_SOURCE_COMMIT_REF:\s*\$\{\{\s*github\.event_name == 'deployment_status' && github\.event\.deployment\.ref \|\| ''\s*\}\}/);

if (/["']\.\/data\/corpus\/(?:\*\*|\*)/.test(nextConfig)) {
  failures.push("Next config 禁止把全量 data/corpus 目录打入任意路由 trace");
}
if (/corpusRuntimeRewrites|async rewrites\(|slugToBucket/.test(nextConfig)) {
  failures.push("Next config 禁止展开全量 slug 重写；Vercel 每部署最多 2048 条路由，必须走 Proxy");
}
requirePattern(
  nextConfig,
  "Next config 必须按生成清单为独立运行时路由追踪受控语料桶",
  /corpusRuntimeTracing\.buckets\.map[\s\S]*\/corpus-runtime\/\$\{bucket\.id\}\/\*\*/,
);
requirePattern(
  googleVerifier,
  "Google integrations 必须逐桶抽查生产版页正文",
  /for \(const smoke of corpusRuntimeSmokeRoutes\)[\s\S]*sutra-segment/,
);
const xinjingBucket = corpusRuntimeRouting.slugToBucket.xinjing;
const xinjingTrace = corpusRuntimeTracing.buckets.find((bucket) => bucket.id === xinjingBucket);
if (!xinjingTrace?.paths.includes("data/corpus/cbeta/T08n0251.xml")) {
  failures.push("心经必须由生成的运行时分桶追踪受控语料资产");
}
if (
  packageJson.scripts?.postbuild !==
  "node scripts/verify-corpus-runtime-traces.mjs && node scripts/verify-corpus-folio-runtime-guard.mjs && node scripts/verify-sitemap-runtime-guard.mjs"
) {
  failures.push("生产构建必须在 postbuild 校验分桶 trace，并拒绝目录/sitemap 再打开语料母版或在 sitemap-index 物化全量 URL");
}
if (!/verify:corpus-folio-runtime-guard/.test(JSON.stringify(packageJson.scripts))) {
  failures.push("必须提供版页运行时门禁脚本");
}
if (!/verify:sitemap-runtime-guard/.test(JSON.stringify(packageJson.scripts))) {
  failures.push("必须提供 sitemap 运行时门禁脚本");
}
if (!/verify:corpus-sitemap-ledger/.test(JSON.stringify(packageJson.scripts))) {
  failures.push("必须提供 sitemap 账本校验脚本");
}
if (!/verify:corpus-work-catalog/.test(JSON.stringify(packageJson.scripts))) {
  failures.push("必须提供经目账本校验脚本");
}
if (!/verify:corpus-folio-locator/.test(JSON.stringify(packageJson.scripts))) {
  failures.push("必须提供版页定位账本校验脚本");
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log("✓ SEO 运维工作流保持只读默认、固定 Action，并对 IndexNow 与 Google integrations 发布验收施加门禁");
}
