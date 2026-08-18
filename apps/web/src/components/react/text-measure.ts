export function measureCharWidths(text: string, font: string): number[] {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  context.font = font;
  return Array.from(text).map((char) => context.measureText(char).width);
}

export function getFontShorthand(element: HTMLElement): string {
  const style = getComputedStyle(element);
  const parts: string[] = [];
  const family = style.fontFamily.split(",")[0].trim().replace(/['"]/g, "");

  if (style.fontStyle && style.fontStyle !== "normal") parts.push(style.fontStyle);
  if (style.fontWeight && style.fontWeight !== "400") parts.push(style.fontWeight);
  parts.push(style.fontSize, family);

  return parts.join(" ");
}
