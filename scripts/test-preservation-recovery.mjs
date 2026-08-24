import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  parseChecksumFile,
  validateArchiveMembers,
  validateManifest,
  verifyPreservationRecovery,
} from "./verify-preservation-recovery.mjs";
import { selectImmutableGbcrRelease } from "./select-preservation-release.mjs";

const digest = "a".repeat(64);
const commit = "b".repeat(40);
const shortCommit = commit.slice(0, 12);
const tag = "gbcr-v6.18.0";

const sums = parseChecksumFile(
  `${digest}  archive.tar.zst\n${digest}  preservation-manifest.json\n`,
  "fixture",
);
assert.equal(sums.length, 2);
assert.throws(() => parseChecksumFile(`${digest}  ../escape\n`, "fixture"), /不安全路径/);
assert.throws(
  () => parseChecksumFile(`${digest}  same\n${digest}  same\n`, "fixture"),
  /重复文件/,
);
assert.throws(() => parseChecksumFile(`${digest.toUpperCase()}  upper\n`, "fixture"), /格式无效/);

const members = validateArchiveMembers(
  [shortCommit, `${shortCommit}/file.txt`, `${shortCommit}/folder`],
  ["d", "-", "d"],
  shortCommit,
  "fixture archive",
);
assert.equal(members.size, 3);
assert.throws(
  () => validateArchiveMembers([shortCommit, `${shortCommit}/../escape`], ["d", "-"], shortCommit),
  /不安全路径/,
);
assert.throws(
  () => validateArchiveMembers([shortCommit, `${shortCommit}/link`], ["d", "l"], shortCommit),
  /链接或特殊文件/,
);
assert.throws(
  () => validateArchiveMembers([shortCommit, shortCommit], ["d", "d"], shortCommit),
  /重复成员/,
);

const manifest = {
  schema: "https://foxue.ai/schemas/preservation-manifest-v0.1",
  service: "foxue.ai",
  commit,
  sourceDateEpoch: 1_700_000_000,
  files: [
    { name: `foxue.ai-${shortCommit}-source.tar`, bytes: 100, sha256: digest },
    { name: `foxue.ai-${shortCommit}-history.bundle`, bytes: 200, sha256: digest },
  ],
  criticalAssets: { "docs/RECOVERY.md": digest },
  recoveryEntryPoint: "docs/RECOVERY.md",
};
assert.deepEqual(validateManifest(manifest, tag), {
  expectedBundle: `foxue.ai-${shortCommit}-history.bundle`,
  expectedSource: `foxue.ai-${shortCommit}-source.tar`,
  shortCommit,
});
assert.throws(
  () => validateManifest({ ...manifest, criticalAssets: { "../escape": digest } }, tag),
  /不安全路径/,
);
assert.throws(() => validateManifest(manifest, "latest"), /标签无效/);

const releases = [
  { tagName: "gbcr-v6.18.0", isDraft: false, isImmutable: true },
  { tagName: "gbcr-v6.21.0", isDraft: true, isImmutable: true },
  { tagName: "gbcr-v7.0.0", isDraft: false, isImmutable: false },
  { tagName: "gbcr-v6.20.0", isDraft: false, isImmutable: true },
  { tagName: "unrelated", isDraft: false, isImmutable: true },
];
assert.equal(selectImmutableGbcrRelease(releases), "gbcr-v6.20.0");
assert.equal(selectImmutableGbcrRelease(releases, "gbcr-v6.18.0"), "gbcr-v6.18.0");
assert.throws(() => selectImmutableGbcrRelease(releases, "gbcr-v7.0.0"), /尚未不可变/);
assert.throws(() => selectImmutableGbcrRelease(releases, "latest"), /标签无效/);

async function sha256File(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function runIntegrationFixture() {
  const root = await mkdtemp(join(tmpdir(), "foxue-preservation-recovery-"));
  try {
    const repository = join(root, "repository");
    const releaseDirectory = join(root, "release");
    const preservation = join(root, "preservation");
    await mkdir(join(repository, "docs"), { recursive: true });
    await mkdir(releaseDirectory, { recursive: true });
    await mkdir(preservation, { recursive: true });
    await writeFile(join(repository, "docs", "RECOVERY.md"), "# Recovery fixture\n", "utf8");
    execFileSync("git", ["init", "-q"], { cwd: repository });
    execFileSync("git", ["config", "user.name", "foxue.ai recovery test"], { cwd: repository });
    execFileSync("git", ["config", "user.email", "recovery-test@foxue.ai"], { cwd: repository });
    execFileSync("git", ["add", "docs/RECOVERY.md"], { cwd: repository });
    execFileSync("git", ["commit", "-q", "-m", "recovery fixture"], { cwd: repository });
    const fixtureCommit = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: repository,
      encoding: "utf8",
    }).trim();
    const fixtureShort = fixtureCommit.slice(0, 12);
    const sourceName = `foxue.ai-${fixtureShort}-source.tar`;
    const bundleName = `foxue.ai-${fixtureShort}-history.bundle`;
    const innerRoot = join(preservation, fixtureShort);
    await mkdir(innerRoot, { recursive: true });
    execFileSync("git", [
      "archive",
      "--format=tar",
      `--prefix=foxue.ai-${fixtureShort}/`,
      `--output=${join(innerRoot, sourceName)}`,
      fixtureCommit,
    ], { cwd: repository });
    execFileSync("git", ["bundle", "create", join(innerRoot, bundleName), "HEAD"], {
      cwd: repository,
    });
    const sourceInfo = await readFile(join(innerRoot, sourceName));
    const bundleInfo = await readFile(join(innerRoot, bundleName));
    const recoveryInfo = await readFile(join(repository, "docs", "RECOVERY.md"));
    const sourceEpoch = Number(execFileSync("git", ["show", "-s", "--format=%ct", fixtureCommit], {
      cwd: repository,
      encoding: "utf8",
    }).trim());
    const fixtureManifest = {
      schema: "https://foxue.ai/schemas/preservation-manifest-v0.1",
      formatVersion: "0.1.0",
      service: "foxue.ai",
      commit: fixtureCommit,
      sourceDateEpoch: sourceEpoch,
      files: [
        { name: sourceName, bytes: sourceInfo.length, sha256: createHash("sha256").update(sourceInfo).digest("hex") },
        { name: bundleName, bytes: bundleInfo.length, sha256: createHash("sha256").update(bundleInfo).digest("hex") },
      ],
      criticalAssets: {
        "docs/RECOVERY.md": createHash("sha256").update(recoveryInfo).digest("hex"),
      },
      recoveryEntryPoint: "docs/RECOVERY.md",
    };
    const manifestPath = join(innerRoot, "preservation-manifest.json");
    await writeFile(manifestPath, `${JSON.stringify(fixtureManifest, null, 2)}\n`, "utf8");
    const innerSums = [
      `${await sha256File(join(innerRoot, sourceName))}  ${sourceName}`,
      `${await sha256File(join(innerRoot, bundleName))}  ${bundleName}`,
      `${await sha256File(manifestPath)}  preservation-manifest.json`,
    ].join("\n");
    await writeFile(join(innerRoot, "SHA256SUMS"), `${innerSums}\n`, "utf8");
    const archiveName = `foxue-ai-preservation-${tag}-${fixtureShort}.tar.zst`;
    const tarPath = join(root, archiveName.slice(0, -4));
    const archivePath = join(releaseDirectory, archiveName);
    execFileSync("tar", ["-cf", tarPath, "-C", preservation, fixtureShort]);
    execFileSync("zstd", ["-q", "-f", "-o", archivePath, tarPath]);
    await copyFile(manifestPath, join(releaseDirectory, "preservation-manifest.json"));
    await copyFile(join(innerRoot, "SHA256SUMS"), join(releaseDirectory, "SHA256SUMS"));
    const releaseSums = [
      `${await sha256File(archivePath)}  ${archiveName}`,
      `${await sha256File(join(releaseDirectory, "preservation-manifest.json"))}  preservation-manifest.json`,
      `${await sha256File(join(releaseDirectory, "SHA256SUMS"))}  SHA256SUMS`,
    ].join("\n");
    await writeFile(join(releaseDirectory, "RELEASE-SHA256SUMS"), `${releaseSums}\n`, "utf8");

    const { report } = await verifyPreservationRecovery({
      releaseDirectory,
      tag,
      workDirectory: join(root, "work"),
    });
    assert.equal(report.passed, true);
    assert.equal(report.commit, fixtureCommit);
    assert.equal(report.criticalAssetsVerified, 1);
    assert.equal(report.gitBundleVerified, true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

if (process.argv.includes("--integration")) {
  await runIntegrationFixture();
  console.log("✓ 合成发行完成下载后全量校验、双层解压、关键资产复算和 Git bundle 恢复");
}

console.log("✓ 恢复校验器拒绝路径穿越、链接、重复项与非法清单");
console.log("✓ 合法的发行校验和、归档成员和保存清单通过");
console.log("✓ 定时任务只选择最高语义版本的公开不可变 GBCR 发行");
