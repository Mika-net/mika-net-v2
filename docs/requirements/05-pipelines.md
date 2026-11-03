# 05 — Pipelines: GitHub Actions for the site and the infrastructure

**Status:** v1.0, 2026-10-24. Implements `docs/DESIGN.md` §8 (D3), §11, §12. Phase 1.

## Purpose

Every change reaches AWS through a workflow in the repository, authenticated by OIDC, gated by the checks in this file. The pipelines are also part of the portfolio: a reader of either repository should be able to understand how a commit becomes the live site from the workflow files alone.

## Human prerequisites (see `docs/HUMAN-TASKS.md`)

- Repository variables from `04-infrastructure.md` INF-41 set in both repositories.
- GitHub Environment `production` created in both repositories with Michael as required reviewer and deployment branch restricted to `main`.
- Branch protection on `main` in both repositories: PR required, the status checks named in PIPE-04 and PIPE-21 required, linear history, no force-push.
- The infra `apply` workflow needs `TF_VAR_budget_email` as a repository secret (the only secret in either repository).

## Requirements — site repository (`Mika-netv2`)

### General

**PIPE-01** Two workflows: `.github/workflows/ci.yml` (on `pull_request` to `main`) and `.github/workflows/deploy-prod.yml` (on `push` to `main`, plus `workflow_dispatch`). Both declare `permissions: { contents: read, id-token: write, pull-requests: write }` at the job level, nothing broader.

**PIPE-02** Every third-party action is pinned to a full commit SHA with a trailing comment naming the version (`# v4.2.2`). Renovate keeps them current (PIPE-14). Allowed actions: `actions/checkout`, `actions/setup-node`, `pnpm/action-setup`, `actions/cache`, `aws-actions/configure-aws-credentials`, `treosh/lighthouse-ci-action`, `lycheeverse/lychee-action`, `gitleaks/gitleaks-action`, `actions/github-script`, `actions/upload-artifact`. Anything else needs a line in the PR.

**PIPE-03** Concurrency: `ci.yml` uses `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`; `deploy-prod.yml` uses `group: deploy-prod, cancel-in-progress: false` so production deploys serialise and never cancel mid-sync.

**PIPE-04** Status checks that branch protection requires (job names): `build`, `checks`, `lighthouse`; `deploy-dev` joins the required set once it exists. *Implemented 2026-11-03 in `ci.yml` without the deploy jobs.*

### `ci.yml` jobs, in order

**PIPE-05** `build`: checkout; `pnpm/action-setup` (reads `packageManager`); `setup-node` with `.nvmrc` and pnpm cache; `pnpm install --frozen-lockfile`; `pnpm astro check`; `pnpm test` (Vitest: content, tokens, resume, router fixtures); `pnpm build` with `SITE_URL=https://dev.mika-net.io INCLUDE_DRAFTS=true`; upload `dist/` as an artifact. The post-build scripts in `01-content.md` CNT-19 and `02-resume.md` RES-11 run inside `pnpm build`.

**PIPE-06** *As implemented 2026-11-03:* internal links are checked by `scripts/check-links.mjs` inside the `build` job (no external dependency; every `href`/`src`/`srcset` into the site must resolve to a built file; `REQUIRE_GENERATED=1` also demands `resume.pdf`); external links are not fetched yet. Secrets: the gitleaks **CLI** via its container image over the full history in the `checks` job, because the gitleaks GitHub Action requires a licence for organisation repositories (`.gitleaks.toml`). `pnpm audit` runs in the same job (SEC-09). The requirements mirror (PIPE-15) is not yet implemented. Original specification — `checks` (needs `build`): download `dist/`; **links** with lychee over `dist/**/*.html` (`--offline` for internal links MUST pass; external links run with `--accept 200,204,206,301,302,308 --max-retries 2` and failures are reported as a warning annotation, not a failure); **secrets** with gitleaks over the full history of the PR's commits; **requirements mirror** per PIPE-15.

**PIPE-07** `deploy-dev` (needs `checks`; runs only when the PR's head is in this repository — `if: github.event.pull_request.head.repo.full_name == github.repository` — because the repository is public and fork PRs get no OIDC token): assume `AWS_ROLE_ARN_DEV` via `configure-aws-credentials` (`role-session-name: mika-net-dev-${{ github.run_id }}`, `aws-region: us-east-1`); sync per PIPE-09 to `S3_BUCKET_DEV`; invalidate `CF_DIST_ID_DEV` with path `/*`; comment on the PR with `actions/github-script` — one comment, edited in place on later runs — containing the dev URL, the commit SHA, and the deploy time.

**PIPE-08** `resume-pdf` runs inside `build` after `astro build`: install Playwright's Chromium (`pnpm exec playwright install --with-deps chromium`, cached by `actions/cache` on the Playwright version); serve `dist/` locally (`pnpm exec serve dist -l 4321` or `astro preview`); load `http://localhost:4321/resume/`, `page.emulateMedia({ media: 'print' })`, wait for fonts (`document.fonts.ready`), `page.pdf({ path: 'dist/resume.pdf', format: 'Letter', printBackground: true, preferCSSPageSize: true })`; assert page count ≤ 2 with `pdf-lib` (fail the job otherwise); assert `pdftotext`-equivalent extraction contains "Michael Johnson". The script is `scripts/render-resume-pdf.mjs` and also runs locally with `pnpm resume:pdf`.

**PIPE-09** S3 sync strategy (a script `scripts/deploy.sh <bucket>` used by both environments), in this order so a reader never sees HTML referencing a missing asset:

1. `aws s3 sync dist/ s3://<bucket>/ --exclude "*" --include "_astro/*" --cache-control "public, max-age=31536000, immutable"` (hashed assets first).
2. `aws s3 sync dist/ s3://<bucket>/ --exclude "_astro/*" --exclude "*.html" --exclude "resume.pdf" --cache-control "public, max-age=86400"` (fonts, images, feeds, manifest).
3. `aws s3 sync dist/ s3://<bucket>/ --exclude "*" --include "*.html" --include "resume.pdf" --cache-control "public, max-age=0, must-revalidate"` with explicit `--content-type` where S3's guess is wrong (`.xml`, `.webmanifest`, `.pdf`).
4. `aws s3 sync dist/ s3://<bucket>/ --delete --exclude "_astro/*"` to remove stale pages while keeping old hashed assets for 24 h (a separate monthly cleanup is unnecessary; the bucket lifecycle handles noncurrent versions).
5. `aws cloudfront create-invalidation --distribution-id <id> --paths "/*"`.

**PIPE-10** *As implemented 2026-11-03:* an independent `lighthouse` job builds with the production `SITE_URL` (so `robots.txt` allows crawling and SEO is measured) and `STRICT_PLACEHOLDERS=0`, runs `@lhci/cli autorun` against `staticDistDir` with the assertions in `.lighthouserc.json`, writes the scores to the job summary (`scripts/lighthouse-summary.mjs`) and uploads the reports as an artifact. It needs no deployment, so it runs today; a run against `dev.mika-net.io` after `deploy-dev` is optional later. Original specification — `lighthouse` (needs `deploy-dev`): `treosh/lighthouse-ci-action` against `https://dev.mika-net.io/`, `/posts/`, the newest post URL (computed in `build` and passed as an output), `/resume/`; `runs: 3`, mobile preset, `configPath: .lighthouserc.json`. Assertions (fail on error): `categories:performance`, `categories:accessibility`, `categories:best-practices`, `categories:seo` each `minScore: 0.95`; `largest-contentful-paint` `maxNumericValue: 1500`; `cumulative-layout-shift` `maxNumericValue: 0.1`; `resource-summary:script:size` `maxNumericValue: 1024` on content pages and `40960` on `/resume/` (via a second config entry for that URL); `resource-summary:font:size` `maxNumericValue: 122880`; `axe` serious/critical via the accessibility category. Upload the HTML reports as an artifact and post the four scores into the same PR comment as PIPE-07.

### `deploy-prod.yml` jobs

**PIPE-11** `build` as PIPE-05 but `SITE_URL=https://mika-net.io` and no `INCLUDE_DRAFTS`; `checks` as PIPE-06; `deploy-prod` in `environment: production` (waits for Michael's approval, which is also what makes the OIDC `sub` match `environment:production`): assume `AWS_ROLE_ARN_PROD`, sync per PIPE-09 to `S3_BUCKET_PROD`, invalidate `CF_DIST_ID_PROD`.

**PIPE-12** `smoke` (needs `deploy-prod`): `curl` against production — `/` 200; `/posts/` 200; `/posts/shipping`, `/posts/SMTP`, `/posts/ai-plugins`, `/posts/ai-plugins-chatgpt` each 301 then 200 after following; `/resume/` 200; `/resume.pdf` 200 with `content-type: application/pdf`; `/rss.xml` 200; `/does-not-exist/` 404 with the 404 page body; `https://www.mika-net.io/posts/shipping/` 301 to the apex. Response headers checked for `strict-transport-security` and `content-security-policy`. Before the DNS cutover (`04-infrastructure.md` INF-42) the smoke job runs against the CloudFront domain with `--resolve mika-net.io:443:<cloudfront-ip>` or a `Host` header; a workflow input `smoke_base_url` selects which.

**PIPE-13** A failed `smoke` does not roll back automatically (there is nothing to roll back to safely in S3 without versioned-copy logic); it fails loudly, and the runbook in `06-security-operations.md` SEC-30 says to re-run the previous successful `deploy-prod` run via `workflow_dispatch` on that commit.

### Dependency hygiene

**PIPE-14** `renovate.json` at the root of both repositories: `extends: ["config:recommended", ":pinDigests", "helpers:pinGitHubActionDigests"]`, `schedule: ["before 6am on monday"]`, `labels: ["deps"]`, grouped minor/patch updates for npm, separate PRs for Astro majors and Terraform providers, `automerge: false`. If Renovate's GitHub App cannot be installed on the organisation, Dependabot with equivalent `dependabot.yml` (weekly, grouped) is the fallback.

**PIPE-15** Requirements mirror check (in `checks`): `diff docs/requirements/04-infrastructure.md ../mika-net-infrastructure/docs/REQUIREMENTS.md` is not possible in CI across repositories; instead, `ci.yml` fetches `https://raw.githubusercontent.com/Mika-net/mika-net-infrastructure/main/docs/REQUIREMENTS.md` and diffs it against the local file, failing with a message to sync them. Skipped (warning) if the fetch fails.

## Requirements — infrastructure repository (`mika-net-infrastructure`)

**PIPE-20** `plan.yml` on `pull_request`: for each root in `envs/{global,dev,prod}` as a matrix: checkout; `hashicorp/setup-terraform` pinned; assume `AWS_ROLE_ARN_PLAN`; `terraform init -backend-config="bucket=${TF_STATE_BUCKET}"`; `fmt -check`; `validate`; `tflint`; `plan -no-color -out=tfplan`; post the plan summary (resource counts and the `+/~/-` lines) as one PR comment per root, edited in place. `terraform test` for the router fixtures (`04-infrastructure.md` INF-13).

**PIPE-21** Required status checks: `plan (global)`, `plan (dev)`, `plan (prod)`.

**PIPE-22** `apply.yml` on `push` to `main`: same matrix, `environment: production`, assume `AWS_ROLE_ARN_APPLY`, `plan -out=tfplan` then `apply tfplan` (apply exactly what was planned in the same job). Order: `global` first, then `dev` and `prod` in parallel (`needs`). `TF_VAR_budget_email` from the repository secret. Concurrency group `apply`, no cancel.

**PIPE-23** `apply.yml` MUST NOT run `destroy`; destruction of anything is a local, human-run operation (`04-infrastructure.md` INF-50) or a PR that removes the resource and is applied through the normal flow.

**PIPE-24** Both workflows use `permissions: { contents: read, id-token: write, pull-requests: write }` and pin actions by SHA (PIPE-02 applies).

## Acceptance criteria

- [ ] A PR in `Mika-netv2` produces: a green `build`, `checks`, `deploy-dev`, `lighthouse`; one PR comment with the dev URL and four Lighthouse scores; `resume.pdf` as a build artifact.
- [ ] A merge to `main` waits for approval in `production`, deploys, and `smoke` passes with all legacy URLs redirecting.
- [ ] Workflow wall-clock from push to `smoke` green is under 10 minutes (`docs/DESIGN.md` §1).
- [ ] No action in either repository is referenced by a mutable tag.
- [ ] A PR in `mika-net-infrastructure` shows three plan comments; a merge applies `global` then `dev`/`prod` and leaves a second `plan` on the same commit empty.
- [ ] Deleting `AWS_ROLE_ARN_DEV` from repository variables makes `deploy-dev` fail at credential exchange, not later (proves no fallback credentials exist).

## Agent notes

- Compute the newest post URL in `build` by reading `dist/rss.xml` or a small JSON the build writes (`dist/_build/newest-post.json`) and expose it as a job output for `lighthouse`.
- `configure-aws-credentials` needs `id-token: write`; forgetting it is the most common failure and the error message is misleading (`Credentials could not be loaded`).
- Keep `scripts/deploy.sh` POSIX `sh`-compatible and idempotent; it runs from both workflows and from a laptop in an emergency.
- Do not add a `workflow_dispatch` path that skips `checks`.
