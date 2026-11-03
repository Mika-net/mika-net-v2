# ADR-0009: Keep `/posts/[id]/` as the canonical post URL

- **Status:** Accepted, 2026-10-24 (design document §15)
- **Requirements:** `01-content.md` CNT-04, CNT-10, CNT-11

## Context

Renaming the section to `/writing/` reads slightly better but requires a redirect map for four URLs with little inbound traffic. The navigation label can say *Writing* regardless.

## Decision

Post URLs stay at `/posts/<id>/` with ids equal to the old slugs (`shipping`, `SMTP`, `ai-plugins`, `ai-plugins-chatgpt`), case preserved. The nav label is *Writing*; the section heading is *Lessons Distilled*.

## Alternatives considered

- **`/writing/` with 301s** — revisit only if a redirect mechanism exists for another reason.

## Consequences

No redirect map. A custom `generateId` in the content config to preserve case.
