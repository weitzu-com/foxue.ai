import { readFile } from "node:fs/promises";

const workflowPaths = [
  ".github/workflows/cloudflare-r2-release.yml",
  ".github/workflows/preservation-recovery-drill.yml",
  ".github/workflows/cloudflare-edge-deploy.yml",
  ".github/workflows/cloudflare-edge-health.yml",
];
const [r2, recovery, edgeDeploy, edgeHealth] = await Promise.all(
  workflowPaths.map((path) => readFile(path, "utf8")),
);
const failures = [];

function requirePattern(document, description, pattern) {
  if (!pattern.test(document)) failures.push(description);
}

function requireOrder(document, description, fragments) {
  const positions = fragments.map((fragment) => document.indexOf(fragment));
  if (positions.some((position) => position === -1)) {
    failures.push(`${description}（缺少步骤）`);
    return;
  }
  if (!positions.every((position, index) => index === 0 || positions[index - 1] < position)) {
    failures.push(`${description}（顺序错误）`);
  }
}

for (const [path, document] of workflowPaths.map((path, index) => [
  path,
  [r2, recovery, edgeDeploy, edgeHealth][index],
])) {
  if (/pull_request_target:/.test(document)) failures.push(`${path} 禁止使用 pull_request_target`);
  requirePattern(document, `${path} 根权限必须只读`, /permissions:\n\s+contents: read/);
  const actions = [...document.matchAll(/^\s*(?:-\s*)?uses:\s*([^\s#]+)(?:\s*#.*)?$/gm)].map(([, action]) => action);
  if (actions.length === 0) failures.push(`${path} 没有 GitHub Action 引用`);
  for (const action of actions) {
    const revision = action.slice(action.lastIndexOf("@") + 1);
    if (!/^[a-f0-9]{40}$/.test(revision)) failures.push(`${path} Action 未固定到完整 SHA：${action}`);
  }
}

requirePattern(r2, "R2 发布只能由 workflow_dispatch 进入", /publish:\n\s+needs: validate-publisher\n\s+if: github\.event_name == 'workflow_dispatch'/);
requirePattern(r2, "R2 发布缺少精确人工确认", /seed-foxue-ai-corpus/);
for (const secret of [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
]) {
  requirePattern(r2, `R2 发布缺少 ${secret}`, new RegExp(secret));
}
requirePattern(r2, "R2 发布未要求公开 ready", /REQUIRE_READY: "true"/);
requirePattern(r2, "R2 发布未要求穆勒经目可用", /REQUIRE_MULLER_INDEX: "true"/);
requirePattern(r2, "R2 发布未要求 Gemmell《金刚经》可用", /REQUIRE_GEMMELL_INDEX: "true"/);
requireOrder(r2, "R2 发布门禁必须先验证、再上传、再部署、最后公开验证", [
  "run: pnpm verify",
  "--dry-run --plan",
  "node scripts/publish-corpus-release-s3.mjs --plan",
  "wrangler deploy --config infra/corpus-edge/wrangler.jsonc",
  "node scripts/verify-cloudflare-edge.mjs",
]);

requirePattern(recovery, "恢复演练必须按季度运行", /schedule:\n\s+- cron: "17 3 1 \*\/3 \*"/);
requirePattern(
  recovery,
  "恢复任务必须拒绝 pull_request",
  /recover:\n\s+needs: validate-verifier\n\s+if: github\.event_name != 'pull_request' && github\.repository == 'weitzu-com\/foxue\.ai'/,
);
if (/permissions:\n\s+contents: write/.test(recovery)) failures.push("恢复演练不得拥有 contents: write");
requireOrder(recovery, "恢复演练必须先验证证明，再执行从零恢复", [
  "gh release verify \"$RELEASE_TAG\"",
  "gh release verify-asset",
  "node scripts/verify-preservation-recovery.mjs",
]);
requirePattern(recovery, "恢复演练必须保存报告", /RECOVERY-DRILL-REPORT\.json/);

requirePattern(
  edgeDeploy,
  "Worker 独立部署只能由 workflow_dispatch 进入",
  /on:\n  workflow_dispatch:/,
);
requirePattern(edgeDeploy, "Worker 独立部署缺少精确人工确认", /deploy-foxue-corpus-edge/);
for (const secret of ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN"]) {
  requirePattern(edgeDeploy, `Worker 独立部署缺少 ${secret}`, new RegExp(secret));
}
if (/R2_(?:ACCESS_KEY_ID|SECRET_ACCESS_KEY)/.test(edgeDeploy)) {
  failures.push("Worker 独立部署不得读取 R2 上传凭据");
}
requirePattern(
  edgeDeploy,
  "Worker 独立部署必须与 R2 发布共享并发锁",
  /group: cloudflare-r2-corpus-release/,
);
requirePattern(edgeDeploy, "Worker 独立部署未要求公开 ready", /REQUIRE_READY: "true"/);
requirePattern(edgeDeploy, "Worker 独立部署未要求穆勒经目可用", /REQUIRE_MULLER_INDEX: "true"/);
requirePattern(edgeDeploy, "Worker 独立部署未要求 Gemmell《金刚经》可用", /REQUIRE_GEMMELL_INDEX: "true"/);
requireOrder(edgeDeploy, "Worker 独立部署必须先验证、读取原子指针、部署、再公开验证", [
  "pnpm cloudflare:types:check && pnpm cloudflare:check",
  "https://canon.foxue.ai/v1/latest.json",
  "wrangler deploy --config infra/corpus-edge/wrangler.jsonc",
  "node scripts/verify-cloudflare-edge.mjs",
]);

requirePattern(edgeHealth, "Worker 健康检查必须每日运行", /schedule:\n\s+- cron: "41 2 \* \* \*"/);
requirePattern(edgeHealth, "Worker 健康检查未要求公开 ready", /REQUIRE_READY: "true"/);
requirePattern(edgeHealth, "Worker 健康检查未按发行能力要求穆勒经目", /REQUIRE_MULLER_INDEX: "true"/);
requirePattern(edgeHealth, "Worker 健康检查未按发行能力要求 Gemmell《金刚经》", /REQUIRE_GEMMELL_INDEX: "true"/);
requirePattern(
  edgeHealth,
  "Worker 健康检查缺少公开验证",
  /node scripts\/verify-cloudflare-edge\.mjs https:\/\/canon\.foxue\.ai/,
);

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log("✓ 长期运维工作流保持只读默认、固定 Action、隔离 PR 与有序生产门禁");
}
