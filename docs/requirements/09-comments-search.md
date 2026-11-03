# 09 — Comments (giscus) and search (Pagefind)

**Status:** v1.0, 2026-10-24. Implements `docs/DESIGN.md` §8 (D4, D6). **Phase 3.** Both are optional additions with their own ADRs; neither is needed for the site to serve its purpose.

## Purpose

Comments give readers a way to reply and give Michael the user-facing result the 2025 rebuild tried to build, with no backend: giscus stores comments as GitHub Discussions on the site repository and authenticates commenters on GitHub's side. Search is added only when the archive is large enough to need it.

## Human prerequisites

- Decide whether comments are wanted at all (`docs/DESIGN.md` §8 says "no comments" remains acceptable).
- Enable GitHub Discussions on `Mika-net/mika-net-v2`, create a category *Posts* (announcement type, so only maintainers open threads), and install the giscus GitHub App on the repository.
- Choose the moderation stance (GitHub's tools; nothing on the site).

## Requirements — comments

**CMT-01** giscus is loaded only on post pages, below the post footer, under a `h2` "Comments" and a one-line note that commenting uses a GitHub account. Mapping `pathname`; category *Posts* (id from the giscus configurator); `data-strict="1"`; `data-reactions-enabled="1"`; `data-input-position="top"`; `data-lang="en"`; `data-loading="lazy"`.

**CMT-02** The giscus `<script>` is injected by a small island that first renders a "Load comments" button; the script loads on click or when the section scrolls into view, whichever first, so the content page's JavaScript budget (`03-frontend.md` FE-32) is unaffected until the reader asks for comments. The island is ≤ 2 KB and vanilla.

**CMT-03** Theme: pass `data-theme` as `light` or `dark` matching `[data-theme]`, and post a message to the giscus iframe on theme toggle so it follows (`03-frontend.md` FE-30 exposes `window.__setTheme`; extend it to dispatch a `themechange` event).

**CMT-04** CSP (`06-security-operations.md` SEC-10) gains `frame-src https://giscus.app` and `script-src 'self' https://giscus.app`. Nothing else changes.

**CMT-05** The four 2022–2023 posts get comments like any other post; no retroactive import exists (the 2025 comment store was never in production).

**CMT-06** If comments are later removed, the Discussions remain on GitHub; removing the island and the CSP entries is the whole change.

## Requirements — search

**SRCH-01** Pagefind is added when the archive has 15 or more non-draft posts, and not before. Trigger recorded in the decision log when it happens.

**SRCH-02** `pagefind --site dist` runs as the last step of `pnpm build`, indexing only `main` content (`data-pagefind-body` on the post body, `data-pagefind-ignore` on nav, footer, code-block language labels). Index output goes to `dist/pagefind/` and is deployed as hashed-like assets with `max-age=86400`.

**SRCH-03** The search UI appears only on `/posts/`: a mono input `❯ search` that loads the Pagefind UI script on focus (≤ 40 KB gzipped budget for that page, `03-frontend.md` FE-32). No search on the home page; no site-wide keyboard shortcut.

**SRCH-04** Results show title, pillar, date and a highlighted excerpt, in the site's tokens (override Pagefind's CSS variables; do not ship its default theme).

## Acceptance criteria

- [ ] A post page without interaction loads no giscus script (check the network panel); clicking "Load comments" loads it and renders the thread.
- [ ] A comment posted on dev appears under the Discussions category *Posts* with the pathname title.
- [ ] Theme toggle switches the comment iframe without reload.
- [ ] (Search) `/posts/` Lighthouse budget still passes with Pagefind present; a query for "Native AOT" returns the post.

## Agent notes

- giscus's own configurator at https://giscus.app produces the `data-repo-id` and `data-category-id` values; they are not secrets and go in `src/data/site.ts`.
- Pagefind runs as a post-build CLI (`pnpm dlx pagefind` or a dev dependency); it does not need an Astro integration.
