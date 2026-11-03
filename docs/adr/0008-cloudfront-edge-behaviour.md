# ADR-0008: Routing and security headers at the CloudFront edge

- **Status:** Accepted, 2026-10-24 (design document §15)
- **Requirements:** `04-infrastructure.md` INF-13 – INF-15; `06-security-operations.md` SEC-10

## Context

OAC requires the S3 REST origin, which does not resolve `/path/` to `/path/index.html`. The four legacy post URLs have no trailing slash. `www` must redirect. Security headers should not depend on the origin.

## Decision

One CloudFront Function (viewer-request) does `www` → apex, `/path/` → `/path/index.html`, and `/path` (no extension) → 301 `/path/`. One response-headers policy sets HSTS, CSP and the rest. Custom error responses map S3 403/404 to the 404 page.

## Alternatives considered

- **S3 website endpoint** — resolves index documents but is HTTP-only and cannot be private.
- **Lambda@Edge** — heavier and slower than a CloudFront Function for four lines of logic.
- **Headers from the build** — S3 cannot set arbitrary response headers.

## Consequences

Routing logic is ten lines, unit-tested, and the same in both environments. The CSP is maintained in one place per environment.
