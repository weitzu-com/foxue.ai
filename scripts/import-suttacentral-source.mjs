import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const root = process.cwd();
const batch = JSON.parse(await readFile(resolve(root, "data/corpus/suttacentral/batch-v0.7.0.json"), "utf8"));
const requested = process.argv.slice(2);
if (!requested.includes("--all") && !requested.includes(batch.work.canonId)) {
  console.error(`用法：pnpm import:suttacentral --all，或指定 ${batch.work.canonId}`);
  process.exit(1);
}
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1")
  .update(`blob ${value.length}\0`)
  .update(value)
  .digest("hex");
const execFileAsync = promisify(execFile);

for (const file of batch.files) {
  const url = `https://raw.githubusercontent.com/${batch.source.repository}/${batch.source.commit}/${file.upstreamPath}`;
  const { stdout: upstream } = await execFileAsync(
    "curl",
    ["-fsSL", "--retry", "3", "--connect-timeout", "15", "--max-time", "90", url],
    { encoding: null, maxBuffer: 1024 * 1024 },
  );
  if (
    upstream.length !== file.upstreamBytes ||
    sha256(upstream) !== file.upstreamSha256 ||
    gitBlobSha1(upstream) !== file.upstreamGitBlobSha1
  ) {
    throw new Error(`${file.id} 上游固定对象漂移`);
  }
  const parsed = JSON.parse(upstream.toString("utf8"));
  if (!parsed[file.firstSegmentId] || !parsed[file.lastSegmentId]) {
    throw new Error(`${file.id} 首尾段落标识缺失`);
  }
  const normalized = Buffer.concat([upstream, Buffer.from("\n")]);
  if (normalized.length !== file.localBytes || sha256(normalized) !== file.localSha256) {
    throw new Error(`${file.id} 本地规范化哈希不一致`);
  }
  const destination = resolve(root, file.localPath);
  await mkdir(dirname(destination), { recursive: true });
  try {
    const existing = await readFile(destination);
    if (!existing.equals(normalized)) throw new Error(`${file.localPath} 已存在但内容不同，拒绝覆盖`);
    console.log(`${file.id} 已是经核验的固定版本，无需重复导入。`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await writeFile(destination, normalized, { flag: "wx" });
    console.log(`${file.id} 已导入 ${file.localPath}。`);
  }
}
