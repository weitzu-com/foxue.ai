import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const sources = {
  T0210: {
    url: "https://raw.githubusercontent.com/cbeta-org/xml-p5/2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9/T/T04/T04n0210.xml",
    destination: "data/corpus/cbeta/T04n0210.xml",
    upstreamBytes: 517419,
    upstreamSha256: "89586f1b114e01a78ac9b94714d177ee14c255e84e6b0ce6a88f7cdd25caa9dc",
    localBytes: 517420,
    localSha256: "5f265927bba467f46652c5436e981e52944fd5c8f8609aa55f1027e11c81d035",
  },
};

const id = process.argv[2];
const source = sources[id];
if (!source) {
  console.error(`用法：pnpm import:cbeta ${Object.keys(sources).join("|")}`);
  process.exit(1);
}

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const execFileAsync = promisify(execFile);
const { stdout: upstream } = await execFileAsync(
  "curl",
  ["-fsSL", "--retry", "3", "--connect-timeout", "15", "--max-time", "60", source.url],
  { encoding: null, maxBuffer: 2 * 1024 * 1024 },
);

if (upstream.length !== source.upstreamBytes) throw new Error(`${id} 上游字节数漂移`);
if (sha256(upstream) !== source.upstreamSha256) throw new Error(`${id} 上游 SHA-256 漂移`);

const text = upstream.toString("utf8");
if (
  !text.includes(`<TEI xmlns="http://www.tei-c.org/ns/1.0"`) ||
  !text.includes(`xml:id="T04n0210"`)
) {
  throw new Error(`${id} TEI 标识不匹配`);
}
if (!text.includes("Available for non-commercial use when distributed with this header intact.")) {
  throw new Error(`${id} 缺少非商业使用与保留头部声明`);
}

const normalized = Buffer.concat([upstream, Buffer.from("\n")]);
if (normalized.length !== source.localBytes) throw new Error(`${id} 本地字节数不匹配`);
if (sha256(normalized) !== source.localSha256) throw new Error(`${id} 本地 SHA-256 不匹配`);

const destination = resolve(process.cwd(), source.destination);
await mkdir(dirname(destination), { recursive: true });
try {
  const existing = await readFile(destination);
  if (!existing.equals(normalized)) throw new Error(`${source.destination} 已存在但内容不同，拒绝覆盖`);
  console.log(`${id} 已是经核验的固定版本，无需重复导入。`);
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
  await writeFile(destination, normalized, { flag: "wx" });
  console.log(`${id} 已导入 ${source.destination}（${normalized.length} 字节）。`);
}
