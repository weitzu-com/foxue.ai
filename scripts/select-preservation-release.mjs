import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const TAG_PATTERN = /^gbcr-v([0-9]+)\.([0-9]+)\.([0-9]+)$/;

function version(tag) {
  const match = TAG_PATTERN.exec(tag);
  return match ? match.slice(1).map(Number) : null;
}

export function selectImmutableGbcrRelease(releases, requested = "") {
  if (!Array.isArray(releases)) throw new Error("GitHub release 列表不是数组");
  if (requested && !TAG_PATTERN.test(requested)) throw new Error(`发行标签无效：${requested}`);
  const candidates = releases.filter((release) =>
    release &&
    typeof release === "object" &&
    version(release.tagName) &&
    release.isDraft === false &&
    release.isImmutable === true,
  );
  if (requested) {
    const selected = candidates.find((release) => release.tagName === requested);
    if (!selected) throw new Error(`指定发行不存在、仍是草稿或尚未不可变：${requested}`);
    return selected.tagName;
  }
  candidates.sort((left, right) => {
    const a = version(left.tagName);
    const b = version(right.tagName);
    for (let index = 0; index < 3; index += 1) {
      if (a[index] !== b[index]) return b[index] - a[index];
    }
    return 0;
  });
  if (!candidates[0]) throw new Error("没有可供恢复的不可变 GBCR 发行");
  return candidates[0].tagName;
}

async function main() {
  const [, , releaseListPath, requested = ""] = process.argv;
  if (!releaseListPath) throw new Error("用法：node scripts/select-preservation-release.mjs <releases.json> [gbcr-vX.Y.Z]");
  const releases = JSON.parse(await readFile(resolve(releaseListPath), "utf8"));
  console.log(selectImmutableGbcrRelease(releases, requested));
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
