import path from "node:path";
import { readdir } from "node:fs/promises";
import { getCollection, type CollectionEntry } from "astro:content";

const candidateClipDirs = [
  path.resolve(process.cwd(), "src/content/clips"),
  path.resolve(process.cwd(), "apps/web/src/content/clips"),
];

async function hasClipFiles() {
  for (const clipsDir of candidateClipDirs) {
    try {
      const entries = await readdir(clipsDir, { withFileTypes: true });
      if (
        entries.some((entry) => {
          return entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_");
        })
      ) {
        return true;
      }
    } catch {
      continue;
    }
  }

  return false;
}

export async function getClipEntries(): Promise<CollectionEntry<"clips">[]> {
  if (!(await hasClipFiles())) {
    return [];
  }

  return getCollection("clips");
}
