# ADR-0004: Comments, if any, via giscus on GitHub Discussions (Phase 3)

- **Status:** Accepted, 2026-10-24 (design document §15)
- **Requirements:** `09-comments-search.md` CMT-01 – CMT-06

## Context

The 2025 rebuild spent most of its effort on GitHub-authenticated comments stored in DynamoDB behind a .NET API. giscus delivers the same user-facing result with no backend.

## Decision

If Michael wants comments, use giscus: comments live as Discussions on the site repository, commenters authenticate with GitHub, the script loads on demand. Default until Phase 3 is no comments.

## Alternatives considered

- **Build it** (2025 approach) — rejected; becomes a post instead.
- **No comments** — acceptable, remains the default.
- **Hosted services (Disqus etc.)** — tracking and weight; rejected.

## Consequences

Two CSP entries and one small island. Moderation is GitHub's tooling. Removing comments later is a one-PR change.
