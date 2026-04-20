# Project

`clip.rajjoshi.me` is a static clippings site backed by markdown content and a local-first `clip` CLI.

## Stack

- pnpm workspaces
- `apps/web`: Astro 5, Tailwind v4, React islands, static output
- `packages/clip-cli`: TypeScript CLI run with `tsx`

## Layout

- `apps/web/src/content/config.ts`: Astro collection registration
- `apps/web/src/content/schema.ts`: shared clip schema and types
- `apps/web/src/components/cards/`: feed and permalink card rendering
- `packages/clip-cli/src/`: detection, scraping, prompts, markdown, storage, git

## Commands

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm clip -- <input>`

## Content Conventions

- Clip kinds: `link`, `tweet`, `image`, `video`, `note`
- One markdown file per clip in `apps/web/src/content/clips/`
- Assets live in `apps/web/public/clips/<slug>/`
- Copy stays lowercase-first and cards remain native to the site

## CLI Flow

1. Detect input kind
2. Scrape metadata and download assets
3. Prompt for tags and optional note
4. Validate against the shared Zod schema
5. Write markdown, then git add/commit/push unless disabled

## Do Not

- Add a backend for v1
- Add third-party social embeds
- Hand-edit generated frontmatter unless debugging the CLI
- Skip `pnpm build` before shipping changes
