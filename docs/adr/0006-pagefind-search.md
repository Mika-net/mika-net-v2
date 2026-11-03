# ADR-0006: Search with Pagefind, only once the archive needs it (Phase 3)

- **Status:** Accepted, 2026-10-24 (design document §15)
- **Requirements:** `09-comments-search.md` SRCH-01 – SRCH-04

## Context

Four posts do not need search. When the archive grows, search should remain static.

## Decision

Add Pagefind as a post-build step when there are 15 or more posts; UI only on the writing index, loaded on focus.

## Alternatives considered

- **Algolia** — a service for a static site; rejected.
- **No search** — the default until the threshold.

## Consequences

A build-time index served as static files; a bounded JavaScript budget on one page.
