# Human tasks — what Michael does, and agents do not

**Status:** v1.0, 2026-10-24. Companion to `docs/requirements/`. Each task says why it is yours: it needs your credentials, your identity, your judgement, or your words. Everything not listed here is agent work driven by the requirement files.

Tick items as you go; agents read this file to know what is unblocked. Where a task produces a value an agent needs, the *Record* column says where to put it.

## Phase 0 — Reset (by 2026-10-31)

| # | Task | Why you | Record |
| --- | --- | --- | --- |
| 0.1 | [ ] Leaked credentials, revised 2026-11-03: the GitHub OAuth App secret in `Mika-net/.env.production` is to be regenerated or the app deleted **before launch** (Phase 1 gate 1.13, not a Phase 0 blocker, because the repositories have always been private). `NEXTAUTH_SECRET` was only ever on the unmerged `feature/add-dynamodb` branch and was never deployed, so there is nothing to rotate; delete `.env.production` and the secret line in `DEPLOYMENT.md` from the old working tree whenever convenient. (`06-security-operations.md` SEC-01) | Your GitHub account | Tick when the OAuth App is gone |
| 0.2 | [x] Say whether `Mika-net`, `mika-net-api`, `mika-net-infrastructure` are public or private. If any is or will be public, rewrite history (SEC-02). | Only you can see the setting and own the force-push | **Answered 2026-10-25: all three have always been private.** SEC-02 is therefore tidy-up, not urgent; do it before any of them is ever made public. |
| 0.3 | [ ] Identify the registrar for `mika-net.io` and whether a Route 53 hosted zone already exists. | Registrar login | `mika-net-infrastructure/envs/global/terraform.tfvars` → `create_zone = true/false`; registrar name here |
| 0.4 | [ ] Confirm the AWS account to use (is it the one with `blog-content-dev`?), enable root MFA, and set up an admin role or Identity Center user you can assume locally. (`04-infrastructure.md` prerequisites) | Account owner | Account id here (not secret) |
| 0.5 | [x] Create the GitHub repository. **Done 2026-11-03: `Mika-net/Mika-netv2`, public.** | Org permissions | — |
| 0.6 | [ ] Push the first commit: the local folder was renamed to `Mika-netv2`, `git init` and the initial commit were done for you on 2026-11-03, and `origin` is set. Run `cd ~/Documents/repos/Mika-netv2 && git push -u origin main`. | Your GitHub credentials | Tick when pushed |
| 0.7 | [ ] Fill the three profile URLs in `src/data/resume.json` (GitHub, LinkedIn, Stack Overflow) and confirm `Chicago area · remote`. (`02-resume.md` prerequisites) | Your identity | The file itself |
| 0.8 | [ ] Decide on `education` in `resume.json`: add entries or confirm the section stays empty and is omitted from the page. | Your history | The file itself |
| 0.9 | [ ] Review the `lenses` tags on each résumé highlight (proposed by the author of these files); change any you disagree with. | Your judgement about your own work | The file itself |
| 0.10 | [ ] Note the Jul–Dec 2024 gap between CapTech and Alight. The Phase 2 timeline will show it as a gap, which is fine; if you want a line for it (sabbatical, contract work, study), add a `work[]` entry or leave it. | Your history | `resume.json` or a note here |

### Running the prototype (added 2026-10-25)

The front-end prototype is in `Mika-netv2/`. To run it: `corepack enable && pnpm install && pnpm dev`, then open http://localhost:4321. `pnpm build` runs the post-build checks; `pnpm test` runs the contrast and content tests; `pnpm resume:pdf` needs `pnpm exec playwright install chromium` once. Pages with `TODO(michael)` (About, Now) build locally but will fail a production build until you fill them (tasks 1.6, 2.3).

## Phase 1 — MVP (by 2026-11-21)

| # | Task | Why you | Record |
| --- | --- | --- | --- |
| 1.1 | [ ] Run `bootstrap/bootstrap-state.sh` with your admin credentials, then the first `terraform apply` of `envs/global` (an agent prepares both and shows you the plan). (`04-infrastructure.md` INF-02, INF-40) | AWS credentials | Output values: name servers, role ARNs |
| 1.2 | [ ] If a new hosted zone was created: set the four name servers at the registrar. Wait for propagation (minutes to hours). | Registrar login | Date done |
| 1.3 | [ ] Set GitHub repository variables in both repositories from the Terraform outputs, and the one secret `TF_VAR_budget_email` in the infra repo. (`04-infrastructure.md` INF-41) An agent with `gh` can do the variables. | Secret needs you | — |
| 1.4 | [ ] GitHub settings in both repositories: branch protection on `main` (PR required; required checks per `05-pipelines.md` PIPE-04/PIPE-21; linear history; no force-push); Environment `production` with yourself as required reviewer and `main` as the only deployment branch. | Repository admin | — |
| 1.5 | [ ] Install Renovate's GitHub App on the organisation (or confirm Dependabot fallback). (`05-pipelines.md` PIPE-14) | Org admin | Which one, here |
| 1.6 | [ ] Write the About page body (`src/content/pages/about.md`): who you are in one paragraph, what you are looking for, and the contact section. Keep the sentence that explains "Mika" and the domain. (`01-content.md` CNT-17) | Your words | The file |
| 1.7 | [ ] Write or approve the home hero line and the three proof-point labels (`03-frontend.md` FE-40). The placeholders are the author's guess at your positioning; make them yours. | Your positioning | `src/data/home.ts` |
| 1.8 | [ ] Approve the rewritten post descriptions (`01-content.md` CNT-15; drafted in `scripts/migrate-posts.mjs` for `shipping`, `SMTP`, `ai-plugins`, `ai-plugins-chatgpt` — the last one now says the post was an AI-written experiment, which the body's editor's note already admits) and add `note2026` lines where your view has moved (CNT-16). | Your writing | In the PR |
| 1.9 | [ ] Improve the `heroAlt` text for the four migrated cover images (agents set them to the title as a placeholder). | You know what the images show | In the PR |
| 1.10 | [ ] Review the first rendered pages on `dev.mika-net.io` for the aesthetic (`03-frontend.md` FE-10 – FE-18). Change token *values* freely in a PR; token *names* and budgets stay. | Taste | PR comments |
| 1.11 | [ ] Approve each production deploy in the GitHub Environment (this is the required-reviewer gate; it takes one click). | The control is you | — |
| 1.12 | [ ] Give the explicit go-ahead for the DNS cutover once `smoke` passes against the CloudFront domain (`04-infrastructure.md` INF-42). | Irreversible, public | Date here |
| 1.13 | [ ] Before cutover: delete the GitHub OAuth App (0.1). After cutover: delete the Amplify app that serves the 2023 site from `Mika-net`; keep `Mika-net`, `mika-net-api` private and read-only for history (archive on GitHub). | Your accounts | Date here |
| 1.14 | [ ] Validate the RSS feed (W3C validator), the OG cards (LinkedIn Post Inspector), and the structured data (Rich Results Test) for the live site; five minutes total. (`07-discoverability.md`) | External tools under your login | Tick |
| 1.15 | [ ] Keyboard-only walkthrough of home, a post, the writing index, résumé, about — recorded as a comment in the MVP PR. (`03-frontend.md` FE-51) An agent does the first pass; you do the one that counts. | Independent check | In the PR |
| 1.16 | [ ] Read each runbook in `docs/runbooks/` once. (`06-security-operations.md` SEC-40) | You will be the one at 2 a.m. | Tick |

## Phase 2 — Content (by 2026-12-31)

| # | Task | Why you | Record |
| --- | --- | --- | --- |
| 2.1 | [ ] Take the Native AOT cold-start measurements on the `mika-net-api` stack **before** it is deleted: deploy it once, measure cold and warm starts (Lambda `Init Duration` from CloudWatch logs) for the AOT build and a JIT build of the same code, at least 30 samples each. An agent writes the measurement script; you run it with your credentials and approve the deletion afterwards (`04-infrastructure.md` INF-50). | AWS credentials; the deletion is irreversible | Raw numbers in `docs/analytics/native-aot/` |
| 2.2 | [ ] Write the Native AOT post from those numbers; cite the CapTech 86 % figure only as the résumé does, without client detail. | Your writing, your client confidentiality | `src/content/posts/native-aot-lambda/` |
| 2.3 | [ ] Write the first Now entry and set the monthly reminder (first weekend of each month, five minutes). | Your life | `src/content/now/` |
| 2.4 | [ ] Confirm or edit the three seed project entries and add any others (`01-content.md` CNT-18). | Your work | `src/content/projects/` |
| 2.5 | [ ] Approve enabling CloudFront logging (`08-analytics.md` prerequisites). | Costs money (cents) and stores IPs | Tick |
| 2.6 | [ ] Verify the domain in Google Search Console and Bing Webmaster Tools (DNS TXT via the Terraform variable; an agent adds the record once you paste the token). Submit the sitemap. | Your Google/Microsoft accounts | Tick |
| 2.7 | [ ] Point LinkedIn *Website*, the GitHub profile README and Stack Overflow *About me* at `https://mika-net.io`. (`07-discoverability.md` DISC-10) | Your profiles | Tick |
| 2.8 | [ ] After the first full month on AWS: read Cost Explorer and record the monthly cost here (target < US$5). | Billing console | Amount here |
| 2.9 | [ ] Four weeks after launch: search your name plus "lead engineer" and note what ranks. | Judgement | Note here |

## Phase 3 — Depth (by 2027-03-31)

| # | Task | Why you | Record |
| --- | --- | --- | --- |
| 3.1 | [ ] Decide whether you want comments at all. If yes: enable Discussions, create the *Posts* category, install the giscus app. (`09-comments-search.md`) | Repository admin; moderation is yours | Decision here |
| 3.2 | [ ] Write the scope post-mortem post (the 2025 three-tier-backend-for-four-posts story). | Your story | `src/content/posts/` |
| 3.3 | [ ] Decide on per-PR preview environments after reading the ADR an agent drafts. | Cost/benefit judgement | Decision log |
| 3.4 | [ ] Submit the domain to the HSTS preload list once HTTPS has been stable for a month. (`06-security-operations.md` SEC-11) | Irreversible-ish (removal takes months) | Date here |
| 3.5 | [ ] Quarterly: review the four OIDC role policies for drift (`06-security-operations.md` SEC-06); five minutes. | Account owner | Date here |

## Standing rhythm

- First weekend of each month: Now page (five minutes), analytics ritual once Phase 2 is live (ten minutes).
- First week of each quarter: open the draft PR for that quarter's post (`docs/DESIGN.md` §11).
- Two months before the domain renews: check auto-renew.

## Approvals agents will ask you for

Agents stop and ask, by design, before: any `terraform apply` or `destroy`; the DNS cutover; deleting anything in AWS or GitHub; rewriting git history; making a repository public; adding a dependency outside the allowlists; changing anything in `docs/DESIGN.md` §15. Everything else they do and show you in a PR.
