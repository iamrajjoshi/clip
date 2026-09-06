import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { clipFrontmatterSchema } from "@/content/schema";
import { linkifyText } from "@/lib/text";
import { getClipTileContent, isUrlOnlyText, truncateTileText } from "@/lib/tile";
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
    const newer = makeClip("note", {
      slug: "newer",
      clippedAt: new Date("2026-04-20T00:00:00.000Z"),
    });
    const older = makeClip("link", {
      slug: "older",
      clippedAt: new Date("2026-04-18T00:00:00.000Z"),
    });
    assert.deepEqual(
      sortClips([older, newer]).map((clip) => clip.slug),
      ["newer", "older"],
    );
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
      title:
        "GitHub - rohitg00/awesome-claude-design: Claude Design DESIGN.md prompts by aesthetic family",
      description:
        "Claude Design DESIGN.md prompts by aesthetic family - rohitg00/awesome-claude-design",
    });

    assert.equal(getClipTitle(clip), "rohitg00/awesome-claude-design");
    assert.equal(getClipDescription(clip), "Claude Design DESIGN.md prompts by aesthetic family");
    assert.equal(getClipSourceLabel(clip), "GitHub");
    assert.equal(getClipSocialImage(clip), "/og/github-repo.svg");
  });

  it("keeps captured post text as text while making web URLs usable", () => {
    const parts = linkifyText(
      "Read &amp; save <script>alert(1)</script> https://example.com/?a=1&amp;b=2.",
    );
    assert.equal(
      parts.map((part) => part.text).join(""),
      "Read & save <script>alert(1)</script> https://example.com/?a=1&b=2.",
    );
    assert.deepEqual(
      parts.filter((part) => part.href).map((part) => part.href),
      ["https://example.com/?a=1&b=2"],
    );
    assert.equal(
      linkifyText("javascript:alert(1)").some((part) => part.href),
      false,
    );
  });

  it("preserves punctuation around multiple post links and balanced URL parentheses", () => {
    const value = "See (https://example.com/one), then https://example.com/a_(b).";
    const parts = linkifyText(value);
    assert.equal(parts.map((part) => part.text).join(""), value);
    assert.deepEqual(
      parts.filter((part) => part.href).map((part) => part.href),
      ["https://example.com/one", "https://example.com/a_(b)"],
    );
  });
});

describe("clip tiles", () => {
  it("distinguishes URL-only posts from quotes without treating protocols or prose as links", () => {
    assert.equal(isUrlOnlyText("https://t.co/BZ9YpF6DOo"), true);
    assert.equal(
      isUrlOnlyText("  https://example.com/a\n\nhttps://example.com/b?x=1&amp;y=2  "),
      true,
    );
    assert.equal(isUrlOnlyText("https://example.com/a_(b)"), true);
    assert.equal(isUrlOnlyText("Look at https://example.com"), false);
    assert.equal(isUrlOnlyText("https://example.com is useful"), false);
    assert.equal(isUrlOnlyText(""), false);
    assert.equal(isUrlOnlyText(" \n "), false);
    assert.equal(isUrlOnlyText("javascript:alert(1)"), false);
    assert.equal(isUrlOnlyText("ftp://example.com/file"), false);
    assert.equal(isUrlOnlyText("(https://example.com)"), false);
  });

  it("takes plain excerpts at word boundaries without stripping punctuation", () => {
    assert.equal(
      truncateTileText("  A local-first tool\nwith full-control features.  ", 27),
      "A local-first tool with…",
    );
    assert.equal(truncateTileText("short text", 30), "short text");
    assert.equal(truncateTileText("https://t.co/BZ9YpF6DOo"), "https://t.co/BZ9YpF6DOo");
  });

  it("does not split Unicode graphemes", () => {
    assert.equal(truncateTileText("👩🏽‍💻👩🏽‍💻👩🏽‍💻", 2), "👩🏽‍💻👩🏽‍💻…");
    assert.equal(truncateTileText("café naïve résumé", 12), "café naïve…");
  });

  it("preserves post paragraphs and list lines while truncating at newline boundaries", () => {
    const text = "A local-first tool.\r\n\r\n-  First link\r\n- Second link";
    assert.equal(
      truncateTileText(text, 190, true),
      "A local-first tool.\n\n- First link\n- Second link",
    );
    assert.equal(truncateTileText("First\nSecond\nThird", 9, true), "First…");
    assert.equal(truncateTileText("First\nSecond\nThird", 190), "First Second Third");

    const post = {
      ...makeClip("note"),
      data: clipFrontmatterSchema.parse({
        kind: "tweet",
        slug: "post-with-lines",
        clippedAt: baseDate,
        platform: "x",
        url: "https://x.com/person/status/1",
        author: { name: "A person", handle: "person" },
        text,
        postedAt: baseDate,
      }),
    };
    assert.equal(
      getClipTileContent(post).excerpt,
      "A local-first tool.\n\n- First link\n- Second link",
    );
  });

  it("supports all five kinds without changing content or substituting avatars for media", () => {
    const fixtures = [
      {
        kind: "link",
        url: "https://example.com/link",
        title: "A useful link",
        description: "A source description.",
        favicon: "/favicon.png",
        ogImage: "/link.png",
      },
      {
        kind: "tweet",
        platform: "x",
        url: "https://x.com/person/status/1",
        author: { name: "A person", handle: "person", avatar: "/avatar.png" },
        text: "A local-first tool &amp; a link.",
        postedAt: baseDate,
        media: [{ src: "/post.png" }],
      },
      {
        kind: "image",
        src: "/image.png",
        width: 1200,
        height: 800,
        alt: "A saved diagram",
        sourceUrl: "https://www.example.com/image",
      },
      {
        kind: "video",
        url: "https://vimeo.com/1",
        provider: "vimeo",
        title: "A useful video",
        thumbnail: "/video.png",
      },
      { kind: "note" },
    ];
    const clips = fixtures.map((fixture, index) => ({
      ...makeClip("note"),
      data: clipFrontmatterSchema.parse({
        ...fixture,
        slug: "tile-" + index,
        clippedAt: baseDate,
        tags: ["saved"],
      }),
      body: "Original note text.",
    }));
    const original = structuredClone(clips);
    const tiles = clips.map(getClipTileContent);
    assert.deepEqual(clips, original);
    assert.deepEqual(
      tiles.map((tile) => tile.image),
      ["/link.png", "/post.png", "/image.png", "/video.png", undefined],
    );
    assert.deepEqual(
      tiles.map((tile) => tile.title),
      ["A useful link", "A person", "A saved diagram", "A useful video", "Saved note"],
    );
    assert.equal(tiles[1].excerpt, "A local-first tool & a link.");
    assert.equal(tiles[2].source.label, "example.com");
    assert.equal(tiles[4].excerpt, "Original note text.");
    assert.equal(tiles[4].source.url, undefined);

    const post = clips[1];
    post.data = { ...post.data, media: undefined };
    post.data.text = "https://t.co/BZ9YpF6DOo";
    const urlOnly = getClipTileContent(post);
    assert.equal(urlOnly.image, undefined);
    assert.equal(urlOnly.source.icon, "/avatar.png");
    assert.equal(urlOnly.title, "A person");
    assert.equal(urlOnly.excerpt, "https://t.co/BZ9YpF6DOo");
  });
});
