# Project

`clip.rajjoshi.me` is a static clippings site backed by markdown content. The `clip` CLI is developed in a separate repository ([iamrajjoshi/cliplink](https://github.com/iamrajjoshi/cliplink)) and published as the `cliplink` npm package; this repository is site-only.

## Stack

- pnpm workspaces
- `apps/web`: Astro 5, Tailwind v4, React islands, static output

## Layout

- `apps/web/src/content/config.ts`: Astro collection registration
- `apps/web/src/content/schema.ts`: shared clip schema and types
- `apps/web/src/components/cards/`: feed and permalink card rendering

## Commands

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm test`
- `pnpm format:check`

## Content Conventions

- Clip kinds: `link`, `tweet`, `image`, `video`, `note`
- One markdown file per clip in `apps/web/src/content/clips/`
- Assets live in `apps/web/public/clips/<slug>/`
- Copy stays lowercase-first and cards remain native to the site
- TypeScript variables and functions use camelCase; types and components use PascalCase.
- Test files use the `*.test.ts` suffix and should avoid shared mutable state.

## Do Not

- Add a backend for v1
- Add third-party social embeds
- Hand-edit generated frontmatter unless debugging the CLI
- Skip `pnpm build` before shipping changes
