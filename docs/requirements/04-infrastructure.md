# 04 — Infrastructure: Terraform for S3, CloudFront, ACM, Route 53, OIDC

**Status:** v1.0, 2026-10-24. Implements `docs/DESIGN.md` §8 (D2, D3, D8), §12. Phase 1 unless marked. Lives in the `mika-net-infrastructure` repository; this file is copied there as `docs/REQUIREMENTS.md` and the two copies MUST be kept identical (a CI diff check in the site repo, `05-pipelines.md` PIPE-15).

## Purpose

Everything that exists in AWS for mika-net.io is declared in this repository and applied by a pipeline. Nothing is created in the console except the one-time state bucket. The result is a static site served privately from S3 through CloudFront, two environments, no long-lived credentials anywhere.

## Human prerequisites (see `docs/HUMAN-TASKS.md`)

1. An AWS account with root MFA enabled and an admin IAM Identity Center user or role Michael can assume locally. Confirm whether this is the account holding the 2025 `blog-content-dev` table.
2. The registrar for `mika-net.io` identified. If it is not Route 53, Michael changes the name servers at the registrar after INF-20 creates the hosted zone; if the zone already exists in Route 53, INF-20 uses a data source instead.
3. The state bucket bootstrapped (INF-02) with Michael's credentials.
4. The first `terraform apply` of `envs/global` run locally by Michael (INF-40), because the OIDC roles the pipeline needs are created by it.
5. GitHub repository variables set from the Terraform outputs (INF-41).

## Repository layout

```
mika-net-infrastructure/
  README.md                 # how to bootstrap, plan, apply; links here
  CLAUDE.md                 # agent entry point for this repo
  docs/REQUIREMENTS.md      # this file
  bootstrap/
    bootstrap-state.sh      # INF-02; run once by a human
  modules/
    static-site/            # bucket, OAC, distribution, function, headers policy, DNS records
    github-oidc/            # provider (optional create) + one role per input spec
  envs/
    global/                 # hosted zone, ACM certificate, OIDC provider + roles, budget
    dev/                    # static-site module instance for dev.mika-net.io
    prod/                   # static-site module instance for mika-net.io + www
  legacy/                   # the 2025 DynamoDB/Secrets Manager code, untouched, until INF-50
  .github/workflows/
    plan.yml  apply.yml     # 05-pipelines.md PIPE-20..24
  .terraform-version
```

Each `envs/*` directory is its own root module with its own backend key (`global/terraform.tfstate`, `dev/terraform.tfstate`, `prod/terraform.tfstate`). `dev` and `prod` read the certificate ARN and hosted zone id through `data` sources by domain name, not through remote state, so the roots stay independent.

## Requirements

### Versions and state

**INF-01** `required_version = ">= 1.11"`; `hashicorp/aws ~> 6.0`; provider lockfile (`.terraform.lock.hcl`) committed in every root; `terraform fmt` clean; `terraform validate` clean; `tflint` with the AWS ruleset clean (warnings allowed, errors not).

**INF-02** State lives in S3 with the backend's native lockfile. `bootstrap/bootstrap-state.sh` creates, idempotently, the bucket `mika-net-tfstate-<account-id>` in `us-east-1` with: versioning enabled, default encryption SSE-S3 (AES256), public access fully blocked, a lifecycle rule expiring noncurrent versions after 90 days, and tags `Project=mika-net`. It MUST NOT create a DynamoDB table. Each root's `backend.tf`:

```hcl
terraform {
  backend "s3" {
    bucket       = "mika-net-tfstate-<account-id>"   # set at init via -backend-config, never hard-coded in git
    key          = "prod/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
```

The bucket name is passed with `-backend-config` from a per-environment `backend.hcl` that is git-ignored; the README documents it. Rationale: HashiCorp documents DynamoDB-based locking as deprecated ([Terraform S3 backend docs](https://developer.hashicorp.com/terraform/language/backend/s3)).

**INF-03** No `terraform.tfstate`, `*.tfvars` with values, `backend.hcl`, or `.terraform/` directory is ever committed; `.gitignore` covers them and gitleaks runs in CI (`06-security-operations.md` SEC-03).

**INF-04** Every resource carries tags `Project = "mika-net"`, `Environment = <env|global>`, `ManagedBy = "terraform"` via `default_tags` on the provider.

### Static site module (`modules/static-site`)

Inputs: `env`, `domain_name` (apex or sub-domain), `aliases` (list; prod passes `["mika-net.io", "www.mika-net.io"]`, dev passes `["dev.mika-net.io"]`), `certificate_arn`, `hosted_zone_id`, `robots_noindex` (bool), `csp` (string), `logging` (object, Phase 2). Outputs: `bucket_name`, `bucket_arn`, `distribution_id`, `distribution_arn`, `distribution_domain_name`.

**INF-10** Site bucket `mika-net-<env>-site`: private; public access fully blocked; object ownership `BucketOwnerEnforced` (no ACLs); versioning enabled; lifecycle: noncurrent versions expire after 30 days, incomplete multipart uploads abort after 7 days; default encryption SSE-S3. Bucket policy grants `s3:GetObject` on `arn:aws:s3:::mika-net-<env>-site/*` to the service principal `cloudfront.amazonaws.com` with condition `AWS:SourceArn` equal to the distribution ARN, and nothing else.

**INF-11** Origin Access Control: `aws_cloudfront_origin_access_control` with `origin_access_control_origin_type = "s3"`, `signing_behavior = "always"`, `signing_protocol = "sigv4"`. The distribution's origin uses the bucket's regional REST domain (`bucket_regional_domain_name`), never the S3 website endpoint.

**INF-12** Distribution: `enabled`, `is_ipv6_enabled = true`, `http_version = "http2and3"`, `price_class = "PriceClass_100"`, `default_root_object = "index.html"`, `aliases` from input, `viewer_certificate { acm_certificate_arn, ssl_support_method = "sni-only", minimum_protocol_version = "TLSv1.2_2021" }`, `default_cache_behavior { viewer_protocol_policy = "redirect-to-https", allowed_methods = ["GET","HEAD","OPTIONS"], cached_methods = ["GET","HEAD"], compress = true, cache_policy_id = <managed CachingOptimized>, response_headers_policy_id = <INF-15>, function_association { event_type = "viewer-request", function_arn = <INF-13> } }`, `restrictions { geo_restriction { restriction_type = "none" } }`. `custom_error_response` per INF-14. Phase 2 adds logging per `08-analytics.md`.

**INF-13** CloudFront Function `mika-net-<env>-router`, runtime `cloudfront-js-2.0`, event `viewer-request`, with exactly this behaviour, in this order:

1. If the `host` header is `www.mika-net.io`, return a 301 to `https://mika-net.io` + the same URI (and query string if present).
2. If the URI ends with `/`, append `index.html` and continue.
3. If the last path segment contains no `.` and the URI does not end with `/`, return a 301 to the URI + `/` (preserving the query string). This is what keeps the four legacy post URLs working (`01-content.md` CNT-11).
4. Otherwise pass the request through unchanged.

Reference implementation (the module ships it as `router.js` beside the Terraform and feeds it with `file()`):

```js
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var host = request.headers.host ? request.headers.host.value : '';
  var qs = '';
  var keys = Object.keys(request.querystring || {});
  if (keys.length) {
    qs = '?' + keys.map(function (k) {
      var v = request.querystring[k].value;
      return v === '' ? k : k + '=' + v;
    }).join('&');
  }
  if (host === 'www.mika-net.io') {
    return { statusCode: 301, statusDescription: 'Moved Permanently',
             headers: { location: { value: 'https://mika-net.io' + uri + qs } } };
  }
  if (uri.endsWith('/')) {
    request.uri = uri + 'index.html';
    return request;
  }
  var last = uri.substring(uri.lastIndexOf('/') + 1);
  if (last.indexOf('.') === -1) {
    return { statusCode: 301, statusDescription: 'Moved Permanently',
             headers: { location: { value: uri + '/' + qs } } };
  }
  return request;
}
```

The module MUST include a `terraform test` or a Node script that exercises the four rules against fixtures (`/`, `/posts/SMTP`, `/posts/SMTP/`, `/resume.pdf`, `www` host) before publish.

**INF-14** Custom error responses: S3 returns 403 for missing keys behind OAC, so map error code 403 → response page `/404.html` with response code 404, TTL 60 s; and 404 → `/404.html`, 404, TTL 60 s. No other error mappings.

**INF-15** Response headers policy `mika-net-<env>-headers`:

- `strict_transport_security`: `max-age=63072000; includeSubDomains; preload` (`override = true`).
- `content_security_policy`: the string from `06-security-operations.md` SEC-10, passed in as the `csp` input so the policy lives in one place (`envs/<env>/main.tf`).
- `content_type_options`: nosniff. `frame_options`: DENY. `referrer_policy`: strict-origin-when-cross-origin. `xss_protection`: not set (deprecated header).
- Custom header `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`.
- When `robots_noindex` is true (dev only): custom header `X-Robots-Tag: noindex, nofollow`.
- No CORS configuration (nothing cross-origin reads the site).

**INF-16** Route 53 records in the module: for each alias, an `A` and an `AAAA` alias record to the distribution (`evaluate_target_health = false`). The `www` record exists only so the function in INF-13 can redirect it.

### Global root (`envs/global`)

**INF-20** Hosted zone for `mika-net.io`: `aws_route53_zone` if the zone does not exist, otherwise `data.aws_route53_zone` by name (decided by Michael's answer in `docs/HUMAN-TASKS.md`; the root supports both through a `create_zone` variable). Output the name servers so Michael can set them at the registrar.

**INF-21** ACM certificate in `us-east-1` for `mika-net.io` with SAN `*.mika-net.io`, `validation_method = "DNS"`, validation records created in the zone, `aws_acm_certificate_validation` waited on, `lifecycle { create_before_destroy = true }`. One certificate serves prod, www and dev.

**INF-22** GitHub OIDC provider: `aws_iam_openid_connect_provider` for `https://token.actions.githubusercontent.com` with `client_id_list = ["sts.amazonaws.com"]`. The API requires `thumbprint_list`; use the value from the GitHub documentation and note in a comment that AWS no longer relies on it for this provider. Exactly one provider per account: if one already exists, the root uses a `data` source (variable `create_oidc_provider`).

**INF-23** Four IAM roles, each with `max_session_duration = 3600`, trust policy `sts:AssumeRoleWithWebIdentity` from the provider with `StringEquals` on `token.actions.githubusercontent.com:aud = sts.amazonaws.com` and `StringLike`/`StringEquals` on `token.actions.githubusercontent.com:sub` exactly as follows:

| Role | `sub` condition | Permissions |
| --- | --- | --- |
| `mika-net-site-deploy-dev` | `repo:Mika-net/Mika-netv2:pull_request` | `s3:ListBucket` on the dev bucket; `s3:PutObject`, `s3:DeleteObject` on `dev-bucket/*`; `cloudfront:CreateInvalidation` on the dev distribution ARN |
| `mika-net-site-deploy-prod` | `repo:Mika-net/Mika-netv2:environment:production` | same, scoped to the prod bucket and distribution |
| `mika-net-infra-plan` | `repo:Mika-net/mika-net-infrastructure:pull_request` | `ReadOnlyAccess` managed policy plus `s3:GetObject`/`s3:PutObject` on the state bucket's `*.tflock` keys and `s3:GetObject` on state keys (plan reads state and takes the lock) |
| `mika-net-infra-apply` | `repo:Mika-net/mika-net-infrastructure:environment:production` | an inline policy enumerating the services this repository manages: `s3:*` on the site, logs and state buckets; `cloudfront:*`; `acm:*`; `route53:*` on the zone; `iam:*Role*`, `iam:*Policy*`, `iam:*OpenIDConnectProvider*` scoped to `mika-net-*` names; `budgets:*`; `logs:*` and `athena:*`, `glue:*` for Phase 2. Not `AdministratorAccess`. |

The `environment:production` subjects require the matching GitHub Environments to exist (`docs/HUMAN-TASKS.md`); until they do, the apply workflow cannot assume its role, which is the intended safety.

**INF-24** `aws_budgets_budget` `mika-net-monthly`: `COST`, `limit_amount = "10"`, `USD`, `MONTHLY`, notifications: actual ≥ 80 % and forecasted ≥ 100 % to Michael's email (variable, not committed; passed via `TF_VAR_budget_email` from a GitHub secret in the apply workflow).

### Environment roots

**INF-30** `envs/dev`: one `static-site` instance with `aliases = ["dev.mika-net.io"]`, `robots_noindex = true`, dev CSP. `envs/prod`: one instance with `aliases = ["mika-net.io", "www.mika-net.io"]`, `robots_noindex = false`, prod CSP. Both look up the certificate (`data.aws_acm_certificate` by domain, `statuses = ["ISSUED"]`, `most_recent = true`) and the zone by name.

**INF-31** Outputs of each root, consumed by the site pipeline: `bucket_name`, `distribution_id`, and from `global`: `role_arn_site_deploy_dev`, `role_arn_site_deploy_prod`, `role_arn_infra_plan`, `role_arn_infra_apply`, `name_servers`.

### Bootstrap and hand-off

**INF-40** First apply order, performed by Michael locally with admin credentials (an agent prepares the commands and reviews the plans): `bootstrap-state.sh` → `envs/global` init/plan/apply (zone, certificate, OIDC, roles, budget) → set name servers at the registrar if a new zone → wait for certificate validation → `envs/dev` apply → `envs/prod` apply. After this, every change goes through the pipeline (`05-pipelines.md`).

**INF-41** GitHub variables (not secrets; none of these are sensitive) set in the site repository: `AWS_ROLE_ARN_DEV`, `AWS_ROLE_ARN_PROD`, `S3_BUCKET_DEV`, `S3_BUCKET_PROD`, `CF_DIST_ID_DEV`, `CF_DIST_ID_PROD`; in the infra repository: `AWS_ROLE_ARN_PLAN`, `AWS_ROLE_ARN_APPLY`, `TF_STATE_BUCKET`. An agent with `gh` authenticated as Michael MAY set them with `gh variable set`; otherwise Michael does.

**INF-42** DNS cutover (prod only, Phase 1 gate): Michael's explicit go-ahead is required. Before: the prod distribution serves the site at its `*.cloudfront.net` domain and passes the smoke test (`05-pipelines.md` PIPE-12) with a `Host` override. The cutover is the apply that creates the apex and `www` records (INF-16) — keep them behind a `create_records` variable defaulting to `false` in prod so the records are a deliberate flip. After: verify from an external resolver, then delete the Amplify app that served the 2023 site (`docs/HUMAN-TASKS.md` 1.13).

### Legacy resources

**INF-50** The 2025 code (DynamoDB table `blog-content-dev`, Secrets Manager secret, two IAM policies) moves unchanged into `legacy/` with its local state file git-ignored there, in the first PR of the rebuild. It is destroyed by `terraform destroy` run locally by Michael (or by an agent with his explicit go-ahead in the task) only after the Native AOT measurements for the Phase 2 post are taken (`docs/DESIGN.md` §4). The `mika-net-api` SAM stack is deleted the same way (`sam delete`). Until then nothing in `legacy/` is touched.

## Acceptance criteria

- [ ] `terraform fmt -check`, `validate`, `tflint` clean in all three roots; lockfiles committed.
- [ ] `plan` on a clean checkout of `envs/dev` and `envs/prod` after bootstrap shows no changes (idempotent).
- [ ] `curl -sI https://<dev-distribution>.cloudfront.net/posts/SMTP` (with `Host: dev.mika-net.io`) returns 301 to `/posts/SMTP/`; the slashed URL returns 200 with `strict-transport-security`, `content-security-policy` and `x-robots-tag` headers present on dev and absent `x-robots-tag` on prod.
- [ ] A direct request to the bucket's S3 URL returns 403.
- [ ] A GitHub Actions job in a PR of `Mika-netv2` can assume `mika-net-site-deploy-dev`; a job on `main` cannot assume it (sub mismatch), and vice versa for prod.
- [ ] The budget exists with both notifications.
- [ ] Monthly cost after one full month ≤ US$5 (checked in `docs/HUMAN-TASKS.md`).

## Agent notes

- Managed cache policy `CachingOptimized` id is `658327ea-f89d-4fab-a63d-7e88639e58f6`; prefer `data.aws_cloudfront_cache_policy { name = "Managed-CachingOptimized" }` over hard-coding.
- The OAC bucket policy's `AWS:SourceArn` creates a dependency cycle if the policy is defined before the distribution; define the bucket, then the distribution, then the policy that references `aws_cloudfront_distribution.this.arn`.
- Certificate validation can take several minutes after the zone's name servers propagate; the global root's apply blocks on it by design.
- `router.js` runs under CloudFront Functions' JavaScript runtime 2.0: no `let`/`const` destructuring surprises, no `URL` object, no modules. Keep the file under 10 KB.
- Never run `apply` or `destroy` from an agent session without Michael's go-ahead in the task text. `plan` is always fine.
