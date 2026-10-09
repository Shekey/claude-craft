import { mkdirSync, writeFileSync } from "node:fs";
import { repoContext, sh } from "./lib.mjs";

const [command = "paths"] = process.argv.slice(2);
const context = repoContext(process.cwd());

if (!context) {
  process.stderr.write("Not inside a git repository.\n");
  process.exit(1);
}

if (command === "paths") {
  const { root, key, cacheDir, conventions, conventionsShared, configFile, stateFile, config, state } = context;
  process.stdout.write(
    `${JSON.stringify({ root, key, cacheDir, conventions, conventionsShared, configFile, stateFile, config, state }, null, 2)}\n`,
  );
} else if (command === "mark") {
  const head = sh("git rev-parse HEAD", context.root);
  mkdirSync(context.cacheDir, { recursive: true });
  writeFileSync(
    context.stateFile,
    `${JSON.stringify({ conventionsCommit: head.ok ? head.out.trim() : null, updatedAt: new Date().toISOString() }, null, 2)}\n`,
  );
  process.stdout.write(`Recorded conventions for ${context.key} at ${head.ok ? head.out.trim().slice(0, 12) : "no commit yet"}\n`);
} else {
  process.stderr.write("Usage: repo.mjs [paths|mark]\n");
  process.exit(1);
}
