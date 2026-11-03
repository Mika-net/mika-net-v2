# 08 — Analytics: CloudFront logs → S3 → Athena

**Status:** v1.0, 2026-10-24. Implements `docs/DESIGN.md` §8 (D5). **Phase 2.** Lives in `mika-net-infrastructure-v2` (Terraform) plus a `docs/analytics/` folder of saved queries in the site repository.

## Purpose

Answer the only questions that matter, with data Michael already owns and no client-side script, cookies or consent banner: which pages are read, how often the résumé PDF is downloaded, where readers come from, and what 404s. It is also one post (`docs/DESIGN.md` §4, the fifth pillar).

## Human prerequisites

Michael's go-ahead to enable logging (it adds a few cents per month and stores client IP addresses, see ANA-05) and a decision on whether to publish aggregate numbers on the Now page.

## Requirements

**ANA-01** CloudFront standard logging to S3 is enabled on the prod distribution only, delivered to `mika-net-prod-logs` (private, SSE-S3, object ownership enforced, public access blocked). Use the current standard-logging mechanism the AWS provider supports at implementation time (the newer delivery-based logging, resources `aws_cloudwatch_log_delivery_source` / `aws_cloudwatch_log_delivery_destination` / `aws_cloudwatch_log_delivery` with an S3 destination, partitioned by date and in Parquet if available; otherwise legacy `logging_config` on the distribution). Record which in the ADR.

**ANA-02** Logs are partitioned by `year/month/day` so Athena scans stay small; an `aws_glue_catalog_database` `mika_net` and `aws_glue_catalog_table` `cloudfront_logs` with partition projection over the date range, so no crawler and no manual `MSCK REPAIR` are needed. Athena workgroup `mika-net` with query results in `mika-net-prod-logs/athena-results/` and a per-query scan limit of 1 GB.

**ANA-03** Saved queries, committed as `.sql` files in `docs/analytics/` and registered as `aws_athena_named_query`:

| Name | Question | Output |
| --- | --- | --- |
| `pageviews_by_path_30d` | Which pages are read | path, views, unique client IP count (approximate uniques), last 30 days, HTML only |
| `resume_downloads_30d` | How often is the PDF downloaded | daily count of `GET /resume.pdf` with status 200 |
| `referrers_30d` | Where readers come from | referrer host, views, excluding the site itself |
| `not_found_30d` | What 404s | path, count, for `sc-status = 404` |
| `countries_30d` | Where readers are | edge location prefix → region, views |

Each query excludes known bot user agents by a maintained regex (`bot|crawl|spider|preview|lighthouse`) and the site's own smoke test session name.

**ANA-04** A monthly ritual (human, ten minutes): run the five queries, paste the three headline numbers into a private note, and decide whether anything changes the content plan. Numbers MAY be published on the Now page in aggregate ("about N readers last month"). No dashboard is built; the queries are the dashboard. If the ritual proves worth automating, an EventBridge-scheduled Athena query emailing a summary is the next ADR, not a BI tool.

**ANA-05** Retention and privacy: raw logs expire after 90 days via bucket lifecycle; no log line leaves the bucket except as the aggregate results above; client IPs are never joined to anything else; nothing is set on the reader's device. The colophon states this in one sentence.

**ANA-06** Cost ceiling: logging, storage and Athena combined under US$0.50/month at current traffic; the budget alarm (`04-infrastructure.md` INF-24) covers surprises.

## Acceptance criteria

- [ ] Log objects appear in the logs bucket within an hour of enabling.
- [ ] `resume_downloads_30d` returns a row for a test download made after enabling.
- [ ] `pageviews_by_path_30d` scans under 50 MB for a month of logs (check Athena's "data scanned").
- [ ] Lifecycle rule expires objects at 90 days; verified in the bucket configuration.
- [ ] The post explaining the setup is drafted in the same phase (`docs/DESIGN.md` §8 guiding principle).

## Agent notes

- CloudFront log fields and the Athena DDL are documented in the AWS CloudFront developer guide ("Standard logging"); copy the column list from there at implementation time rather than from memory, and note the guide's revision date in the ADR.
- Partition projection avoids both a crawler and the Glue catalog growing per day; use `projection.enabled = true` with a `date` type partition key.
