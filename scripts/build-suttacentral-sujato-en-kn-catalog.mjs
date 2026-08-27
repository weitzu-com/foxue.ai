import { spawn } from "node:child_process";

const verify = process.argv.includes("--verify");
const child = spawn(
  process.execPath,
  ["scripts/audit-suttacentral-sujato-en-kn.mjs", ...(verify ? ["--verify"] : [])],
  { stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 1));
