import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sentry from "@sentry/astro";
import tailwindcss from "@tailwindcss/vite";

// The build runs with cwd set to this workspace, so neither Astro nor
// sentry-vite-plugin discovers the repo-root env files on their own. Read them
// here so Sentry config has one home at the root regardless of where the build
// is invoked from.
function readRootEnv(name) {
  if (process.env[name]) {
    return process.env[name];
  }

  for (const file of [".env.sentry-build-plugin", ".env"]) {
    try {
      const contents = readFileSync(
        fileURLToPath(new URL(`../../${file}`, import.meta.url)),
        "utf8",
      );
      const match = contents.match(new RegExp(`^\\s*${name}\\s*=\\s*(.+)$`, "m"));
      const value = match?.[1]?.trim().replace(/^["']|["']$/g, "");

      if (value) {
        return value;
      }
    } catch {
      continue;
    }
  }

  return undefined;
}

function getCommitSha() {
  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

export default defineConfig({
  site: "https://clip.rajjoshi.me",
  output: "static",
  integrations: [
    react(),
    sentry({
      project: "clip",
      org: "flash-corp",
      authToken: readRootEnv("SENTRY_AUTH_TOKEN"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    define: {
      "import.meta.env.PUBLIC_COMMIT_SHA": JSON.stringify(getCommitSha()),
      "import.meta.env.PUBLIC_SENTRY_DSN": JSON.stringify(readRootEnv("PUBLIC_SENTRY_DSN")),
    },
  },
});
