# Authab launch requirement sheet

Status: **Draft for sign-off** · 17 November 2026
Scope: public, self-serve, paid launch of the hosted Authab service
Related: [User journeys and flows](user-journeys.md) · [System design](../architecture/system-design.md)

## 1. What "launch" means

A new customer can do all of this without help from the Authab team:

1. Sign up and create a workspace.
2. Register an agent, add a connection, create a narrow grant and make a governed call.
3. See the decision and result in the audit trail.
4. Invite a teammate, approve a high-risk action and use production mode.
5. Upgrade to Pro or Scale, pay, get an invoice, and cancel or downgrade.

The supported connector set must be live-verified with real credentials. Billing, email, support, backups, monitoring and incident response must be operating. Public claims must match what a customer can actually do.

Enterprise SSO/SCIM, cross-org trust, audit streaming and custom connectors are **assisted at launch** (P1), not sold as fully self-serve until they pass a real IdP/SIEM test.

## 2. Current baseline — what is true today

**Verdict: not launch-ready yet.** Code and automated coverage are strong. The blockers are operational and external: production deployment, email and domain setup, package publication, OAuth app approvals, live connector proof, a live billing test, an independent security review, and support/incident readiness.

| Area | Evidence | Launch reading |
| --- | --- | --- |
| Automated tests | `npm test`: **274 tests, 274 pass, 0 fail** (17 Nov 2026) | Strong regression baseline; not a substitute for live provider tests |
| Connector contracts | `npm run connectors:check`: **31 connectors, 301 actions**, contract OK (17 Nov 2026) | Catalogue is internally consistent |
| CI definition | `.github/workflows/ci.yml` runs unit tests, connector contracts, typecheck, SDK/CLI/MCP builds, production build, Python tests and real framework adapters | CI exists; production deployment is separate |
| Product surfaces | Landing, pricing, auth, onboarding, dashboard, docs, legal, status, trust, consent, control center, approvals and API routes are built | Broad coverage; several flows are not live-verified |
| Connector probes | 23 of 31 connectors have a read-only health probe in `src/lib/health-checks.ts` | 8 connectors need a probe or an explicit "no safe probe" state |
| OAuth providers | 12 providers are defined in `src/lib/oauth-providers.ts` | Requires 12 app registrations and provider reviews |
| Packaging | npm and PyPI packages are **not published**; docs currently install from the repository | Public developer experience is not launch-ready |
| Deployment | No production deployment, domain, secret manager, email domain or monitoring is recorded in this repository | Platform workstream is open |
| Live provider proof | Last recorded proof: Resend returned 200. Stripe and Razorpay keys returned 401 because the credentials were invalid, so those tests need a rerun with real keys. Most providers have no live proof | Treat every connector as unverified until it has a dated proof |
| OAuth apps | At the last audit (16 Nov 2026) no database OAuth apps and no `CONNECT_*` credentials were configured | One-click connect is not live |
| Enterprise flows | SSO, SCIM, cross-org trust and audit streaming have automated coverage | Not yet proven against real Okta/Entra/Splunk/S3 or two real workspaces |
| Recovery | Restore rehearsal 11 Nov 2026: 47 tables, 511 rows, 218 audit events, 6/6 chains valid | Rehearsed at demo volume; production-volume rehearsal still required |
| Load | Load-test baseline recorded 11 Nov 2026 | Development baseline, not an SLO |

## 3. Priority and status key

**Priority**

- **P0** — must be true before any public signup or paid charge.
- **P1** — must be true before broad launch or enterprise sales; can be assisted/manual during a soft launch.
- **P2** — after launch.

**Status**

- **Verified** — implemented and tested in this workspace with evidence.
- **Built** — implemented with automated tests; live verification still required.
- **Partial** — implemented with known gaps.
- **Blocked** — waiting on an external account, review or credential.
- **Open** — not done.

## 4. Launch gates

A requirement is only "done" when its gate can be demonstrated, not when the code exists.

| Gate | Question | Pass condition |
| --- | --- | --- |
| **A. Safe to accept signups** | Can a stranger create an account and recover it? | Production URL + TLS, verified email, backups, monitoring, support and legal pages are live |
| **B. Safe to hold real credentials** | Can we protect and revoke secrets? | Encryption, tenant isolation, audit WORM, rate limits, independent security review and restore drill are proven |
| **C. Safe to charge** | Can we take money and reverse it correctly? | Stripe live checkout, webhook, invoices, tax, dunning, cancellation, refund and entitlement tests pass |
| **D. Safe to claim production** | Can a customer run live traffic? | Production isolation, approvals, plan gate, 90-day/1-year retention and status page are proven |
| **E. Safe to sell enterprise** | Can a security team approve us? | Real IdP SSO/SCIM, SIEM delivery, DPA, subprocessors, pen test summary and security questionnaire answers exist |

## 5. Requirement sheet

### 5.1 Platform and operations

| ID | P | Status | Requirement | Done when |
| --- | --- | --- | --- | --- |
| A1 | P0 | Open | Production URL on an owned domain with TLS/HSTS, plus a separate staging URL and database | `app.` and `staging.` serve the app; HTTP redirects to HTTPS; staging cannot read production data |
| A2 | P0 | Open | All runtime secrets in a managed secret store; none in git, build logs, images, client bundles or the database | Secret inventory signed off; `MASTER_KEY`, `JWT_SIGNING_PRIVATE_KEY`, `AUTH_COOKIE_SECRET`, `CRON_SECRET`, Stripe and provider keys stored; rotation rehearsal passes |
| A3 | P0 | Built | Production Neon project with pooled application connection, direct migration connection and versioned migrations | `prisma migrate status` clean; app uses pooled URL; migrations run on a branch before production |
| A4 | P0 | Partial | Automated off-site logical backups plus Neon point-in-time recovery, with a production-volume restore rehearsal | Daily backup to storage outside the database provider, checksum verified, 35-day retention, restore matches row counts and audit heads |
| A5 | P0 | Built | Scheduled cron for webhooks, audit sinks, approvals, credential health, alert rules and pruning | Cron runs every 5 minutes with `CRON_SECRET`; failures alert; manual re-run is idempotent |
| A6 | P0 | Partial | Transactional email from a verified domain for verification, magic links, invites, approvals and alerts | SPF, DKIM and DMARC pass; delivery tested to Gmail and Outlook; bounce/complaint handling; no sandbox sender in production |
| A7 | P0 | Partial | Error tracking, structured logs, uptime checks and dashboards for proxy, approvals, email, cron and billing | On-call receives alerts; proxy error/latency dashboard live; audit-chain verification failure pages on-call |
| A8 | P0 | Built | Public status page and incident process | Real incidents publish to `/status`; severity matrix, on-call rota, customer comms templates and postmortem template exist |
| A9 | P0 | Partial | Production-like load test and capacity plan | Load test at expected launch concurrency; p95 within target; DB pool sized; 429/402 behavior verified; cost estimate recorded |
| A10 | P0 | Partial | Web security baseline: WAF/bot protection, rate limits, CSP, HSTS, cookie flags, dependency and secret scanning | Headers verified in production; WAF on auth/consent/proxy; high and critical dependency findings resolved; secret scanning enabled |
| A11 | P0 | Open | Support channel with published response target and escalation | Monitored inbox/ticketing, first-response target, macros for top 10 issues, escalation path, in-app contact link |
| A12 | P0 | Built | Demo and data-contribution isolation | `ALLOW_DEMO_LOGIN` and `ALLOW_DEMO_SEED` unset; demo org not visible; seed refuses production; `dataContributionEnabled` false by default |

### 5.2 Connectors and providers

| ID | P | Status | Requirement | Done when |
| --- | --- | --- | --- | --- |
| B1 | P0 | Open | Publish an honest connector tier policy instead of claiming all 31 are equally live | All 31 remain visible; a launch set has dated live proof; the rest are labelled Beta or "add your credentials"; marketing makes no "all live" claim |
| B2 | P0 | Blocked | Register and configure OAuth apps for the launch providers, including redirect URIs and scopes, and complete provider reviews | Each launch OAuth provider has production client ID/secret, verified callback, successful connect, refresh and revoke test |
| B3 | P0 | Partial | Verify token/API-key connectors with real credentials or vendor test accounts | Each launch token connector has a dated successful read plus a safe write/destructive test; evidence file contains no secrets |
| B4 | P0 | Partial | A safe health probe for every launch connector, or an explicit "no safe probe" state | Dashboard separates healthy, broken and no-probe; failures notify the workspace owner |
| B5 | P0 | Open | Fix the known connector defects before calling any affected connector stable | GitHub `list_repos` works with PAT and OAuth; Snowflake list/describe send the required SQL; Zoho module is required; Google service-account option is hidden or implemented; verifier inputs exist; auth-method labels match reality |
| B6 | P0 | Partial | Scripted end-to-end connector verification harness | One command runs connect/credential → grant → proxy → audit → revoke per connector and writes a dated evidence artifact |
| B7 | P1 | Built | Provider error normalization, retries, token refresh and quota handling | 401/403/429/5xx mapped to actionable errors; refresh races handled; backoff and circuit breaker documented; provider quotas tracked |
| B8 | P0 | Partial | Per-connector docs and in-product setup help | Each launch connector has auth setup, scopes, sample action, limits, risk labels and current status |
| B9 | P1 | Built | Plan-aware connector capacity | All 31 connectors require Scale; Pro stops at 25 with a clear upgrade path; limits enforced server-side |
| B10 | P0 | Built | Revocation and disconnect proven end to end | Revoked grant denies the next call; disconnect destroys credentials and expires grants; audit rows remain append-only |

### 5.3 Developer packaging and public API

| ID | P | Status | Requirement | Done when |
| --- | --- | --- | --- | --- |
| C1 | P0 | Open | Publish `@authab/sdk` to npm with provenance | `npm install @authab/sdk` works on a clean machine; 2FA/provenance enabled; version and changelog published |
| C2 | P0 | Open | Publish `@authab/cli` to npm | `npx @authab/cli` and global install work; `authab login`, agent, credential, grant and token commands work against production |
| C3 | P0 | Open | Publish `@authab/mcp` to npm | `npx @authab/mcp` is documented; a real MCP client lists tools and makes a governed call |
| C4 | P0 | Open | Publish `authab-sdk` to PyPI with signing, LangChain, LangGraph, CrewAI and OpenAI Agents extras | `pip install authab-sdk` and each extra install from the wheel; framework adapter tests pass from the published artifact |
| C5 | P0 | Open | Replace repository-install instructions with registry-install instructions | `/docs/sdk`, `/docs/cli`, `/docs/mcp` and `/docs/quickstart` show published commands and supported versions |
| C6 | P0 | Open | Clean-machine quickstart test | A new machine with Node 20+ and Python 3.12 completes the public quickstart against a Free workspace using only public docs |
| C7 | P1 | Open | Release automation and compatibility policy | Tagged release publishes all packages; semver, deprecation, changelog and rollback documented |
| C8 | P1 | Built | Public API/OpenAPI reference matches the live API | `/docs/api` covers auth, errors, pagination, idempotency and every public route |

### 5.4 Billing and commercial

| ID | P | Status | Requirement | Done when |
| --- | --- | --- | --- | --- |
| D1 | P0 | Open | Stripe live account, products, prices and webhook endpoint | Live Pro/Scale checkout in USD and INR; signed webhook verified; test and live objects separated |
| D2 | P0 | Partial | Checkout, customer portal, trial and invoices | Real low-value purchase; invoice and PDF; payment-method update; cancel at period end |
| D3 | P0 | Built | Webhook idempotency and subscription state machine | Duplicate and out-of-order events do not double-charge or unlock incorrectly; reconciliation job exists |
| D4 | P0 | Partial | Dunning, past-due, suspension and downgrade behavior | Simulated failed payment matches the pricing copy: limits paused, retries, 7-day suspension, return to Free; production paused on downgrade |
| D5 | P0 | Open | Tax, billing address, tax ID and credit notes | Tax behavior configured for both currencies; invoices show correct seller, buyer and tax; refund/credit-note process documented |
| D6 | P0 | Open | Refund and cancellation policy | Policy published; manual runbook exists; support macros written; no automated refund command is offered |
| D7 | P0 | Built | Plan limits and entitlement enforcement | 402 at call, agent, connection and seat caps; Free production locked; every path enforces limits server-side |
| D8 | P1 | Open | Revenue reporting and reconciliation | MRR/ARR, failed payments, refunds and taxes reconcile to Stripe monthly |
| D9 | P0 | Built | Pricing page matches billing behavior | Trial, overage, downgrade, INR and dunning claims verified against live billing |
| D10 | P1 | Partial | Enterprise invoicing and procurement | Manual annual-invoice, PO, DPA and security-review process documented |

### 5.5 Identity, security and compliance

| ID | P | Status | Requirement | Done when |
| --- | --- | --- | --- | --- |
| E1 | P0 | Blocked | Google and GitHub sign-in configured and tested | Real OAuth apps; sign-in, cancel and error states; account linking; production callback verified |
| E2 | P0 | Partial | Magic-link and password security | Single-use, 15-minute expiry, rate limits, session revocation, password reset; deliverability tested |
| E3 | P0 | Built | MFA enrollment and enforcement | TOTP enroll, recovery codes, required-MFA flow and lost-device path tested |
| E4 | P1 | Built | SSO live with real identity providers | One OIDC and one SAML connection tested end to end; enforced SSO; domain restrictions; JIT provisioning |
| E5 | P1 | Built | SCIM live with a real identity provider | Create, update and deactivate users; group-to-role mapping; token revocation; member cap |
| E6 | P0 | Built | Audit chain and WORM verified in production | Nightly verification; break alerts; exports and streams preserve chain columns; pruning tested on a branch |
| E7 | P1 | Built | Audit streaming to a real SIEM or S3 bucket | Signed delivery, HMAC verification, retries, ordering and dead-letter tested; test sink disabled afterwards |
| E8 | P0 | Partial | Tenant isolation review and automated tests | Cross-org and cross-environment access tests in CI; every API route reviewed; no shared development/production data |
| E9 | P0 | Open | Independent security review before real credentials; full penetration test before enterprise sales | Review completed; critical and high findings fixed and retested; summary published; trust page updated |
| E10 | P0 | Open | Vulnerability disclosure and `security.txt` | `security.txt`, security inbox, disclosure policy and response targets published |
| E11 | P0 | Built | Key rotation rehearsal | Rotate JWT, cookie and master keys in production with zero downtime; retire old keys; verify existing signatures |
| E12 | P0 | Built | Data export, deletion, retention and consent | End-user export and delete tested; product owners notified; retention pruning works; data contribution off by default |
| E13 | P0 | Partial | Terms, privacy, DPA, subprocessors and cookie/analytics consent | Counsel-reviewed; current subprocessor list; DPA available; analytics consent respected |
| E14 | P0 | Open | Incident response and breach notification | Runbook, severity, contact tree, 72-hour process and tabletop exercise |
| E15 | P0 | Built | Compliance claims are accurate | Trust page states no SOC 2, ISO 27001 or penetration test until independently true; no unsupported sales or docs claims |

### 5.6 Product UX and lifecycle

| ID | P | Status | Requirement | Done when |
| --- | --- | --- | --- | --- |
| F1 | P1 | Open | Fix the onboarding step count | "Setup · 01 of 02" either gets a real second step or the copy changes to one step |
| F2 | P0 | Partial | First-run checklist and empty states | Checklist tracks agent, connection, grant, token, first call and audit; every empty state links to the next action |
| F3 | P0 | Partial | Connector auth UX | OAuth versus token is clear; only implemented methods appear; setup help and health status are present; no dead ends |
| F4 | P0 | Built | Consent page UX | Branding, verified domain, scope groups, duration and decline work; mobile and screen-reader tested |
| F5 | P0 | Built | Control center UX | Magic link, permissions, revoke, disconnect, export and delete work; request status visible; no activity content leaked |
| F6 | P0 | Built | Approval UX | Email link, inbox, redacted payload, approve/deny, approve-always, expiry and audit work |
| F7 | P0 | Built | Production upgrade UX | Gate explains why; upgrade path and return-to-development path work; post-upgrade setup is clear |
| F8 | P0 | Built | Team and invite UX | Invite delivery, resend, role change, removal, member cap and shareable fallback link work |
| F9 | P0 | Built | Billing self-serve UX | Portal, invoices, payment update, cancel, plan change and currency work |
| F10 | P1 | Partial | Error copy and recovery | Top 20 errors have actionable copy and a support link; raw provider errors are never shown |
| F11 | P1 | Open | Accessibility audit | WCAG 2.1 AA for landing, auth, dashboard, consent and control center; keyboard and contrast verified |
| F12 | P1 | Partial | Mobile dashboard | Core flows usable at 390px; tables scroll; forms do not zoom |
| F13 | P1 | Open | Product analytics with consent | Activation funnel instrumented; no PII or secrets; consent respected |
| F14 | P0 | Built | Demo off and real organizations protected | No demo login or seed in production; demo workspace flagged; other Free workspaces untouched |
| F15 | P0 | Partial | Docs match production | Install, pricing, connector status, OAuth setup, limits and error codes match the live service |

### 5.7 Launch surfaces and support

| ID | P | Status | Requirement | Done when |
| --- | --- | --- | --- | --- |
| G1 | P0 | Partial | Audit every landing-page claim | Each claim has evidence; unverified connectors are marked Beta; no "live" claim without dated proof |
| G2 | P0 | Built | Security and trust pages are current | Subprocessors, controls and disclosures updated; no certification claims |
| G3 | P0 | Built | Status page reflects real incidents | Uptime history, incidents and subscriptions work; no fake green |
| G4 | P0 | Built | Legal pages linked and versioned | Terms, privacy and DPA linked from signup and footer |
| G5 | P0 | Open | Contact and sales routing | `hello@`, `support@` and `security@` monitored; auto-acknowledgement; sales handoff defined |
| G6 | P1 | Built | Launch content | Quickstart tested; launch blog post; connector docs; changelog |
| G7 | P0 | Open | Support onboarding | Support person trained; macros; escalation; refund and security processes |
| G8 | P1 | Open | Launch-day checklist | Announcement, status watch, on-call, rollback owner and customer comms assigned |

### 5.8 Enterprise and advanced flows

| ID | P | Status | Requirement | Done when |
| --- | --- | --- | --- | --- |
| H1 | P1 | Built | Cross-org trust live test | Two real workspaces complete invite, accept, shadow agent, scoped call, mirrored audit and revoke |
| H2 | P1 | Built | Custom connectors and OpenAPI | Validate, version, test and roll back; SSRF guard holds; Scale gating enforced |
| H3 | P1 | Built | JIT grants, delegation and policy lab | Expiring grants, delegation chains and simulations match real decisions |
| H4 | P1 | Open | Enterprise onboarding package | Security questionnaire answers, DPA, architecture diagram and SSO/SCIM runbook exist |
| H5 | P2 | Open | Data residency and multi-region | Decision documented; not part of launch |
| H6 | P2 | Open | Public connector marketplace and submissions | Post-launch |

## 6. Connector launch matrix

All 31 connectors can remain visible. Only connectors with a dated live proof should be labelled **Stable**. Everything else must be **Beta** or **Needs credentials**.

### OAuth providers (12)

| Connector | Category | Main review risk | Launch recommendation |
| --- | --- | --- | --- |
| Google | Communication / AI and data | Restricted Gmail scopes can require a security assessment | Launch with non-restricted scopes; keep Gmail actions Beta until review completes |
| Microsoft 365 | Communication | Publisher verification and tenant admin consent | Register first; test with a real tenant |
| Slack | Communication | Public distribution review if listed publicly | Internal-workspace install is the fast path |
| GitHub | Developer | Lowest-friction OAuth app | Verify first |
| Notion | Productivity | Public integration review | Verify with a private/internal integration first |
| HubSpot | Productivity | Marketplace review if public | Private app path first |
| Linear | Productivity | Low-friction OAuth app | Verify early |
| Atlassian | Productivity | Marketplace review only if distributed publicly | Direct OAuth install first |
| Dropbox | Productivity | Production app review; full-dropbox scopes are slower than app-folder scopes | Start with app-folder scopes |
| Figma | Productivity | OAuth app review for public use | Verify with a test team |
| Salesforce | Commerce | Connected app is direct; AppExchange review is separate | Direct connected app first |
| Airtable | Productivity | OAuth integration review | Verify with a test base |

Confirm current provider policy at application time; review timelines change.

### Token/API-key connectors (19)

Stripe, OpenAI, Anthropic, Resend, Vercel, Cloudflare, Hugging Face, Discord, Twilio, Razorpay, Supabase, Cursor, n8n, Zapier, Sentry, Shopify, Zoho, Snowflake, Pinecone.

### Health probes today

Probes exist for 23 connectors. These 8 do **not** have a safe probe yet:

- Cursor
- n8n
- Zapier
- Sentry
- Shopify
- Zoho
- Snowflake
- Pinecone

Each needs a read-only probe or an explicit "no safe probe" state in the UI. A connector must never be marked healthy without evidence.

## 7. Known defects and gaps

These are specific, current and should be fixed or disclosed before launch.

| Area | Defect | Required action |
| --- | --- | --- |
| GitHub | `list_repos` uses an installation-only endpoint that fails for user PAT/OAuth tokens | Select the endpoint by auth mode and test both PAT and OAuth |
| Snowflake | List/describe actions omit the required SQL statement | Add the statement body and test against a real account |
| Zoho | Module is optional although the API requires it | Make the module field required |
| Google | Service-account option is advertised but not implemented | Hide it or implement and test it |
| Verifier inputs | Default verifier actions for Atlassian, Dropbox, Google, Figma and Zapier need inputs | Add safe defaults or dedicated probes |
| Auth labels | Notion, HubSpot and Linear advertise OAuth only even though manual tokens work | Show both methods or label the manual path explicitly |
| Probes | 8 connectors have no health probe | Add a probe or a "no probe" state |
| Capacity | All 31 connectors in one workspace exceed Pro's 25-connection cap | Document that this needs Scale and make the upgrade path clear |
| Onboarding | The page says "Setup · 01 of 02" but only one onboarding page exists | Add the second step or change the copy |
| Packaging | SDK, CLI, MCP and Python SDK are not on registries | Publish and test from a clean machine |
| Live proof | Most connectors, SSO/SCIM, trust and streaming lack live evidence | Run the verification waves before launch |

## 8. Decisions needed before sign-off

| Decision | Recommended default | Why it matters |
| --- | --- | --- |
| Connector launch policy | 8–12 Stable; all 31 visible, with the rest marked Beta | Makes the marketing claim defensible without blocking on 12 OAuth reviews |
| Gmail at launch | No restricted Gmail scopes; Gmail Beta | Restricted-scope review can take weeks |
| Paid launch vs free beta | Paid Pro/Scale at public launch, with Stripe live tested first | The product already has billing and plan gates |
| Enterprise at launch | Assisted only | SSO/SCIM and trust need real IdP and two-workspace proof |
| Region | One region at launch, documented | Current recovery evidence is single-region |
| Support target | One business day for email at launch | Realistic before 24/7 staffing |
| Uptime claim | Do not publish a public SLA until 30 days of monitoring | Avoid commitments the team cannot yet measure |
| Refunds | 14-day money-back on first purchase, manual review | Simple and supportable; no automated refund command |
| Trial | 14-day card-less Pro or Scale trial | Already described on the pricing page |
| SOC 2 / ISO | Keep "not certified" until a real audit exists | The trust page already discloses this |
| Analytics | Privacy-first product events, no PII or secrets | Required for consent and data-minimization claims |

### Inputs needed from the founder

- Domain and DNS access for the production and staging hosts.
- Hosting project and a Neon production project or branch. Preserve the existing Neon configuration.
- Stripe live account, business verification, products/prices for USD and INR, and the webhook secret.
- Resend account with a verified sending domain, plus SPF, DKIM and DMARC records.
- OAuth client IDs and secrets for the launch providers, and an owner for each provider review.
- Real test accounts or credentials for the token connectors in the launch set.
- Company details, tax IDs, refund policy, support inbox and legal review for terms, privacy and DPA.
- Decisions from the table above: connector tiers, Gmail scope, enterprise scope, region, support target and refund policy.

Keep third-party credentials out of tracked files, tickets and commits. For local testing they belong in the gitignored `.env`; for production they belong in the hosting secret manager. Never echo them back or commit them.

## 9. Launch sequence

### Phase 0 — decisions and accounts (1–3 days)

- Freeze the launch connector set and tier policy.
- Create provider developer accounts and OAuth apps.
- Create Stripe products/prices and the live webhook.
- Provision domain, staging, Neon production project and secret manager.
- Name one owner for each workstream: platform, connectors, packaging, billing, security, product UX and support.
- Name the on-call and support owner.

**Exit:** every P0 item has an owner and an external account or credential.

### Phase 1 — platform foundation (3–5 days)

- Deploy staging and production with TLS, secrets, migrations and cron.
- Verify email domain and send all transactional templates.
- Turn on monitoring, uptime checks, error tracking and status page.
- Run the backup and restore rehearsal at production volume.
- Publish npm and PyPI packages; test from a clean machine.

**Exit:** Gate A passes; a teammate can sign up, recover the account and see an empty dashboard on production.

### Phase 2 — connector wave 1 (5–10 days)

Verify 8–12 connectors end to end, including at least:

- GitHub and Slack (OAuth)
- Google (non-restricted scopes)
- Stripe, OpenAI, Resend and Vercel (token)
- One productivity connector (Notion, Linear or Airtable)

For each: credential or OAuth connect → grant → proxy call → audit → revoke. Record dated evidence without secrets. Fix the known defects. Mark everything else Beta.

**Exit:** Gate B passes for the launch set; the connector page shows honest status.

### Phase 3 — money and identity (3–5 days)

- Stripe live checkout, webhook, portal, invoice, cancellation and dunning test.
- Google/GitHub sign-in and email verification in production.
- MFA, SSO and SCIM with one real IdP if enterprise is sold at launch.
- End-user consent, control center, export and deletion test.

**Exit:** Gate C passes; a real low-value payment is charged, invoiced and refunded manually.

### Phase 4 — hardening and game day (3–5 days)

- Independent security review; fix critical and high findings.
- Production-volume load test; verify 429/402 behavior.
- Audit-chain verification, key rotation and restore drill.
- Support macros and incident tabletop.
- Full game day: sign up → connect → call → approve → upgrade → cancel → delete.

**Exit:** Gate D passes; no P0 checklist item is open.

### Phase 5 — soft launch (1–2 weeks)

- Invite 5–10 design partners.
- Watch activation, connector failures, approval latency and support volume.
- Fix the top three friction points before public marketing.
- Keep enterprise deals assisted.

**Exit:** Activation and reliability targets hold for two consecutive weeks.

### Phase 6 — public launch

- Open self-serve signup and paid plans.
- Publish the launch post, docs and status watch.
- Staff support and on-call for launch week.
- Review metrics daily; roll back the launch flag if the error or support load crosses the threshold.

## 10. Go/No-Go checklist

Every box must be checked before public paid launch.

### Platform

- [ ] Production domain, TLS and HSTS work; staging is separate
- [ ] All secrets are in a managed store; no secret is in git or logs
- [ ] Production migrations applied over the direct connection; app uses pooled
- [ ] Daily off-site backup runs; checksum verified; restore rehearsal passed at production volume
- [ ] Cron runs every 5 minutes and failures alert
- [ ] Email domain passes SPF, DKIM and DMARC; all templates delivered to Gmail and Outlook
- [ ] Error tracking, uptime checks and proxy/approval/billing dashboards are live
- [ ] Public status page and incident runbook are ready
- [ ] Load test at launch concurrency passes; DB pool sized
- [ ] WAF, rate limits, CSP, HSTS, cookie flags and dependency scanning are on
- [ ] Support inbox is monitored; response target published
- [ ] Demo login and seed are off; data contribution is off by default

### Connectors

- [ ] Launch connector tiers are published
- [ ] Launch OAuth apps are configured, reviewed where required, and tested
- [ ] Launch token connectors have dated live proof
- [ ] Every launch connector has a probe or an explicit no-probe state
- [ ] Known connector defects are fixed or disclosed
- [ ] End-to-end verification harness runs before each release
- [ ] Revoke and disconnect stop the next call

### Packaging

- [ ] `@authab/sdk`, `@authab/cli`, `@authab/mcp` published to npm
- [ ] `authab-sdk` published to PyPI with extras
- [ ] Docs use registry install commands
- [ ] Clean-machine quickstart passes
- [ ] API/OpenAPI reference matches production

### Money

- [ ] Stripe live checkout works in USD and INR
- [ ] Webhook signature, idempotency and out-of-order events tested
- [ ] Real low-value payment, invoice, PDF and portal update tested
- [ ] Cancel, downgrade, past-due and suspension behavior match the pricing page
- [ ] Tax, billing address, tax ID and credit notes configured
- [ ] Refund and cancellation policy published
- [ ] Plan limits and 402 behavior enforced on every path

### Security and identity

- [ ] Google and GitHub sign-in work in production
- [ ] Magic link, password reset, MFA and session revocation tested
- [ ] SSO and SCIM tested with a real IdP (if enterprise is sold)
- [ ] Audit chain verifies nightly; break alert fires; WORM holds
- [ ] Cross-org and cross-environment isolation tests pass
- [ ] Independent security review complete; critical/high fixed
- [ ] `security.txt` and disclosure policy published
- [ ] Key rotation rehearsed in production
- [ ] Data export, deletion and retention tested
- [ ] Terms, privacy, DPA, subprocessors and analytics consent reviewed
- [ ] Incident and breach runbook exercised
- [ ] No unsupported SOC 2, ISO or penetration-test claims

### Product and launch

- [ ] Onboarding step copy fixed
- [ ] First-run checklist works; every empty state has one next action
- [ ] Connector auth UX is honest about OAuth vs token
- [ ] Consent, control center, approvals and billing self-serve flows tested on mobile
- [ ] Accessibility audit passed for the core flows
- [ ] Landing claims audited; only proven connectors say Stable
- [ ] Legal pages linked and versioned
- [ ] Contact, support and security inboxes monitored
- [ ] Launch-day on-call, rollback owner and comms owner assigned
- [ ] Game day completed end to end

## 11. Launch metrics

Set targets before launch; measure weekly.

| Metric | Definition | Launch target |
| --- | --- | --- |
| Activation | Sign-up to first successful governed proxy call | Measure baseline; target under 15 minutes for the quickstart path |
| Setup completion | Onboarding completed / sign-ups | ≥ 60% |
| Connector auth success | Successful connect or credential save / attempts | ≥ 85% for Stable connectors |
| Proxy success | 2xx / all proxy calls, excluding policy denials | ≥ 99% for Stable connectors |
| Approval latency | Request created to decision | p50 under 10 minutes during business hours |
| Approval expiry | Expired / all approval requests | < 10% |
| Trial to paid | Paid subscriptions / trial starts | Set after soft launch |
| Involuntary churn | Past-due workspaces that do not recover | Set after 30 days |
| Support first response | First human reply | Within one business day |
| Incident MTTR | Detection to mitigation | Set after the first tabletop |
| Audit integrity | Verification failures | 0 |
| Error budget | 5xx rate on core surfaces | < 0.5% at launch |

## 12. Out of scope for launch

- SOC 2 Type II or ISO 27001 certification.
- A public connector marketplace or third-party connector submissions.
- Multi-region data residency.
- Fully self-serve enterprise SSO/SCIM without assistance.
- 24/7 support.
- Automated refunds.
- Native mobile apps.
- All 31 connectors marketed as equally Stable.

## 13. Source of truth

- [README](../../README.md) — product, API, deployment, demo workspace
- [.env.example](../../.env.example) — environment variable inventory
- [CI workflow](../../.github/workflows/ci.yml) — test and build gates
- [Plans and limits](../../src/lib/plans.ts) — Free/Pro/Scale/Enterprise limits
- [OAuth providers](../../src/lib/oauth-providers.ts) — 12 provider definitions
- [Health probes](../../src/lib/health-checks.ts) — connector probe coverage
- [System design](../architecture/system-design.md) — target architecture, scale limits and implementation phases
- [Backup and restore](../operations/backup-restore.md) — measured recovery evidence and limits
- [Load testing](../operations/load-testing.md) — baseline numbers and caveats
- [Key rotation](../operations/key-rotation.md) — rotation procedure
- [GitOps](../operations/gitops.md) — config-as-code limits
- [Onboarding](../../src/app/onboarding/page.tsx), [consent](../../src/app/consent/%5Btoken%5D/page.tsx), [control center](../../src/app/me/page.tsx), [approvals](../../src/app/approve/%5Btoken%5D/page.tsx)
- [Trust center](../../src/app/trust/page.tsx) — current compliance disclosures
