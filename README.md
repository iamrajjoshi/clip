# clip.rajjoshi.me

A static clippings site that collects links, tweets, images, videos, and notes as repo-backed markdown. Built with Astro and deployed to GitHub Pages.

> The `clip` CLI that authors clips is a **separate npm package** — see [The `clip` CLI](#the-clip-cli) below.

## Table of Contents

- [What this is](#what-this-is)
- [Tech Stack](#tech-stack)
- [Develop](#develop)
- [Build](#build)
- [Content Structure](#content-structure)
- [Deployment](#deployment)
- [The `clip` CLI](#the-clip-cli)

## What this is

`clip.rajjoshi.me` is a static clippings site. Each clip is a single markdown file in the repo, rendered by Astro into a feed of cards and individual permalink pages. There is no database, backend, or runtime service — the repo's content collection is the source of truth and Astro generates a static site from it.

## Tech Stack

- [Astro 5](https://astro.build) — static site generator, content collections, React islands
- [Tailwind CSS v4](https://tailwindcss.com) — styling
- [React](https://react.dev) — interactive islands (card rendering, embeds)
- [pnpm](https://pnpm.io) workspaces — package management
- Static output, deployed to [GitHub Pages](https://pages.github.com)

## Develop

Requires Node.js and pnpm.

```bash
pnpm install
pnpm dev
```

The dev server starts the Astro site with hot reload. The web app lives in `apps/web`.

Lint, test, and format:

```bash
pnpm lint
pnpm test
pnpm format:check
```

## Build

Produce the static site in `apps/web/dist`:

```bash
pnpm build
```

Always run `pnpm build` before shipping changes.

## Content Structure

- Clip markdown files live in `apps/web/src/content/clips/` (one file per clip)
- Clip assets (images, downloaded media) live in `apps/web/public/clips/<slug>/`
- The clip schema and types are defined in `apps/web/src/content/schema.ts`
- The Astro content collection is registered in `apps/web/src/content/config.ts`
- Card rendering components live in `apps/web/src/components/cards/`

Clip kinds: `link`, `tweet`, `image`, `video`, `note`. One markdown file per clip; assets live in `apps/web/public/clips/<slug>/`.

## Deployment

The site is deployed with GitHub Actions to GitHub Pages.

- GitHub Actions builds `apps/web` and deploys `apps/web/dist` to Pages
- `apps/web/public/CNAME` must contain `clip.rajjoshi.me`
- DNS should point `clip.rajjoshi.me` at `iamrajjoshi.github.io`

See [`docs/architecture.md`](docs/architecture.md) and [`runbooks/README.md`](runbooks/README.md) for system flow and deployment recovery.

## The `clip` CLI

The CLI that authoring clips is a separate project, published as the `@clip/cli` npm package and developed in [iamrajjoshi/clip-cli](https://github.com/iamrajjoshi/clip-cli).

Install it globally to publish clips into this repository:

```bash
npm install -g @clip/cli
```

For CLI documentation — authentication, configuration, `clip init`, remote and local publishing modes, and the full command and flag reference — see the [clip-cli repository](https://github.com/iamrajjoshi/clip-cli).
