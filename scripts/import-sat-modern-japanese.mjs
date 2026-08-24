import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const root = process.cwd();
const catalog = JSON.parse(await readFile(resolve(root, "data/corpus/sat/modern-japanese-catalog-v1.0.0.json"), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const execFileAsync = promisify(execFile);

for (const file of catalog.files) {
  const { stdout: upstream } = await execFileAsync(
    "curl",
    ["-fsSL", "--retry", "3", "--connect-timeout", "15", "--max-time", "90", file.upstreamUrl],
    { encoding: null, maxBuffer: 2 * 1024 * 1024 },
  );
  if (upstream.length !== file.upstreamBytes) throw new Error(`${file.id} 上游字节数漂移`);
  if (sha256(upstream) !== file.upstreamSha256) throw new Error(`${file.id} 上游 SHA-256 漂移`);
  const text = upstream.toString("utf8");
  if (!text.includes("creativecommons.org/licenses/by/4.0/")) throw new Error(`${file.id} 缺少 CC BY 4.0`);
  if (!text.includes("SAT大蔵経テキストデータベース研究会")) throw new Error(`${file.id} 缺少 SAT 署名`);
  const normalized = Buffer.concat([upstream, Buffer.from("\n")]);
  if (normalized.length !== file.localBytes) throw new Error(`${file.id} 本地字节数不匹配`);
  if (sha256(normalized) !== file.localSha256) throw new Error(`${file.id} 本地 SHA-256 不匹配`);
  const destination = resolve(root, file.localPath);
  await mkdir(dirname(destination), { recursive: true });
  try {
    const existing = await readFile(destination);
    if (!existing.equals(normalized)) throw new Error(`${file.localPath} 已存在但内容不同，拒绝覆盖`);
    console.log(`${file.id} 已是经核验的固定版本，无需重复导入。`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await writeFile(destination, normalized, { flag: "wx" });
    console.log(`${file.id} 已导入 ${file.localPath}（${normalized.length} 字节）。`);
  }
}
