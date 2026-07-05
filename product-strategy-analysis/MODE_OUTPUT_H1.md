# Game-Theoretic (H1) Analysis

## Thesis

The Land Selection Framework presents an **unstable multi-player game** where productization would trigger defection dynamics within the working group (whose consent is structurally required), while simultaneously entering a competitive market where the only viable equilibrium position — values-differentiated low-margin — directly conflicts with the "valuable, professional, state of the art" revenue expectations implied by Gustaf's framing. The deeper structural problem: Gustaf has just spent significant effort *de-commodifying* the tool (reciprocity reframe, Land Standing dimension, stripped contacts), and "product to sell" re-commodifies it — this is not a strategic pivot, it is a **zero-sum reversal** that damages the core positioning. The honest game-theoretic assessment: **a saleable product may exist, but it is neither this artifact nor this team's to build unilaterally.**

---

## Top Findings

### §F1: The Working Group is a Cooperation Game Gustaf Cannot Exit Unilaterally

**Evidence:**
- Askja is named "originator" — the intellectual contribution that started this.
- Adam provisioned a VPS and contributed foundational architecture decisions.
- The collaboration protocol explicitly requires "[COMMITTED] decisions should not be overwritten — add commentary directly below them instead" (source-docs/Overview r4).
- The public-facing authorship guardrail: "credit Askja as originator + the working group" (CLAUDE.md).
- Gustaf explicitly described as holding a "practitioner reality-check seat" — a contribution role, not an ownership position.

**Reasoning chain:**
1. In a multi-player contribution game, each contributor has an *investment* (time, IP, reputation).
2. Commercialization without consent converts shared investment into private value extraction.
3. The protocol's formality (versioned handoffs, explicit decision-marking) signals contributors expect *shared* control over outcomes.
4. Unilateral productization = defection. Standard game-theory: defection in a visible cooperation game triggers retaliation (withdrawal, public dispute, fork).
5. Gustaf's current relationship with the group is cooperative equilibrium; productization destabilizes it.

**Severity:** Critical. This is not a footnote — it is the first-order constraint. There is no "product to sell" that doesn't either (a) resolve this consent problem, or (b) invite reputational and relational damage.

**Confidence:** 0.90

**So What?:** Before any further product-strategy work: draft a clear written proposal to the working group articulating what "product" would mean, who owns what, and how proceeds (if any) flow. Gustaf cannot build this alone and should not try.

---

### §F2: The Customer Segments Have Incompatible Payoff Functions

**Evidence:**
- Context pack lists plausible segments: intentional-community founders, land trusts, regen networks, climate-migration planners, HNW "apocalypse buyers," rewilding orgs.
- The reciprocity/Land Standing dimension explicitly states "where arriving would harm the community already there, the honest answer is not there."
- HNW "apocalypse buyers" (the Atlantic interview angle) are precisely the segment whose behavior the reciprocity ethic critiques.

**Reasoning chain:**
1. Each segment has a different utility function: community-founders optimize for fit-with-existing-networks; HNW buyers optimize for bunker-site acquisition; land trusts optimize for conservation.
2. A tool that surfaces "whose land this is" and "what arriving asks of you" is **aversive** to buyers seeking minimal friction — it adds friction by design.
3. The customers most willing to pay (HNW, real-estate developers, speculation-adjacent) are the customers whose extraction the tool's ethics explicitly resist.
4. This is a **non-aligned principal-agent problem**: Gustaf cannot serve high-WTP customers without betraying the tool's values, and cannot serve values-aligned customers at premium pricing.

**Severity:** High. The market contains a payoff cliff: serve values-aligned customers at low margins, or betray values to serve high-WTP customers. There is no middle.

**Confidence:** 0.85

**So What?:** Run explicit customer-segment mapping with willingness-to-pay AND values-alignment axes. Expect the intersection (high-WTP + values-aligned) to be nearly empty. If the intersection is empty, productization at "state of the art" pricing is structurally unviable.

---

### §F3: Incumbents Have Insurmountable Data Moats; Values Are the Only Equilibrium Position

**Evidence:**
- Regrid, Land.id, LandGate, ESRI/ArcGIS, Cape Analytics are named market comparables.
- Gustaf's documented differentiator: "the values frame + state+trajectory over 50–100 yr + reciprocity, NOT raw geospatial tech (where incumbents dominate)."
- V1 explicitly bans composite scoring — which is the feature these platforms sell.
- The prototype is hand-curated 20 regions; incumbents have continental + parcel-level data.

**Reasoning chain:**
1. Incumbents play a **data-scale game**: more parcels, faster updates, deeper integrations.
2. A new entrant cannot compete on data scale without VC-level capitalization — Gustaf is solo, part-time, one of ~14 projects.
3. The only viable equilibrium for a small entrant is **differentiated niche**: serve a segment incumbents ignore, with positioning they cannot credibly replicate.
4. Values-based positioning (reciprocity, long-horizon, anti-composite) is hard for incumbents to copy because their business model requires high-volume transaction facilitation — the opposite of "where arriving would harm the community, the answer is not there."
5. But this niche is structurally low-volume, low-WTP, and incompatible with "state of the art" revenue expectations.

**Severity:** Moderate. This finding is about *what kind* of product is viable, not whether one exists. A values-differentiated niche product is defensible; a "state of the art" competitor product is not.

**Confidence:** 0.85

**So What?:** If productization proceeds, position explicitly as a **values-first niche tool** — "the anti-Regrid" — and set revenue expectations accordingly (lifestyle business, not scale business).

---

### §F4: The Reciprocity Reframe is a Credible Commitment Device That Productization Nullifies

**Evidence:**
- In July 2026 Gustaf deliberately de-commodified the tool: hero/subtitle/presets/meta reframed to "bioregioning"; contacts stripped; Land Standing dimension surfacing Indigenous territory and "the honest answer is not there."
- CLAUDE.md calls this a "central values tension" and states "'product to sell for finding land' risks re-commodifying exactly what was just de-commodified."
- The ethics section names Mi'kma'ki, Sinixt/Ktunaxa/Syilx, Zapotec/Mixtec/Chatino explicitly.

**Reasoning chain:**
1. In game theory, a **credible commitment** is an action that visibly binds you to a strategy — costly to reverse, therefore believable.
2. The reciprocity reframe functions as a credible commitment: Gustaf spent real effort aligning the tool's surface with an anti-extraction ethic.
3. Selling the tool for profit directly reverses this commitment, signaling to the very audiences he just courted (regen networks, Indigenous-sovereignty-aware practitioners) that the ethic was cosmetic.
4. Worse: The Atlantic interview positions Gustaf publicly on "land for communities that flourish." Pivoting to "product for sale" within weeks invites "he was selling something all along" interpretive frame.
5. This is **cheap talk destruction**: past ethical signaling becomes retroactively unbelievable if followed by commercialization.

**Severity:** High. The reciprocity reframe is load-bearing for current positioning. Productization doesn't just fail to capture its value — it *destroys* the credibility of the reframe.

**Confidence:** 0.88

**So What?:** If Gustaf wants a product, the frame must be: "the framework is free; consulting/implementation is paid" — preserving the open artifact while monetizing services. Selling *the tool* itself is incompatible with the credibility built this month.

---

### §F5: The Consent-Clearing Mechanism Doesn't Exist Yet

**Evidence:**
- The r4 → r5 Handoff Request is addressed "Open — @Monty, @Alaska, @Askja, @Deca, @Adam, or any other group member."
- Open questions include "is the demonstration-artifact track an explicit V1/V2 dual-track?" — i.e., even the prototype's status is unsettled.
- No governance structure exists for "who decides commercialization."
- Alaska's existence is uncertain ("worth confirming with Gustaf").

**Reasoning chain:**
1. A multi-contributor project without a clear IP-ownership or decision-rights structure has an **implicit default**: all contributors hold blocking rights.
2. Moving to commercialization requires consent from stakeholders with blocking rights.
3. The async-chat-and-handoff protocol is designed for collaborative design decisions, not for high-stakes governance (revenue split, IP ownership, product control).
4. There is no mechanism to *get* consent cleanly — any proposal is a new, high-stakes conversation the protocol wasn't designed for.

**Severity:** Moderate-High. This is solvable but is **pre-requisite work** that hasn't started. Product strategy is premature until governance is clarified.

**Confidence:** 0.82

**So What?:** Draft a **governance charter** (IP ownership, decision rights, revenue split principles) and circulate it to the working group *before* any product design. This is a blocking dependency.

---

### §F6: Gustaf's Competitive Position in This Game is "Labor + Craft, Not Capital + Control"

**Evidence:**
- Gustaf delivered r4 with 12 Tier-1 ingested layers, a working prototype, and the practitioner reality-check.
- The protocol defines him as "practitioner reality-check seat" — a contribution role, not an authority role.
- Askja originated, Adam provisioned infrastructure, Deca synthesized.
- Gustaf is solo, part-time, one of ~14 projects.

**Reasoning chain:**
1. In a multi-stakeholder game, power derives from: capital (who funded it), IP contribution (who created the core idea), labor (who built it), and legitimacy (whose name carries weight externally).
2. Gustaf's position: high labor contribution (r4 was substantial), moderate craft/taste contribution, no capital contribution, shared legitimacy.
3. This gives Gustaf leverage to negotiate but not to dictate. Askja holds originator legitimacy; Adam holds infrastructure contribution.
4. A "Gustaf sells it" model requires either (a) others' consent, (b) a clean-room rebuild that doesn't use the shared work, or (c) defection with reputational cost.

**Severity:** Moderate. This is not a blocker if Gustaf pursues consent, but it constrains options.

**Confidence:** 0.80

**So What?:** Model explicitly: "What would a product built solely on Gustaf's r4 contributions look like, if all prior contributions were excluded?" If viable, that is the scope of a unilateral product. If not viable, consent is mandatory.

---

### §F7: The "State of the Art" Frame is a Payoff-Expectation Trap

**Evidence:**
- Gustaf's framing: "a product to sell — valuable, professional, state of the art."
- The prototype is explicitly "hand-curated 20 regions" — not a data product.
- V1 is "ingestion only" — no query layer exists.
- A prior "build V1 in miniature" raster approach failed (downloads truncated, projection errors).

**Reasoning chain:**
1. "State of the art" implies competing with Regrid/ESRI on data completeness and UX polish.
2. The current artifact is a **communicative demonstration**, not a data product — a gap of years of engineering work.
3. Closing this gap requires capital investment Gustaf cannot make solo.
4. Setting "state of the art" as the expectation creates a payoff-expectation mismatch: the effort required to reach that bar is disproportionate to the solo-buildable revenue opportunity.
5. This is a **misframed game**: Gustaf is optimizing for "impressive product" when the viable game is "niche values-tool."

**Severity:** Moderate. This finding is about expectation calibration, not viability.

**Confidence:** 0.85

**So What?:** Reframe the question from "state of the art product" to "minimum viable values-niche offering." What is the smallest thing Gustaf could charge for that doesn't require closing a multi-year engineering gap?

---

### §F8: There May Be a Viable "Consulting + Open Framework" Equilibrium

**Evidence:**
- The framework layer is **Portable** — survives substrate change.
- Gustaf's live network includes eco-villages (Heartwood of Ecovillages magazine), practitioners, regenerative community networks.
- The prototype already functions as a credibility asset.
- Consulting/advising is infinitely scalable in time-for-money terms without product infrastructure.

**Reasoning chain:**
1. The prototype + framework + r4 evidence = a credibility artifact that positions Gustaf as an expert.
2. The expert can sell *time and judgment* without selling the artifact itself.
3. This sidesteps: (a) working-group consent for commercialization, (b) the reciprocity-commodification trap, (c) the incumbent-data-moat problem.
4. Revenue model: "I advise communities on site selection using this open framework; the tool remains free."
5. This is a **cooperative equilibrium**: the working group benefits from the open tool's growth; Gustaf benefits from consulting revenue; customers get expert guidance.

**Severity:** This is not a risk — it is an alternative game worth modeling.

**Confidence:** 0.78

**So What?:** Model "consulting practice supported by open framework" as the alternative hypothesis to "product to sell." Estimate: what is the consulting revenue opportunity if the framework stays open? Compare to product revenue estimates.

---

## Risks Identified

1. **Working-group rupture:** Unilateral productization triggers defection (withdrawal, public dispute, fork), destroying both the collaboration and Gustaf's reputation in the small regen-community world.
2. **Credibility destruction:** The reciprocity reframe becomes retroactively unbelievable, damaging Gustaf's positioning with the exact audience (regen practitioners, Indigenous-sovereignty-aware networks) he built credibility with.
3. **Payoff-expectation mismatch:** "State of the art" framing leads to over-investment in infrastructure that cannot generate proportional revenue.
4. **Customer-values misalignment:** Pursuit of high-WTP customers (HNW, real-estate-adjacent) requires betraying the tool's values; pursuit of values-aligned customers caps revenue.
5. **Incumbent response:** If the tool gains traction, well-capitalized incumbents can add a "values layer" cosmetically and capture the market.

---

## Recommendations

| # | Recommendation | Priority | Effort | Tier | Benefit |
|---|----------------|----------|--------|------|---------|
| R1 | Draft and circulate a working-group governance charter (IP ownership, decision rights, revenue-split principles) before any product design | P0 | Low-Medium | Portable | Clears the blocking consent dependency |
| R2 | Map customer segments on a 2×2 (WTP × values-alignment); validate assumptions with 5 real conversations | P1 | Medium | Portable | Grounds revenue expectations in evidence |
| R3 | Model "consulting + open framework" as alternative to "product"; estimate revenue potential of each | P1 | Low | Portable | Identifies viable equilibrium without commercialization |
| R4 | If product proceeds: position as "anti-Regrid" values-niche tool with explicit lifestyle-business revenue expectations | P2 | Low | Portable | Aligns expectations with defensible equilibrium |
| R5 | Keep the framework open; consider "pro tier" for consulting-derived tools/templates that Gustaf alone creates | P2 | Medium | Semi-portable | Monetizes labor without selling shared IP |
| R6 | Document the scope of "r4-only contributions" — what could Gustaf sell without group consent? | P3 | Low | Portable | Clarifies unilateral-vs-consent boundary |
| R7 | Delay product strategy until after Atlantic interview lands; assess whether "apocalypse land" positioning helps or hurts | P3 | Low | Portable | Avoids commitment before public positioning is set |

---

## New Ideas & Extensions

| Idea | Score | Notes |
|------|-------|-------|
| **Consulting practice:** Offer paid "site-selection advising" using the open framework as credibility asset | Significant | Monetizes expertise without commodifying the tool |
| **Report-as-a-service:** Community pays Gustaf to generate a detailed r4-style dossier for regions not currently covered | Significant | High-touch, high-value, no product infrastructure needed |
| **Grants + foundation funding:** Pursue regen-community foundation funding (RSF Social Finance, Patagonia grants) to fund open development | Significant | Alternative to commercial revenue; aligns with values |
| **Community land-trust partnership:** Partner with Agrarian Trust, OPAL, or similar to build the V2 query layer collaboratively; they have customers, Gustaf has framework | Radical | Transforms the competitive game by joining a larger player |
| **Training/workshop product:** Sell a "Site Selection for Regenerative Communities" workshop using the framework as curriculum | Incremental | Low-infrastructure revenue stream |

---

## Assumptions Ledger

| Assumption | Confidence | If Wrong |
|------------|------------|----------|
| Working-group contributors expect shared control over commercialization | 0.85 | If they don't care, Gustaf has more freedom — but reputational risk remains |
| Values-aligned customers have low WTP relative to extractive-adjacent customers | 0.80 | If a high-WTP values-aligned segment exists, product viability improves |
| Gustaf cannot close the data-gap with incumbents without capitalization | 0.90 | If there's a technical shortcut, product viability improves |
| The reciprocity reframe is load-bearing for current positioning | 0.88 | If it's cosmetic, productization is less costly |
| Consulting revenue opportunity is meaningful in the regen-community space | 0.70 | If the space doesn't pay for consulting, this alternative fails |

---

## Questions for Project Owner

1. **Have you discussed commercialization with Askja, Adam, or Deca?** What was their reaction? Is there existing agreement or disagreement?
2. **What does "state of the art" mean to you concretely?** Is it about data completeness, UX polish, feature set, or something else?
3. **Who do you imagine paying for this, and how much?** What segment, what price point, what frequency?
4. **Would you be satisfied with a consulting practice supported by an open framework?** Or is "selling the product itself" the goal?
5. **What is the relationship between this project and your ~14 other active projects?** Is this the one to bet on, or one of many?
6. **How do you want the working group to continue if you commercialize?** Do you see them as co-founders, contributors to be bought out, or something else?

---

## Points of Uncertainty

1. **Working-group sentiment:** I'm inferring consent requirements from protocol structure, not from direct evidence of their views on commercialization.
2. **Market size:** No data on how many "intentional-community founders" exist, what they pay for, or whether they buy tools.
3. **Consulting WTP:** Assumption that regen-community space pays for consulting is based on general knowledge, not validated.
4. **Competitive response:** Prediction that incumbents would add "values layer" if threatened is speculative.
5. **Gustaf's ambition level:** Unclear whether "product to sell" means lifestyle revenue or growth ambition.

---

## Agreements & Tensions with Other Perspectives

**Likely agreements:**
- Most perspectives will flag the working-group consent issue (though I foreground it as the *first-order* constraint).
- Most will note the reciprocity-commodification tension.
- Portability-filter perspectives will agree the framework layer is Portable and the wiring is Tied.

**Likely tensions:**
- **Market-sizing perspectives** may be more optimistic about segment size; I'm skeptical there's a high-WTP + values-aligned intersection.
- **Product-design perspectives** may focus on "what to build" without surfacing that the right to build it is contested.
- **Risk-aversion perspectives** may recommend abandoning productization entirely; I propose alternatives (consulting, grants) rather than full retreat.
- **Enthusiasm-matching perspectives** (if any) will conflict with my core finding that "state of the art product" is a payoff-expectation trap.

---

## Confidence

**Overall confidence: 0.82**

**Calibration note:** This analysis is rigorous on the *structural* game-theoretic dynamics (consent, incentives, equilibria) but relies on inferred rather than validated assumptions about working-group sentiment and market size. The findings are directionally reliable; specific numbers (WTP, segment size) are placeholders. I'm confident the consent-clearing and reciprocity-commodification issues are load-bearing; I'm less confident in the consulting-revenue alternative's viability without market validation.

---

*H1 Analysis complete. This lens foregrounds that the "who can sell what to whom with whose consent" question must be resolved before any "what product to build" question becomes meaningful.*
