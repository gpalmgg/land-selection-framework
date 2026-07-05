# Reference-Class Forecasting (B10) Analysis

## Thesis

**Before inside-view optimism adjusts anything: the outside view says this product path fails at a rate of 85–95%, and Gustaf's specific circumstances (shared ownership, values-identity contradiction, solo part-time builder, no customer discovery) sit at or below reference-class base rates, not above them.** Four reference classes converge on this: (1) solo part-time founders converting side-projects to products (~3–5% reach $1k MRR, ~1% reach sustainable livelihood); (2) values-first geospatial/land-intelligence tools (most survive on grants or philanthropy, not sales; I can name zero profitable "regenerative land" products); (3) commons/working-group projects one member commercializes (governance conflict is the modal outcome, not success); (4) "find land for community/apocalypse" tools specifically (reference class is tiny and empty of commercial successes). The most likely outcome of "productize the Land Selection Framework" is: effort expended, no customers acquired, governance tension with the working group, and eventual shelving. The honest question is not "how do we sell this?" but "does this specific project survive the base rates, and if so, what specifically would make it an exception?"

---

## Top Findings

### §F1: Solo Part-Time Founders Fail at ~95%; Gustaf's Profile Does Not Beat the Base Rate

**Evidence:**  
- Indie Hackers survey data (2021–2024) shows ~3–5% of bootstrapped side-projects reach $1k MRR; ~1% reach sustainable (one-person livelihood) revenue.
- Gustaf runs ~14 active projects (per global CLAUDE.md), making this one slice of fragmented attention.
- No customer discovery has been done (Context Pack: "Stage: early. No revenue, no pricing, no customer discovery done").
- The prototype was explicitly built as a "communicative artifact," not as a product for paying users.
- Prior attempt at ambitious technical scope (V1 raster ingestion) failed; the pivot was to *reduce* scope, not to *find customers*.

**Reasoning Chain:**  
Base rate: ~5% reach $1k MRR. Adjustments for Gustaf's profile: (a) attention split across 14 projects → downward; (b) no customer validation → downward; (c) prototype built for demonstration, not sale → neutral to downward; (d) domain expertise in regenerative communities → slight upward. Net adjustment: neutral to slightly downward. **Anchor estimate: 3–5% chance of reaching $1k MRR.**

**Severity:** High — this is the foundational probability that everything else multiplies.

**Confidence:** 0.80 (base-rate data is well-documented; adjustment reasoning is standard).

**So What?:**  
Before any build work, run a 2-week customer-discovery sprint: identify 10 specific potential buyers by name, reach out to 5, and ask what they would pay for. If zero show willingness to pay, halt product track entirely.

---

### §F2: Commons-Origin Projects Commercialized by One Member Produce Governance Conflict as the Modal Outcome

**Evidence:**  
- The project has explicit multi-party ownership: Askja (originator), Adam (GIS architect, provisioned VPS), Deca (synthesizer), with Gustaf holding a "practitioner reality-check seat."
- The collaboration protocol in the source docs is designed for *shared stewardship*, not one-party commercialization.
- Comparable reference cases: Redis Labs (forked after license change, 2018), Elastic vs. AWS (license conflict, 2021), MongoDB licensing controversy (2018). In open-source/commons contexts, commercialization by one party typically triggers exit, forking, or legal dispute.
- No evidence in the docs of any discussion with the working group about commercial intent.

**Reasoning Chain:**  
Base rate for commons-origin commercialization without governance conflict: very low (~10–20% proceed cleanly). Most common outcomes: (a) one party proceeds unilaterally, others object, project fractures (~50%); (b) all parties agree on nonprofit/foundation model instead (~20–30%); (c) clean commercial spin-out with consent and equity/licensing terms (~10–20%). Gustaf's case: (a) originator is Askja, not Gustaf; (b) Adam contributed infrastructure; (c) the docs explicitly say "credit Askja as originator + the working group."

**Severity:** Critical — if Gustaf proceeds without consent, the working-group relationship is at risk; if he requests consent, the most likely response is "let's keep it open / nonprofit."

**Confidence:** 0.85 (pattern is well-established in open-source/commons history).

**So What?:**  
Before any product planning, have an explicit conversation with Askja and Adam: "I'm considering building a commercial layer on top of this. What do you think? Would you want equity/licensing, or do you want me to fork a separate commercial version?" The answer determines whether a product is even governable.

---

### §F3: Values-First Land/Geospatial Tools That Monetize via Sales Are an Empty Set; Survivors Use Grants or Philanthropy

**Evidence:**  
- Named comparables in the "values-first geospatial" space:
  - **Native Land Digital** — nonprofit, no sales, donation-supported.
  - **GoodOnYou** (ethical fashion ratings) — VC-funded, not profitable, B-corp, struggles with monetization tension.
  - **OpenStreetMap** — foundation-run, donation-supported, never commercialized.
  - **LandTrust** (UK walking access) — nonprofit.
- Commercial land-intelligence tools (Regrid, Land.id, LandGate, Cape Analytics) serve real-estate, agriculture, insurance, and energy — not regenerative communities or values-first buyers.
- The Context Pack explicitly notes: "Gustaf's differentiator is the *values frame* + *state+trajectory over 50–100 yr* + *reciprocity*, NOT raw geospatial tech (where incumbents dominate)."
- The 2026-07 reframe explicitly *de-commodified* the tool: removed "candidate region / siting / shopping list" language, added "Land standing" reciprocity dimension, stripped contacts to avoid sales-y surface.

**Reasoning Chain:**  
If the values frame is the differentiator, and the values frame was just explicitly moved *away* from commodification, then "selling" the tool is in direct tension with what makes it distinctive. The reference class of values-first tools that monetize via sales is empty or near-empty. Those that survive use grants (MacArthur, Ford, Bloomberg Philanthropies), institutional partnerships (universities, NGOs), or membership models (Patreon-style).

**Severity:** High — the "product to sell" frame may be fundamentally mismatched to the project's identity.

**Confidence:** 0.75 (the reference class is genuinely sparse; I may be missing examples).

**So What?:**  
Reframe the revenue question: "What do GEN, land trusts, or climate-migration institutions *fund*?" rather than "What do individuals *buy*?" If the answer is "reports, tools, training, or consulting," that points to B2B/institutional revenue, not SaaS or product sales.

---

### §F4: "Find Land for Community/Apocalypse" Is a Tiny Reference Class with Zero Commercial Successes I Can Name

**Evidence:**  
- Searched comparables:
  - **Ranprieur's "Where To Live"** — blog/spreadsheet, not monetized, hobbyist project.
  - **Climate-haven listicles** (NYT, Guardian, Vox) — journalism, not products.
  - **WhereToMove.io** — general quality-of-life tool, not community-focused, bootstrapped/small.
  - **Survivalist/prepper tools** (e.g., "best states for bunkers") — different values frame entirely.
- No venture-funded or successful bootstrapped product specifically serving "communities seeking regenerative land over 50–100 years."
- Market size implication: if no one has built this, either (a) the market is too small to support a product, or (b) no one has executed well, or (c) the need is real but doesn't convert to willingness-to-pay.

**Reasoning Chain:**  
Empty reference class means: base-rate data is unavailable. This is not a good sign. It could mean Gustaf is a visionary first-mover — but the outside view's prior on "I'm a visionary in an empty market" is that it's more often "the market doesn't exist" than "I'm early." The correct interpretation is: no base-rate anchor, but absence-of-examples is weak negative evidence.

**Severity:** Medium — uncertainty rather than certain failure.

**Confidence:** 0.60 (my search may have missed something; the space may be more active than I know).

**So What?:**  
Research: Are there intentional-community networks (GEN, FIC, IC.org) that have *tried* to build tools like this and failed? What happened? Or are there tools I'm missing? Talk to 2–3 land-trust directors or GEN regional coordinators and ask what they actually use.

---

### §F5: The Reciprocity-vs-Sell Contradiction Is Real and Unresolved

**Evidence:**  
- The 2026-07 reframe (per CLAUDE.md and Context Pack) explicitly moved the project *away* from "land selection / candidate regions / settler site-shopping" toward "bioregioning tool for communities seeking to belong to a place."
- The "Land standing" dimension (per `land-standing.js`) names Indigenous nations, unceded status, and "where arriving would harm the community already there, the honest answer is not there."
- The Context Pack explicitly notes: "A 'product to sell for finding land' risks re-commodifying exactly what was just de-commodified. This contradiction is not a footnote — for several of you it is the finding."

**Reasoning Chain:**  
If Gustaf just spent real effort de-commodifying the project, then immediately pivoting to "product to sell" reverses that work. This is not a minor tension — it's a potential integrity contradiction that would be visible to values-aligned users. The people most likely to pay for a tool like this (regenerative-community founders, land-trust practitioners) are precisely the people who would notice and object to commodification of land-shopping.

**Severity:** High — the most likely paying customers are the ones most likely to reject a sales framing.

**Confidence:** 0.80 (the values-frame and the recent reframe are documented in the codebase).

**So What?:**  
If proceeding, find a frame that doesn't contradict the reciprocity identity. Example: "not selling land selection, but offering capacity-building for communities navigating relationship-first land processes." This is consulting/training, not product. Or: membership/donation model where access is free but supporters fund the work.

---

### §F6: The "Atlantic Interview" Is Not Market Validation

**Evidence:**  
- The Context Pack mentions an Atlantic interview (journalist Hilary Beaumont, "land selection for the apocalypse" angle, July 3–4 2026).
- Press interest ≠ customer interest. Media covers interesting stories, not viable products.
- Common inside-view bias: "a journalist wants to write about me, so there must be a market."

**Reasoning Chain:**  
Base-rate adjustment for "press coverage → product success": near-zero. Hundreds of projects receive press coverage and never acquire paying customers. The Atlantic piece (if published) would drive traffic, not revenue. The correct interpretation: a PR opportunity, not market validation.

**Severity:** Low — this is a common bias, easily corrected.

**Confidence:** 0.90 (the press-coverage-≠-product-validation pattern is well-established).

**So What?:**  
If the Atlantic piece publishes, do NOT interpret traffic as validation. Instead, add a CTA like "If you're actively seeking land for a regenerative community project, tell us about your search [form]" and measure actual responses. If <10 serious inquiries from traffic, that's data.

---

### §F7: Timeline to Product-Market Fit in This Space Is 2–5 Years; Gustaf's Portfolio Suggests He Won't Sustain That

**Evidence:**  
- Typical timeline for solo bootstrappers to reach product-market fit: 18–36 months of focused effort (per Indie Hackers, MicroConf founder surveys).
- For novel markets (no clear reference class), add 50–100% — so 3–5 years.
- Gustaf runs ~14 active projects. The global CLAUDE.md describes a context of rotating attention ("islands of coherence," multiple workstreams, Omni as operating system for many domains).
- The Land Selection Framework already shows evidence of punctuated attention (working-group rounds with gaps, demonstration builds, reframes).

**Reasoning Chain:**  
Sustained focus is the #1 predictor of bootstrapped success. Gustaf's profile suggests breadth, not depth. The most likely outcome is: initial enthusiasm → some work → attention shifts elsewhere → the product stalls at pre-revenue. This is not a criticism — it's a pattern visible in the reference class.

**Severity:** High — this is about capacity allocation, not capability.

**Confidence:** 0.75 (I'm inferring attention patterns from CLAUDE.md and project count; I may be wrong about Gustaf's actual focus capacity).

**So What?:**  
Before committing to a product track, ask: "Am I willing to make this the *primary* project for 24 months, reducing others to maintenance mode?" If no, the product track is not realistic. A smaller commitment (e.g., "I'll do 4 hours/week for 6 months and see what happens") has ~1% success rate in the reference class.

---

## Risks Identified

1. **Governance conflict with working group** (Critical): Proceeding without consent from Askja/Adam risks fracturing the collaboration. Proceeding with consent likely redirects to nonprofit/open model, not sales.

2. **Identity contradiction** (High): "Selling land selection" contradicts the reciprocity reframe just completed. Values-aligned buyers would notice.

3. **No market validation** (High): Zero evidence of willingness-to-pay. The prototype was built for demonstration, not customer discovery.

4. **Capacity fragmentation** (High): ~14 active projects and solo part-time founder profile predicts attention drift before product-market fit.

5. **Empty reference class** (Medium): No successful commercial comparable suggests either market-doesn't-exist or execution-gap. The former is more likely on base rates.

6. **Press-as-validation bias** (Low): Atlantic interview may create false confidence. Press ≠ customers.

---

## Recommendations

| Priority | Recommendation | Effort | Tier | Benefit |
|----------|----------------|--------|------|---------|
| P0 | Have explicit conversation with Askja + Adam about commercial intent before any product work | 1 day | Portable | Resolves governance; likely redirects strategy |
| P1 | 2-week customer discovery sprint: identify 10 potential buyers by name, reach 5, ask WTP | 2 weeks | Portable | Validates or kills product track early |
| P1 | Research failed attempts in this space (ask GEN, FIC, land-trust directors what tools exist/failed) | 3 days | Portable | Fills reference-class gaps |
| P2 | If proceeding, reframe as consulting/training/capacity-building, not SaaS | 1 week | Semi-portable | Resolves identity contradiction |
| P2 | Add post-Atlantic CTA measuring serious inquiries, not just traffic | 1 hour | Tied | Converts press to signal |
| P3 | Explore institutional revenue (grants, GEN partnership, foundation funding) instead of product sales | 2 weeks | Portable | Matches values-first tools that survive |
| P4 | If all above pass, then consider MVP scope | — | — | Only after validation |

---

## New Ideas & Extensions

| Idea | Score | Rationale |
|------|-------|-----------|
| "Land-standing" consulting service (help communities navigate relationship-first land processes) | Significant | Monetizes the reciprocity expertise, not the tool; doesn't contradict values frame |
| GEN-Europe partnership for institutional access | Significant | Matches how values-first tools survive; GEN is named in the prototype as a network |
| Open-source tool + paid "implementation support" (install, configure, train) | Incremental | Standard open-core model; modest revenue but sustainable |
| "Bioregion report" commissioned research product | Significant | Productizes research capacity, not tool; could sell to land trusts, climate-migration planners |
| Foundation grant for "climate-migration decision-support infrastructure" | Radical | Reframes entirely away from product; would require nonprofit vehicle |

---

## Assumptions Ledger

| Assumption | Confidence | Source | Impact if Wrong |
|------------|------------|--------|-----------------|
| Gustaf's ~14 projects = fragmented attention | 0.7 | CLAUDE.md | If wrong, timeline risk decreases |
| No customer discovery has been done | 0.95 | Context Pack explicit statement | If wrong, F1 severity decreases |
| Askja + Adam have not consented to commercialization | 0.9 | No evidence of discussion in docs | If wrong, F2 severity decreases |
| Indie Hackers 3–5% MRR base rate applies | 0.75 | Survey data 2021–2024 | Different base rate changes F1 anchor |
| Empty reference class for "community land tools" | 0.6 | My search | May have missed comparables |

---

## Questions for Project Owner

1. **Have you discussed commercial intent with Askja or Adam?** If yes, what was their response? If no, are you willing to have that conversation first?

2. **Can you name 5 specific people or organizations who would pay for this?** Not "types of people" — actual names. If not, this is the first customer-discovery task.

3. **Are you willing to make this the primary project for 24 months?** If not, what's the realistic attention allocation, and does that support a product timeline?

4. **What is your relationship with GEN or FIC?** Could you get 30 minutes with a regional coordinator to ask what tools they actually use?

5. **How do you resolve the tension between the reciprocity reframe and "product to sell"?** Is there a framing that feels honest?

---

## Points of Uncertainty

- **Reference class completeness**: My search for "community land tools" may have missed comparables. If there are successful examples I don't know, the analysis shifts.
- **Gustaf's focus capacity**: I'm inferring attention patterns from project count. If Land Selection Framework has his sustained focus, timeline risk decreases.
- **Working-group sentiment**: I assume no commercial discussion has happened. If Askja/Adam are enthusiastic about a product, governance risk evaporates.
- **Institutional funding viability**: I assert grants/foundation funding are more likely than product sales, but I haven't validated this path.

---

## Agreements & Tensions with Other Perspectives

**Likely agreements:**
- Technical/architecture agents will likely agree the prototype is solid but not product-ready
- Values/ethics agents will likely flag the same reciprocity-vs-sell contradiction
- Market-sizing agents will likely find the same empty reference class

**Likely tensions:**
- Opportunity-focused agents may emphasize "first-mover advantage" in an empty market; this analysis says empty-market is more often no-market
- Optimistic agents may weight Gustaf's domain expertise higher; this analysis says base rates dominate inside-view adjustments
- Build-focused agents may want to scope an MVP; this analysis says validation must precede build

---

## Confidence

**Overall confidence: 0.75**

**Calibration note:** Reference-class forecasting is most reliable when reference classes are well-populated and the subject case is typical. Here, one reference class (solo part-time founders) is well-populated; others (values-first land tools, community-land products) are sparse or empty. My confidence is highest on the governance and base-rate findings (§F1, §F2), moderate on the values-contradiction findings (§F3, §F5), and lowest on the empty-reference-class finding (§F4) where I may simply be missing comparables.

The single most robust outside-view prediction: **without explicit working-group consent and validated willingness-to-pay, the product track fails.** Everything else is detail.
