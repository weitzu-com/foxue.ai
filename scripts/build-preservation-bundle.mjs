import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const runText = (command, args) =>
  execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
const runBuffer = (command, args) => execFileSync(command, args, { cwd: root });
const sha256 = (content) => createHash("sha256").update(content).digest("hex");

const commit = runText("git", ["rev-parse", "HEAD"]);
const shortCommit = commit.slice(0, 12);
const commitTime = Number(runText("git", ["show", "-s", "--format=%ct", commit]));
const outputDirectory = resolve(root, "artifacts", "preservation", shortCommit);
await mkdir(outputDirectory, { recursive: true });

const sourceArchiveName = `foxue.ai-${shortCommit}-source.tar`;
const gitBundleName = `foxue.ai-${shortCommit}-history.bundle`;
const sourceArchivePath = resolve(outputDirectory, sourceArchiveName);
const gitBundlePath = resolve(outputDirectory, gitBundleName);

execFileSync(
  "git",
  [
    "archive",
    "--format=tar",
    `--prefix=foxue.ai-${shortCommit}/`,
    `--output=${sourceArchivePath}`,
    commit,
  ],
  { cwd: root, stdio: "inherit" },
);
execFileSync("git", ["bundle", "create", gitBundlePath, "HEAD"], {
  cwd: root,
  stdio: "inherit",
});
execFileSync("git", ["bundle", "verify", gitBundlePath], {
  cwd: root,
  stdio: "ignore",
});

const archivedPaths = runBuffer("git", ["ls-tree", "-r", "-z", "--name-only", commit])
  .toString("utf8")
  .split("\0")
  .filter(Boolean);
const requiredPaths = [
  "README.md",
  "LICENSE",
  "package.json",
  "pnpm-lock.yaml",
  "docs/RECOVERY.md",
  "docs/ANALYTICS.md",
  "docs/foxue.ai_建站方案_v1.0_20260811.md",
  "data/gbcr/registry-v0.2.0.json",
  "data/gbcr/source-snapshots-v0.2.0.json",
  "data/gbcr/checksums-v0.2.0.sha256",
  "data/corpus/cbeta/NOTICE.md",
  "data/corpus/cbeta/catalog-v0.2.0.json",
  "data/corpus/cbeta/manifest-v0.2.0.json",
  "data/corpus/cbeta/T04n0210.xml",
  "data/corpus/cbeta/T08n0251.xml",
  "data/corpus/cbeta/T08n0235.xml",
  "data/corpus/cbeta/T09n0262.xml",
  "data/corpus/cbeta/T12n0360.xml",
  "data/corpus/cbeta/T12n0365.xml",
  "data/corpus/cbeta/T12n0366.xml",
  "data/corpus/cbeta/T16n0670.xml",
  "data/corpus/cbeta/T19n0945.xml",
  "scripts/build-corpus-catalog.mjs",
  "scripts/build-corpus-release.mjs",
  "scripts/corpus-release-context.mjs",
  "scripts/publish-corpus-release.mjs",
  "scripts/verify-corpus-release.mjs",
  "infra/corpus-edge/src/index.ts",
  "infra/corpus-edge/wrangler.jsonc",
  "infra/corpus-edge/worker-configuration.d.ts",
];
for (const path of requiredPaths) {
  if (!archivedPaths.includes(path)) throw new Error(`保存包缺少关键文件：${path}`);
}

const criticalAssets = Object.fromEntries(
  requiredPaths.map((path) => [path, sha256(runBuffer("git", ["show", `${commit}:${path}`]))]),
);
const sourceArchive = await readFile(sourceArchivePath);
const gitBundle = await readFile(gitBundlePath);
const sourceArchiveStat = await stat(sourceArchivePath);
const gitBundleStat = await stat(gitBundlePath);

const manifest = {
  schema: "https://foxue.ai/schemas/preservation-manifest-v0.1",
  formatVersion: "0.1.0",
  service: "foxue.ai",
  commit,
  sourceDateEpoch: commitTime,
  createdAt: new Date(commitTime * 1000).toISOString(),
  reproducibility: {
    sourceArchive: "git archive at the recorded commit",
    historyBundle: "git bundle containing HEAD and reachable history",
    note: "相同 Git 对象可复核内容哈希；不同 Git/OS 版本产生的容器字节不承诺完全相同。",
  },
  files: [
    { name: sourceArchiveName, bytes: sourceArchiveStat.size, sha256: sha256(sourceArchive) },
    { name: gitBundleName, bytes: gitBundleStat.size, sha256: sha256(gitBundle) },
  ],
  criticalAssets,
  recoveryEntryPoint: "docs/RECOVERY.md",
  limitations: [
    "保存包不包含任何密钥、账户凭据或第三方受限全文。",
    "上游佛典候选记录保存来源提交与路径摘要，不等于镜像上游内容。",
    "CI 工件是短期副本，必须另行复制到机构对象存储与离线介质。",
  ],
};

const manifestName = "preservation-manifest.json";
const manifestContent = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(resolve(outputDirectory, manifestName), manifestContent, "utf8");
const checksums = [
  ...manifest.files.map((file) => `${file.sha256}  ${file.name}`),
  `${sha256(manifestContent)}  ${manifestName}`,
].join("\n");
await writeFile(resolve(outputDirectory, "SHA256SUMS"), `${checksums}\n`, "utf8");

console.log(`保存包已生成：artifacts/preservation/${shortCommit}`);
console.log(`包含 ${archivedPaths.length} 个受控文件；提交 ${commit}`);
