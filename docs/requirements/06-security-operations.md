# 06 — Security, operations and cost

**Status:** v1.0, 2026-10-24. Implements `docs/DESIGN.md` §12. Phase 0 for SEC-01/02; Phase 1 for the rest.

## Purpose

A static site has almost no attack surface. What remains: the credentials already leaked into git, the deploy path into AWS, the supply chain of build dependencies, and the headers the site sends. This file closes each, and records the runbooks for the few things that can go wrong.

## Human prerequisites

SEC-01 and SEC-02 are Michael's alone; they involve his GitHub and AWS accounts. Everything after can be done by an agent except where marked.

## Requirements

### Phase 0 — leaked credentials (human)

**SEC-01** Before the production cutover (Phase 1 gate), Michael MUST regenerate or delete the GitHub OAuth App whose client secret is in `Mika-net/.env.production` (commit `6f29521`), and delete `.env.production` and the secret line in `DEPLOYMENT.md` from the `Mika-net` working tree. Revised 2026-11-03: the repositories have always been private and the `NEXTAUTH_SECRET` only ever existed on the unmerged `feature/add-dynamodb` branch, never in a deployment, so this is a pre-launch hygiene item rather than an incident.

**SEC-02** If any of the three repositories is public, or will be made public, Michael MUST rewrite history to remove the secrets (`git filter-repo --invert-paths --path .env.production` and a replacement rule for the `NEXTAUTH_SECRET` value in `DEPLOYMENT.md`), force-push, and ask GitHub Support to purge cached views if the repository was public. Archiving a private repository with the secrets in history is acceptable only after SEC-01 has made them worthless.

### Secrets policy

**SEC-03** gitleaks runs in CI on every PR in both repositories (`05-pipelines.md` PIPE-06, PIPE-20) with the default ruleset plus a custom rule for `NEXTAUTH_SECRET`-style base64 strings of 40+ characters next to `=`. A pre-commit hook (`.githooks/pre-commit`, enabled by `git config core.hooksPath .githooks`, documented in README) runs `gitleaks protect --staged`. The hook is a convenience; CI is the control.

**SEC-04** The only secret in either repository's GitHub settings is `TF_VAR_budget_email` in the infrastructure repository. Everything else the workflows need is a variable (role ARNs, bucket names, distribution ids), because none of it is sensitive. No AWS access keys exist in GitHub, on Michael's machine for CI purposes, or in any file.

**SEC-05** No IAM users. Michael's own access is through IAM Identity Center (or, at minimum, a single admin role assumed with MFA); root has MFA and is not used day to day. Agents never create IAM users or access keys (`00-overview.md`).

### Deploy path

**SEC-06** The four OIDC roles in `04-infrastructure.md` INF-23 are the only principals that write to AWS from CI. Their trust policies pin repository and either `pull_request` or `environment:production`; their permission policies enumerate resources by ARN. A quarterly review (human, five minutes) checks that no role has drifted toward `*` resources.

**SEC-07** Production deploys and infrastructure applies run in the GitHub Environment `production` with Michael as the required reviewer. This is both a control and a portfolio feature: a reader sees approvals on every production change.

### Supply chain

**SEC-08** Lockfiles committed (`pnpm-lock.yaml`, `.terraform.lock.hcl`); `pnpm install --frozen-lockfile` in CI; Actions pinned by SHA; Renovate weekly (`05-pipelines.md` PIPE-14). New npm dependencies need a one-line reason in the PR; dependencies with install scripts are reviewed (pnpm's `onlyBuiltDependencies` allowlist in `package.json`, e.g. `sharp`, `esbuild`).

**SEC-09** `pnpm audit --audit-level=high` runs in `checks` and fails on high or critical findings with an available fix; findings without a fix are recorded as a PR comment and tracked.

### Headers

**SEC-10** Content Security Policy, set at the edge (`04-infrastructure.md` INF-15), one string per environment maintained in `envs/<env>/main.tf`:

```
default-src 'none';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'self';
manifest-src 'self';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

`style-src 'unsafe-inline'` is required because Astro inlines small scoped stylesheets; it is acceptable for a site with no user-generated content. `script-src 'self'` works because the theme script is an external file (`03-frontend.md` FE-30). Phase 3 adds `frame-src https://giscus.app; script-src 'self' https://giscus.app` for comments (`09-comments-search.md`). Any other change to the CSP needs a line in the PR explaining what needed it.

**SEC-11** The remaining headers per INF-15: HSTS with preload (submit to the preload list only after a month of stable HTTPS; human task), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` denying camera, microphone, geolocation.

**SEC-12** Verified in `smoke` (`05-pipelines.md` PIPE-12) and, monthly, by Mozilla Observatory or `securityheaders.com` (human, two minutes; record the grade in the Now page if Michael likes).

### Backups and recovery

**SEC-20** Content and configuration are in git on GitHub; that is the primary backup. Site buckets keep 30 days of noncurrent versions; the state bucket keeps 90 days. Nothing else needs backing up.

**SEC-21** Recovery scenarios and their procedure, kept short because each is rare:

| Scenario | Procedure |
| --- | --- |
| Bad deploy (site broken after `main` merge) | Re-run the previous green `deploy-prod` via `workflow_dispatch` on that commit; then fix forward. |
| Bad `apply` (infra broken) | Revert the PR; the next `apply` restores. If the state is corrupt, restore the previous state object version in the state bucket, then `plan`. |
| AWS account lost | New account; `bootstrap-state.sh`; apply `global`, `dev`, `prod`; change name servers at the registrar. Expected time: under two hours. |
| GitHub account lost | Local clones are complete copies; push to a new remote. |
| Domain expiry | Registrar auto-renew on and a calendar reminder two months before expiry (human). |
| Certificate | ACM renews automatically while the validation CNAMEs exist; never delete them. |

### Cost control

**SEC-30** AWS Budget at US$10/month with alerts (INF-24). Michael checks the Cost Explorer once after the first full month and records the number in `docs/HUMAN-TASKS.md`; the success criterion is under US$5.

**SEC-31** Price class `PriceClass_100` on CloudFront (North America and Europe edges) keeps egress at the lowest tier; readers elsewhere are served from those edges with slightly higher latency, which is acceptable for this audience.

### Runbooks

**SEC-40** `docs/runbooks/` in the site repository holds one file per procedure above, each under 30 lines, written so Michael can follow it at 2 a.m. without this document. Agents create them in Phase 1 from SEC-21.

## Acceptance criteria

- [ ] gitleaks in CI catches a planted fake secret in a test PR (then the PR is closed, not merged).
- [ ] `gh secret list` in the site repository is empty; in the infra repository shows only `TF_VAR_budget_email`.
- [ ] `aws iam list-users` in the account returns no users created for this project.
- [ ] Production deploy waits for approval; an unapproved run expires without deploying.
- [ ] `curl -sI https://mika-net.io/` shows every header in SEC-10/SEC-11; Observatory grade A or better.
- [ ] Each runbook in `docs/runbooks/` has been read once by Michael.

## Agent notes

- Treat SEC-01/02 as blockers for Phase 1 PRs that would make the new repository public; the new repository itself never contains the secrets, but the organisation's older repositories do.
- When adding the giscus CSP entries in Phase 3, keep the MVP CSP as a comment above for the colophon's history.
