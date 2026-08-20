import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const host = process.env.SEO_SMOKE_HOST ?? "127.0.0.1";
const expectedSiteOrigin = process.env.EXPECTED_SITE_ORIGIN ?? "https://www.foxue.ai";
const nextBin = resolve("node_modules/next/dist/bin/next");

async function resolvePort() {
  if (process.env.SEO_SMOKE_PORT) return Number(process.env.SEO_SMOKE_PORT);

  return await new Promise((resolve, reject) => {
    const probe = createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, host, () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to resolve a free local port for SEO smoke"));
        return;
      }

      probe.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });
}

function formatExit(code, signal) {
  if (typeof code === "number") return `exit code ${code}`;
  return `signal ${signal ?? "unknown"}`;
}

function readGitValue(args) {
  try {
    return execSync(`git ${args.join(" ")}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() || undefined;
  } catch {
    return undefined;
  }
}

async function waitForHealth(server, fetchBaseUrl) {
  for (let attempt = 1; attempt <= 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Local production server exited early with ${formatExit(server.exitCode, server.signalCode)}`);
    }

    try {
      const response = await fetch(`${fetchBaseUrl}/api/health`, {
        signal: AbortSignal.timeout(2_000),
      });

      if (response.ok) return;
    } catch {
      // wait and retry
    }

    await delay(1_000);
  }

  throw new Error(`Timed out waiting for ${fetchBaseUrl}/api/health`);
}

async function stopServer(server) {
  if (server.exitCode !== null) return;

  server.kill("SIGTERM");
  const result = await Promise.race([
    once(server, "exit").then(([code, signal]) => ({ code, signal })),
    delay(5_000).then(() => null),
  ]);

  if (result !== null) return;

  server.kill("SIGKILL");
  await once(server, "exit");
}

async function main() {
  const port = await resolvePort();
  const fetchBaseUrl = `http://${host}:${port}`;
  const startCommand = [nextBin, "start", "--hostname", host, "--port", String(port)];
  const expectedSourceCommitSha = readGitValue(["rev-parse", "--verify", "HEAD"])?.toLowerCase();
  const expectedSourceCommitRef = readGitValue(["rev-parse", "--abbrev-ref", "HEAD"]);

  console.log(`Starting local production server for SEO smoke on ${fetchBaseUrl}`);

  const server = spawn(process.execPath, startCommand, {
    stdio: "inherit",
    env: process.env,
  });

  try {
    await waitForHealth(server, fetchBaseUrl);
    const checks = [
      ["scripts/verify-google-integrations.mjs", fetchBaseUrl],
      ["scripts/verify-library-metadata-guards.mjs", fetchBaseUrl],
    ];

    for (const command of checks) {
      const smoke = spawn(process.execPath, command, {
        stdio: "inherit",
        env: {
          ...process.env,
          EXPECTED_SITE_ORIGIN: expectedSiteOrigin,
          ...(expectedSourceCommitSha ? { EXPECTED_SOURCE_COMMIT_SHA: expectedSourceCommitSha } : {}),
          ...(expectedSourceCommitRef ? { EXPECTED_SOURCE_COMMIT_REF: expectedSourceCommitRef } : {}),
        },
      });

      const [code, signal] = await once(smoke, "exit");
      if (code !== 0) {
        throw new Error(`${command[0]} failed with ${formatExit(code, signal)}`);
      }
    }
  } finally {
    await stopServer(server);
  }
}

await main();
