import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

export async function loadCorpusReleaseContext(root) {
  const manifestInputs = [
    ["cbeta_xml_p5", "data/corpus/cbeta/manifest-v4.21.0.json"],
    ["suttacentral_bilara_dhammapada", "data/corpus/suttacentral/manifest-v0.7.0.json"],
    ["suttacentral_bilara_digha_nikaya", "data/corpus/suttacentral/dn-manifest-v0.8.0.json"],
    ["suttacentral_bilara_majjhima_nikaya", "data/corpus/suttacentral/mn-manifest-v0.9.0.json"],
    ["suttacentral_bilara_samyutta_nikaya", "data/corpus/suttacentral/sn-manifest-v1.0.0.json"],
    ["suttacentral_bilara_anguttara_nikaya", "data/corpus/suttacentral/an-manifest-v1.1.0.json"],
    ["suttacentral_bilara_khuddaka_nikaya", "data/corpus/suttacentral/kn-manifest-v1.2.0.json"],
    ["suttacentral_bilara_indic_roots", "data/corpus/suttacentral/indic-manifest-v1.3.0.json"],
    ["suttacentral_bilara_vinaya_roots", "data/corpus/suttacentral/vinaya-manifest-v1.4.0.json"],
    ["suttacentral_bilara_abhidhamma_roots", "data/corpus/suttacentral/abhidhamma-manifest-v1.5.0.json"],
  ];
  const sourceManifests = await Promise.all(manifestInputs.map(async ([id, relativePath]) => {
    const bytes = await readFile(resolve(root, relativePath));
    return { id, relativePath, bytes, manifest: JSON.parse(bytes.toString("utf8")) };
  }));
  const contractInputs = [
    ...sourceManifests.map((source) => [`source-manifest:${source.id}`, source.bytes]),
    ["release-context", await readFile(fileURLToPath(import.meta.url))],
    ["release-builder", await readFile(resolve(root, "scripts/build-corpus-release.mjs"))],
    ["tei-parser", await readFile(resolve(root, "src/lib/cbeta-tei.mjs"))],
    ["bilara-parser", await readFile(resolve(root, "src/lib/bilara-reading.mjs"))],
  ];
  const fingerprint = createHash("sha256");

  for (const [label, bytes] of contractInputs) {
    fingerprint.update(`${label}\0${bytes.length}\0`);
    fingerprint.update(bytes);
  }

  const releaseFingerprint = fingerprint.digest("hex").slice(0, 12);
  const releaseId = [
    "gbcr",
    "6.12.0",
    sourceManifests[0].manifest.source.commit.slice(0, 12),
    sourceManifests[1].manifest.source.commit.slice(0, 12),
    releaseFingerprint,
  ].join("-");

  return {
    releaseId,
    releaseFingerprint,
    sourceManifests,
  };
}
