#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const entry = path.resolve(__dirname, "../src/index.ts");
const tsxLoader = require.resolve("tsx");
const result = spawnSync(process.execPath, ["--import", tsxLoader, entry, ...process.argv.slice(2)], {
  stdio: "inherit",
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
