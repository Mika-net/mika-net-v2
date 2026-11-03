# ADR-0011: Visual direction: restrained cyberpunk / terminal

- **Status:** Accepted, 2026-10-24 (design document §15)
- **Requirements:** `03-frontend.md` FE-10 – FE-18; design document §9 and decision V1

## Context

Michael likes cyberpunk and hacker aesthetics. The readers are hiring managers at top-tier firms and consulting practices, for whom neon, glitch and scanline effects read as hobbyist, and which cost legibility and performance.

## Decision

Dark-first on a near-black blue (never `#000`), IBM Plex Mono for headings, navigation, metadata and code, IBM Plex Sans for body, one phosphor-green accent with amber as the only secondary, terminal idioms (prompt glyph, blinking cursor off under reduced motion, key=value metadata, Markdown-style heading marks). A designed light "paper" theme. Forbidden: glow, gradients (beyond a ≤ 3 % grid), glitch, scanlines, CRT, Matrix rain, parallax, custom cursors, sound.

## Alternatives considered

- **Full neon cyberpunk** — fun; wrong for the reader.
- **Neutral typographic (serif) design** — the original §9 proposal; replaced by this at Michael's request.

## Consequences

The mood is unmistakable without any single element being loud. Contrast ratios are tested in CI, so taste changes cannot break accessibility.

## Amendment — 2026-11-03

After reviewing the prototype Michael judged the blue-black + phosphor-green palette too close to HackerRank's. The accent moved to VT220 amber (`#f5b543`) on a warm graphite (`#0d0c0a`), with the soft green demoted to the secondary token (`--accent-2`). Everything else in this decision stands. Token values are in `docs/requirements/03-frontend.md` FE-10/FE-11.
