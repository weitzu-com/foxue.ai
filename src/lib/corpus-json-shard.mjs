import { readFile } from "node:fs/promises";

const projectRoot = process.cwd().replace(/\/$/, "");

export async function readRegisteredJsonFile(assetPath) {
  if (typeof assetPath !== "string" || !assetPath.startsWith(`${projectRoot}/src/data/`)) {
    throw new Error(`拒绝读取未登记的分片路径：${assetPath}`);
  }
  if (assetPath.includes("\0") || assetPath.includes("/../")) {
    throw new Error(`拒绝读取越界分片路径：${assetPath}`);
  }
  try {
    return JSON.parse(await readFile(assetPath, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export function resolveRegisteredJsonFile(relativePath) {
  if (
    typeof relativePath !== "string"
    || relativePath.startsWith("/")
    || relativePath.includes("\0")
    || relativePath.includes("\\")
    || relativePath.includes("/../")
    || (
      !relativePath.startsWith("src/data/corpus-work-catalog-chunks/")
      && !relativePath.startsWith("src/data/corpus-folio-locator-chunks/")
    )
    || !relativePath.endsWith(".json")
  ) {
    throw new Error(`分片路径越界：${relativePath}`);
  }
  return `${projectRoot}/${relativePath}`;
}
