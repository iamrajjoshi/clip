import { readdir } from "node:fs/promises";
import { getCollection, type CollectionEntry } from "astro:content";

const clipsDir = new URL("../content/clips", import.meta.url);

async function hasClipFiles() {
  try {
    const entries = await readdir(clipsDir, { withFileTypes: true });
    return entries.some((entry) => {
      return entry.isFile() && entry.name.endsWith(".md") && !entry.name.startsWith("_");
    });
  } catch {
    return false;
  }
}

export async function getClipEntries(): Promise<CollectionEntry<"clips">[]> {
  if (!(await hasClipFiles())) {
    return [];
  }

  return getCollection("clips");
}
