# ADR-0010: The résumé is generated from one JSON Resume file

- **Status:** Accepted, 2026-10-24 (design document §15)
- **Requirements:** `02-resume.md`

## Context

Michael maintains a `.docx`. The site needs a web version, a PDF and structured data, and they must never disagree.

## Decision

`src/data/resume.json` in JSON Resume schema plus two optional extensions (lenses, evidence). Build renders `/resume/`, `/resume.json` (strict), `resume.pdf` (headless Chromium in CI) and the `Person` JSON-LD. Phone number omitted from all public outputs.

## Alternatives considered

- **Keep the `.docx` and link it** — drifts; not machine-readable.
- **Hand-written résumé page** — duplicates the data.
- **Third-party résumé builders** — lock-in.

## Consequences

One file to edit. PDF is always current and ATS-readable. Interactive features (timeline, lenses) are additive islands in later phases.
