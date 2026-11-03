# Architecture decision records

One file per accepted decision, numbered in the order they were made. Status is one of Proposed, Accepted, Superseded (by ADR-n), Rejected. A new decision that changes `docs/DESIGN.md` §15 gets a new ADR and a row in that table; existing ADRs are never edited except to change status.

| ADR | Title |
| --- | --- |
| 0001 | Build the site with Astro 5 |
| 0002 | Host on S3 + CloudFront, provisioned by Terraform |
| 0003 | Deploy with GitHub Actions over OIDC; no long-lived AWS credentials |
| 0004 | Comments, if any, via giscus on GitHub Discussions (Phase 3) |
| 0005 | Analytics from CloudFront logs via Athena, no client script (Phase 2) |
| 0006 | Search with Pagefind, only once the archive needs it (Phase 3) |
| 0007 | Images and Open Graph cards generated at build |
| 0008 | Routing and security headers at the CloudFront edge |
| 0009 | Keep `/posts/[id]/` as the canonical post URL |
| 0010 | The résumé is generated from one JSON Resume file |
| 0011 | Visual direction: restrained cyberpunk / terminal |

Template for new ADRs: title, status + date, requirements affected, context, decision, alternatives considered, consequences. Keep each under 40 lines.
