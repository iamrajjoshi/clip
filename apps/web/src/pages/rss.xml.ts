import type { APIContext } from "astro";
import rss from "@astrojs/rss";
import { getClipDescription, getClipPermalink, getClipTitle, sortClips } from "@/lib/clips";
import { getClipEntries } from "@/lib/content";

export async function GET(context: APIContext) {
  const clips = sortClips(await getClipEntries());

  return rss({
    title: "Raj’s clips",
    description: "Links, notes, and things I want to come back to.",
    site: context.site!,
    items: clips.map((clip) => ({
      title: getClipTitle(clip),
      description: getClipDescription(clip),
      pubDate: clip.data.clippedAt,
      link: getClipPermalink(clip),
    })),
  });
}
