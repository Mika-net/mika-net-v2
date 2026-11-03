# ADR-0005: Analytics from CloudFront logs via Athena, no client script (Phase 2)

- **Status:** Accepted, 2026-10-24 (design document §15)
- **Requirements:** `08-analytics.md`

## Context

The questions that matter are few: which pages, how many résumé downloads, referrers, 404s. A client-side analytics script adds JavaScript, a privacy surface and a third party.

## Decision

Enable CloudFront standard logging to a private S3 bucket; query with Athena through a Glue table with partition projection; five saved queries; a ten-minute monthly ritual; 90-day retention.

## Alternatives considered

- **Plausible** — good, paid, still a script.
- **Cloudflare Web Analytics** — free, but a script and another vendor.
- **Google Analytics** — rejected for privacy and weight.

## Consequences

Zero bytes on the page; no consent banner. Numbers are approximate (IP-based uniques). Worth one post.
