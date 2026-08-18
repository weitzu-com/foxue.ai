import { readFile } from "node:fs/promises";

const workflowPath = ".github/workflows/preservation-release.yml";
const workflow = await readFile(workflowPath, "utf8");

const requiredPatterns = [
  ["pull requests run policy validation", /pull_request:\n\s+paths:/],
  ["root permission is read-only", /permissions:\n\s+contents: read/],
  ["release job waits for validation", /release:\n\s+needs: validate/],
  [
    "pull requests cannot enter the release job",
    /if: github\.event_name != 'pull_request' && github\.repository == 'weitzu-com\/foxue\.ai'/,
  ],
  ["only the release job can write contents", /release:[\s\S]*?permissions:\n\s+contents: write/],
  ["release tags use a strict semantic version", /\^gbcr-v\[0-9]\+\\\.\[0-9]\+\\\.\[0-9]\+\$/],
  ["release tags must be annotated", /git cat-file -t/],
  ["release commit must be reachable from main", /git merge-base --is-ancestor/],
  ["dependencies are installed from the lockfile", /pnpm install --frozen-lockfile/],
  ["the full project is verified", /run: pnpm verify/],
  ["an offline preservation bundle is built", /run: pnpm preserve/],
  ["release checksums are generated", /RELEASE-SHA256SUMS/],
  ["release begins as a draft", /gh release create[\s\S]*?--draft/],
  ["draft assets are verified remotely", /--json isDraft,assets/],
  ["draft is explicitly published", /--draft=false/],
  ["published release must be immutable", /isImmutable/],
  ["release attestation is verified", /gh release verify \"\$RELEASE_TAG\"/],
  ["each release asset is verified", /gh release verify-asset/],
];

const failures = [];
for (const [description, pattern] of requiredPatterns) {
  if (!pattern.test(workflow)) failures.push(description);
}

if (/pull_request_target:/.test(workflow)) {
  failures.push("pull_request_target is forbidden for this privileged workflow");
}

const actionReferences = [...workflow.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s*#.*)?$/gm)].map(
  ([, reference]) => reference,
);
if (actionReferences.length === 0) failures.push("no GitHub Actions references were found");
for (const reference of actionReferences) {
  const separator = reference.lastIndexOf("@");
  const revision = separator === -1 ? "" : reference.slice(separator + 1);
  if (!/^[0-9a-f]{40}$/.test(revision)) {
    failures.push(`action is not pinned to a full commit SHA: ${reference}`);
  }
}

const verifyPosition = workflow.indexOf("run: pnpm verify");
const preservePosition = workflow.indexOf("run: pnpm preserve");
const draftPosition = workflow.indexOf("gh release create");
const uploadPosition = workflow.indexOf("gh release upload");
const publishPosition = workflow.indexOf("--draft=false");
const proofPosition = workflow.lastIndexOf("gh release verify \"$RELEASE_TAG\"");
if (!(verifyPosition < preservePosition && preservePosition < draftPosition)) {
  failures.push("verification, preservation, and draft creation are out of order");
}
if (!(draftPosition < uploadPosition && uploadPosition < publishPosition && publishPosition < proofPosition)) {
  failures.push("draft, upload, publish, and proof operations are out of order");
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`✓ ${workflowPath} satisfies ${requiredPatterns.length} preservation controls`);
  console.log(`✓ ${actionReferences.length} action references are pinned to full commit SHAs`);
  console.log("✓ privileged operations are ordered after verification and draft checks");
}
