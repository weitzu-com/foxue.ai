import { readFile } from "node:fs/promises";
import { join } from "node:path";

const maxShardId = 10_000;

export async function readCorpusJsonShard(relativeDir, id) {
  if (!Number.isSafeInteger(id) || id < 0 || id > maxShardId) return null;
  if (
    typeof relativeDir !== "string" ||
    relativeDir.startsWith("/") ||
    relativeDir.includes("\0") ||
    relativeDir.includes("\\") ||
    relativeDir === ".." ||
    relativeDir.startsWith("../") ||
    relativeDir.includes("/../")
  ) {
    throw new Error(`分片目录越界：${relativeDir}`);
  }

  try {
    return JSON.parse(await readFile(join(process.cwd(), relativeDir, `${id}.json`), "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}
