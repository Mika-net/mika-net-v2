# 03 — Front end: Astro project, design system, pages, accessibility, performance

**Status:** v1.0, 2026-10-24. Implements `docs/DESIGN.md` §2, §5, §9 and decision V1 (restrained cyberpunk aesthetic). Phase 1 unless marked.

## Purpose

Defines the Astro project, the design system (tokens, type, motifs), every page's content, the islands policy and the budgets that CI enforces. Agents building any page or component work from this file plus `01-content.md`.

## Human prerequisites

None to start. Michael reviews the first rendered pages on `dev.mika-net.io` and may adjust token values; token names and budgets do not change without a PR to this file.

## Project setup

**FE-01** Scaffold with `pnpm create astro@latest` (template: minimal, TypeScript strictest), then add integrations: `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`, `sharp` (image service). No UI framework integration at MVP (see FE-31). No Tailwind or other utility framework: styles are plain CSS with custom properties, scoped per component, plus one global stylesheet. This is a deliberate reversal of the old site's Tailwind setup: a token-based design system is easier to read and audit as a portfolio piece.

**FE-02** `astro.config.mjs` MUST set: `site: process.env.SITE_URL ?? 'https://mika-net.io'`, `trailingSlash: 'always'`, `build: { format: 'directory', inlineStylesheets: 'auto' }`, `markdown: { shikiConfig: { themes: { light: 'github-light', dark: 'tokyo-night' }, defaultColor: false } }`, `image: { service: sharpImageService() }`.

**FE-03** Directory layout:

```
src/
  layouts/Base.astro             # html, head (via Head), header, main, footer
  components/
    Head.astro                   # title, meta, canonical, OG, JSON-LD slot (07-discoverability.md)
    Header.astro  Footer.astro  SkipLink.astro  ThemeToggle.astro
    Hero.astro  ProofPoints.astro
    PostCard.astro  PostMeta.astro  PillarBadge.astro  TagList.astro
    Callout.astro                # note2026 and similar
    Prose.astro                  # typographic wrapper for rendered Markdown
    resume/ResumeView.astro  resume/Timeline.astro (Phase 2)
  styles/
    tokens.css                   # the custom properties in FE-10/FE-11, both themes
    global.css                   # reset, base typography, focus, selection, print
    prose.css                    # Markdown output styling
  lib/
    pillars.ts  resume.ts  dates.ts  reading-time.ts  seo.ts
  pages/                         # routes per 01-content.md CNT-10
public/
  theme.js                       # FE-30
  fonts/                         # FE-13 (if not using fontsource)
  favicon.svg  favicon.ico  apple-touch-icon.png  site.webmanifest
```

## Design system — "restrained terminal"

The aesthetic is cyberpunk/hacker in mood — specifically the amber-phosphor terminal — and professional in execution. The reader is a hiring manager at a top-tier firm; the design must read as *precise*, not *themed*. The rule for any visual decision: if it would look at home in a well-made terminal emulator or a monospace code editor, it is in; if it would look at home on a gaming peripheral's box, it is out.

**FE-10** Colour tokens, dark theme (default). Revised 2026-11-03 after Michael's review: the accent moved from phosphor green to VT220 amber on a warm graphite, because blue-black plus saturated green read as HackerRank's palette; the soft green became the secondary (`--accent-2`, formerly `--amber`). Any change MUST keep the contrast ratios in FE-12.

```css
:root, [data-theme="dark"] {
  color-scheme: dark;
  --bg:          #0d0c0a;   /* warm graphite; never #000 */
  --bg-elev:     #16140f;   /* cards, header */
  --bg-inset:    #110f0b;   /* code blocks, inset panels */
  --fg:          #e4ddcf;   /* body text */
  --fg-muted:    #9d9380;   /* metadata, secondary */
  --fg-faint:    #6b6252;   /* decorative glyphs, disabled */
  --accent:      #f5b543;   /* amber phosphor (VT220): links on hover, focus, current item, cursor */
  --accent-dim:  #c48a2a;   /* link underlines, borders that carry meaning */
  --accent-2:    #8fd3a0;   /* the only secondary colour: "updated" markers, callouts, drafts */
  --danger:      #ff6b6b;   /* error states only (404, build-time warnings) */
  --line:        #2a2620;   /* hairlines */
  --line-strong: #3b352c;
  --selection:   rgba(245, 181, 67, 0.25);
}
```

**FE-11** Colour tokens, light "paper" theme. It is a designed alternative, not an inversion.

```css
[data-theme="light"] {
  color-scheme: light;
  --bg:          #f7f4ec;
  --bg-elev:     #ffffff;
  --bg-inset:    #efeadf;
  --fg:          #1f1b14;
  --fg-muted:    #5c5546;
  --fg-faint:    #847b6a;
  --accent:      #8a5a00;
  --accent-dim:  #b07a1e;
  --accent-2:    #0a6b3f;
  --danger:      #b42318;
  --line:        #dcd6c8;
  --line-strong: #c5bda9;
  --selection:   rgba(138, 90, 0, 0.18);
}
```

**FE-12** Contrast: `--fg` on `--bg` ≥ 7:1 in both themes; `--fg-muted` on `--bg` ≥ 4.5:1; `--accent` and `--accent-2` on `--bg` ≥ 4.5:1 wherever they carry text; `--fg-faint` is never used for text that conveys information. A unit test (`tests/tokens.test.ts`) parses `tokens.css` and asserts these ratios so a token tweak cannot silently fail accessibility.

**FE-13** Typography. Two families, self-hosted, latin subset, woff2, weights 400 and 600 only, four files, ≤ 120 KB total, `font-display: swap`, the two above-the-fold files preloaded:

- **IBM Plex Mono** — headings (`h1`–`h4`), navigation, metadata lines, buttons, labels, code, the hero prompt.
- **IBM Plex Sans** — body text, descriptions, résumé highlights, tables.

Fallback stacks: `ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace` and `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Use `@fontsource/ibm-plex-mono` and `@fontsource/ibm-plex-sans` (latin, 400/600) or copy the four files to `public/fonts/`; either way the files are first-party.

**FE-14** Type scale (fluid, `clamp()` between 360 px and 1280 px viewports):

| Token | Use | Size |
| --- | --- | --- |
| `--text-xs` | metadata, tags | 0.8125rem |
| `--text-sm` | captions, footer | 0.9375rem |
| `--text-md` | body | `clamp(1.0625rem, 1rem + 0.25vw, 1.125rem)` (17–18 px) |
| `--text-lg` | h4, lede | 1.25rem |
| `--text-xl` | h3 | 1.5rem |
| `--text-2xl` | h2 | `clamp(1.5rem, 1.3rem + 1vw, 1.875rem)` |
| `--text-3xl` | h1 | `clamp(1.875rem, 1.5rem + 1.5vw, 2.25rem)` |

Body line-height 1.6; headings 1.2; monospace metadata 1.4. Measure: `--measure: 72ch` for prose; code blocks and tables MAY extend to 90ch. Headings in mono at 600; no letter-spacing changes; no uppercase transforms except on `--text-xs` labels.

**FE-15** Motifs — permitted and expected:

- The home hero line begins with a prompt glyph `❯` in `--accent` and ends with a block cursor `▍` that blinks at 1 Hz via CSS; the blink is disabled under `prefers-reduced-motion: reduce`. The cursor glyph is `aria-hidden`.
- `h2` in prose carries a `::before` of `## ` in `--fg-faint` (a Markdown reference). `h3` carries `### `. Purely decorative, hidden from assistive tech by being generated content.
- Metadata lines are set in mono as key=value pairs separated by two spaces: `2022-12-16  judgement  4 min read`.
- Horizontal rules are a 1 px dashed `--line` border, not characters.
- Links are underlined with `text-decoration-color: var(--accent-dim)`, `text-underline-offset: 0.15em`; on hover and focus the text turns `--accent`.
- Focus ring: `outline: 2px solid var(--accent); outline-offset: 2px` on every focusable element; never removed.
- Selection uses `--selection`.
- The 404 page reads `$ cat /path/you/requested` — `No such file or directory` in mono, with links home and to the writing index.
- Optional (MAY): a background grid at ≤ 3 % opacity drawn with CSS gradients on `body`, 32 px cell, disabled in print.

**FE-16** Motifs — forbidden. Any of these fails review: text or box glow (`text-shadow`, coloured `box-shadow`), gradients other than the grid in FE-15, glitch, scanline, CRT or flicker effects, Matrix-style rain, parallax, autoplaying animation other than the cursor, custom cursors, sound, pure `#000` backgrounds, more than the two accent hues, images of code, stock photography, neon typefaces.

**FE-17** Code blocks: Shiki dual theme (FE-02) switched by `[data-theme]` via CSS variables, `--bg-inset` background, 1 px `--line` border, 4 px radius, horizontal scroll not wrap, a language label in the top-right in `--text-xs` mono, no line numbers by default, no copy button at MVP (adds JavaScript). Inline code uses `--bg-inset` with 2 px padding.

**FE-18** Radii 4 px (controls) and 8 px (cards); borders 1 px; spacing scale 4/8/12/16/24/32/48/64 px as `--space-*`. Shadows are not used.

## Theme switching and islands policy

**FE-30** Theme: `public/theme.js` (≤ 1 KB, plain ES5-compatible JavaScript, no module) is loaded with a blocking `<script src="/theme.js">` as the first element in `<head>` so the theme is set before first paint. It reads `localStorage.theme` (`'dark' | 'light'`), falls back to `prefers-color-scheme`, sets `document.documentElement.dataset.theme`, and exposes `window.__setTheme(name)`. All storage access is wrapped in `try/catch`. `ThemeToggle.astro` renders a `<button aria-pressed>` that calls it. This is the only JavaScript on content pages; it is external so the CSP (`06-security-operations.md` SEC-10) needs no hashes.

**FE-31** Islands: a component may ship client JavaScript only if this file names it: `Timeline` has none (build-time SVG), `Lenses` (Phase 3, `02-resume.md` RES-30), giscus (Phase 3, `09-comments-search.md`), Pagefind UI (Phase 3). Implement islands as vanilla `<script>` in an Astro component or as a Preact island (`@astrojs/preact`) when state management warrants it; never React. `client:visible` or `client:idle`, never `client:load`, unless the island is above the fold.

**FE-32** Budgets, enforced by Lighthouse CI (`05-pipelines.md` PIPE-10):

| Page class | JavaScript (gzipped, excluding `theme.js`) | Fonts | Images above fold | LCP (simulated 4G, mobile) | CLS |
| --- | --- | --- | --- | --- | --- |
| Content pages (`/`, `/posts/*`, `/about/`, `/now/`, `/colophon/`, `/tags/*`) | 0 KB | ≤ 120 KB | ≤ 200 KB | < 1.5 s | < 0.1 |
| Résumé (`/resume/`) | ≤ 40 KB (0 KB until Phase 3) | ≤ 120 KB | 0 | < 1.5 s | < 0.1 |
| Writing index (`/posts/`) | 0 KB (Pagefind in Phase 3: ≤ 40 KB, loaded on interaction) | ≤ 120 KB | ≤ 200 KB | < 1.5 s | < 0.1 |

Lighthouse categories Performance, Accessibility, Best Practices, SEO MUST each be ≥ 95 on `/`, `/posts/`, the newest post and `/resume/`.

## Pages

**FE-40** Home `/`. Above the fold at 390 × 844 and 1280 × 800, in order:

1. `Hero`: `h1` "Michael Johnson", a mono line `❯ Lead Engineer — cloud-first, event-driven systems on AWS and .NET; teams that ship daily without outages ▍` (exact copy is Michael's; this is the placeholder), then
2. `ProofPoints`: three mono tiles, each an `<a>`: `9 engineers led` → `/resume/#alight`, `millions of users served` → `/resume/#alight`, `incidents −87.3%` → `/resume/#alight` (retargeted to the post once it exists, `02-resume.md` RES-31). Numbers come from `resume.json` highlights, not hard-coded copy, so they cannot drift from the résumé.
3. Three actions: **Résumé** (`/resume/`, primary style), **Writing** (`/posts/`), **Contact** (`/about/#contact`).

Below the fold: *Selected writing* — posts with `featured: true` (max 3), else the three newest; each as `PostCard` (date, title, description, pillar). Phase 2 adds *Now* (first 240 characters of the newest entry, link) and *Selected projects* (featured projects). Footer.

**FE-41** Post `/posts/[id]/`: `h1` title; `PostMeta` line (date, pillar badge, reading time, `updated` in `--accent-2` if `updatedDate` present); `Callout` with `note2026` if present; hero image via `<Image>` with `heroAlt` if present (max width = measure, `loading="eager"` since above the fold); body inside `Prose`; `TagList`; a one-line footer "Michael Johnson · Lessons Distilled"; Phase 3: comments slot. No previous/next navigation at MVP; no share buttons ever.

**FE-42** Writing index `/posts/`: `h1` "Lessons Distilled" with the tagline "Lessons learned from building things" beneath in mono; posts grouped under `h2` year headings, newest first; each item: date (mono), title (link), description, pillar badge. Drafts show a `draft` badge in `--accent-2` on dev builds. Phase 2 MAY add a pillar filter as plain links to `/tags/`-style pillar pages (no JavaScript).

**FE-43** About `/about/`: renders `pages/about.md` inside `Prose`; the `## Contact` heading MUST have `id="contact"` (Astro's default heading ids will produce `contact`; assert it in a test). Profile links come from `resume.json`.

**FE-44** Now `/now/`: `h1` "Now", the `updated` date in mono directly under it, the newest entry's body. One sentence of explanation of what a Now page is, linking to nownownow.com, in `--fg-muted`.

**FE-45** Colophon `/colophon/`: ten sentences maximum on the stack (Astro, S3, CloudFront, Terraform, GitHub Actions over OIDC), with links to both repositories and to the posts that explain each decision as they are written. This page is the "infrastructure is portfolio" surface and MUST be linked from the footer.

**FE-46** 404 `/404.html`: see FE-15. MUST be a static page (no request path available without JavaScript; the `$ cat` line uses a generic path).

**FE-47** Header: site name (mono, links home) left; nav right: `writing` `projects` (Phase 2) `résumé` `about` in mono lowercase; `ThemeToggle` at the far right. Current section marked with `aria-current="page"` and an `--accent` underline. On viewports < 640 px the nav wraps to a second line; no hamburger menu, no JavaScript.

**FE-48** Footer: `now` `rss` `colophon` · `github` `linkedin` `stack overflow` · email · "© Michael Johnson, 2022–<build year>". Profile links carry `rel="me"`.

## Accessibility

**FE-50** WCAG 2.2 AA throughout. Specifically: one `h1` per page; heading levels never skip; landmarks `header`, `nav` (labelled), `main`, `footer`; `SkipLink` as the first focusable element; all images have alternative text or `alt=""` when decorative; colour never the only carrier of meaning (the pillar badge has text, the current nav item has an underline and `aria-current`); focus visible (FE-15); minimum target size 24 × 24 CSS px; `prefers-reduced-motion` honoured; `lang="en"` on `<html>`; code blocks keyboard-scrollable (`tabindex="0"` on overflow containers with an accessible name).

**FE-51** Checked by: axe via Lighthouse CI (serious and critical violations fail), plus a manual keyboard-only pass of every page class before each phase ships (recorded in the PR).

## Responsive layout

**FE-60** Single column, `max-width: var(--measure)`, centred, 16 px side gutters at < 640 px and 24 px above. Breakpoints: 640 px (nav wraps below), 960 px (résumé two-column above). No horizontal scrolling at 320 px except inside code blocks. Images never exceed the column.

## Acceptance criteria

- [ ] `pnpm build` produces every route in `01-content.md` CNT-10 with no `TODO(michael)` on prod builds.
- [ ] `tests/tokens.test.ts` passes the contrast assertions for both themes.
- [ ] Lighthouse CI on `dev.mika-net.io` reports ≥ 95 in all four categories on `/`, `/posts/`, newest post, `/resume/`, and the resource budgets in FE-32 pass.
- [ ] Toggling the theme produces no flash of wrong theme on reload (verify with the Performance panel or by eye on a slow profile).
- [ ] With JavaScript disabled, every page is fully readable and navigable; only the theme toggle is inert.
- [ ] Keyboard-only walkthrough recorded in the MVP PR for all page classes.
- [ ] At 320 px width, no horizontal scrollbar on any page outside code blocks.

## Agent notes

- Load the `frontend-design` skill (if available in your environment) before the first visual pass, with this file as the brief. Its purpose is to avoid template-looking defaults; it does not override anything here.
- Build tokens and `global.css` first, then `Base.astro`, then one page end to end (`/posts/[id]/`), then the rest. Do not build all components before any page renders.
- Shiki's dual-theme output needs the CSS in FE-17 to select the right variables under `[data-theme]`; follow the Astro docs for `defaultColor: false`.
- Measure font file sizes after subsetting and record them in the PR; FE-13's 120 KB is a ceiling.
- The hero copy and proof-point targets are placeholders until Michael edits them; keep them in one file (`src/content/pages/home.md` or `src/data/home.ts`) so the edit is a one-file change.
