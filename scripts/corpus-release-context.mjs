import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export async function loadCorpusReleaseContext(root) {
  const sourceManifestPath = resolve(root, "data/corpus/cbeta/manifest-v0.3.0.json");
  const sourceManifestBytes = await readFile(sourceManifestPath);
  const sourceManifest = JSON.parse(sourceManifestBytes.toString("utf8"));
  const sourceCommit = sourceManifest.source.commit;
  const contractInputs = [
    ["source-manifest", sourceManifestBytes],
    ["release-context", await readFile(fileURLToPath(import.meta.url))],
    ["release-builder", await readFile(resolve(root, "scripts/build-corpus-release.mjs"))],
    ["tei-parser", await readFile(resolve(root, "src/lib/cbeta-tei.mjs"))],
  ];
  const fingerprint = createHash("sha256");

  for (const [label, bytes] of contractInputs) {
    fingerprint.update(`${label}\0${bytes.length}\0`);
    fingerprint.update(bytes);
  }

  const releaseFingerprint = fingerprint.digest("hex").slice(0, 12);
  const releaseId = [
    "cbeta",
    sourceManifest.version,
    sourceCommit.slice(0, 12),
    releaseFingerprint,
  ].join("-");

  return {
    releaseId,
    releaseFingerprint,
    sourceCommit,
    sourceManifest,
    sourceManifestBytes,
  };
}
