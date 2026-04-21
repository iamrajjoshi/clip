import type { APIContext } from "astro";
import { excerpt, getClipDescription, getClipTitle, type ClipEntry } from "@/lib/clips";
import { getClipEntries } from "@/lib/content";

const WIDTH = 1200;
const HEIGHT = 630;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapText(input: string, maxChars: number) {
  const words = input.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;

    if (next.length <= maxChars) {
      current = next;
      continue;
    }

    if (current) {
      lines.push(current);
      current = word;
      continue;
    }

    lines.push(word);
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function renderTextBlock({
  lines,
  x,
  y,
  fontSize,
  lineHeight,
  fill,
  fontWeight = 400,
}: {
  lines: string[];
  x: number;
  y: number;
  fontSize: number;
  lineHeight: number;
  fill: string;
  fontWeight?: number;
}) {
  return `
    <text x="${x}" y="${y}" fill="${fill}" font-size="${fontSize}" font-weight="${fontWeight}" letter-spacing="-0.02em">
      ${lines
        .map((line, index) => {
          const dy = index === 0 ? 0 : lineHeight;
          return `<tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`;
        })
        .join("")}
    </text>
  `;
}

function buildOgSvg(clip: ClipEntry) {
  const title = getClipTitle(clip);
  const description = excerpt(getClipDescription(clip), 220);
  const sourceLabel =
    clip.data.kind === "link"
      ? clip.data.siteName ?? new URL(clip.data.url).hostname.replace(/^www\./, "")
      : clip.data.kind;
  const titleLines = wrapText(title, 26).slice(0, 3);
  const descriptionLines = wrapText(description, 52).slice(0, 4);
  const titleLineCount = Math.max(titleLines.length, 1);
  const descriptionY = 190 + (titleLineCount - 1) * 80;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#050505" />
  <rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" rx="28" fill="#0B0B0B" stroke="#1E1E1E" />
  <rect x="76" y="76" width="160" height="34" rx="17" fill="#111111" stroke="#242424" />
  <text x="98" y="99" fill="#A3A3A3" font-size="18" font-weight="500">${escapeXml(sourceLabel)}</text>
  <text x="${WIDTH - 198}" y="99" fill="#6E6E6E" font-size="18">clip.rajjoshi.me</text>
  <line x1="76" y1="136" x2="${WIDTH - 76}" y2="136" stroke="#1C1C1C" />
  ${renderTextBlock({
    lines: titleLines,
    x: 76,
    y: 210,
    fontSize: 64,
    lineHeight: 80,
    fill: "#FAFAFA",
    fontWeight: 700,
  })}
  ${renderTextBlock({
    lines: descriptionLines,
    x: 76,
    y: descriptionY + 72,
    fontSize: 30,
    lineHeight: 42,
    fill: "#A3A3A3",
    fontWeight: 400,
  })}
  <line x1="76" y1="${HEIGHT - 128}" x2="${WIDTH - 76}" y2="${HEIGHT - 128}" stroke="#1C1C1C" />
  <text x="76" y="${HEIGHT - 88}" fill="#6E6E6E" font-size="20">${escapeXml(clip.data.kind)}</text>
  <text x="${WIDTH - 300}" y="${HEIGHT - 88}" fill="#6E6E6E" font-size="20">${escapeXml(clip.slug)}</text>
</svg>`;
}

export async function getStaticPaths() {
  const clips = await getClipEntries();

  return clips.map((clip) => ({
    params: { slug: clip.slug },
    props: { clip },
  }));
}

export async function GET({ props }: APIContext<{ clip: ClipEntry }>) {
  return new Response(buildOgSvg(props.clip), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
