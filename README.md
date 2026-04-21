# clip.rajjoshi.me

A static clippings site plus a small `clip` CLI for saving links, tweets, images, videos, and notes into repo-backed markdown.

## Stack

- `apps/web`: Astro 5, Tailwind v4, React islands, Astro content collections
- `packages/clip-cli`: TypeScript CLI executed with `tsx`
- Hosting: GitHub Pages with `clip.rajjoshi.me`

## Workspace

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm clip -- <url|path|->
```

## Content Model

- Content files live in `apps/web/src/content/clips/`
- Clip assets live in `apps/web/public/clips/<slug>/`
- The schema is defined in `apps/web/src/content/schema.ts` and mounted in `apps/web/src/content/config.ts`

## CLI

`clip <url | path | ->`

- Detects the clip kind from the input
- Scrapes metadata and downloads local assets where available
- Applies built-in tags for supported domains and optionally captures a note
- Writes markdown into the Astro content collection
- Commits and pushes unless `--dry-run` or `--no-push` is passed

## Deployment

- GitHub Actions builds `apps/web` and deploys `apps/web/dist` to Pages
- `apps/web/public/CNAME` must contain `clip.rajjoshi.me`
- DNS should point `clip.rajjoshi.me` at `iamrajjoshi.github.io`
