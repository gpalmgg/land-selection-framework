# Layer 4: Structured Data — Nova Scotia / Cape Breton land access for newcomer regenerative communities (2026)

**Generated:** 2026-07-03T00:00:00Z (session date; exact time not captured by tooling)
**Target type:** Topical/legal claim (deed-transfer tax, foreign-buyer ban, provincial nominee program, Mi'kma'ki treaty status) — NOT a single entity with one primary domain.

**Resolution approach:** Per dispatch instructions, this target does not resolve to one meaningful entity domain. Instead of declining outright, three **authoritative government/institutional domains** implicated by the specific legal claims were identified and run through infra recon, on the theory that confirming these are genuine first-party government infrastructure (not spoofed/third-party mirrors) is itself a useful corroborating signal for Layer 1's prose claims:

1. **novascotia.ca** — Government of Nova Scotia (deed transfer tax, general provincial policy)
2. **novascotiaimmigration.com** — Nova Scotia Provincial Nominee Program (PNP)
3. **canada.ca** — Government of Canada (federal foreign-buyer ban: Prohibition on the Purchase of Residential Property by Non-Canadians Act)

A fourth candidate, **kmkno.ca** (Kwilmu'kw Maw-klusuaqn Negotiation Office — the Mi'kmaq treaty/rights negotiation body relevant to Mi'kma'ki treaty status claims), was attempted and **did not resolve** — see Wiring Notes.

This file is therefore a **hybrid**: infra-fingerprint recon on the domains that host/publish the claims, not recon on "the claim" itself. Treat it as provenance/authenticity corroboration, not as a source of the policy facts themselves (that's Layer 1/3's job).

**Binary detection matrix:**
- whois: present (/usr/bin/whois)
- dig: present (/usr/bin/dig)
- subfinder: present (/Users/gustafpalm/go/bin/subfinder)
- nmap: present (/opt/homebrew/bin/nmap) — not invoked; no process step calls for active port scanning in this passive-recon pass
- httpx: present (/Users/gustafpalm/Library/Python/3.9/bin/httpx) — not invoked; no process step required it
- curl: present (/usr/bin/curl)

**Service availability:**
- crt.sh: ✗ (502 Bad Gateway, non-JSON, both first attempt and retry)
- Wayback CDX: partial (root-domain snapshots retrieved; specific policy-page paths timed out on repeated attempts — see Wiring Notes)
- GitHub: n/a (target is not a software project/org)

---

## whois (registration ground-truth)

### novascotia.ca
- **Creation Date:** 2004-11-22
- **Registry Expiry Date:** 2029-11-17
- **Registrar:** Rebel.ca Corp.
- **Updated Date:** 2026-06-18
- **Registrant Organization:** Government of Nova Scotia
- **Registrant Country:** CA
- **Name Servers:** ns1.d-zone.ca, ns2.d-zone.ca

### novascotiaimmigration.com (PNP domain)
- **Creation Date:** 2004-12-21
- **Registry Expiry Date:** 2026-12-21 (renews in ~5.5 months from today)
- **Registrar:** Rebel.com / Rebel Ltd
- **Updated Date:** 2026-06-20
- **Registrant Organization/Country:** REDACTED FOR PRIVACY (WHOIS privacy on the .com registration — note the underlying infra confirms government ownership regardless, see Infra Fingerprint)
- **Name Servers:** ns1.d-zone.ca, ns2.d-zone.ca

### canada.ca (federal foreign-buyer-ban authority)
- **Creation Date:** 2002-11-25
- **Registry Expiry Date:** 2026-10-16
- **Registrar:** Authentic Web Inc.
- **Updated Date:** 2025-10-30
- **Registrant Organization:** Shared Services Canada
- **Registrant Country:** CA
- **Name Servers:** ns1/ns2.d-zone.ca + ns10/ns11/ns40/ns41.ent.global.gc.ca (Government of Canada enterprise DNS)

### kmkno.ca (Mi'kmaq treaty negotiation body)
- Did not resolve. See Wiring Notes.

---

## dig (DNS records)

### novascotia.ca
- **A:** 64.15.49.124
- **MX:** 5 novascotia-ca.mail.protection.outlook.com (Microsoft 365)
- **NS:** ns1.d-zone.ca, ns2.d-zone.ca
- **TXT (up to 6):** pexip-portal-domain-verification=..., pexip-ms-tenant-domain-verification=..., intersight=..., two long DKIM/verification-style hashes, adobe-idp-site-verification=...

### novascotiaimmigration.com
- **A:** 64.15.49.106
- **MX:** (none returned)
- **NS:** ns1.d-zone.ca, ns2.d-zone.ca
- **TXT (up to 6):** `_v7270z7i276ktws5fter3c76dscfhsp`, `v=spf1 -all` (mail explicitly disallowed — consistent with no MX record), `vs049.cio.gov.ns.ca alias` (**direct evidence this .com domain is CNAME/alias-mapped to the province's own CIO server naming convention**), `_16swonocsybqd1aaejfyadbhp26ahb2`

### canada.ca
- **A:** 205.193.215.159, 160.106.123.29, 167.40.79.24, 205.193.117.159 (multiple A records — load-balanced/anycast)
- **MX:** 0 canada-ca.mail.protection.outlook.com (Microsoft 365)
- **NS:** ns1/ns2.d-zone.ca + ns10/ns11/ns40/ns41.ent.global.gc.ca

## Reverse DNS / IP ownership (supplementary — not in standard process but load-bearing here)

- `64.15.49.124` (novascotia.ca) reverse-resolves to **`vs121.cio.gov.ns.ca`** and `novascotia.ca` — "cio.gov.ns.ca" is the province's own Chief Information Officer domain naming convention, i.e. self-hosted, not a third-party CDN.
- IP whois for `64.15.49.124`: **CIDR 64.15.48.0/20, Organization: "Nova Scotia Provincial Government (NSPG)", NetName: NSPG-NET, Country: CA.** The IP block itself is registered directly to the provincial government — this is first-party government infrastructure, not a reseller or hosting intermediary.
- `64.15.49.106` (novascotiaimmigration.com) reverse-resolves into a cluster of related domains on the same government hosting block: `vs049.cio.gov.ns.ca`, `passwordupdate.novascotia.ca`, `passwordreset.novascotia.ca`, `nouvelleecosse.com` / `nouvelle-ecosse.com` (French-language mirrors), `immigrationnouvelleecosse.com`, `accessns.ca`, `myhealthns.ca`, `huntns.ca`, `hearingandspeech.ca`, `iwkhealth.ca`, `nsdomesticviolence.ca` — confirming novascotiaimmigration.com sits in the same first-party NS-government-family hosting cluster as other confirmed provincial services (health, hunting licenses, domestic-violence resources), despite its `.com` TLD and WHOIS-privacy-redacted registrant.

## subfinder (subdomain enumeration — novascotia.ca)

556 total subdomains discovered via passive sources; capped to 50 below (sorted, deduped). Full count noted for scale context. One directly relevant to the target's PNP claim: **immigration.novascotia.ca**.

```
511.novascotia.ca
811.novascotia.ca
acadien.novascotia.ca
accessappointments.novascotia.ca
accessible.novascotia.ca
accessnscancel.novascotia.ca
accessnsticket.novascotia.ca
accommodations-registry.novascotia.ca
acp.novascotia.ca
acs.cloud.novascotia.ca
actionforeconomy.blog.novascotia.ca
actionforhealth.novascotia.ca
admin-latis-dev.apps.nonprod.novascotia.ca
admin-latis-test.apps.nonprod.novascotia.ca
admin-latis-uat.apps.nonprod.novascotia.ca
admin-latis.novascotia.ca
admin.dev.forms.novascotia.ca
admin.passive.forms.novascotia.ca
admin.stage.forms.novascotia.ca
afh-newsletter.novascotia.ca
agri-classroom.novascotia.ca
ansa.novascotia.ca
antibullying.novascotia.ca
api-notification-dev.cloud.novascotia.ca
api-notification-stag.cloud.novascotia.ca
api-notification-stg.cloud.novascotia.ca
api-nsguard-dev.apps.nonprod.novascotia.ca
api-nsguard-test.apps.nonprod.novascotia.ca
api-nsid.novascotia.ca
api.dev.forms.novascotia.ca
api.ext.novascotia.ca
api.nonprod-hfx.novascotia.ca
api.notification-dev.cloud.novascotia.ca
api.passive.forms.novascotia.ca
api.rjsc.novascotia.ca
api.stage.forms.novascotia.ca
app-balmoralgristmill.apps.nonprod.novascotia.ca
app-blackloyalist.apps.nonprod.novascotia.ca
app-cardingmill.apps.nonprod.novascotia.ca
app-clifton.apps.nonprod.novascotia.ca
app-cossithouse.apps.nonprod.novascotia.ca
app-doryshop.apps.nonprod.novascotia.ca
app-firefightersmuseum.apps.nonprod.novascotia.ca
app-fisheriesmuseum.apps.nonprod.novascotia.ca
app-fishermanslife.apps.nonprod.novascotia.ca
app-fundygeological.apps.nonprod.novascotia.ca
app-highlandvillage.apps.nonprod.novascotia.ca
app-lawrencehouse.apps.nonprod.novascotia.ca
app-levillage.apps.nonprod.novascotia.ca
app-maritimemuseum.apps.nonprod.novascotia.ca
highlandvillage.novascotia.ca
immigration.novascotia.ca
sutherlandsteammill.novascotia.ca
```

(Note: the last three lines above were pulled from a keyword grep of the full 556-entry list rather than strict alphabetical position within the first 50 — included because `immigration.novascotia.ca` is directly relevant to the PNP claim in the target.)

## crt.sh (certificate transparency)

**Skipped.** Both the initial request and a single retry (per graceful-degradation rules) returned an HTML 502 Bad Gateway from nginx rather than JSON — crt.sh's backend appears to be down or rate-limiting, not merely challenge-paging. Subfinder's 556-subdomain passive-source result substantially covers the cert-transparency signal for this domain regardless.

## Wayback Machine (first snapshots)

- **novascotia.ca:** first archived **2005-12-17** — http://web.archive.org/web/20051217120526/http://novascotia.ca:80/
- **novascotiaimmigration.com:** first archived **2005-02-27** — http://web.archive.org/web/20050227003846/http://www.novascotiaimmigration.com:80/

Attempts to date the *specific* policy pages (non-resident/foreign-buyer deed transfer tax page, PNP program-detail pages) via Wayback CDX with guessed URL paths and wildcard/filter queries **timed out repeatedly** (see Wiring Notes) — archive.org's CDX API appeared to rate-limit or choke on filtered/wildcard queries specifically, even though its homepage and simple exact-URL queries succeeded. No first-snapshot date could be obtained for the deed-transfer-tax or PNP program-detail pages specifically; only domain-root dates are reported above.

## GitHub Org Graph

N/A — target is a government policy topic, not a software project or identifiable GitHub org.

## Infra Fingerprint

- **Registrar:** novascotia.ca → Rebel.ca Corp.; novascotiaimmigration.com → Rebel.com/Rebel Ltd; canada.ca → Authentic Web Inc.
- **Domain registered:** novascotia.ca — 2004; novascotiaimmigration.com — 2004; canada.ca — 2002
- **Mail provider:** Microsoft 365 for both novascotia.ca and canada.ca (`*.mail.protection.outlook.com` MX records). novascotiaimmigration.com has no MX and an explicit `v=spf1 -all` (no mail sent from this domain at all — consistent with it being a program-info portal, not a mail-handling domain).
- **DNS provider:** d-zone.ca (D-Zone Inc., CIRA's anycast DNS infrastructure) across all three government domains — a strong Canadian-government-institutional signal, since D-Zone is CIRA-affiliated and commonly used by Canadian public-sector domains. canada.ca additionally layers in `*.ent.global.gc.ca` (Government of Canada's own enterprise nameservers) alongside d-zone.ca.
- **Hosting indicator:** novascotia.ca and novascotiaimmigration.com are **self-hosted first-party Nova Scotia provincial government infrastructure** — the IP block (64.15.48.0/20) is registered directly to "Nova Scotia Provincial Government (NSPG)," and reverse DNS resolves to the province's own `cio.gov.ns.ca` naming convention, not a third-party CDN/cloud reseller. This is a meaningful authenticity signal: these are not spoofed or unofficial mirrors.
- **First public presence:** novascotia.ca — 2005-12-17 (Wayback); novascotiaimmigration.com — 2005-02-27 (Wayback)

## Wiring Notes

- **crt.sh unreachable:** returned HTTP 502 Bad Gateway (nginx) on both the initial call and a retry — a genuine service outage/rate-limit on crt.sh's side, not the usual JSON-challenge-page failure mode this agent is built to detect. Even a plain `curl https://crt.sh` homepage request timed out, confirming it's crt.sh-side rather than query-specific. Subfinder's passive-source result (556 subdomains) is the substitute signal.
- **Wayback CDX flakiness on filtered/wildcard queries:** simple exact-URL CDX lookups (root domain, novascotiaimmigration.com root) succeeded on retry, but every attempt to use `matchType=domain` + `filter=urlkey:...` wildcard queries to locate the specific deed-transfer-tax or PNP program-detail pages timed out (3 separate attempts, 12-20s timeouts each). This looks like archive.org rate-limiting broader/filtered CDX queries specifically. As a result, **no first-snapshot date could be obtained for the specific policy pages** referenced in the target claim (deed transfer tax page, PNP program page) — only domain-root first-presence dates are reported. This is a genuine data gap, not a fabricated substitute.
- **kmkno.ca (Mi'kmaq treaty negotiation body / KMKNO) did not resolve:** no A record, no whois record returned via either the default whois client or an explicit query to `whois.cira.ca`. This could mean (a) the domain has lapsed/changed, (b) KMKNO publishes under a different domain not identified in this pass, or (c) the domain requires a differently-formatted CIRA whois query this tool didn't replicate. **This is a genuine gap for the Mi'kma'ki treaty-status portion of the target claim** — Layer 4 could not independently verify or fingerprint the primary institutional domain for that claim. Flagging for Layer 1 (WebSearch) to identify the correct current domain, if one exists, since that's outside this agent's remit.
- **novascotiaimmigration.com registrant identity is WHOIS-privacy-redacted** on the .com registration itself (unlike the .ca novascotia.ca record, which plainly states "Government of Nova Scotia"). Ownership was instead confirmed indirectly via infrastructure (shared IP block with NSPG-registered space, `vs049.cio.gov.ns.ca` alias in TXT records, shared D-Zone nameservers, and reverse-DNS clustering with other confirmed NS-government domains). This is a slightly weaker chain of evidence than a direct WHOIS registrant field, though still solid corroboration.
- **nmap and httpx were detected as present but not invoked** — no step in this agent's defined process calls for active port scanning or live HTTP probing; the pre-flight matrix only reports their presence for transparency.
- **GitHub section skipped** — not applicable; this is a government policy topic, not a software project.
- **This file corroborates domain authenticity/infrastructure, not policy content.** It cannot confirm or deny the substance of the deed-transfer-tax rate, foreign-buyer-ban mechanics, PNP eligibility criteria, or Mi'kma'ki treaty status claims themselves — only that novascotia.ca, novascotiaimmigration.com, and canada.ca are genuine, self-hosted/first-party Canadian government infrastructure where such claims would authoritatively originate. Cross-reference against Layer 1's prose citations for the actual policy content.
