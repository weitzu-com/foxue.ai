import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const sources = {
  cbeta: {
    repository: "cbeta-org/xml-p5",
    commit: "2b8ab8d5e4fe957a9b94f2cde01cb0d2e2dcd2b9",
  },
  suttacentral: {
    repository: "suttacentral/bilara-data",
    commit: "eac6c24781dd1eefdc17dc2f787b54bf6fe31719",
  },
};

const fetchTree = async ({ repository, commit }) => {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "foxue-ai-gbcr-snapshot",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const response = await fetch(
    `https://api.github.com/repos/${repository}/git/trees/${commit}?recursive=1`,
    { headers },
  );
  if (!response.ok) throw new Error(`${repository} GitHub tree 请求失败：${response.status}`);
  return response.json();
};

const countBy = (items, selector) =>
  Object.fromEntries(
    [...items.reduce((map, item) => {
      const key = selector(item);
      map.set(key, (map.get(key) ?? 0) + 1);
      return map;
    }, new Map())].sort(([left], [right]) => left.localeCompare(right)),
  );

const digestPaths = (paths) =>
  createHash("sha256").update([...paths].sort().join("\n")).digest("hex");

const [cbetaTree, suttacentralTree] = await Promise.all([
  fetchTree(sources.cbeta),
  fetchTree(sources.suttacentral),
]);

if (cbetaTree.truncated || suttacentralTree.truncated) {
  throw new Error("GitHub tree 响应被截断，不能生成可审计快照");
}

const cbetaPaths = cbetaTree.tree
  .map((item) => item.path)
  .filter((path) => path.endsWith(".xml"))
  .sort();
const suttacentralRootPaths = suttacentralTree.tree
  .map((item) => item.path)
  .filter((path) => path.startsWith("root/") && path.endsWith(".json"))
  .sort();
const canonicalLanguages = new Set(["pli", "lzh", "pra", "san"]);
const suttacentralCandidatePaths = suttacentralRootPaths.filter((path) =>
  canonicalLanguages.has(path.split("/")[1]),
);

const snapshot = {
  schema: "https://foxue.ai/schemas/gbcr/source-snapshots-v0.1",
  version: "0.1.0",
  capturedAt: "2026-08-11",
  status: "candidate_record_inventory",
  denominatorReady: false,
  warning: "候选来源记录不是去重后的作品数，不得直接用作全球覆盖率分母。",
  sources: [
    {
      id: "cbeta_xml_p5",
      repository: sources.cbeta.repository,
      commit: sources.cbeta.commit,
      treeTruncated: false,
      repositoryTreeEntries: cbetaTree.tree.length,
      candidateRecordCount: cbetaPaths.length,
      recordUnit: "TEI P5 XML source record",
      inclusionRule: "Git tree 中所有以 .xml 结尾的路径",
      candidatePathSha256: digestPaths(cbetaPaths),
      groups: countBy(cbetaPaths, (path) => path.split("/")[0]),
      denominatorCaveat: "异译、别本、续藏与版本见证尚未映射到 Work/Expression/Witness，文件数不是作品数。",
    },
    {
      id: "suttacentral_bilara",
      repository: sources.suttacentral.repository,
      commit: sources.suttacentral.commit,
      treeTruncated: false,
      repositoryTreeEntries: suttacentralTree.tree.length,
      allJsonFiles: suttacentralTree.tree.filter((item) => item.path.endsWith(".json")).length,
      allRootRecords: suttacentralRootPaths.length,
      excludedInterfaceAndNameRecords: suttacentralRootPaths.length - suttacentralCandidatePaths.length,
      candidateRecordCount: suttacentralCandidatePaths.length,
      recordUnit: "Bilara canonical-language root record",
      inclusionRule: "root/{pli,lzh,pra,san}/ 下所有 JSON；排除英文界面和 misc 名称记录",
      candidatePathSha256: digestPaths(suttacentralCandidatePaths),
      groups: countBy(suttacentralCandidatePaths, (path) => path.split("/")[1]),
      denominatorCaveat: "root 记录可能是经、律、论的章节或细分单元；跨语言平行关系与作品级去重尚未裁决。",
    },
  ],
};

const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
if (process.argv.includes("--verify")) {
  const checkedPath = resolve(process.cwd(), "data/gbcr/source-snapshots-v0.1.0.json");
  const checked = await readFile(checkedPath, "utf8");
  if (checked !== serialized) {
    console.error("上游目录快照已漂移，或固定提交/提取规则与受控文件不一致。");
    process.exit(1);
  }
  console.log(`上游目录快照验证通过：CBETA ${cbetaPaths.length}，SuttaCentral ${suttacentralCandidatePaths.length} 条候选记录。`);
} else {
  process.stdout.write(serialized);
}
