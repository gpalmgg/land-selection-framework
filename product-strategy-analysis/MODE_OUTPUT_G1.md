# Decision-Analysis (G1) Analysis

## Thesis

The productization question is not a single decision but a **decision tree under deep uncertainty**—specifically, uncertainty about demand (will anyone pay?), about governance (does Gustaf have the right to commercialize shared work?), and about identity-coherence (does selling contradict what the project deliberately became?). The expected value of rushing to build a product is **low-to-negative** given zero demand validation, ~14 competing claims on Gustaf's time, and a deliberate 2026-07 de-commodification reframe. The highest-value move is **not productization but information-gathering**: three cheap tests can reduce uncertainty by 60-80% before any build commitment. Only one option survives expected-value analysis as plausibly positive: a **thin consulting/advisory layer** on top of the shared framework—which Gustaf can offer today with zero new build, minimal governance friction, and reversible downside.

---

## Top Findings

### §F1. The Belief Question and the Action Question Are Dangerously Conflated

**Evidence:** CONTEXT_PACK §"Deployment / market context": ~zero users, unvalidated segments, no pricing, no customer discovery done. Gustaf's prompt: "a product to sell—valuable, professional, state of the art" assumes demand exists.

**Reasoning chain:** Decision theory distinguishes *beliefs* (probability estimates about world-states) from *actions* (choices with consequences). "Will anyone pay for this?" is a belief question; "Should Gustaf build a product?" is an action question. Acting before resolving the belief bets the action's cost on an untested belief. The evidence here is: belief is untested, action cost (build time across 14 projects + potential governance conflict + values-identity damage) is significant.

**Severity:** High. This is the failure mode the prompt names (enthusiasm-bias). Gustaf's time is the scarcest input; mis-allocating it destroys value across all 14 projects.

**Confidence:** 0.90

**So What?** Before ANY product decision, separate the belief question. Run a demand-validation spike (§R1) to get evidence on whether anyone will pay. Do not design, build, or plan until the belief is tested.

---

### §F2. Governance/Consent Blocks Three of Six Options Outright

**Evidence:** CONTEXT_PACK §"Ownership reality": Askja is originator; Adam provisioned VPS; Deca synthesized; Gustaf holds r4 seat. r4 Overview: "Public authorship guardrail: credit Askja as originator + the working group." Protocol requires consensus or propose-and-proceed with 5-day response window.

**Reasoning chain:** Options that touch the *framework itself* (productize the shared project; license the framework; SaaS data-product using the shared data layers) require consent from people Gustaf has not consulted. Proceeding without consent risks relationship damage with the very people who make the framework credible. The cost of being wrong here is non-financial: it threatens the collaborative ecosystem Gustaf values, and it would be publicly visible as an ethical breach (originator credited, product sold by someone else).

**Option-level impact:**
| Option | Governance gate? | Can proceed solo? |
|--------|------------------|-------------------|
| Status quo | No | Yes |
| Product Gustaf owns (adjacent) | Depends on reuse | Probably, if truly novel |
| Productize shared project | **Yes—blocks** | No |
| Consulting/advisory | No (uses expertise) | Yes |
| SaaS data-product | **Yes—blocks** | No |
| License framework | **Yes—blocks** | No |

**Severity:** Critical. Three options are unavailable without explicit working-group consent, which has not been sought.

**Confidence:** 0.95

**So What?** Do not plan SaaS, licensing, or direct productization of the shared project until you have explicit working-group consent. That conversation is itself a non-trivial action with relationship stakes.

---

### §F3. The Values-Coherence Cost of "Selling Land Selection" Is Not Zero

**Evidence:** CONTEXT_PACK §"The reciprocity reframe": July 2026 Gustaf repositioned the tool as "a bioregioning tool for communities seeking to belong to a place and help it flourish" with "reciprocity as the spine"; deliberately removed "land selection / candidate regions / settler site-shopping" from framing copy; stripped contacts to avoid sales-y surface; added Land Standing dimension with qualitative territory/obligation. The ethics section explicitly says "where arriving would harm the community already there, the honest answer is not there."

**Reasoning chain:** A product sold as "find land to buy" *is* the framing that was removed. The de-commodification work was not neutral—it was a values statement. Re-commodifying the tool would either (a) reverse that work visibly, (b) create cognitive dissonance between marketing and message, or (c) require a new frame that somehow reconciles "pay us to help you find land" with "the land is someone's homeland and the honest answer may be not there." Option (c) is possible but non-trivial and likely narrows viable segments.

**Severity:** Moderate-to-High. This is about mission-fit, not legal risk. If Gustaf's personal brand rests on "regenerative, reciprocity-first," selling a land-shopping tool could damage that brand—not catastrophically, but measurably.

**Confidence:** 0.75 (values alignment is subjective; Gustaf may not weigh this as heavily as I do)

**So What?** Any product framing must pass a coherence test: "Would I be comfortable if a critic quoted my Atlantic interview next to my product sales page?" Run that test explicitly before building anything public.

---

### §F4. Expected Value of "SaaS Data-Product" Is Likely Negative Under Realistic Builder Constraints

**Evidence:** CONTEXT_PACK §"Builder": solo, part-time, one of ~14 active projects. §"Paradigm lesson": an ambitious raster approach FAILED (large-file downloads truncated, projection errors); the winning move was a designed artifact, not a data product. §"Known limitations": hand-curated values, honest data gaps, no real V1 infrastructure.

**Reasoning chain:** A SaaS data-product competes on data coverage, freshness, and reliability. Competitors (Regrid, Land.id, ESRI) are well-funded teams with years of data-pipeline investment. Gustaf's prototype is explicitly "a communicative artifact," not infrastructure. Building real ingestion pipelines to the standard a paying customer expects (99.9% uptime, automated refresh, support) is a multi-person-year effort. Gustaf's time budget, spread across 14 projects, cannot deliver this. Expected outcome: a half-built product that either never ships or ships and churns because it cannot match customer expectations.

**Rough probability distribution:**
- Best case (30%): Ships MVP, finds niche customers willing to tolerate gaps, generates modest revenue (~$5-20K/yr).
- Base case (50%): Build takes 2x expected time, ships late, fails to find paying users, sunk cost.
- Worst case (20%): Build consumes time from higher-value projects (e.g., Animate Intelligence writing, Omni agents), ships nothing, strains working-group relationships.

**Multi-dimensional value:**
- Money: Expected $0-5K/yr after effort-weighted costs. Net negative if opportunity cost counted.
- Mission: Neutral-to-negative (see §F3).
- Relationships: Negative risk (governance friction, brand confusion).
- Time: Significant negative (direct build + maintenance tail).

**Cost of being wrong:** 6-12 months of Gustaf's time, relationship strain with working group, potential brand damage.

**Severity:** High. The option fails expected-value test.

**Confidence:** 0.80

**So What?** Do not build a SaaS data-product. The option is dominated by others.

---

### §F5. Consulting/Advisory Is the Only Option with Positive Expected Value Today

**Evidence:** The framework exists. Gustaf's embedded-in-eco-villages expertise exists. The Atlantic interview creates visibility. There is no build required—Gustaf can offer "guided land search consulting" today using the prototype as a credibility artifact.

**Reasoning chain:** Consulting has these properties:
- Zero build cost (prototype + expertise are inputs; deliverable is time).
- Zero governance conflict (Gustaf sells his expertise, not the shared framework).
- Values-coherent framing available ("I help communities navigate bioregioning with reciprocity in mind"—this *is* the de-commodified frame).
- Reversible (if no one pays, Gustaf has lost only the time of outreach).
- Tests the demand belief (if no one pays $X/hr for consulting, they certainly won't pay $Y/yr for a SaaS).

**Rough probability distribution:**
- Best case (20%): Atlantic interview or network generates inbound; Gustaf lands 2-5 engagements at $1-5K each; proves demand exists; informs future product decisions.
- Base case (60%): One or two nibbles; Gustaf learns what people actually want; valuable market research even if revenue is minimal.
- Worst case (20%): No takers; Gustaf learns demand is thin; saved from building a product no one wants.

Note: even the worst case is information-positive.

**Multi-dimensional value:**
- Money: Expected $0-10K/yr with minimal effort. Net positive even at low volume.
- Mission: Positive (direct service to communities; reciprocity-frame maintained).
- Relationships: Neutral-to-positive (no working-group friction; builds practitioner credibility).
- Time: Low investment; hourly deliverable model scales with demand, not ahead of it.

**Cost of being wrong:** A few hours of outreach and one or two unpaid conversations. Negligible.

**Severity:** N/A (this is a recommendation, not a risk).

**Confidence:** 0.85

**So What?** Pursue consulting/advisory as the first productization test. Write a one-pager describing the offer. Share it in the working group as "Gustaf's practice," not "the project's product." Test demand before any build.

---

### §F6. Value-of-Information Analysis: Three Cheap Tests Dominate Any Build

**Evidence:** Zero validated demand. Unknown governance position. Unknown Atlantic interview impact.

**Reasoning chain:** Under uncertainty, the value of information (VoI) is the expected improvement in decision quality from learning something before committing. Here, three cheap tests have high VoI:

| Test | Cost | What it resolves | VoI |
|------|------|------------------|-----|
| **Demand outreach** (5-10 cold emails to land trusts, community founders, GEN contacts) | 2-4 hours | "Will anyone pay?" (the belief question) | High—this is the crux |
| **Working-group conversation** (raise "what would you think if I offered consulting/product around this?" with Askja, Adam, Deca) | 1-2 hours, relationship risk | Governance consent; relational stakes | High—blocks 3+ options if no consent |
| **Atlantic interview observation** (wait for publication, track inbound) | 0 hours (passive) | Whether media generates demand signal | Moderate—free information |

None of these require building anything. All can be done in the next week. Together they resolve 60-80% of the decision uncertainty.

**Severity:** N/A (opportunity, not risk).

**Confidence:** 0.90

**So What?** Run all three tests before any build planning. Explicitly design the demand outreach as a falsifiable hypothesis: "If <5 of 10 contacts express willingness to pay $X, demand is not validated."

---

### §F7. The "Adjacent Product Gustaf Alone Owns" Option Requires Genuine Novelty—Which May Not Exist

**Evidence:** CONTEXT_PACK §"Core substrate": the framework layer (criteria, sovereignty axes, state+trajectory, reciprocity, MAUP-aware methodology) IS the product identity. The build wiring (MapLibre, Vercel, JS) is Tied and disposable.

**Reasoning chain:** An "adjacent product Gustaf owns" would need to add something the shared framework doesn't contain. What could that be?
- *The reciprocity dimension / Land Standing?* Gustaf built it, but it's now part of the prototype, which is the working group's artifact.
- *The 17-layer map?* Tied wiring, low value without the framework's interpretive context.
- *Consulting methodology?* This is expertise, not a product—collapses to consulting option.
- *A different geography (e.g., Global South)?* Possible, but requires significant new data work (see §F4 constraints).

The danger is building something that *looks* novel but relies on the shared framework's credibility, blurring the ownership line.

**Severity:** Moderate. The option is theoretically available but practically thin.

**Confidence:** 0.70

**So What?** If pursuing an adjacent product, articulate clearly *what Gustaf adds that the framework doesn't contain* before building. If the answer is "interpretation/expertise," you're describing consulting, not a product.

---

### §F8. The Real Decision Is Not "What to Build" but "What to Not Build"

**Evidence:** Gustaf has ~14 active projects (listed in ~/Projects/CLAUDE.md). Time is the binding constraint. Every hour on Land Selection is an hour not on Animate Intelligence essays, Omni agents, ecovillage magazine, consulting clients, etc.

**Reasoning chain:** Decision theory for constrained portfolios asks: "What is the opportunity cost of this investment?" Here, the opportunity cost of building a Land Selection product includes:
- Not finishing the next Animate Intelligence piece (high mission value, direct revenue via Substack).
- Not advancing Omni agents (compound returns on automation).
- Not serving existing consulting clients (relationship + revenue).

Even if Land Selection product EV were slightly positive, it may be dominated by higher-EV alternatives in Gustaf's portfolio.

**Severity:** High (portfolio-level, not project-level).

**Confidence:** 0.85

**So What?** Before building, force a portfolio comparison: "Is this the highest-return use of my next 40 hours?" If not, defer Land Selection build until it is.

---

## Risks Identified

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Building without demand validation** (sunk cost, time drain) | 70% if build starts now | High | Run demand tests first (§R1) |
| **Governance conflict with working group** | 30-50% if commercializing shared work | High (relationship damage) | Explicit conversation first (§R2) |
| **Values incoherence / brand damage** | 20-40% if "land shopping" frame returns | Moderate | Apply coherence test (§F3) |
| **Opportunity cost across 14-project portfolio** | Near-certain if significant build | High | Portfolio-compare before committing (§F8) |
| **Competitor entry with funded teams** | Ongoing | Moderate (niche differentiation possible) | Compete on values/expertise, not data scale |

---

## Recommendations

### R1. Run a Demand-Validation Spike Before Any Build Decision
**Priority:** P0 (do first)
**Effort:** 4-8 hours
**Tier:** Portable (the skill of demand validation transfers)
**Benefit:** Resolves the belief question with evidence, not assumption. Prevents sunk cost on unwanted product.
**Specifics:** Identify 10 contacts in plausible segments (3 land trusts, 3 community founders, 2 GEN/FIC network, 2 HNW/family-office). Send a short email: "Would you pay $X for guided land-search support?" Track responses. If <3 express interest, demand is not validated.

### R2. Have an Explicit Governance Conversation Before Any Commercialization
**Priority:** P0 (do first, parallel with R1)
**Effort:** 2-4 hours
**Tier:** Portable (relational skill)
**Benefit:** Clears or blocks commercialization options; prevents relationship damage.
**Specifics:** Message Askja, Adam, Deca: "I'm exploring whether to offer consulting or a product layer around this work. What's your read on that?" Listen more than pitch.

### R3. If Proceeding, Start with Consulting—Not a Product Build
**Priority:** P1 (after R1/R2)
**Effort:** 2-4 hours to write offer, then per-engagement
**Tier:** Portable (expertise, relationships)
**Benefit:** Tests demand with zero sunk cost. Values-coherent framing available. No governance conflict if framed as Gustaf's practice.

### R4. Do NOT Build a SaaS Data-Product
**Priority:** P2 (negative recommendation)
**Effort:** Saves 6-12 months
**Tier:** N/A
**Benefit:** Avoids dominated option. Preserves time for higher-EV portfolio projects.

### R5. If Atlantic Interview Generates Inbound, Capture It Lightly
**Priority:** P2 (contingent)
**Effort:** 2-4 hours to prepare a landing page / intake form
**Tier:** Semi-portable (the leads are valuable; the page is disposable)
**Benefit:** Converts media visibility to demand signal without premature commitment.

---

## New Ideas & Extensions

| Idea | Novelty | Notes |
|------|---------|-------|
| **Consulting offer using prototype as credibility artifact** | Incremental | Lowest-risk path; tests demand |
| **Working-group consortium model** (shared revenue if product proceeds) | Significant | Solves governance; requires buy-in |
| **Curriculum / workshop for intentional-community land seekers** | Significant | Scales expertise without building software; values-coherent |
| **Partner with existing platform (GEN, FIC) rather than building own** | Significant | Leverage their audience; avoid build |
| **"Red Team Your Land Search" service** (consulting as critique, not selection) | Radical | Inverses the frame; fits reciprocity ethic; differentiated |

---

## Assumptions Ledger

| Assumption | Confidence | If wrong... |
|------------|------------|-------------|
| Gustaf's time is constrained across ~14 projects | 0.95 | Build capacity is higher; SaaS option less dominated |
| Working group has not consented to commercialization | 0.90 | Options may already be open |
| Demand is unvalidated | 0.98 | If demand exists, R1 will surface it quickly |
| De-commodification reframe reflects Gustaf's values | 0.80 | Values-coherence concern may be overstated |
| Competitors (Regrid, Land.id, ESRI) are well-funded | 0.90 | If competitors are weaker, data-product option improves |

---

## Questions for Project Owner

1. Have you discussed commercialization with Askja, Adam, or Deca? What was their response?
2. If you could only do one thing with this project in the next 90 days, what would it be—and why?
3. What's your honest estimate of hours/week available for Land Selection vs. other projects?
4. The reciprocity reframe was recent (July 2026). How load-bearing is that values positioning for you?
5. If the Atlantic interview generates 10 inbound inquiries, what would you offer them?

---

## Points of Uncertainty

- **Demand existence:** The crux unknown. All analysis hinges on whether anyone will pay.
- **Governance outcome:** Unknown until conversation happens.
- **Gustaf's values weighting:** I've assumed reciprocity-coherence matters significantly; Gustaf may weight money/impact higher.
- **Competitor landscape:** I've assumed well-funded incumbents; niche dynamics may differ.
- **Atlantic interview impact:** Unpredictable; could be zero or could be catalytic.

---

## Agreements & Tensions with Other Perspectives

**Likely agreements:**
- Market-Fit (A1) will likely agree demand is unvalidated.
- Values-Alignment (A5) will likely agree on the de-commodification tension.
- Resource-Constraint (B2) will likely agree Gustaf's time is the binding constraint.
- Risk-Assessment (C3) will likely flag governance and opportunity-cost risks.

**Likely tensions:**
- Growth-Optimism (if present) may argue for bolder action; I argue for information-first.
- Technical-Feasibility (if present) may argue the prototype is closer to product than I credit; I emphasize the gap between "communicative artifact" and "sellable infrastructure."
- Mission-Maximization (if present) may argue that money enables more mission; I counter that sunk cost on failed products destroys mission capacity.

---

## Confidence

**Overall confidence in analysis:** 0.80

**Calibration note:** This analysis is anchored in decision-theoretic principles (expected value, value-of-information, option enumeration) applied to the evidence in the codebase. The main uncertainty is whether Gustaf's personal weighting of money vs. mission vs. relationships matches the multi-dimensional trade-offs I've modeled. If Gustaf weights money much higher than I assume, the SaaS option's EV improves (though still likely negative net of opportunity cost). If Gustaf weights mission/relationships much higher, consulting and status-quo options dominate even more strongly. The demand-validation spike (R1) is robust across all weighting schemes—it is the highest-information, lowest-cost next move regardless of preferences.
