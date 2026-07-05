# Normative / Value-Ethics (K1) Analysis

## Thesis

The July 2026 reframe embedded an explicit anti-commodification ethics into the framework's identity—reciprocity as spine, qualitative "Land standing" dimensions that are *never scored*, an ethics section stating "where arriving would harm the community already there, the honest answer is not to go." **A "product to sell for finding land" would be in direct normative contradiction with these commitments unless the product form is radically constrained to sell process/wisdom/service rather than land-targeting.** The tool as reframed is not a neutral instrument; it encodes specific value commitments (localism, bioregioning, reciprocity, healthy integration, stewardship-as-relationship). "Making it a product" is not a business question first—it is an ethical question about whether commercialization can be made consistent with the values the tool publicly professes. The descriptive question "what would sell" (affluent apocalypse-preppers, climate-migration-anxious HNW individuals) diverges sharply from the normative question "what *ought* to be sold" (process, not targeting; community discernment, not land acquisition). The most ethically coherent product forms are ones that *slow down* or *complicate* the land-seeking process rather than optimize it—which is a strange value proposition for a commercial tool.

---

## Top Findings

### §F1 · The Reciprocity Spine Is Load-Bearing and Anti-Transactional

**Evidence:**
- `deeper.html` #ethics: "Reciprocity is inseparable from bioregioning... arriving means entering obligation with the people, lifeways and nations already rooted there, *not acquiring something empty*. Where arriving in a place would harm the community already there, the honest answer is not to go."
- `land-standing.js`: Every North American region entry names the Indigenous nation(s) and treaty/cession status; `obligation` field describes what "arriving in good faith asks of a settler."
- July reframe removed "candidate regions / siting / shopping list" language; contacts stripped to "avoid a sales-y surface" (CLAUDE.md).

**Reasoning:**
The reframe was not cosmetic. It encoded a normative stance: land is not inventory to optimize over, but a web of relationships to enter carefully. The word "obligation" appears 20 times in land-standing.js (once per region). This is the language of moral duty, not market opportunity. A commercial product's core promise—"pay us, get value, acquire land faster/better"—inverts this stance. The user becomes a customer seeking a good; the land-and-community becomes the product being delivered. This is the exact dynamic the reciprocity spine was designed to refuse.

**Severity:** Foundational (not merely high). This is not a fixable bug but a structural contradiction.  
**Confidence:** 0.92  
**So What?:** Before any productization, Gustaf must decide: Is the reciprocity spine negotiable marketing copy, or is it a constraint that eliminates certain product forms entirely? If the latter, document that constraint as a non-negotiable in any product spec.

---

### §F2 · "What Would Sell" and "What Ought to Be Sold" Are in Tension

**Evidence:**
- CONTEXT_PACK names plausible buyer segments: "intentional-community founders, land trusts, regenerative-ag/ecovillage networks, climate-migration planners, HNW individuals/'apocalypse land' buyers."
- The Atlantic interview angle is explicitly "land selection for the apocalypse"—a climate-anxiety-driven HNW buyer.
- The ethics section explicitly names unhealthy arrival: "Whether a place welcomes new arrivals, and on what terms, is a matter of trust built across decades. It is not a checkbox a framework can verify."

**Reasoning:**
The segments with highest willingness-to-pay (HNW apocalypse buyers, climate-anxious individuals) are precisely those whose arrival patterns the framework's ethics section warns against. They seek *escape*, not *integration*; they have capital but not relationship. Selling to them would mean the tool helps people do what the tool says should not be done. Meanwhile, the segments most aligned with the values (community land trusts, GEN networks, regen-ag collectives) operate on thin margins and grant funding—low willingness-to-pay. A commercial product will face constant pressure to optimize for the paying segment, which corrupts the mission.

**Severity:** High (structural market-ethics misalignment).  
**Confidence:** 0.85  
**So What?:** If productizing, explicitly exclude or de-prioritize the HNW individual segment in the business model. Consider a pricing model that gates individual use (high friction) while enabling institutional/community use (low friction)—the opposite of typical SaaS.

---

### §F3 · The Land-Standing Data Surfaces Harms the Tool Then Helps Navigate

**Evidence:**
- `land-standing.js` entries for North America:
  - Nova Scotia: "Unceded Mi'kma'ki... recognise unceded Mi'kma'ki and the Peace and Friendship Treaties."
  - Kootenays: "Unceded Sinixt, Ktunaxa & Syilx territory... honour the Crown duty to consult on unceded territory."
  - Oaxaca: "Zapotec, Mixtec & Chatino comunal lands... 418 of 570 municipalities can admit or exclude you."
- The ethics section states: "Much of this land... is held in Indigenous or communal title."

**Reasoning:**
The tool does something ethically unusual: it names the harm (settler arrival on unceded land, displacement of rooted communities) and then helps users do it anyway—albeit with eyes open. This is coherent *only if* the tool's purpose is discernment rather than optimization. A product that charges money for helping people arrive on unceded Indigenous territory has a materially different ethical character than a free/open resource that surfaces this information for reflection. Money changes the relationship: it creates an implicit promise that the payment buys something useful (land access), not something uncomfortable (moral complication).

**Severity:** High (the distinction between "free discernment tool" and "paid land-targeting service" is ethically load-bearing).  
**Confidence:** 0.88  
**So What?:** If productizing, the "Land standing" data must remain freely accessible and non-paywalled. Any paid tier should add process/consulting/wisdom—never gate the reciprocity information itself.

---

### §F4 · Shared Ownership Means Shared Ethics

**Evidence:**
- CONTEXT_PACK: "This is NOT solely Gustaf's project." Askja is originator; Adam contributed architecture; Deca synthesized.
- The working-group protocol requires consensus on major decisions: "propose-and-proceed" with 5-day response window.
- The r4 Overview doc: Gustaf's contribution was "practitioner reality-check"—one seat among many.

**Reasoning:**
"Productize it" is not Gustaf's unilateral decision. More fundamentally: the working group formed around shared values (regenerative, long-horizon, practitioner-grounded). A commercial product would need to embody values all collaborators can endorse. If Askja's intent was a commons-serving open resource, converting it to a commercial product without her explicit consent would be an ethical breach of the collaboration compact—regardless of who holds the GitHub repo. The question "should we sell this?" must be asked of the group, not assumed.

**Severity:** High (ethical and relational, not merely legal).  
**Confidence:** 0.90  
**So What?:** Before any product development, surface the productization question to the full working group (Adam, Askja, Deca at minimum). Document explicit consent or dissent. Do not proceed on implied consent from silence.

---

### §F5 · The Framework's Committed Discipline Constrains Product Forms

**Evidence:**
- Overview Decision 4: "No querying or scoring in V1."
- Decision 1: "Native units throughout (not a fixed H3 grid)."
- Adam's non-negotiable (kept): "never build a composite 'livability score.' Users combine criteria themselves."
- The prototype uses threshold sliders (filtering) deliberately instead of weight sliders (scoring).

**Reasoning:**
These constraints are not arbitrary technical choices; they encode normative commitments. No composite scoring = refuse to tell users "this place is better than that place." Native units = refuse to erase local context into a universal grid. No querying in V1 = the tool's job is to surface, not to decide. A commercial product faces market pressure to add "smart recommendations," "best match rankings," "personalized results"—all of which would violate the framework's core discipline. The framework is designed to keep the burden of judgment on the user; a product that "does the thinking for you" would be a different tool with different ethics.

**Severity:** Medium-High (market pressure vs. committed discipline).  
**Confidence:** 0.82  
**So What?:** Any product spec should explicitly carry forward the "no composite scoring" non-negotiable as a constraint that marketing/product cannot override. Document this as an ethics guard, not a technical choice.

---

### §F6 · The Honest Answer "Not There" Cannot Be Monetized

**Evidence:**
- Ethics section: "Where arriving in a place would harm the community already there, the honest answer is not to go."
- Legal_ownership r4 finding: "Only 1 of 20 regions allows multi-household residence as-of-right (Ozarks)." 19 regions have significant legal barriers.
- Land_cost finding: "15 of 20 regions are rising or rising_fast."

**Reasoning:**
The framework's most valuable output might be *dissuasion*—telling a user "you should not do this." But dissuasion is un-monetizable in a direct sense. A paid product that frequently says "don't buy here, don't arrive there" will generate customer dissatisfaction ("I paid for help finding land, not for being told I can't"). The commercial incentive is to be encouraging, to surface possibilities, to justify the purchase. The ethical incentive is to be honest, which often means saying "no." These are in structural tension.

**Severity:** Medium (commercial viability vs. ethical function).  
**Confidence:** 0.78  
**So What?:** If productizing, design the value proposition around *process* (discernment, education, community formation) rather than *outcome* (land acquisition). Frame the product as "help you decide if and where," not "help you find land."

---

### §F7 · There Is an Ethically-Clean Product Form (But It's Strange)

**Evidence:**
- The existing prototype is a "communicative artifact," not a data product (CLAUDE.md: "a designed communicative artifact, not a data product").
- CONTEXT_PACK: "plausible segments: land trusts, regenerative-ag/ecovillage networks (GEN)."
- Gustaf's 14 active projects include consultancy work (Islands of Coherence).

**Reasoning:**
The ethically clean form is: sell *wisdom, process, discernment, facilitation*—not land-targeting. Concretely: consulting/facilitation services for community formation (pre-search: "are you actually ready?"); educational workshops on the legal/relational realities; due-diligence audits of specific parcels a community has already identified; integration coaching post-arrival. These monetize Gustaf's accumulated knowledge without selling land targeting. They keep the framework free/open as a commons resource while building a consulting layer on top. This is closer to "professional services" than "product"—and it inverts the typical scaling assumption.

**Severity:** Low (this is a viable path, not a finding of harm).  
**Confidence:** 0.75  
**So What?:** Consider whether "a product to sell" should be reframed as "a service to offer"—consulting, facilitation, education—with the framework itself remaining a public commons.

---

## Risks Identified

1. **Reputation Risk:** Selling a "land-finding tool" while publicly professing reciprocity/anti-displacement values creates a credibility gap. The Atlantic audience will notice.

2. **Working-Group Fracture Risk:** Commercializing without explicit group consent could fracture the collaboration and lose contributors whose expertise (Adam's GIS, Askja's framework) is foundational.

3. **Mission Drift Risk:** Market pressure to add features (rankings, recommendations, "matches") that violate the framework's committed discipline.

4. **Harm-Enablement Risk:** The tool could help well-resourced individuals arrive in ways that harm the communities the reciprocity spine was designed to protect.

5. **Ethical Inconsistency Risk:** Charging for access to the Land-standing data while claiming to center reciprocity would be incoherent.

---

## Recommendations

| # | Recommendation | Priority | Effort | Tier | Benefit |
|---|----------------|----------|--------|------|---------|
| R1 | Convene the working group on the productization question; document explicit consent/dissent before any product development | P0 | Low | Portable | Protects collaboration, ensures ethical legitimacy |
| R2 | Draft a "values non-negotiables" doc that any product spec must satisfy (no composite scoring, Land-standing never paywalled, no rankings/recommendations, etc.) | P1 | Low | Portable | Creates an ethics guard against market pressure |
| R3 | Reframe "product to sell" as "service to offer": consulting, facilitation, education, with the framework as public commons | P1 | Medium | Semi-portable | Aligns revenue with values; sidesteps land-targeting ethics |
| R4 | If building a paid product, design a pricing structure that *increases* friction for individual HNW buyers (high price, application process) and *decreases* friction for community/institutional use (sliding scale, grants) | P2 | Medium | Tied | Filters for aligned users |
| R5 | Conduct explicit "who would be harmed?" analysis before launch, mapping product features to potential harms and documenting mitigations | P2 | Low | Portable | Documents due diligence; surfaces blind spots |

---

## New Ideas & Extensions

| Idea | Description | Score |
|------|-------------|-------|
| **Anti-product product:** A paid "community formation coaching" service where clients pay for facilitation help *before* they search for land—value is in slowing down and discerning, not accelerating | Radical |
| **Grant-funded commons model:** Seek foundation funding (regen networks, land trusts) to keep the tool free/open while covering maintenance costs; monetize consulting on top | Significant |
| **Institutional licensing:** License to land trusts, GEN, conservation orgs who use it for mission-aligned screening; no direct-to-individual sales | Significant |
| **"Not here" feature:** Explicit UI for regions where arrival would harm—make the dissuasion prominent, not hidden | Incremental |
| **"Integration pathway" upsell:** For regions where arrival is ethically viable, offer paid detailed guides on the relational/legal pathway (e.g., "How to actually join an acequia community") | Incremental |

---

## Assumptions Ledger

| Assumption | Confidence | If Wrong |
|------------|------------|----------|
| The reciprocity spine is genuinely load-bearing for Gustaf, not marketing copy | 0.85 | Analysis overstates the constraint; some product forms become viable |
| The working group's implicit values would resist commercialization | 0.70 | Group might actively want commercial success; proceed faster |
| HNW "apocalypse buyer" segment has higher WTP than regen-community segment | 0.80 | Market might be more aligned than expected |
| A paid product would face pressure to add rankings/recommendations | 0.75 | Gustaf might successfully resist; discipline might hold |

---

## Questions for Project Owner

1. **Is the reciprocity spine negotiable?** Could you sell a product that helps wealthy individuals find land on unceded Indigenous territory, or is that outside the ethical envelope?

2. **What would Askja say?** Have you discussed commercialization with the originator? What values does she want the project to embody?

3. **Are you willing to say "no" to high-value customers?** If an affluent individual wants to buy the "apocalypse land" version, is turning them away acceptable?

4. **Is "service" an acceptable substitute for "product"?** Consulting/facilitation is less scalable but more ethically aligned—is that trade-off acceptable?

5. **What does "professional" mean to you?** Is it about production quality, credibility, revenue, or something else? The answer shapes which product forms are relevant.

---

## Points of Uncertainty

- **Market size for ethically-constrained product:** Unknown whether there's sufficient demand for a tool that complicates rather than optimizes land-seeking.
- **Working group's commercial appetite:** Never tested; could go either way.
- **Gustaf's personal values evolution:** The July reframe was recent; whether these values are stable over commercial pressure is untested.
- **Legal exposure:** Unclear whether a paid land-targeting product would create liability if users arrive badly and cause harm.

---

## Agreements & Tensions with Other Perspectives

| Perspective | Likely Agreement | Likely Tension |
|-------------|------------------|----------------|
| Market Analysis (M1) | Both see HNW segment as high-WTP | M1 may recommend targeting them; K1 says don't |
| Competitive Strategy (C1) | Both see "values frame" as differentiator | C1 may want to soften values for market; K1 says values ARE the product |
| Build/Technical (T1) | Both see current wiring as Tied/disposable | T1 may want features K1 would flag as ethics violations |
| Risk Analysis (R1) | Both see working-group consent as critical | May differ on severity weighting |
| User Research (U1) | Both care about who actually uses this | U1 may surface user wants that K1 would say shouldn't be served |

---

## Confidence

**Overall Confidence:** 0.80

**Calibration note:** This analysis is confident that a normative contradiction exists between the reframed values and straightforward "product to sell for finding land" models. I am less confident about whether ethically-clean alternative forms (services, institutional licensing) are commercially viable—that's outside this lens's scope. The analysis assumes Gustaf takes the reciprocity spine seriously; if it's softer than it reads, the constraints loosen.
