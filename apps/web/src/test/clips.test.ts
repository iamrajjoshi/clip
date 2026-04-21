import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clipFrontmatterSchema } from "@/content/schema";
import {
  buildSearchIndex,
  collectTagCounts,
  excerpt,
  getClipDescription,
  getClipSocialImage,
  getClipSourceLabel,
  getClipTitle,
  sortClips,
} from "@/lib/clips";

const baseDate = new Date("2026-04-19T00:00:00.000Z");

function makeClip(kind: "note" | "link", overrides: Record<string, unknown> = {}) {
  const slug = (overrides.slug as string | undefined) ?? (kind === "note" ? "note" : "link");
  const data =
    kind === "note"
      ? clipFrontmatterSchema.parse({
        kind: "note",
        slug,
        clippedAt: baseDate,
        tags: ["notes"],
        ...overrides,
      })
      : clipFrontmatterSchema.parse({
        kind: "link",
        slug,
        clippedAt: baseDate,
        tags: ["design"],
        url: "https://example.com",
          title: "example",
          ...overrides,
        });

  return {
    id: `${slug}.md`,
    slug,
    body: kind === "note" ? "a saved note body" : "link commentary",
    collection: "clips",
    data,
    render: undefined,
    filePath: `${slug}.md`,
    digest: "digest",
  } as any;
}

describe("clip helpers", () => {
  it("sorts clips by clippedAt descending", () => {
    const newer = makeClip("note", { slug: "newer", clippedAt: new Date("2026-04-20T00:00:00.000Z") });
    const older = makeClip("link", { slug: "older", clippedAt: new Date("2026-04-18T00:00:00.000Z") });
    assert.deepEqual(sortClips([older, newer]).map((clip) => clip.slug), ["newer", "older"]);
  });

  it("collects tag counts", () => {
    const clips = [
      makeClip("note", { tags: ["notes", "design"] }),
      makeClip("link", { tags: ["design"] }),
    ];
    assert.deepEqual(collectTagCounts(clips), [
      { tag: "design", count: 2 },
      { tag: "notes", count: 1 },
    ]);
  });

  it("builds search items", () => {
    const clips = [makeClip("note", { slug: "sample-note" })];
    assert.deepEqual(buildSearchIndex(clips)[0], {
      slug: "sample-note",
      kind: "note",
      title: "a saved note body",
      description: "a saved note body",
      clippedAt: "2026-04-19T00:00:00.000Z",
      tags: ["notes"],
      permalink: "/clips/sample-note/",
    });
  });

  it("creates short excerpts", () => {
    assert.equal(excerpt("hello **world**", 20), "hello world");
  });

  it("cleans github repo titles and descriptions", () => {
    const clip = makeClip("link", {
      slug: "github-repo",
      tags: ["github"],
      url: "https://github.com/rohitg00/awesome-claude-design",
      title: "GitHub - rohitg00/awesome-claude-design: Claude Design DESIGN.md prompts by aesthetic family",
      description: "Claude Design DESIGN.md prompts by aesthetic family - rohitg00/awesome-claude-design",
    });

    assert.equal(getClipTitle(clip), "rohitg00/awesome-claude-design");
    assert.equal(getClipDescription(clip), "Claude Design DESIGN.md prompts by aesthetic family");
    assert.equal(getClipSourceLabel(clip), "GitHub");
    assert.equal(getClipSocialImage(clip), "/og/github-repo.svg");
  });
});
