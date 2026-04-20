import type { CollectionEntry } from "astro:content";

export type ClipEntry = CollectionEntry<"clips">;

export function sortClips(clips: ClipEntry[]): ClipEntry[] {
  return [...clips].sort((left, right) => {
    return right.data.clippedAt.getTime() - left.data.clippedAt.getTime();
  });
}

export function collectTagCounts(clips: ClipEntry[]) {
  const counts = new Map<string, number>();

  for (const clip of clips) {
    for (const tag of clip.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => {
      if (right.count === left.count) {
        return left.tag.localeCompare(right.tag);
      }

      return right.count - left.count;
    });
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[#>*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(text: string, maxLength = 160) {
  const clean = stripMarkdown(text);

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength).trim()}...`;
}

export function getClipTitle(clip: ClipEntry) {
  switch (clip.data.kind) {
    case "link":
      return clip.data.title;
    case "tweet":
      return `@${clip.data.author.handle}`;
    case "image":
      return clip.data.alt ?? "image clip";
    case "video":
      return clip.data.title;
    case "note":
      return excerpt(clip.body || "note", 64) || "note";
  }
}

export function getClipDescription(clip: ClipEntry) {
  switch (clip.data.kind) {
    case "link":
      return clip.data.description ?? clip.data.siteName ?? clip.data.url;
    case "tweet":
      return excerpt(clip.data.text, 160);
    case "image":
      return clip.data.alt ?? excerpt(clip.body ?? "image clip", 160);
    case "video":
      return clip.data.channel
        ? `${clip.data.channel} on ${clip.data.provider}`
        : `saved from ${clip.data.provider}`;
    case "note":
      return excerpt(clip.body, 160) || "a clipped note";
  }
}

export function getClipPermalink(clip: ClipEntry) {
  return `/clips/${clip.slug}/`;
}

export function getClipOgImage(clip: ClipEntry) {
  switch (clip.data.kind) {
    case "link":
      return clip.data.ogImage;
    case "tweet":
      return clip.data.media?.[0]?.src ?? clip.data.author.avatar;
    case "image":
      return clip.data.src;
    case "video":
      return clip.data.thumbnail;
    case "note":
      return undefined;
  }
}

export function buildSearchIndex(clips: ClipEntry[]) {
  return sortClips(clips).map((clip) => ({
    slug: clip.slug,
    kind: clip.data.kind,
    title: getClipTitle(clip),
    description: getClipDescription(clip),
    clippedAt: clip.data.clippedAt.toISOString(),
    tags: clip.data.tags,
    permalink: getClipPermalink(clip),
  }));
}
