# 07 — Discoverability: sitemap, feeds, social cards, structured data

**Status:** v1.0, 2026-10-24. Implements `docs/DESIGN.md` §10. Phase 1.

## Purpose

The site must be found by name (a recruiter searching "Michael Johnson" with a stack keyword, or following the LinkedIn link) and by topic (an engineer searching for Native AOT cold starts). Both are solved at build time with no third-party service.

## Human prerequisites

Search Console and Bing Webmaster verification, and updating the profile links on LinkedIn, GitHub and Stack Overflow, are Michael's (`docs/HUMAN-TASKS.md`). DNS-based verification records are added through Terraform once Michael has the tokens (`04-infrastructure.md` global root, a `verification_txt_records` variable).

## Requirements

### Head and metadata

**DISC-01** `Head.astro` renders, for every page: `<title>` as `Page title · Michael Johnson` (home: `Michael Johnson — Lead Engineer`); `<meta name="description">` from the page or post description (never empty, never over 160 characters); `<link rel="canonical">` as the absolute URL with trailing slash; `<meta name="theme-color">` for both schemes; `<link rel="alternate" type="application/rss+xml" title="Lessons Distilled — writing by Michael Johnson" href="/rss.xml">`; `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` plus `favicon.ico` and `apple-touch-icon.png`; `<link rel="manifest">`; viewport; charset; `<html lang="en">`.

**DISC-02** Open Graph and Twitter: `og:type` (`website` for home, `profile` for `/about/` and `/resume/`, `article` for posts with `article:published_time`, `article:modified_time`, `article:author`, `article:tag`); `og:title`, `og:description`, `og:url`, `og:site_name` (`Michael Johnson`), `og:image` (DISC-04), `og:image:width` 1200, `og:image:height` 630, `og:image:alt`; `twitter:card` `summary_large_image`. The dev environment sets the same tags (so previews can be checked) but carries the `noindex` header from the edge.

### Feeds and crawl files

**DISC-03** RSS at `/rss.xml` via `@astrojs/rss`: title `Lessons Distilled — writing by Michael Johnson`, description = the tagline, `site` from config, items = all non-draft posts newest first with `title`, `link`, `pubDate`, `description`, `categories` = tags, and `content` (full rendered HTML, `01-content.md` CNT-20); `customData` with `<language>en-us</language>`; stylesheet `rss.xsl` so the feed renders readably in a browser (an XSLT file in `public/`). Validate against the W3C feed validator once before launch (human, one minute).

**DISC-04** Open Graph images are generated at build: one per post and one each for home, `/about/`, `/resume/`, `/posts/`. Template: 1200 × 630, `--bg` dark token background, the title in IBM Plex Mono 600 wrapped to at most three lines, the pillar name and date in mono small caps beneath, `❯ mika-net.io` bottom-left, no photo, no gradient. Implemented with `satori` + `@resvg/resvg-js` in an Astro endpoint `src/pages/og/[...slug].png.ts` (static, `getStaticPaths` from the collections) so the images are ordinary build outputs cached by CloudFront. Fonts are the same four files as the site (`03-frontend.md` FE-13).

**DISC-05** Sitemap via `@astrojs/sitemap` at `/sitemap-index.xml`, excluding drafts, `/404/`, `/og/*` and any route with `noindex`. `robots.txt` is generated at build (`src/pages/robots.txt.ts`): prod allows all and lists the sitemap; dev disallows all (the edge header does the same; belt and braces).

### Structured data

**DISC-06** JSON-LD, one `<script type="application/ld+json">` per page, generated in `src/lib/seo.ts`:

- Home and `/about/`: `Person` from `resume.json` (`02-resume.md` RES-10) with `@id` `https://mika-net.io/#person`.
- `/resume/`: `Person` plus `ProfilePage` whose `mainEntity` is the person.
- Posts: `BlogPosting` with `headline`, `description`, `datePublished`, `dateModified`, `author` → `{ "@id": "https://mika-net.io/#person" }`, `publisher` → the same person, `mainEntityOfPage`, `image` (the OG image), `keywords` = tags, `wordCount`, `articleSection` = pillar display name, `isPartOf` → `Blog` named *Lessons Distilled*.
- `/posts/`: `Blog` with `blogPost` list of the ten newest.
- Every page except home: `BreadcrumbList` (Home → section → page).

Validated once before launch with Google's Rich Results Test and the Schema Markup Validator (human, five minutes).

**DISC-07** Footer profile links carry `rel="me"`. `/.well-known/` is not needed at MVP.

**DISC-08** `humans.txt` at `/humans.txt`: team (Michael), site stack (one line each), last update = build date. Linked from the colophon.

### Names and search

**DISC-09** The string `Michael Johnson` appears in `<title>` of every page, in the `Person` JSON-LD and in the footer; the string `Mika` appears once on `/about/` in the sentence explaining the domain and the earlier byline, so a search for either name lands here. The old byline `Mika Johnson` is not used anywhere else.

**DISC-10** After launch (human): verify the domain in Google Search Console and Bing Webmaster Tools (DNS TXT via Terraform variable), submit the sitemap, and set the LinkedIn *Website* field, the GitHub profile README link and the Stack Overflow *About me* link to `https://mika-net.io`. Check the name search result after four weeks and note it in `docs/HUMAN-TASKS.md`.

## Acceptance criteria

- [ ] `dist/rss.xml` validates; opening it in a browser shows a styled page.
- [ ] `dist/og/posts/shipping.png` exists, is 1200 × 630, and shows the full title; the LinkedIn Post Inspector and the Twitter/X card validator render it for the dev URL (human, two minutes, before launch).
- [ ] `dist/sitemap-index.xml` lists every route in `01-content.md` CNT-10 except `/404/` and excludes drafts and `/og/*`.
- [ ] Rich Results Test shows no errors for a post and for home.
- [ ] `curl https://dev.mika-net.io/robots.txt` disallows; `curl https://mika-net.io/robots.txt` allows and names the sitemap.
- [ ] Every page's `<title>` and `description` are unique (a test over `dist/` asserts it).

## Agent notes

- `satori` needs fonts as `ArrayBuffer`s and does not support variable fonts; use the static 400/600 Plex files.
- Keep the OG template as one Astro-independent function (`src/lib/og.tsx` or `.ts` returning satori markup) so it can be unit-tested without a build.
- `@astrojs/sitemap` needs `site` set; it already is (`03-frontend.md` FE-02).
