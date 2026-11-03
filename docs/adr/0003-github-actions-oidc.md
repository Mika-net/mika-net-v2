# ADR-0003: Deploy with GitHub Actions over OIDC; no long-lived AWS credentials

- **Status:** Accepted, 2026-10-24 (design document §15)
- **Requirements:** `05-pipelines.md`; `04-infrastructure.md` INF-22, INF-23; `06-security-operations.md` SEC-04 – SEC-07

## Context

The existing pipeline is Vercel's Git integration: invisible to a reader of the repository. The deploy path must be code, and it must not involve AWS access keys stored anywhere.

## Decision

GitHub Actions workflows in both repositories; jobs assume IAM roles via OIDC with trust policies pinned to repository and `pull_request` or `environment:production`; production deploys and infrastructure applies run in a GitHub Environment with Michael as required reviewer.

## Alternatives considered

- **Vercel Git integration** — current; not code.
- **AWS CodePipeline** — more AWS to explain, less legible than workflow files.
- **Access keys in GitHub secrets** — rejected on principle.

## Consequences

No secrets in the site repository; one (`TF_VAR_budget_email`) in the infra repository. The `environment:production` subject means the apply role cannot be assumed until the Environment exists — intended.
