# Raj’s clips

Raj’s saved collection has its own identity. These styles belong to this site; they don't change the main portfolio, blog, public Cliplink template, or Cliplink product site. Local CSS owns the design, with no remote stylesheet connecting it to the portfolio.

## Appearance

An oversized cobalt masthead sits beside the collection on desktop. Both use ordinary page scrolling; the masthead stops sticking in short windows and becomes a horizontal header on phones. The name is “Raj’s clips” in the header, browser title, RSS, and share images. “About me” links to Raj’s personal site.

Light mode uses mist `#EDF2FC`, cobalt `#2344D2`, navy ink `#202C48`, and slate metadata `#53627C`. Images have white backing. Dark mode uses navy `#141E35`, pale ink `#EDF2FC`, blue links `#A8BCFF`, and muted text `#ACBAD3`. Tokens live in `apps/web/src/styles/site-foundation.css`; `global.css` handles the feed and reading layouts.

[Bricolage Grotesque](https://github.com/ateliertriay/bricolage) supplies both display and reading type. The site hosts the variable font locally under the SIL Open Font License, included in `apps/web/public/fonts/Bricolage-OFL.txt`. Mastheads and quotations use display optical sizing; body text uses automatic optical sizing. The font has no italic, so Markdown emphasis allows a synthesized slant.

## Where each clip begins and ends

We compared open side brackets with transparent frames using the actual feed. Brackets left each clip’s right edge unclear in the two-column view. Thin frames give every item a complete boundary, with a four-pixel corner radius and no fill or shadow. Hover and keyboard focus change the edge color; nothing tilts or animates into place.

Adjacent frames share a bottom edge, with the saved date and open link at their foot. Links lead with their real images when available, while posts lead with quotations and retain author attribution. URL-only posts use compact, full-width frames.

## Content and behavior

The two-column grid preserves chronological, row-major order. Tablet widths use one reading column beside the masthead; phones move the masthead above the feed. Don't pack gaps with masonry.

Previews keep the saved wording and actual media. Preserve paragraph breaks, source links, and attribution; mark shortened excerpts with an ellipsis. Don't invent summaries, covers, or headlines. Full text remains on existing permalinks, and the original Markdown files, assets, and slugs stay unchanged.

Search filters the static feed locally without sending the query elsewhere. Without JavaScript, clips and ordinary links still work; nonfunctional controls stay hidden. Keep visible keyboard focus and honor reduced motion. The theme script reads `raj-theme` before painting and shares an explicit preference across `.rajjoshi.me`; the favicon retains Raj’s octopus without repeating it in the masthead.

Share images use the same cobalt-and-mist palette, embedded font, and each clip’s real metadata. The default image says “Raj’s clips” once. Keep the commit SHA in the site footer.

## References

[Inspora](https://www.inspora.design/?category=Web) prompted the stronger composition; [Frank Chimero](https://frankchimero.com/) informed the separation of persistent identity from reading. [Jim Nielsen’s notes](https://notes.jim-nielsen.com/) provided a reference for source-led quotations.

[Are.na’s attribution guidance](https://help.are.na/docs/guides/handling-blocks-with-care) supports keeping collected material in context. [Raindrop’s layout documentation](https://help.raindrop.io/collections) distinguishes ordered grids from image-led moodboards, while [W3C C27](https://www.w3.org/WAI/WCAG22/Techniques/css/C27) explains why visual and DOM order should agree. These references inform the choices; they don't establish one best palette or layout.
