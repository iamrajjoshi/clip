export interface TextPart {
  text: string;
  href?: string;
}

function decodeEntities(text: string): string {
  const entities: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    "#39": "'",
  };
  return text.replace(/&(amp|lt|gt|quot|apos|#39);/g, (_, entity: string) => entities[entity]);
}

// Return text nodes and HTTP(S) links; never interpret captured text as HTML.
export function linkifyText(value: string): TextPart[] {
  const text = decodeEntities(value);
  const parts: TextPart[] = [];
  let cursor = 0;

  for (const match of text.matchAll(/https?:\/\/[^\s<>"]+/gi)) {
    const start = match.index;
    let url = match[0].replace(/[.,!?;:]+$/, "");
    for (const [open, close] of [
      ["(", ")"],
      ["[", "]"],
      ["{", "}"],
    ]) {
      while (url.endsWith(close) && url.split(close).length > url.split(open).length) {
        url = url.slice(0, -1);
      }
    }
    if (start > cursor) parts.push({ text: text.slice(cursor, start) });
    try {
      const parsed = new URL(url);
      parts.push({ text: url, href: parsed.href });
    } catch {
      parts.push({ text: url });
    }
    cursor = start + url.length;
  }

  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}
