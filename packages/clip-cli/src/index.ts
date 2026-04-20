#!/usr/bin/env node

import path from "node:path";
import { detectInput } from "./detect";
import { commitAndPush } from "./git";
import { serializeClip, writeClipFile } from "./markdown";
import { resolveProjectPaths } from "./paths";
import { collectPrompts } from "./prompts";
import { clipFrontmatterSchema, type ClipFrontmatter } from "./schema";
import { inspectImage } from "./scrapers/image";
import { scrapeLink } from "./scrapers/og";
import { scrapeTweet } from "./scrapers/tweet";
import { scrapeVideo } from "./scrapers/video";
import { baseSlugFromText, datedFilename, ensureUniqueSlug } from "./slug";
import { createLocalStorage } from "./storage";
import type { CliOptions } from "./types";
import { extFromContentType, fetchBuffer, pathExtFromUrl, sanitizeFilename, slugify } from "./utils";

function printHelp() {
  console.log(`clip <url | path | ->

options:
  --dry-run    print the clip that would be written without changing the repo
  --no-push    commit locally but skip git push
  --help       show this help
`);
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    noPush: false,
    help: false,
  };

  const positionals: string[] = [];

  for (const arg of argv) {
    if (arg === "--") {
      continue;
    }

    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (arg === "--no-push") {
      options.noPush = true;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`Unknown flag: ${arg}`);
    }

    positionals.push(arg);
  }

  if (positionals.length > 1) {
    throw new Error("Only a single input value is supported.");
  }

  options.input = positionals[0];
  return options;
}

async function downloadOptionalAsset({
  storage,
  slug,
  url,
  fallbackName,
  dryRun,
}: {
  storage: ReturnType<typeof createLocalStorage>;
  slug: string;
  url?: string;
  fallbackName: string;
  dryRun: boolean;
}) {
  if (!url) {
    return undefined;
  }

  const guessedExt = pathExtFromUrl(url);
  const safeBase = sanitizeFilename(path.basename(fallbackName, path.extname(fallbackName))) || "asset";

  if (dryRun) {
    return `/clips/${slug}/${safeBase}${guessedExt || path.extname(fallbackName)}`;
  }

  try {
    const { buffer, contentType } = await fetchBuffer(url);
    const resolvedExt = guessedExt || extFromContentType(contentType) || path.extname(fallbackName) || ".bin";
    return await storage.writeBuffer(slug, `${safeBase}${resolvedExt}`, buffer);
  } catch (error) {
    console.warn(`warning: could not download ${url}:`, error instanceof Error ? error.message : error);
    return undefined;
  }
}

function commitSubject(frontmatter: ClipFrontmatter) {
  switch (frontmatter.kind) {
    case "link":
      return frontmatter.title;
    case "tweet":
      return `@${frontmatter.author.handle}`;
    case "image":
      return frontmatter.alt ?? frontmatter.slug;
    case "video":
      return frontmatter.title;
    case "note":
      return frontmatter.slug;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const invocationCwd = process.env.INIT_CWD ?? process.cwd();

  if (options.help || !options.input) {
    printHelp();
    return;
  }

  const paths = await resolveProjectPaths(invocationCwd);
  const detection = await detectInput(options.input, invocationCwd);
  const storage = createLocalStorage(paths);
  const clippedAt = new Date();

  let frontmatter: ClipFrontmatter;
  let body: string;
  let assetPathsToStage: string[] = [];

  if (detection.kind === "link") {
    const scraped = await scrapeLink(detection.url.toString());
    const initialSlug = slugify(scraped.title) || slugify(detection.url.hostname) || "link";
    const slug = await ensureUniqueSlug(initialSlug, paths.contentDir);
    const prompts = await collectPrompts();
    const favicon = await downloadOptionalAsset({
      storage,
      slug,
      url: scraped.faviconUrl,
      fallbackName: "favicon.png",
      dryRun: options.dryRun,
    });
    const ogImage = await downloadOptionalAsset({
      storage,
      slug,
      url: scraped.ogImageUrl,
      fallbackName: "og-image.png",
      dryRun: options.dryRun,
    });

    if ((favicon || ogImage) && !options.dryRun) {
      assetPathsToStage = [path.join(paths.clipsAssetDir, slug)];
    }

    frontmatter = clipFrontmatterSchema.parse({
      kind: "link",
      slug,
      clippedAt,
      tags: [],
      url: detection.url.toString(),
      title: scraped.title,
      description: scraped.description,
      siteName: scraped.siteName,
      favicon,
      ogImage,
    });
    body = prompts.body;
  } else if (detection.kind === "tweet") {
    const scraped = await scrapeTweet(detection.url.toString());
    const initialSlug =
      slugify(`${scraped.author.handle}-${scraped.text.slice(0, 40)}`) ||
      `${scraped.author.handle}-tweet`;
    const slug = await ensureUniqueSlug(initialSlug, paths.contentDir);
    const prompts = await collectPrompts();
    const avatar = await downloadOptionalAsset({
      storage,
      slug,
      url: scraped.author.avatarUrl,
      fallbackName: "avatar.jpg",
      dryRun: options.dryRun,
    });
    const media = [];

    for (const [index, item] of scraped.media.entries()) {
      const stored = await downloadOptionalAsset({
        storage,
        slug,
        url: item.url,
        fallbackName: `media-${index + 1}.jpg`,
        dryRun: options.dryRun,
      });

      if (stored) {
        media.push({
          src: stored,
          alt: item.alt,
        });
      }
    }

    if ((avatar || media.length) && !options.dryRun) {
      assetPathsToStage = [path.join(paths.clipsAssetDir, slug)];
    }

    frontmatter = clipFrontmatterSchema.parse({
      kind: "tweet",
      slug,
      clippedAt,
      tags: [],
      platform: "x",
      url: detection.url.toString(),
      author: {
        name: scraped.author.name,
        handle: scraped.author.handle,
        avatar,
      },
      text: scraped.text,
      postedAt: scraped.postedAt,
      media: media.length ? media : undefined,
    });
    body = prompts.body;
  } else if (detection.kind === "video") {
    const scraped = await scrapeVideo(detection.url.toString());
    const initialSlug = slugify(scraped.title) || `${scraped.provider}-video`;
    const slug = await ensureUniqueSlug(initialSlug, paths.contentDir);
    const prompts = await collectPrompts();
    const thumbnail = await downloadOptionalAsset({
      storage,
      slug,
      url: scraped.thumbnailUrl,
      fallbackName: "thumbnail.jpg",
      dryRun: options.dryRun,
    });

    if (thumbnail && !options.dryRun) {
      assetPathsToStage = [path.join(paths.clipsAssetDir, slug)];
    }

    frontmatter = clipFrontmatterSchema.parse({
      kind: "video",
      slug,
      clippedAt,
      tags: [],
      url: detection.url.toString(),
      provider: scraped.provider,
      title: scraped.title,
      channel: scraped.channel,
      thumbnail,
    });
    body = prompts.body;
  } else if (detection.kind === "image") {
    const inspected = await inspectImage(detection.filePath);
    const initialSlug = slugify(inspected.stem) || "image";
    const slug = await ensureUniqueSlug(initialSlug, paths.contentDir);
    const prompts = await collectPrompts();
    const filename = `${sanitizeFilename(path.basename(inspected.filename, path.extname(inspected.filename))) || "image"}${path.extname(inspected.filename)}`;
    const src = options.dryRun
      ? `/clips/${slug}/${filename}`
      : await storage.copyLocalFile(slug, detection.filePath, filename);

    if (!options.dryRun) {
      assetPathsToStage = [path.join(paths.clipsAssetDir, slug)];
    }

    frontmatter = clipFrontmatterSchema.parse({
      kind: "image",
      slug,
      clippedAt,
      tags: [],
      src,
      width: inspected.width,
      height: inspected.height,
      alt: slug.replace(/-/g, " "),
    });
    body = prompts.body;
  } else if (detection.kind === "note") {
    const initialSlug = baseSlugFromText(detection.stdinText, "note");
    const slug = await ensureUniqueSlug(initialSlug, paths.contentDir);
    const prompts = await collectPrompts(detection.stdinText);

    frontmatter = clipFrontmatterSchema.parse({
      kind: "note",
      slug,
      clippedAt,
      tags: [],
    });
    body = prompts.body;
  } else {
    throw new Error(`Unsupported detection kind: ${String(detection)}`);
  }

  const filename = datedFilename(frontmatter.clippedAt, frontmatter.slug);
  const markdown = serializeClip(frontmatter, body);

  if (options.dryRun) {
    console.log(`# ${filename}\n`);
    console.log(markdown);
    return;
  }

  const clipFile = await writeClipFile(paths.contentDir, filename, markdown);
  const relativeClipFile = path.relative(paths.repoRoot, clipFile);
  const relativeAssets = assetPathsToStage.map((assetPath) => path.relative(paths.repoRoot, assetPath));

  commitAndPush({
    cwd: paths.repoRoot,
    paths: [relativeClipFile, ...relativeAssets],
    message: `clip: ${frontmatter.kind} - ${commitSubject(frontmatter)}`,
    noPush: options.noPush,
    dryRun: options.dryRun,
  });

  console.log(`saved ${frontmatter.kind} clip: ${filename}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
