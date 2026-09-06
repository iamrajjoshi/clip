import { getClipDescription, getClipSourceLabel, getClipTitle, type ClipEntry } from "@/lib/clips";
import { linkifyText } from "@/lib/text";

interface TileSource {
  label: string;
  url?: string;
  icon?: string;
}

export interface ClipTileContent {
  title: string;
  excerpt: string;
  source: TileSource;
  image?: string;
}

const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });

export function isUrlOnlyText(value: string): boolean {
  const parts = linkifyText(value);
  return parts.some((part) => part.href) && parts.every((part) => part.href || !part.text.trim());
}

export function truncateTileText(
  value: string,
  maxLength = 190,
  preserveLineBreaks = false,
): string {
  const text = preserveLineBreaks
    ? value
        .replace(/\r\n?/gu, "\n")
        .replace(/[^\S\n]+/gu, " ")
        .trim()
    : value.replace(/\s+/gu, " ").trim();
  const characters = [...segmenter.segment(text)].map(({ segment }) => segment);
  if (characters.length <= maxLength) return text;

  const candidate = characters.slice(0, Math.max(1, maxLength)).join("");
  const wordBoundary = candidate.search(/\s+\S*$/u);
  const shortened = wordBoundary > 0 ? candidate.slice(0, wordBoundary) : candidate;
  return shortened.trimEnd() + "…";
}

function getHostname(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "");
}

export function getClipTileContent(clip: ClipEntry): ClipTileContent {
  const { data } = clip;
  switch (data.kind) {
    case "link":
      return {
        title: getClipTitle(clip),
        excerpt: data.description ? truncateTileText(getClipDescription(clip)) : "",
        source: { label: getClipSourceLabel(clip), url: data.url, icon: data.favicon },
        image: data.ogImage,
      };
    case "tweet":
      return {
        title: data.author.name,
        excerpt: truncateTileText(
          linkifyText(data.text)
            .map((part) => part.text)
            .join(""),
          190,
          true,
        ),
        source: { label: "@" + data.author.handle, url: data.url, icon: data.author.avatar },
        image: data.media?.[0]?.src,
      };
    case "image":
      return {
        title: getClipTitle(clip),
        excerpt: truncateTileText(clip.body),
        source: {
          label: data.sourceUrl ? getHostname(data.sourceUrl) : "Image",
          url: data.sourceUrl,
        },
        image: data.src,
      };
    case "video":
      return {
        title: data.title,
        excerpt: truncateTileText(clip.body),
        source: { label: data.channel || data.provider, url: data.url },
        image: data.thumbnail,
      };
    case "note":
      return {
        title: "Saved note",
        excerpt: truncateTileText(clip.body),
        source: { label: "Note" },
      };
  }
}
