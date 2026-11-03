# ADR-0001: Build the site with Astro 5

- **Status:** Accepted, 2026-10-24 (design document §15)
- **Requirements:** `03-frontend.md` FE-01, FE-31; `01-content.md` CNT-01

## Context

The 2025 rebuild on Next.js grew API routes, auth and a database because the framework made it easy. The site is a content site: four posts, a résumé, a handful of pages. It needs typed content, zero client JavaScript by default, and a small island model for the résumé page.

## Decision

Use Astro 5 with content collections (content layer, Zod schemas), MDX, and islands only where `03-frontend.md` names them. Plain CSS with custom properties; no utility framework.

## Alternatives considered

- **Next.js static export** — known stack, but application-framework gravity; the on-ramp to the 2025 sprawl.
- **Hugo** — fast, but no island model for the résumé interactivity and Go templates are a poor fit for this author.
- **Eleventy** — viable; Astro's typed collections and image pipeline tipped it.

## Consequences

Typed frontmatter fails the build on bad content. Content pages ship 0 KB JavaScript. A future island (lenses, comments) is additive. Agents must resist adding server features; the framework does not stop them, the non-goals do.
