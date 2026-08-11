import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const runText = (command, args) =>
  execFileSync(command, args, { cwd: root, encoding: "utf8" }).trim();
const runBuffer = (command, args) => execFileSync(command, args, { cwd: root, maxBuffer: 16 * 1024 * 1024 });
const sha256 = (content) => createHash("sha256").update(content).digest("hex");
const hashGitPath = (commit, path) => new Promise((resolveHash, rejectHash) => {
  const digest = createHash("sha256");
  const child = spawn("git", ["show", `${commit}:${path}`], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stderr = "";
  child.stdout.on("data", (chunk) => digest.update(chunk));
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.on("error", rejectHash);
  child.on("close", (code) => {
    if (code === 0) resolveHash(digest.digest("hex"));
    else rejectHash(new Error(`无法读取 Git 关键资产 ${path}：${stderr.trim()}`));
  });
});

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
const suttacentralDhammapadaSources = archivedPaths.filter((path) =>
  path.startsWith("data/corpus/suttacentral/root/pli/ms/sutta/kn/dhp/") && path.endsWith(".json"),
);
const suttacentralDighaSources = archivedPaths.filter((path) =>
  path.startsWith("data/corpus/suttacentral/root/pli/ms/sutta/dn/") && path.endsWith(".json"),
);
const suttacentralMajjhimaSources = archivedPaths.filter((path) =>
  path.startsWith("data/corpus/suttacentral/root/pli/ms/sutta/mn/") && path.endsWith(".json"),
);
if (suttacentralDhammapadaSources.length !== 26) {
  throw new Error(`保存包应包含 26 个巴利《法句经》来源文件，实际为 ${suttacentralDhammapadaSources.length}`);
}
if (suttacentralDighaSources.length !== 34) {
  throw new Error(`保存包应包含 34 个巴利《长部》来源文件，实际为 ${suttacentralDighaSources.length}`);
}
if (suttacentralMajjhimaSources.length !== 152) {
  throw new Error(`保存包应包含 152 个巴利《中部》来源文件，实际为 ${suttacentralMajjhimaSources.length}`);
}
const requiredPaths = [
  "README.md",
  "LICENSE",
  "package.json",
  "pnpm-lock.yaml",
  "docs/RECOVERY.md",
  "docs/ANALYTICS.md",
  "docs/foxue.ai_建站方案_v1.0_20260811.md",
  "data/gbcr/registry-v0.6.0.json",
  "data/gbcr/registry-v0.7.0.json",
  "data/gbcr/registry-v0.8.0.json",
  "data/gbcr/registry-v0.9.0.json",
  "data/gbcr/source-snapshots-v0.2.1.json",
  "data/gbcr/cbeta-taisho-sutra-inventory-v0.2.1.json",
  "data/gbcr/checksums-v0.6.0.sha256",
  "data/gbcr/checksums-v0.7.0.sha256",
  "data/gbcr/checksums-v0.8.0.sha256",
  "data/gbcr/checksums-v0.9.0.sha256",
  "data/corpus/cbeta/NOTICE.md",
  "data/corpus/cbeta/batch-v0.5.0.json",
  "data/corpus/cbeta/catalog-v0.5.0.json",
  "data/corpus/cbeta/batch-v0.6.0.json",
  "data/corpus/cbeta/catalog-v0.6.0.json",
  "data/corpus/cbeta/manifest-v0.6.0.json",
  "data/corpus/suttacentral/NOTICE.md",
  "data/corpus/suttacentral/batch-v0.7.0.json",
  "data/corpus/suttacentral/manifest-v0.7.0.json",
  "data/corpus/suttacentral/dn-batch-v0.8.0.json",
  "data/corpus/suttacentral/dn-manifest-v0.8.0.json",
  "data/corpus/suttacentral/mn-batch-v0.9.0.json",
  "data/corpus/suttacentral/mn-manifest-v0.9.0.json",
  ...suttacentralDhammapadaSources,
  ...suttacentralDighaSources,
  ...suttacentralMajjhimaSources,
  "data/corpus/cbeta/T01n0001.xml",
  "data/corpus/cbeta/T01n0026.xml",
  "data/corpus/cbeta/T02n0099.xml",
  "data/corpus/cbeta/T02n0125.xml",
  "data/corpus/cbeta/T04n0210.xml",
  "data/corpus/cbeta/T05n0220a.xml",
  "data/corpus/cbeta/T06n0220b.xml",
  "data/corpus/cbeta/T07n0220c.xml",
  "data/corpus/cbeta/T07n0220d.xml",
  "data/corpus/cbeta/T07n0220e.xml",
  "data/corpus/cbeta/T07n0220f.xml",
  "data/corpus/cbeta/T07n0220g.xml",
  "data/corpus/cbeta/T07n0220h.xml",
  "data/corpus/cbeta/T07n0220i.xml",
  "data/corpus/cbeta/T07n0220j.xml",
  "data/corpus/cbeta/T07n0220k.xml",
  "data/corpus/cbeta/T07n0220l.xml",
  "data/corpus/cbeta/T07n0220m.xml",
  "data/corpus/cbeta/T07n0220n.xml",
  "data/corpus/cbeta/T07n0220o.xml",
  "data/corpus/cbeta/T08n0251.xml",
  "data/corpus/cbeta/T08n0235.xml",
  "data/corpus/cbeta/T08n0223.xml",
  "data/corpus/cbeta/T09n0262.xml",
  "data/corpus/cbeta/T09n0278.xml",
  "data/corpus/cbeta/T10n0279.xml",
  "data/corpus/cbeta/T11n0310.xml",
  "data/corpus/cbeta/T12n0360.xml",
  "data/corpus/cbeta/T12n0365.xml",
  "data/corpus/cbeta/T12n0366.xml",
  "data/corpus/cbeta/T12n0374.xml",
  "data/corpus/cbeta/T12n0375.xml",
  "data/corpus/cbeta/T16n0670.xml",
  "data/corpus/cbeta/T14n0475.xml",
  "data/corpus/cbeta/T16n0671.xml",
  "data/corpus/cbeta/T16n0672.xml",
  "data/corpus/cbeta/T17n0784.xml",
  "data/corpus/cbeta/T17n0842.xml",
  "data/corpus/cbeta/T19n0945.xml",
  "scripts/build-cbeta-catalog.mjs",
  "scripts/build-corpus-catalog.mjs",
  "scripts/build-suttacentral-catalog.mjs",
  "scripts/build-suttacentral-dn-catalog.mjs",
  "scripts/audit-suttacentral-collection.mjs",
  "scripts/build-suttacentral-mn-catalog.mjs",
  "scripts/import-suttacentral-source.mjs",
  "scripts/import-suttacentral-dn-source.mjs",
  "scripts/import-suttacentral-mn-source.mjs",
  "scripts/build-federated-corpus.mjs",
  "scripts/build-corpus-release.mjs",
  "scripts/corpus-release-context.mjs",
  "scripts/publish-corpus-release.mjs",
  "scripts/verify-corpus-release.mjs",
  "src/lib/bilara-reading.mjs",
  "src/lib/bilara-reading.d.mts",
  "src/lib/corpus-reading.ts",
  "src/lib/reader-routes.ts",
  "infra/corpus-edge/src/index.ts",
  "infra/corpus-edge/wrangler.jsonc",
  "infra/corpus-edge/worker-configuration.d.ts",
];
for (const path of requiredPaths) {
  if (!archivedPaths.includes(path)) throw new Error(`保存包缺少关键文件：${path}`);
}

const criticalAssets = {};
for (const path of requiredPaths) {
  criticalAssets[path] = await hashGitPath(commit, path);
}
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
    "上游佛典候选记录保存来源提交、逐文件路径、Git 对象哈希与字节数，不等于镜像全部上游内容。",
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
