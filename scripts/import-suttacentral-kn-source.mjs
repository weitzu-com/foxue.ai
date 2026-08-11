import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const root = process.cwd();
const batch = JSON.parse(await readFile(resolve(root, "data/corpus/suttacentral/kn-batch-v1.2.0.json"), "utf8"));
const requested = process.argv.slice(2).map((argument) => argument.toUpperCase());
const selected = requested.includes("--ALL")
  ? batch.files
  : batch.files.filter((file) => requested.includes(file.id) || requested.includes(file.collectionId));
if (selected.length === 0) {
  console.error("用法：pnpm import:suttacentral:kn --all，或指定书级标识（如 SNP、UD）/来源记录（如 SNP1.1）");
  process.exit(1);
}
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");
const execFileAsync = promisify(execFile);
let cursor = 0;
let imported = 0;

async function importNext() {
  while (cursor < selected.length) {
    const index = cursor;
    cursor += 1;
    const file = selected[index];
    const url = `https://raw.githubusercontent.com/${batch.source.repository}/${batch.source.commit}/${file.upstreamPath}`;
    const { stdout: upstream } = await execFileAsync(
      "curl",
      ["-4", "-fsSL", "--retry", "4", "--retry-all-errors", "--connect-timeout", "15", "--max-time", "120", url],
      { encoding: null, maxBuffer: 8 * 1024 * 1024 },
    );
    if (
      upstream.length !== file.upstreamBytes || sha256(upstream) !== file.upstreamSha256 ||
      gitBlobSha1(upstream) !== file.upstreamGitBlobSha1
    ) throw new Error(`${file.id} 上游固定对象漂移`);
    const parsed = JSON.parse(upstream.toString("utf8"));
    if (!(file.firstSegmentId in parsed) || !(file.lastSegmentId in parsed)) {
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
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      await writeFile(destination, normalized, { flag: "wx" });
      imported += 1;
    }
  }
}

await Promise.all(Array.from({ length: Math.min(24, selected.length) }, () => importNext()));
console.log(`《小部》来源核验完成：${selected.length} 个固定记录，新增写入 ${imported} 个。`);
