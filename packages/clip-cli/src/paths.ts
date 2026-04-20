import { access } from "node:fs/promises";
import path from "node:path";
import type { ProjectPaths } from "./types";

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function resolveProjectPaths(start = process.cwd()): Promise<ProjectPaths> {
  let current = path.resolve(start);

  while (true) {
    const hasGit = await exists(path.join(current, ".git"));
    const hasWorkspace = await exists(path.join(current, "pnpm-workspace.yaml"));

    if (hasGit && hasWorkspace) {
      return {
        repoRoot: current,
        contentDir: path.join(current, "apps/web/src/content/clips"),
        publicDir: path.join(current, "apps/web/public"),
        clipsAssetDir: path.join(current, "apps/web/public/clips"),
      };
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }

    current = parent;
  }

  throw new Error("Could not find the clip workspace root from the current directory.");
}
