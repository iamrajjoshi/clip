import type { APIContext } from "astro";
import { readFileSync } from "node:fs";
import {
  excerpt,
  formatDate,
  getClipDescription,
  getClipSourceLabel,
  getClipTitle,
  type ClipEntry,
} from "@/lib/clips";
import { getClipEntries } from "@/lib/content";

const fontRoot = new URL("../../../public/fonts/", import.meta.url);
const font = readFileSync(new URL("bricolage-grotesque-latin-variable.woff2", fontRoot)).toString(
  "base64",
);

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapText(input: string, maxChars: number, maxLines: number) {
  const words = input.trim().split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    for (let offset = 0; offset < word.length; offset += maxChars) {
      const part = word.slice(offset, offset + maxChars);
      if (line && line.length + part.length + 1 > maxChars) {
        lines.push(line);
        line = "";
      }
      line += (line ? " " : "") + part;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, maxChars - 1) + "…";
  }
  return lines.slice(0, maxLines);
}

export function buildOgSvg(clip?: ClipEntry) {
  const title = clip ? getClipTitle(clip) : "Raj’s clips";
  const description = clip
    ? excerpt(getClipDescription(clip), 180)
    : "Links, notes, and things I want to come back to.";
  const titleLines = wrapText(title, 38, 3);
  const descriptionLines = description === title ? [] : wrapText(description, 63, 3);
  const titleSize = clip ? 48 : 76;
  const titleLeading = clip ? 58 : 86;
  const descriptionTop = 198 + titleLines.length * titleLeading;
  const textLines = (
    lines: string[],
    y: number,
    size: number,
    leading: number,
    fill: string,
    weight: number,
    display = false,
  ) =>
    '<text class="' +
    (display ? "display" : "reading") +
    '" fill="' +
    fill +
    '" font-size="' +
    size +
    '" font-weight="' +
    weight +
    '">' +
    lines
      .map(
        (line, index) =>
          '<tspan x="80" y="' + (y + index * leading) + '">' + escapeXml(line) + "</tspan>",
      )
      .join("") +
    "</text>";

  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">' +
    "<defs><style>@font-face{font-family:Bricolage Grotesque;src:url(data:font/woff2;base64," +
    font +
    ') format("woff2");font-weight:200 800}text{font-family:Bricolage Grotesque,sans-serif;font-optical-sizing:auto}.display{font-variation-settings:"opsz" 96;letter-spacing:-.025em}</style></defs>' +
    '<rect width="1200" height="630" fill="#EDF2FC"/>' +
    (clip
      ? '<text class="display" x="80" y="98" fill="#2344D2" font-size="30" font-weight="650">Raj’s clips</text>'
      : "") +
    textLines(titleLines, 184, titleSize, titleLeading, "#2344D2", clip ? 650 : 750, true) +
    textLines(descriptionLines, descriptionTop, 27, 37, "#53627C", 400) +
    '<line x1="80" y1="518" x2="1120" y2="518" stroke="#C5CEE0"/>' +
    '<text x="80" y="566" fill="#53627C" font-size="20">' +
    escapeXml(clip ? getClipSourceLabel(clip) : "clip.rajjoshi.me") +
    "</text>" +
    '<text x="1120" y="566" text-anchor="end" fill="#53627C" font-size="20">' +
    escapeXml(clip ? formatDate(clip.data.clippedAt) : "") +
    "</text></svg>"
  );
}

export async function getStaticPaths() {
  return [
    { params: { slug: "site" }, props: {} },
    ...(await getClipEntries()).map((clip) => ({ params: { slug: clip.slug }, props: { clip } })),
  ];
}

export async function GET({ props }: APIContext<{ clip?: ClipEntry }>) {
  return new Response(buildOgSvg(props.clip), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
