import { execSync } from "node:child_process";

type ProvenanceSource = "vercel_system_env" | "git_fallback" | "unavailable";

export type ReleaseProvenance = {
  sourceCommitSha: string | null;
  sourceCommitShortSha: string | null;
  sourceCommitRef: string | null;
  deploymentId: string | null;
  deploymentHost: string | null;
  deploymentUrl: string | null;
  environment: string | null;
  targetEnvironment: string | null;
  provenanceSource: ProvenanceSource;
};

function cleanValue(value: string | undefined | null) {
  const compact = value?.trim();
  return compact ? compact : null;
}

function normalizeHost(value: string | null) {
  if (!value) return null;

  try {
    const parsed = value.includes("://") ? new URL(value) : new URL(`https://${value}`);
    return parsed.host || null;
  } catch {
    return null;
  }
}

function normalizeUrlFromHost(value: string | null) {
  const host = normalizeHost(value);
  return host ? `https://${host}` : null;
}

function normalizeCommitSha(value: string | null) {
  if (!value) return null;
  return /^[0-9a-f]{7,40}$/i.test(value) ? value.toLowerCase() : null;
}

function shortenCommitSha(value: string | null) {
  return value ? value.slice(0, 12) : null;
}

function readGitValue(args: string[]) {
  try {
    return execSync(`git ${args.join(" ")}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() || null;
  } catch {
    return null;
  }
}

function resolveReleaseProvenance(): ReleaseProvenance {
  const environment = cleanValue(process.env.VERCEL_ENV) ?? cleanValue(process.env.NODE_ENV);
  const targetEnvironment = cleanValue(process.env.VERCEL_TARGET_ENV);
  const deploymentId = cleanValue(process.env.VERCEL_DEPLOYMENT_ID);
  const deploymentHost = normalizeHost(cleanValue(process.env.VERCEL_URL));
  const deploymentUrl = normalizeUrlFromHost(deploymentHost);

  const envCommitSha = normalizeCommitSha(cleanValue(process.env.VERCEL_GIT_COMMIT_SHA));
  const envCommitRef = cleanValue(process.env.VERCEL_GIT_COMMIT_REF);

  if (envCommitSha || envCommitRef || deploymentId || deploymentHost || targetEnvironment) {
    return {
      sourceCommitSha: envCommitSha,
      sourceCommitShortSha: shortenCommitSha(envCommitSha),
      sourceCommitRef: envCommitRef,
      deploymentId,
      deploymentHost,
      deploymentUrl,
      environment,
      targetEnvironment,
      provenanceSource: "vercel_system_env",
    };
  }

  const gitCommitSha = normalizeCommitSha(readGitValue(["rev-parse", "--verify", "HEAD"]));
  const gitCommitRef = cleanValue(readGitValue(["rev-parse", "--abbrev-ref", "HEAD"]));

  if (gitCommitSha || gitCommitRef) {
    return {
      sourceCommitSha: gitCommitSha,
      sourceCommitShortSha: shortenCommitSha(gitCommitSha),
      sourceCommitRef: gitCommitRef,
      deploymentId,
      deploymentHost,
      deploymentUrl,
      environment,
      targetEnvironment,
      provenanceSource: "git_fallback",
    };
  }

  return {
    sourceCommitSha: null,
    sourceCommitShortSha: null,
    sourceCommitRef: null,
    deploymentId,
    deploymentHost,
    deploymentUrl,
    environment,
    targetEnvironment,
    provenanceSource: "unavailable",
  };
}

export const releaseProvenance = resolveReleaseProvenance();

export function buildReleaseHeaders() {
  const releaseEnvironment = releaseProvenance.targetEnvironment ?? releaseProvenance.environment;

  return [
    ["X-Foxue-Source-Commit", releaseProvenance.sourceCommitSha],
    ["X-Foxue-Source-Commit-Short", releaseProvenance.sourceCommitShortSha],
    ["X-Foxue-Source-Ref", releaseProvenance.sourceCommitRef],
    ["X-Foxue-Deploy-Id", releaseProvenance.deploymentId],
    ["X-Foxue-Deploy-Host", releaseProvenance.deploymentHost],
    ["X-Foxue-Deploy-URL", releaseProvenance.deploymentUrl],
    ["X-Foxue-Deploy-Env", releaseEnvironment],
    ["X-Foxue-Provenance-Source", releaseProvenance.provenanceSource],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
}
