import { readFile } from "node:fs/promises";

const workflowPath = ".github/workflows/geo-auto-submit.yml";
const workflow = await readFile(workflowPath, "utf8");
const failures = [];

function requirePattern(description, pattern) {
  if (!pattern.test(workflow)) failures.push(description);
}

if (/pull_request_target:/.test(workflow)) failures.push("IndexNow workflow 禁止使用 pull_request_target");

requirePattern("IndexNow workflow 根权限必须只读", /permissions:\n\s+contents: read/);

const actions = [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s*#.*)?$/gm)].map(([, action]) => action);
for (const action of actions) {
  const revision = action.slice(action.lastIndexOf("@") + 1);
  if (!/^[a-f0-9]{40}$/.test(revision)) failures.push(`IndexNow workflow Action 未固定到完整 SHA：${action}`);
}

requirePattern("workflow_dispatch 必须保留 urls 手动输入", /workflow_dispatch:\n\s+inputs:\n\s+urls:/);
requirePattern("IndexNow workflow 必须 checkout 当前部署提交", /ref:\s*\$\{\{\s*github\.sha\s*\}\}/);
requirePattern("IndexNow workflow 必须 fetch 至少两个提交用于 diff", /fetch-depth:\s*2/);
requirePattern("IndexNow workflow 必须传递手动 URLs 输入", /INDEXNOW_URLS_INPUT:\s*\$\{\{\s*github\.event\.inputs\.urls\s*\}\}/);
requirePattern("IndexNow workflow 必须通过脚本生成提交批次", /node scripts\/build-indexnow-submission\.mjs > urls\.json/);
requirePattern("IndexNow workflow 必须对缺失密钥失败", /INDEXNOW_KEY secret is missing/);
requirePattern("IndexNow workflow 必须将 200 与 202 视为成功", /case "\$HTTP_CODE" in[\s\S]*200\|202\)/);
requirePattern("IndexNow workflow 必须复用同一份 urls.json 进行 Wayback 保存", /jq -r '\.\[\]' urls\.json/);

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log("✓ SEO 运维工作流保持只读默认、固定 Action、显式传参与可失败的 IndexNow 提交");
}
