# 00 — Overview and shared conventions

**Status:** v1.0, 2026-10-24. Derived from `docs/DESIGN.md` (all decisions accepted).
**Read this file first.** Every other file in this directory assumes it.

## What these files are

`docs/requirements/` is the executable form of the design document: one file per domain, each stating what MUST exist, what MUST NOT, and how to prove it. They are written for two readers at once:

- **Michael**, who reviews them, decides what changes, and does the tasks in `docs/HUMAN-TASKS.md`.
- **Agents** (Claude Code or similar) that implement them. An agent is given one file, or one section of one file, as a task; it does not need the rest of the conversation that produced these files.

If a requirement here contradicts `docs/DESIGN.md`, this file wins for implementation detail and `DESIGN.md` wins for intent. If they contradict on intent, stop and ask.

## Reading order and dependencies

| File | Domain | Depends on | Phase |
| --- | --- | --- | --- |
| `00-overview.md` | Conventions, environments, definition of done | — | 0 |
| `01-content.md` | Content model, URL scheme, migration of the four existing posts | 00 | 1 |
| `02-resume.md` | `resume.json`, `/resume/`, `resume.pdf`, JSON-LD | 00, 01 | 1 (plain), 2–3 (interactive) |
| `03-frontend.md` | Astro project, design system (restrained cyberpunk), pages, accessibility, performance | 00, 01, 02 | 1 |
| `04-infrastructure.md` | Terraform: S3, CloudFront, ACM, Route 53, OIDC roles, budget | 00 | 1 |
| `05-pipelines.md` | GitHub Actions: site and infra workflows, checks, Lighthouse CI, Renovate | 00, 03, 04 | 1 |
| `06-security-operations.md` | Secrets, CSP, supply chain, backups, runbooks | 00, 04, 05 | 0–1 |
| `07-discoverability.md` | Sitemap, RSS, OG images, JSON-LD, canonical, robots | 00, 01, 03 | 1 |
| `08-analytics.md` | CloudFront logs → S3 → Athena | 04 | 2 |
| `09-comments-search.md` | giscus, Pagefind | 03, 06 | 3 |

Build order for Phase 1: 04 (infra bootstrap and `dev` environment) can run in parallel with 01 + 03; 05 needs both; 02 and 07 slot into 03 once pages exist.

## Requirement language

- **MUST / MUST NOT** — a hard requirement; a pull request that violates it is not merged.
- **SHOULD / SHOULD NOT** — the default; deviating requires a one-line justification in the PR description.
- **MAY** — allowed, not required.
- Each requirement has an ID (`CNT-03`, `INF-12`). Reference IDs in commit messages and PR descriptions so the trail from requirement to code is greppable.

## Repositories

| Repository | GitHub | Purpose | State today |
| --- | --- | --- | --- |
| `mika-net-v2` | `Mika-net/mika-net-v2` (public) | The site: Astro project, content, résumé data, site pipelines, these docs | Created 2026-11-03 as `Mika-netv2`, renamed the same day (GitHub redirects the old name) |
| `mika-net-infrastructure-v2` | `Mika-net/mika-net-infrastructure-v2` (to be created, public) | Terraform for everything in AWS | Drafted 2026-11-03, plan-only |
| `mika-net-infrastructure` | `Mika-net/mika-net-infrastructure` (private) | The 2025 Terraform (DynamoDB, Secrets Manager) | Kept read-only for history; its resources are destroyed from there after the Phase 2 measurements (INF-50) |
| `Mika-net` | `Mika-net/Mika-net` (private) | The 2022–2025 Next.js site | Live on AWS Amplify (Git-connected) until cutover; then kept read-only for history |
| `mika-net-api` | `Mika-net/mika-net-api` | 2025 .NET Native AOT API | Source for one post; then archived |

**Repository naming (2026-11-03):** second-generation repositories take the old name plus a `-v2` suffix, all lowercase: `mika-net-v2`, `mika-net-infrastructure-v2` (Michael's decision; the site repository was created as `Mika-netv2` and renamed on GitHub the same day). Lowercase because GitHub names are case-insensitive, so capitals carry no information, and everything derived from the name (the npm package name, AWS resource names, the domain) is lowercase by rule. The organisation stays `Mika-net`. A bare `mika-net` was ruled out because macOS filesystems and GitHub names are case-insensitive and it collides with the old `Mika-net`. AWS resource names keep the `mika-net-` prefix.

## Environments

| Name | Hostname | Deployed from | Robots | Purpose |
| --- | --- | --- | --- | --- |
| `prod` | `mika-net.io` (`www` redirects to apex) | push to `main` of `mika-net-v2` | index | The site |
| `dev` | `dev.mika-net.io` | any same-repository pull request in `mika-net-v2` (last writer wins; fork PRs build but do not deploy) | `noindex` header + `robots.txt` disallow | Preview and Lighthouse CI target |
| `local` | `http://localhost:4321` | `pnpm dev` | — | Authoring |

AWS region for everything: `us-east-1` (required for CloudFront's ACM certificate; everything else follows for simplicity).

## Naming

- AWS resources: `mika-net-<env>-<purpose>` (`mika-net-prod-site`, `mika-net-dev-logs`). Global resources: `mika-net-<purpose>` (`mika-net-tfstate-<account-id>`, `mika-net-github-oidc`).
- IAM roles: `mika-net-site-deploy-<env>`, `mika-net-infra-plan`, `mika-net-infra-apply`.
- GitHub Actions workflows: `ci.yml`, `deploy-prod.yml` (site); `plan.yml`, `apply.yml` (infra).
- Git branches: `main` only as a long-lived branch. Feature branches `feat/<topic>`, `fix/<topic>`, `content/<slug>`, `docs/<topic>`.
- Commits: Conventional Commits (`feat:`, `fix:`, `content:`, `docs:`, `infra:`, `ci:`, `chore:`). Reference requirement IDs in the body.

## Toolchain versions

| Tool | Version | Pin where |
| --- | --- | --- |
| Node.js | current LTS (22.x at time of writing) | `.nvmrc`, `engines` in `package.json`, `setup-node` in workflows |
| pnpm | 9.x or later | `packageManager` field in `package.json` (Corepack) |
| Astro | current major (7.4.2 installed 2026-10-25; the design document and ADR-0001 say "Astro 5" because that is where the content-layer API they rely on was introduced) | `package.json`, lockfile committed |
| TypeScript | 6.x (`astro check` does not yet support 7), strictest | `tsconfig.json` extends `astro/tsconfigs/strictest` |
| Terraform | ≥ 1.11 | `required_version` in `versions.tf`, `.terraform-version` |
| AWS provider | `~> 6.0` | `versions.tf`, lockfile committed |
| GitHub Actions | pinned to commit SHAs with a version comment | each workflow; Renovate keeps them current |

Agents MUST check the current latest versions when scaffolding rather than copying the numbers above; the numbers are a floor.

## Definition of done (any task from these files)

A task is done when all of the following are true:

1. The requirement IDs it covers are listed in the PR description, and each is either satisfied or explicitly deferred with a reason.
2. `pnpm build` (site) or `terraform validate` + `terraform plan` (infra) succeeds locally and in CI.
3. Every check in `05-pipelines.md` that applies is green.
4. No new dependency was added without a one-line reason in the PR.
5. Documentation that the change invalidates is updated in the same PR (these files, `CLAUDE.md`, ADRs).
6. Nothing in `docs/DESIGN.md` section 13 (non-goals) was introduced.
7. For anything visible: viewed once on a phone-width viewport and once with a keyboard only.

## What agents must never do in these repositories

- Add a server, API, database, authentication, CMS or newsletter. (`DESIGN.md` §13.)
- Change a published URL. (`01-content.md`, CNT-10.)
- Commit a secret, an `.env` file with values, or a Terraform state file. (`06-security-operations.md`.)
- Create AWS IAM users or access keys. OIDC roles only. (`04-infrastructure.md`.)
- Add client-side JavaScript to a content page beyond the theme toggle. (`03-frontend.md`, FE-30.)
- Rewrite the body of an existing post. Typo fixes and the 2026 note only. (`01-content.md`, CNT-14.)
- Run `terraform apply`, `terraform destroy`, DNS changes, or anything that touches production without Michael's explicit go-ahead in the task. Plans and dev deployments are fine.
- Touch the old repositories (`Mika-net`, `mika-net-api`) except to read them.

## How to ask versus decide

Decide and note it in the PR when the question is about implementation detail inside a requirement's stated bounds. Ask when: a requirement is impossible as written, two requirements conflict, a decision in `DESIGN.md` §15 would change, money would be spent beyond `DESIGN.md` §12's budget, or an action is irreversible (DNS, deletion, history rewrite).
