# ADR-0007: Images and Open Graph cards generated at build

- **Status:** Accepted, 2026-10-24 (design document §15)
- **Requirements:** `07-discoverability.md` DISC-04; `01-content.md` CNT-02

## Context

The old site required a cover image, an `ogImage` and an author block before a post rendered; that friction is one reason posts stopped. Social cards should exist for every page without manual work.

## Decision

Astro's image pipeline (sharp) for responsive images; per-page OG images rendered at build with satori + resvg from a mono-typeset template; hero images optional.

## Alternatives considered

- **Hand-made covers** (current) — friction.
- **Third-party OG image service** — a dependency and a request per crawl.

## Consequences

Every page has a correct card for free. Build time grows slightly with the number of pages (negligible at this scale).
