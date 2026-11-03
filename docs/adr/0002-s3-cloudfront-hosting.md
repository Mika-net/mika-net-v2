# ADR-0002: Host on S3 + CloudFront, provisioned by Terraform

- **Status:** Accepted, 2026-10-24 (design document §15)
- **Requirements:** `04-infrastructure.md` INF-10 – INF-42

## Context

Michael chose to make the site's infrastructure part of the portfolio. Managed hosts (Vercel, Cloudflare Pages) are the right answer for anyone who did not; they hide exactly the work he wants to show. The 2025 Terraform repository already exists.

## Decision

Private S3 buckets behind CloudFront with Origin Access Control, an ACM certificate, Route 53 records, a CloudFront Function for routing and a response-headers policy; two environments (`prod`, `dev`); all declared in `mika-net-infrastructure`; remote state in S3 with the native lockfile.

## Alternatives considered

- **Vercel** (current) — zero ops, preview deploys for free; configuration lives in a dashboard and demonstrates nothing.
- **Cloudflare Pages** — same trade-off, cheaper egress.
- **S3 website endpoint** — HTTP-only and incompatible with OAC; rejected in favour of REST origin + function.

## Consequences

About US$1–2/month. Every resource is code and reviewable. Preview-per-PR is harder than on Vercel (one shared `dev` environment at MVP). DNS cutover is a deliberate, human-approved step.
