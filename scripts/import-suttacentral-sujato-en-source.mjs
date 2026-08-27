import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const root = process.cwd();
const batch = JSON.parse(
  await readFile(resolve(root, "data/corpus/suttacentral/sujato-en-batch-v1.0.0.json"), "utf8"),
);
const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
const verifyOnly = process.argv.includes("--verify");
const selected = requested.length === 0 || requested.includes("--all")
  ? batch.files
  : batch.files.filter((file) => requested.includes(file.id));
if (selected.length === 0) {
  console.error("用法：pnpm import:suttacentral:sujato-en --all，或指定 EN-DN1…");
  process.exit(1);
}
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1")
  .update(`blob ${value.length}\0`)
  .update(value)
  .digest("hex");
const execFileAsync = promisify(execFile);

for (const file of selected) {
  const destination = resolve(root, file.localPath);
  try {
    const existing = await readFile(destination);
    const upstream = existing.at(-1) === 10 ? existing.subarray(0, -1) : existing;
    if (
      existing.length !== file.localBytes ||
      sha256(existing) !== file.localSha256 ||
      upstream.length !== file.upstreamBytes ||
      sha256(upstream) !== file.upstreamSha256 ||
      gitBlobSha1(upstream) !== file.upstreamGitBlobSha1
    ) {
      throw new Error(`${file.localPath} 已存在但与固定批次不一致`);
    }
    continue;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    if (verifyOnly) throw new Error(`${file.localPath} 缺失`);
  }

  const url = `https://raw.githubusercontent.com/${batch.source.repository}/${batch.source.commit}/${file.upstreamPath}`;
  const { stdout: upstream } = await execFileAsync(
    "curl",
    ["-fsSL", "--retry", "4", "--retry-all-errors", "--connect-timeout", "15", "--max-time", "120", url],
    { encoding: null, maxBuffer: 2 * 1024 * 1024 },
  );
  if (
    upstream.length !== file.upstreamBytes ||
    sha256(upstream) !== file.upstreamSha256 ||
    gitBlobSha1(upstream) !== file.upstreamGitBlobSha1
  ) {
    throw new Error(`${file.id} 上游固定对象漂移`);
  }
  const normalized = Buffer.concat([upstream, Buffer.from("\n")]);
  if (normalized.length !== file.localBytes || sha256(normalized) !== file.localSha256) {
    throw new Error(`${file.id} 本地规范化哈希不一致`);
  }
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, normalized, { flag: "wx" });
  console.log(`${file.id} 已导入 ${file.localPath}。`);
}
console.log(`Sujato 英译 ${selected.length} 个固定文件已核验。`);
