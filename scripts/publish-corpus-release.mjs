import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { loadCorpusReleaseContext } from "./corpus-release-context.mjs";

const root = process.cwd();
const execFileAsync = promisify(execFile);
const { releaseId } = await loadCorpusReleaseContext(root);
const outputRoot = resolve(root, "artifacts", "corpus-release", releaseId);
const uploadPlan = JSON.parse(await readFile(resolve(outputRoot, "upload-plan.json"), "utf8"));
const bucket = process.env.CORPUS_R2_BUCKET ?? uploadPlan.bucket;
const wrangler = resolve(root, "node_modules", ".bin", "wrangler");
const dryRun = process.argv.includes("--dry-run");
const local = process.argv.includes("--local");
const localState = resolve(root, "artifacts", "r2-local");

if (dryRun) {
  console.log(`发布预检：${bucket}，${uploadPlan.entries.length} 个对象，latest 最后更新${local ? "；目标为本地隔离存储" : ""}。`);
  process.exit(0);
}

if (!local) {
  await execFileAsync(wrangler, ["whoami"], { cwd: root, maxBuffer: 2 * 1024 * 1024 });
}

async function upload(entry) {
  const args = [
    "r2", "object", "put", `${bucket}/${entry.key}`,
    "--file", resolve(outputRoot, entry.relativePath),
    "--content-type", entry.contentType,
    "--cache-control", entry.cacheControl,
    local ? "--local" : "--remote",
    "--force",
  ];
  if (local) args.push("--persist-to", localState);
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      await execFileAsync(wrangler, args, { cwd: root, maxBuffer: 4 * 1024 * 1024 });
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

const immutableEntries = uploadPlan.entries.filter((entry) => entry.key !== "v1/latest.json");
for (let offset = 0; offset < immutableEntries.length; offset += 4) {
  const batch = immutableEntries.slice(offset, offset + 4);
  await Promise.all(batch.map(upload));
  console.log(`已发布 ${Math.min(offset + batch.length, immutableEntries.length)}/${immutableEntries.length} 个不可变对象。`);
}

await upload(uploadPlan.entries.find((entry) => entry.key === "v1/latest.json"));
console.log(`${local ? "本地 R2 模拟发布" : "R2 发布"}完成：${releaseId}；latest 指针已最后更新。`);
