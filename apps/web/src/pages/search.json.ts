import { buildSearchIndex } from "@/lib/clips";
import { getClipEntries } from "@/lib/content";

export async function GET() {
  const clips = await getClipEntries();

  return new Response(JSON.stringify(buildSearchIndex(clips), null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}
