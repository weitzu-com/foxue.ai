import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const root = process.cwd();
const catalog = JSON.parse(
  await readFile(resolve(root, "data/corpus/cbeta/catalog-v2.2.0.json"), "utf8"),
);
const requested = process.argv.slice(2);
const selected = requested.includes("--all")
  ? catalog.files
  : catalog.files.filter((file) => requested.includes(file.id));
if (selected.length === 0 || (!requested.includes("--all") && selected.length !== requested.length)) {
  console.error(`用法：pnpm import:cbeta --all，或指定 ${catalog.files.map((file) => file.id).join("|")}`);
  process.exit(1);
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const gitBlobSha1 = (value) => createHash("sha1")
  .update(`blob ${value.length}\0`)
  .update(value)
  .digest("hex");
const execFileAsync = promisify(execFile);
const selectedSources = selected.flatMap((file) => file.sourceParts ?? [file]);
for (const source of selectedSources) {
  const url = `https://raw.githubusercontent.com/${catalog.source.repository}/${catalog.source.commit}/${source.upstreamPath}`;
  const { stdout: upstream } = await execFileAsync(
    "curl",
    ["-fsSL", "--retry", "3", "--connect-timeout", "15", "--max-time", "90", url],
    { encoding: null, maxBuffer: 16 * 1024 * 1024 },
  );
  if (upstream.length !== source.upstreamBytes) throw new Error(`${source.id} 上游字节数漂移`);
  if (sha256(upstream) !== source.upstreamSha256) throw new Error(`${source.id} 上游 SHA-256 漂移`);
  if (gitBlobSha1(upstream) !== source.upstreamGitBlobSha1) throw new Error(`${source.id} Git blob SHA-1 漂移`);

  const text = upstream.toString("utf8");
  const expectedTeiId = source.upstreamPath.split("/").at(-1).replace(/\.xml$/, "");
  if (!text.includes(`<TEI xmlns="http://www.tei-c.org/ns/1.0"`) || !text.includes(`xml:id="${expectedTeiId}"`)) {
    throw new Error(`${source.id} TEI 标识不匹配`);
  }
  if (!text.includes("Available for non-commercial use when distributed with this header intact.")) {
    throw new Error(`${source.id} 缺少非商业使用与保留头部声明`);
  }

  const normalized = Buffer.concat([upstream, Buffer.from("\n")]);
  if (normalized.length !== source.localBytes) throw new Error(`${source.id} 本地字节数不匹配`);
  if (sha256(normalized) !== source.localSha256) throw new Error(`${source.id} 本地 SHA-256 不匹配`);

  const destination = resolve(root, source.localPath);
  await mkdir(dirname(destination), { recursive: true });
  try {
    const existing = await readFile(destination);
    if (!existing.equals(normalized)) throw new Error(`${source.localPath} 已存在但内容不同，拒绝覆盖`);
    console.log(`${source.id} 已是经核验的固定版本，无需重复导入。`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await writeFile(destination, normalized, { flag: "wx" });
    console.log(`${source.id} 已导入 ${source.localPath}（${normalized.length} 字节）。`);
  }
}
