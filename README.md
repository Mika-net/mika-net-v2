# mika-net.io

[![ci](https://github.com/Mika-net/mika-net-v2/actions/workflows/ci.yml/badge.svg)](https://github.com/Mika-net/mika-net-v2/actions/workflows/ci.yml)

Michael Johnson's site: writing under the *Lessons Distilled* imprint, a résumé that is generated from one data file, and a worked example of a static site shipped the way production software is shipped.

- **Live:** https://mika-net.io (dev: https://dev.mika-net.io)
- **Stack:** Astro 5 · S3 + CloudFront · Terraform (`mika-net-infrastructure-v2`) · GitHub Actions over OIDC
- **Design document:** [`docs/DESIGN.md`](docs/DESIGN.md)
- **Requirements by domain:** [`docs/requirements/`](docs/requirements/) — start with `00-overview.md`
- **Decisions:** [`docs/adr/`](docs/adr/)
- **What Michael does himself:** [`docs/HUMAN-TASKS.md`](docs/HUMAN-TASKS.md)
- **For agents:** [`CLAUDE.md`](CLAUDE.md)

## Status

Phase 0 (reset) with a **front-end prototype** (2026-10-25). The repository holds the design, requirements, decisions, the résumé data and a working Astro site. Nothing is deployed; no AWS, CI or third-party integration exists yet.

### Prototype status

Covered: `03-frontend.md` FE-01 – FE-03, FE-10 – FE-18 (tokens, type, motifs), FE-30 (theme script), FE-40 – FE-48 (every MVP page), FE-50, FE-60; `01-content.md` CNT-01 – CNT-10, CNT-13 – CNT-17, CNT-19, CNT-20 (collections, migration of the four posts, placeholders check); `02-resume.md` RES-01 – RES-11 and RES-20 (the timeline, pulled forward from Phase 2 because it is build-time only); `07-discoverability.md` DISC-01 – DISC-03, DISC-05 – DISC-09 (head, RSS with full content and a stylesheet, sitemap, robots, JSON-LD). Tests: `tests/tokens.test.ts` (FE-12 contrast ratios, both themes), `tests/content.test.ts` (legacy ids, frontmatter, résumé schema).

Deferred, by design: DISC-04 generated OG images (the site preview image is a placeholder); everything in `04-`, `05-`, `06-`, `08-`, `09-`; Lighthouse CI (FE-32 budgets are met by construction — 0 KB JavaScript except `theme.js` — but not yet measured); the font preload in FE-13.

Known gaps for Michael: `TODO(michael)` in About and Now; three profile URLs in `src/data/resume.json`; the hero line and proof-point labels in `src/data/home.ts`; the four migrated cover images are the old stock photos and may be better removed (the design prefers no cover by default).

## Local development (once Phase 1 lands)

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev            # http://localhost:4321
pnpm build          # dist/ with post-build checks
pnpm test
pnpm verify         # what CI runs: check, test, build, internal links
```

## Publishing a post

```sh
pnpm new post "Title of the post"   # scaffolds src/content/posts/<slug>/index.md as a draft
# write, then open a PR: the pipeline deploys it to dev.mika-net.io and comments the URL
# set draft: false, merge, approve the production deploy
```

## License

Code: MIT (see `LICENSE`). Writing and images under `src/content/`: © Michael Johnson, all rights reserved unless a post says otherwise.
