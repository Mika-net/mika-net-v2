# 01 — Content model, URL scheme and migration

**Status:** v1.0, 2026-10-24. Implements `docs/DESIGN.md` §4–§6. Phase 1 unless marked.

## Purpose

All content is files in this repository, validated at build time. This file defines the collections, their schemas, the URL every page lives at, and the one-time migration of the four posts from the old `Mika-net` repository.

## Human prerequisites

None for the schemas and migration. Michael supplies the About page text, the first Now entry and the Projects entries (see `docs/HUMAN-TASKS.md`); agents scaffold placeholders marked `TODO(michael)` and the build MUST fail if a `TODO(michael)` string reaches a production build (CNT-19).

## Directory layout

```
src/
  content.config.ts            # collection definitions (Astro 5 content layer)
  content/
    posts/<slug>/index.md      # one directory per post; images beside it
    posts/<slug>/index.mdx     # MDX allowed when a post needs a component
    projects/<slug>.md
    now/YYYY-MM-DD.md          # one file per update; newest is rendered
    pages/about.md
  data/
    resume.json                # see 02-resume.md
```

## Requirements

### Collections and schemas

**CNT-01** Collections MUST be defined with Astro 5's content layer (`defineCollection` with the `glob` loader from `astro/loaders`) in `src/content.config.ts`. Schemas are Zod objects; a build MUST fail on any schema violation.

**CNT-02** The `posts` collection schema:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { basename, dirname } from 'node:path';

export const PILLARS = ['production', 'architecture', 'judgement', 'ai-engineering'] as const;

const posts = defineCollection({
  loader: glob({
    pattern: '**/index.{md,mdx}',
    base: './src/content/posts',
    // Entry id = the post's directory name, verbatim (case preserved). See CNT-04.
    generateId: ({ entry }) => basename(dirname(entry)),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(3).max(80),
      description: z.string().min(50).max(160),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      pillar: z.enum(PILLARS),
      tags: z.array(z.string().regex(/^[a-z0-9-]+$/)).default([]),
      series: z.string().optional(),
      heroImage: image().optional(),
      heroAlt: z.string().optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      canonicalURL: z.string().url().optional(),
      note2026: z.string().max(280).optional(),
    })
    .refine((p) => !p.heroImage || !!p.heroAlt, {
      message: 'heroAlt is required when heroImage is set',
    }),
});
```

Pillar display names: `production` → *Running production*, `architecture` → *Architecture on AWS and .NET*, `judgement` → *Engineering judgement*, `ai-engineering` → *AI-assisted engineering*. The mapping lives in one module (`src/lib/pillars.ts`) and nowhere else.

**CNT-03** The `projects` collection schema:

```ts
const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().max(80),
    summary: z.string().min(50).max(200),
    period: z.object({ start: z.coerce.date(), end: z.coerce.date().optional() }),
    role: z.string().max(60),
    stack: z.array(z.string()).min(1),
    links: z.object({
      repo: z.string().url().optional(),
      live: z.string().url().optional(),
      post: z.string().optional(),      // a posts entry id
    }).default({}),
    status: z.enum(['active', 'shipped', 'retired', 'experiment']).default('shipped'),
    featured: z.boolean().default(false),
  }),
});
```

An absent `period.end` means ongoing and renders as *2025 – present*.

**CNT-04** Entry ids for `posts` MUST equal the directory name verbatim. The default `generateId` slugifies to lower-case; the four existing posts include `SMTP`, so the custom `generateId` in CNT-02 is mandatory. A test (`tests/content.test.ts`) MUST assert that the ids `shipping`, `SMTP`, `ai-plugins`, `ai-plugins-chatgpt` exist.

**CNT-05** The `now` collection: `glob({ pattern: '*.md', base: './src/content/now' })`, schema `{ updated: z.coerce.date() }`, file name `YYYY-MM-DD.md` matching `updated`. The page renders the newest entry; older entries are kept in the repository and MAY be listed under a *Previously* heading.

**CNT-06** The `pages` collection: `glob({ pattern: '*.md', base: './src/content/pages' })`, schema `{ title: z.string(), updatedDate: z.coerce.date().optional() }`. Only `about.md` exists at MVP.

**CNT-07** `resume` is not a content collection; it is `src/data/resume.json` imported with type checking against the Zod schema in `02-resume.md`.

**CNT-08** Reading time MUST be computed at build (a remark plugin that writes `minutesRead` into `data.astro.frontmatter`, or an equivalent utility over the raw body), never stored in frontmatter. Display as `4 min read` using 230 words per minute.

**CNT-09** `draft: true` entries MUST be included in `local` and `dev` builds and excluded from `prod` builds. Control with an environment variable `INCLUDE_DRAFTS=true` set by the dev workflow; the prod workflow MUST NOT set it. Drafts are also excluded from the RSS feed and sitemap in all environments.

### URL scheme

**CNT-10** Published URLs MUST never change. The table below is the complete set of routes at MVP. Every URL is a directory with a trailing slash, served as `index.html` (`trailingSlash: 'always'`, `build.format: 'directory'` in `astro.config.mjs`).

| Route | Source | Notes |
| --- | --- | --- |
| `/` | `src/pages/index.astro` | Home (see `03-frontend.md` FE-40) |
| `/posts/` | `src/pages/posts/index.astro` | Writing index, grouped by year descending; heading *Lessons Distilled* |
| `/posts/[id]/` | `src/pages/posts/[id].astro` | Post; `[id]` is the collection entry id (CNT-04) |
| `/tags/[tag]/` | `src/pages/tags/[tag].astro` | Only generated for tags with ≥ 2 non-draft posts |
| `/projects/` | `src/pages/projects/index.astro` | Phase 2; MVP ships a short placeholder list only if ≥ 1 project exists, else route absent |
| `/projects/[id]/` | `src/pages/projects/[id].astro` | Phase 2 |
| `/resume/` | `src/pages/resume.astro` | `02-resume.md` |
| `/resume.pdf` | built by CI (`05-pipelines.md` PIPE-08) | Not an Astro route |
| `/resume.json` | `src/pages/resume.json.ts` | Strict JSON Resume output (`02-resume.md` RES-05) |
| `/about/` | `src/pages/about.astro` | Renders `pages/about.md`; contains the `#contact` section |
| `/now/` | `src/pages/now.astro` | Newest `now` entry |
| `/colophon/` | `src/pages/colophon.astro` | How the site is built, ten sentences, links to the infra repo |
| `/rss.xml`, `/sitemap-index.xml`, `/robots.txt` | `07-discoverability.md` | |
| `/404.html` | `src/pages/404.astro` | CloudFront maps S3 403/404 to it (`04-infrastructure.md` INF-14) |

**CNT-11** The four legacy URLs `/posts/shipping`, `/posts/SMTP`, `/posts/ai-plugins`, `/posts/ai-plugins-chatgpt` (no trailing slash, as the old Next.js site served them) MUST resolve: the CloudFront Function 301-redirects `/posts/<id>` to `/posts/<id>/` (`04-infrastructure.md` INF-13). The post-deploy smoke test (`05-pipelines.md` PIPE-12) MUST request all four without a slash and expect a 301 followed by a 200.

**CNT-12** `www.mika-net.io` MUST 301 to `https://mika-net.io` preserving the path (`04-infrastructure.md` INF-13).

### Migration of the four existing posts

**CNT-13** A one-time script `scripts/migrate-posts.ts` (run with `pnpm tsx`) MUST read `../Mika-net/_posts/*.md` and `../Mika-net/public/assets/blog/` and write `src/content/posts/<slug>/index.md` plus images, with this frontmatter mapping:

| Old field | New field | Transform |
| --- | --- | --- |
| file name `shipping.md` | directory `shipping/` | strip `.md`, keep case |
| `title` | `title` | trim trailing whitespace (`'Misadventures in SMTP and IMAP '` has one) |
| `excerpt` | `description` | see CNT-15 for the two that must be rewritten; truncate others to 160 chars at a sentence boundary |
| `date` | `pubDate` | keep the date part only (`2022-12-16`), drop the `T05:35:07.322Z` time, which was template filler |
| `coverImage` | `heroImage` + `heroAlt` | copy the file next to the post as `cover.jpg`; `heroAlt` initially the title (Michael improves it later) |
| `author` | — | dropped; single-author site |
| `ogImage` | — | dropped; generated at build (`07-discoverability.md`) |
| — | `pillar` | `shipping` → `judgement`; `SMTP` → `architecture`; `ai-plugins` → `ai-engineering`; `ai-plugins-chatgpt` → `ai-engineering` |
| — | `tags` | `shipping`: `['agile','shipping']`; `SMTP`: `['email','self-hosting','aws']`; `ai-plugins`: `['ai','tooling']`; `ai-plugins-chatgpt`: `['ai','chatgpt']` |
| — | `featured` | `shipping: true`; others false |

The script is committed, run once, and its output committed; it is not part of the build.

**CNT-14** Post bodies MUST be migrated verbatim except for: typo and apostrophe fixes; removing the duplicated `## Title` and `### Excerpt` headings at the top of each body (the old template repeated the frontmatter inside the body; the new layout renders them from frontmatter); converting any raw HTML to Markdown. No sentence is rewritten. Diffs of each body against the original MUST be reviewable in the migration PR.

**CNT-15** Two descriptions MUST be rewritten by hand in the migration PR, with Michael's approval in review:
- `SMTP` and `ai-plugins`: `Tonights cast` → `Tonight's cast` (keep the joke; fix the apostrophe).
- `ai-plugins-chatgpt`: the existing excerpt is generic boilerplate that never mentions ChatGPT. Replace with a one-sentence description of what the post actually argues, written from the body.

**CNT-16** Each migrated post MAY carry a `note2026` of up to 280 characters stating how Michael's view has moved since; the layout renders it in a *2026 note* callout above the body. Agents leave it empty; Michael fills it (human task).

### Projects, About, Now (Phase 1 placeholders, Phase 2 content)

**CNT-17** At MVP, `pages/about.md` MUST exist with the structure: one-paragraph who-I-am, a *What I'm looking for* paragraph, a *Contact* section (`## Contact` with id `contact`) listing email and the three profile links from `resume.json`. Body text is Michael's; agents scaffold with `TODO(michael)` markers.

**CNT-18** Initial `projects` entries (Phase 2) are seeded from Michael's own work, never from client work: `mika-net-io` (this site; `status: active`), `native-aot-lambda-api` (the 2025 API; `status: experiment`), `self-hosted-email` (from the SMTP post; `status: retired`). Michael adds or removes entries (human task).

**CNT-19** The production build MUST fail if any rendered page contains the literal string `TODO(michael)`. Implement as a post-build check over `dist/**/*.html` in `package.json` (`pnpm build` runs `astro build && node scripts/check-placeholders.mjs`).

### RSS content

**CNT-20** The RSS feed (`07-discoverability.md` DISC-03) SHOULD contain full post content for Markdown posts via Astro's container API; it MUST contain `description` and the link for every non-draft post.

## Acceptance criteria

- [ ] `pnpm build` fails on a post missing `description`, `pillar`, or `heroAlt`-with-`heroImage` (prove with a temporary fixture in the PR, then remove it).
- [ ] `tests/content.test.ts` passes: four legacy ids exist, no non-draft post has `TODO(michael)`.
- [ ] `dist/posts/SMTP/index.html` exists with that exact casing after `pnpm build`.
- [ ] The migration PR shows a readable body diff per post and the two rewritten descriptions.
- [ ] `/tags/ai/` is generated (two posts carry `ai`); `/tags/chatgpt/` is not (one post).
- [ ] Drafts appear on `dev.mika-net.io` and not on `mika-net.io` (verify after `05-pipelines.md` is live).

## Agent notes

- Use `pnpm astro sync` to regenerate collection types after schema edits.
- Do not hand-write slugs anywhere; always derive URLs from `entry.id`.
- The old repository is at `../Mika-net` on Michael's machine when both are checked out side by side; the migration script MUST take the source path as an argument with that default.
- `heroImage` via `image()` returns an `ImageMetadata`; render through `astro:assets` `<Image>`, never a raw `<img src>`.
