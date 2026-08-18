import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, isAbsolute, join, posix, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const RELEASE_SUMS = "RELEASE-SHA256SUMS";
const INNER_SUMS = "SHA256SUMS";
const MANIFEST_NAME = "preservation-manifest.json";
const MANIFEST_SCHEMA = "https://foxue.ai/schemas/preservation-manifest-v0.1";
const TAG_PATTERN = /^gbcr-v[0-9]+\.[0-9]+\.[0-9]+$/;
const DIGEST_PATTERN = /^[a-f0-9]{64}$/;

function parseArgument(name) {
  const prefix = `--${name}=`;
  return process.argv.find((argument) => argument.startsWith(prefix))?.slice(prefix.length);
}

function safeRelativeName(name, label, { allowSlash = false } = {}) {
  if (typeof name !== "string" || name.length === 0) throw new Error(`${label} 为空`);
  if (isAbsolute(name) || name.startsWith("/") || /[\\\u0000-\u001f\u007f]/.test(name)) {
    throw new Error(`${label} 包含不安全路径：${JSON.stringify(name)}`);
  }
  const segments = name.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error(`${label} 包含不安全路径：${name}`);
  }
  if (!allowSlash && segments.length !== 1) throw new Error(`${label} 必须是文件名：${name}`);
  if (posix.normalize(name) !== name) throw new Error(`${label} 未规范化：${name}`);
  return name;
}

export function parseChecksumFile(content, label = "checksum file") {
  const lines = content.split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  if (lines.length === 0) throw new Error(`${label} 为空`);
  const entries = [];
  const names = new Set();
  for (const [index, line] of lines.entries()) {
    const match = /^([a-f0-9]{64})  ([^\r\n]+)$/.exec(line);
    if (!match) throw new Error(`${label} 第 ${index + 1} 行格式无效`);
    const [, sha256, name] = match;
    safeRelativeName(name, `${label} 文件名`);
    if (names.has(name)) throw new Error(`${label} 包含重复文件：${name}`);
    names.add(name);
    entries.push({ name, sha256 });
  }
  return entries;
}

export function validateArchiveMembers(names, types, expectedRoot, label = "archive") {
  safeRelativeName(expectedRoot, `${label} 根目录`);
  if (!Array.isArray(names) || names.length === 0) throw new Error(`${label} 没有成员`);
  if (!Array.isArray(types) || types.length !== names.length) {
    throw new Error(`${label} 成员名称与类型数量不一致`);
  }
  const normalized = new Set();
  for (let index = 0; index < names.length; index += 1) {
    const rawName = names[index].endsWith("/") ? names[index].slice(0, -1) : names[index];
    safeRelativeName(rawName, `${label} 成员`, { allowSlash: true });
    if (rawName !== expectedRoot && !rawName.startsWith(`${expectedRoot}/`)) {
      throw new Error(`${label} 成员越出唯一根目录：${rawName}`);
    }
    if (!new Set(["-", "d"]).has(types[index])) {
      throw new Error(`${label} 包含链接或特殊文件：${rawName} (${types[index]})`);
    }
    if (normalized.has(rawName)) throw new Error(`${label} 包含重复成员：${rawName}`);
    normalized.add(rawName);
  }
  return normalized;
}

export function validateManifest(manifest, tag) {
  if (!TAG_PATTERN.test(tag)) throw new Error(`发行标签无效：${tag}`);
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("保存清单不是对象");
  }
  if (manifest.schema !== MANIFEST_SCHEMA) throw new Error(`保存清单 schema 无效：${manifest.schema}`);
  if (manifest.service !== "foxue.ai") throw new Error("保存清单 service 必须是 foxue.ai");
  if (!/^[a-f0-9]{40}$/.test(manifest.commit ?? "")) throw new Error("保存清单 commit 无效");
  if (!Number.isSafeInteger(manifest.sourceDateEpoch) || manifest.sourceDateEpoch <= 0) {
    throw new Error("保存清单 sourceDateEpoch 无效");
  }
  if (!Array.isArray(manifest.files) || manifest.files.length !== 2) {
    throw new Error("保存清单必须且只能列出源码 tar 与 Git bundle");
  }
  const fileNames = new Set();
  for (const file of manifest.files) {
    safeRelativeName(file?.name, "保存清单文件名");
    if (fileNames.has(file.name)) throw new Error(`保存清单包含重复文件：${file.name}`);
    if (!Number.isSafeInteger(file.bytes) || file.bytes < 1) throw new Error(`${file.name} 字节数无效`);
    if (!DIGEST_PATTERN.test(file.sha256 ?? "")) throw new Error(`${file.name} SHA-256 无效`);
    fileNames.add(file.name);
  }
  const shortCommit = manifest.commit.slice(0, 12);
  const expectedSource = `foxue.ai-${shortCommit}-source.tar`;
  const expectedBundle = `foxue.ai-${shortCommit}-history.bundle`;
  if (!fileNames.has(expectedSource) || !fileNames.has(expectedBundle)) {
    throw new Error("保存清单内部文件名与 commit 不一致");
  }
  if (manifest.recoveryEntryPoint !== "docs/RECOVERY.md") {
    throw new Error("保存清单恢复入口无效");
  }
  if (
    !manifest.criticalAssets ||
    typeof manifest.criticalAssets !== "object" ||
    Array.isArray(manifest.criticalAssets) ||
    Object.keys(manifest.criticalAssets).length === 0
  ) {
    throw new Error("保存清单缺少 criticalAssets");
  }
  for (const [path, digest] of Object.entries(manifest.criticalAssets)) {
    safeRelativeName(path, "criticalAssets 路径", { allowSlash: true });
    if (!DIGEST_PATTERN.test(digest)) throw new Error(`criticalAssets SHA-256 无效：${path}`);
  }
  if (!Object.hasOwn(manifest.criticalAssets, manifest.recoveryEntryPoint)) {
    throw new Error("恢复入口未进入 criticalAssets");
  }
  return { expectedBundle, expectedSource, shortCommit };
}

async function hashFile(path) {
  const digest = createHash("sha256");
  let bytes = 0;
  for await (const chunk of createReadStream(path)) {
    bytes += chunk.length;
    digest.update(chunk);
  }
  return { bytes, sha256: digest.digest("hex") };
}

async function ensureRegularFile(path, label) {
  const info = await lstat(path);
  if (!info.isFile()) throw new Error(`${label} 不是普通文件：${path}`);
  return info;
}

async function verifyChecksums(directory, entries, label) {
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (dirname(path) !== resolve(directory)) throw new Error(`${label} 文件越界：${entry.name}`);
    await ensureRegularFile(path, `${label} 对象`);
    const actual = await hashFile(path);
    if (actual.sha256 !== entry.sha256) throw new Error(`${label} SHA-256 不一致：${entry.name}`);
  }
}

function run(command, args, options = {}) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    let stdout = "";
    let stderr = "";
    if (options.capture) {
      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
    }
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) resolveRun({ stdout, stderr });
      else rejectRun(new Error(`${command} ${args.join(" ")} 失败（${code}）：${stderr.slice(-2_000)}`));
    });
  });
}

async function inspectTar(tarPath, expectedRoot, label) {
  const namesResult = await run("tar", ["-tf", tarPath], { capture: true });
  const verboseResult = await run("tar", ["-tvf", tarPath], { capture: true });
  const names = namesResult.stdout.split("\n").filter(Boolean);
  const verboseLines = verboseResult.stdout.split("\n").filter(Boolean);
  const types = verboseLines.map((line) => line[0]);
  return validateArchiveMembers(names, types, expectedRoot, label);
}

async function mapConcurrent(entries, concurrency, mapper) {
  const workers = [];
  let cursor = 0;
  for (let worker = 0; worker < Math.min(concurrency, entries.length); worker += 1) {
    workers.push((async () => {
      while (cursor < entries.length) {
        const index = cursor;
        cursor += 1;
        await mapper(entries[index], index);
      }
    })());
  }
  await Promise.all(workers);
}

async function assertDirectoryWithin(parent, child) {
  const parentReal = await realpath(parent);
  const childReal = await realpath(child);
  const childRelative = relative(parentReal, childReal);
  if (childRelative.startsWith("..") || isAbsolute(childRelative)) {
    throw new Error(`恢复目录越界：${child}`);
  }
}

export async function verifyPreservationRecovery({ releaseDirectory, tag, workDirectory }) {
  const startedAt = Date.now();
  if (!TAG_PATTERN.test(tag)) throw new Error(`发行标签无效：${tag}`);
  const releaseRoot = resolve(releaseDirectory);
  const workRoot = resolve(workDirectory);
  const releaseInfo = await stat(releaseRoot);
  if (!releaseInfo.isDirectory()) throw new Error(`发行目录不存在：${releaseRoot}`);
  await rm(workRoot, { recursive: true, force: true });
  await mkdir(workRoot, { recursive: true });

  const releaseSumsPath = join(releaseRoot, RELEASE_SUMS);
  await ensureRegularFile(releaseSumsPath, RELEASE_SUMS);
  const releaseSums = parseChecksumFile(await readFile(releaseSumsPath, "utf8"), RELEASE_SUMS);
  const expectedFixed = new Set([MANIFEST_NAME, INNER_SUMS]);
  const archives = releaseSums.filter((entry) => entry.name.endsWith(".tar.zst"));
  if (releaseSums.length !== 3 || archives.length !== 1) {
    throw new Error(`${RELEASE_SUMS} 必须列出一个压缩包、${MANIFEST_NAME} 与 ${INNER_SUMS}`);
  }
  for (const name of expectedFixed) {
    if (!releaseSums.some((entry) => entry.name === name)) throw new Error(`${RELEASE_SUMS} 缺少 ${name}`);
  }
  const archive = archives[0];
  await verifyChecksums(releaseRoot, releaseSums, "发行资产");

  const manifestBytes = await readFile(join(releaseRoot, MANIFEST_NAME));
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const { expectedBundle, expectedSource, shortCommit } = validateManifest(manifest, tag);
  const expectedArchive = `foxue-ai-preservation-${tag}-${shortCommit}.tar.zst`;
  if (archive.name !== expectedArchive) throw new Error(`压缩包名称应为 ${expectedArchive}`);

  const compressedPath = join(releaseRoot, archive.name);
  const tarPath = join(workRoot, archive.name.slice(0, -4));
  await run("zstd", ["--test", compressedPath]);
  await run("zstd", ["--decompress", "--force", "-o", tarPath, compressedPath]);
  if (tarPath !== join(workRoot, basename(tarPath))) throw new Error("临时 tar 路径无效");
  await ensureRegularFile(tarPath, "解压后的外层 tar");
  const outerMembers = await inspectTar(tarPath, shortCommit, "外层保存包");

  const extractedRoot = join(workRoot, "preservation");
  await mkdir(extractedRoot, { recursive: true });
  await run("tar", [
    "-xf", tarPath,
    "-C", extractedRoot,
  ]);
  const bundleRoot = join(extractedRoot, shortCommit);
  await assertDirectoryWithin(extractedRoot, bundleRoot);

  const innerManifestPath = join(bundleRoot, MANIFEST_NAME);
  const innerSumsPath = join(bundleRoot, INNER_SUMS);
  await ensureRegularFile(innerManifestPath, "包内保存清单");
  await ensureRegularFile(innerSumsPath, "包内 SHA256SUMS");
  if (!manifestBytes.equals(await readFile(innerManifestPath))) throw new Error("包内外保存清单不一致");
  const outerInnerSums = await readFile(join(releaseRoot, INNER_SUMS));
  if (!outerInnerSums.equals(await readFile(innerSumsPath))) throw new Error("包内外 SHA256SUMS 不一致");
  const innerSums = parseChecksumFile(outerInnerSums.toString("utf8"), INNER_SUMS);
  const expectedInnerNames = new Set([expectedSource, expectedBundle, MANIFEST_NAME]);
  if (innerSums.length !== expectedInnerNames.size) throw new Error(`${INNER_SUMS} 文件数量无效`);
  for (const name of expectedInnerNames) {
    if (!innerSums.some((entry) => entry.name === name)) throw new Error(`${INNER_SUMS} 缺少 ${name}`);
  }
  await verifyChecksums(bundleRoot, innerSums, "包内资产");
  for (const file of manifest.files) {
    const actual = await hashFile(join(bundleRoot, file.name));
    if (actual.bytes !== file.bytes || actual.sha256 !== file.sha256) {
      throw new Error(`保存清单文件记录不一致：${file.name}`);
    }
  }

  const sourceTar = join(bundleRoot, expectedSource);
  const expectedSourceRoot = `foxue.ai-${shortCommit}`;
  const sourceMembers = await inspectTar(sourceTar, expectedSourceRoot, "源码 tar");
  for (const path of Object.keys(manifest.criticalAssets)) {
    if (!sourceMembers.has(`${expectedSourceRoot}/${path}`)) {
      throw new Error(`源码 tar 缺少 criticalAssets：${path}`);
    }
  }
  const sourceExtractRoot = join(workRoot, "source");
  await mkdir(sourceExtractRoot, { recursive: true });
  await run("tar", [
    "-xf", sourceTar,
    "-C", sourceExtractRoot,
  ]);
  const sourceRoot = join(sourceExtractRoot, expectedSourceRoot);
  await assertDirectoryWithin(sourceExtractRoot, sourceRoot);

  const criticalAssets = Object.entries(manifest.criticalAssets);
  await mapConcurrent(criticalAssets, 16, async ([path, expectedDigest]) => {
    const assetPath = resolve(sourceRoot, path);
    const assetRelative = relative(sourceRoot, assetPath);
    if (assetRelative.startsWith("..") || isAbsolute(assetRelative)) throw new Error(`关键资产越界：${path}`);
    await ensureRegularFile(assetPath, "关键资产");
    const actual = await hashFile(assetPath);
    if (actual.sha256 !== expectedDigest) throw new Error(`关键资产 SHA-256 不一致：${path}`);
  });

  const bareRepository = join(workRoot, "recovered.git");
  await run("git", ["init", "--bare", bareRepository]);
  await run("git", ["-C", bareRepository, "bundle", "verify", join(bundleRoot, expectedBundle)]);
  await run("git", [
    "-C", bareRepository,
    "fetch", "--force", join(bundleRoot, expectedBundle),
    "HEAD:refs/heads/recovered",
  ]);
  const recovered = (await run(
    "git",
    ["--git-dir", bareRepository, "rev-parse", "refs/heads/recovered^{commit}"],
    { capture: true },
  )).stdout.trim();
  if (recovered !== manifest.commit) throw new Error(`Git bundle 提交不一致：${recovered}`);
  await run("git", ["--git-dir", bareRepository, "fsck", "--strict", "--full"]);

  const archiveDigest = await hashFile(compressedPath);
  const report = {
    schema: "https://foxue.ai/schemas/preservation-recovery-report-v0.1",
    passed: true,
    tag,
    commit: manifest.commit,
    archive: archive.name,
    archiveBytes: archiveDigest.bytes,
    archiveSha256: archiveDigest.sha256,
    releaseAssetsVerified: releaseSums.length + 1,
    outerArchiveMembers: outerMembers.size,
    sourceArchiveMembers: sourceMembers.size,
    criticalAssetsVerified: criticalAssets.length,
    gitBundleVerified: true,
    verifiedAt: new Date().toISOString(),
    durationSeconds: Math.round((Date.now() - startedAt) / 100) / 10,
  };
  const reportPath = join(releaseRoot, "RECOVERY-DRILL-REPORT.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return { report, reportPath };
}

async function main() {
  const releaseDirectory = parseArgument("release-dir");
  const tag = parseArgument("tag");
  const workDirectory = parseArgument("work-dir");
  if (!releaseDirectory || !tag || !workDirectory) {
    throw new Error("用法：node scripts/verify-preservation-recovery.mjs --release-dir=<目录> --tag=<gbcr-vX.Y.Z> --work-dir=<空目录>");
  }
  const { report, reportPath } = await verifyPreservationRecovery({
    releaseDirectory,
    tag,
    workDirectory,
  });
  console.log(
    `✓ 恢复演练通过：${report.tag} / ${report.commit}；` +
    `${report.criticalAssetsVerified} 个关键资产；报告 ${reportPath}`,
  );
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
