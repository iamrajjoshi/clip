# Architecture

```mermaid
flowchart LR
  CLI["packages/clip-cli"] -->|writes markdown and assets| Content["apps/web/src/content and public/clips"]
  Content --> Astro["Astro static build"]
  Astro --> Pages["GitHub Pages"]
```

The CLI is local-first. It detects and scrapes an input, validates clip metadata,
then writes content and assets into the web application's repository-backed content
collection. Astro builds that content into a static site. There is no database,
backend, or runtime service.
