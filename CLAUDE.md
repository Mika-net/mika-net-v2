# CLAUDE.md — Mika-netv2 (the site at mika-net.io)

This repository (`Mika-net/Mika-netv2`, public) is Michael Johnson's personal site, mika-net.io: a static Astro site, deployed to S3 + CloudFront by GitHub Actions over OIDC, with infrastructure in the sibling repository `mika-net-infrastructure`. It is both a publication and a portfolio piece, so the way it is built matters as much as what it shows.

## Start here, every session

1. Read `docs/requirements/00-overview.md` (conventions, environments, definition of done, hard rules).
2. Read the requirement file for the domain you are working in (`docs/requirements/01-…` to `09-…`). Each requirement has an ID; cite IDs in commits and PRs.
3. Check `docs/HUMAN-TASKS.md` for anything your task depends on that only Michael can do. If it is unticked, say so and stop rather than working around it.
4. `docs/DESIGN.md` is the intent; `docs/adr/` are the accepted decisions. Do not re-litigate them in a task; propose a new ADR if you think one is wrong.

## Hard rules (also in 00-overview.md)

- No server, API, database, auth, CMS or newsletter. Ever, without a new ADR.
- Published URLs never change. The four legacy posts keep their ids, including `SMTP` in upper case.
- No secrets in git. No AWS access keys anywhere. OIDC only.
- Zero client-side JavaScript on content pages except `public/theme.js`. Islands only where `03-frontend.md` names them.
- Do not rewrite the body of an existing post.
- Do not run `terraform apply`/`destroy`, change DNS, delete anything, or touch the old repositories (`Mika-net`, `mika-net-api`) except to read.
- Ask before anything irreversible or anything that would change a decision in `docs/DESIGN.md` §15.

## Stack and commands

- Node 22 LTS, pnpm (Corepack), Astro 7 (whatever `package.json` pins; the content-layer API from Astro 5 is what the docs describe), TypeScript 6 (`astro check` does not support 7 yet), strictest config. Plain CSS with custom properties; no Tailwind.
- `pnpm install --frozen-lockfile` · `pnpm dev` · `pnpm build` (includes post-build checks) · `pnpm test` (Vitest) · `pnpm astro check` · `pnpm resume:pdf` (Playwright) · `pnpm new post "Title"`.
- Environments: `dev.mika-net.io` from any PR; `mika-net.io` from `main` after Michael approves in the `production` environment.

## Working style

- Build vertically: tokens → base layout → one page end to end → the rest. Open a PR early; the dev URL is the review surface.
- Conventional Commits with requirement IDs in the body (`feat(resume): render /resume/ from resume.json (RES-06, RES-07)`). **Commits are authored by Michael alone: never add `Co-Authored-By`, `Claude-Session` or any other agent trailer** (Michael's instruction, 2026-11-03; it affects his copyright claim).
- Every PR description lists the requirement IDs it covers and any it defers, with a reason.
- Prefer the smallest dependency; justify every new one in one line.
- When the `frontend-design` skill is available, load it before the first visual pass with `docs/requirements/03-frontend.md` as the brief. The aesthetic is "restrained terminal": dark-first on warm graphite, IBM Plex Mono headings, one amber-phosphor accent (VT220) with a soft green secondary, no glow, no gradients, no glitch.
- Verify before claiming done: run the acceptance criteria in the requirement file and paste the evidence (command output, Lighthouse scores, screenshots) in the PR.

## State of the code (2026-11-03)

CI runs on every PR and on `main` (`.github/workflows/ci.yml`: build + tests + type check + résumé PDF + internal links; gitleaks + audit; Lighthouse budgets) with no AWS involved yet. Required checks for branch protection: `build`, `checks`, `lighthouse`. Run the same locally with `pnpm verify`.

A front-end prototype exists: tokens, layout, all MVP routes, the four migrated posts, the résumé page with its PDF, RSS, sitemap, robots, tests. No AWS, no CI, no OG images, no giscus yet. See README.md "Prototype status" for what is covered and what is deferred, and `docs/HUMAN-TASKS.md` for the placeholders only Michael can fill (`TODO(michael)`; a production build refuses them).

## Who you are talking to

Michael is a lead engineer; be direct, skip pleasantries, show evidence, and push back with reasons when a request conflicts with these documents.
