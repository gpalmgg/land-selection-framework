# Debiasing / Calibration (L2) Analysis

## Thesis

The productization question arrives wrapped in predictable cognitive failure modes: Gustaf's enthusiasm ("thinking about it bigger now — a product to sell, something valuable, professional, state of the art") matches the exact pattern that CLAUDE.md documents as a named failure — yes-manning Gustaf on "Omni feasibility for weeks." The project history contains direct evidence of planning fallacy (the failed "V1 in miniature" raster build), the sunk-cost of 20-region hand-curated data and the July 2026 Atlantic interview investment, and narrative coherence bias (the "bioregioning reframe" as identity). Before answering "how to productize," this analysis stress-tests whether the reasoning around the question is sound — because if the reasoning is biased, the conclusions will be too. The base rate of solo, mission-driven geospatial tools becoming sellable products is unfavorable (<5% reach sustainable revenue; most become unfunded open-source utilities or fade), and the specific constraints here (shared ownership, reciprocity values that resist commodification, part-time solo builder across 14 projects, no customer discovery) make the case harder, not easier.

---

## Top Findings

### §F1: The "state-of-the-art product" framing exhibits classic narrative/coherence bias

**Evidence:**
- The phrase "a product to sell — valuable, professional, state of the art" contains three escalating adjectives that form a coherent story, not a plan.
- CONTEXT_PACK.md explicitly warns: enthusiasm-bias is the named failure mode to avoid.
- The July 2026 effort spent *de-commodifying* the tool (reciprocity reframe, stripping contacts, adding Land standing) directly contradicts "a product to sell" — the story hasn't reconciled these.
- CLAUDE.md documents that Gustaf respects being told "no, I actually had this right" far more than capitulation.

**Reasoning chain:** Narrative coherence bias causes decision-makers to embrace options that feel like a good *story* (lone-builder-creates-breakthrough-product) over options that fit the *evidence* (shared working-group artifact with unvalidated market demand). The phrase "state of the art" is a tell: it anchors on an aspirational end-state rather than a tractable next step.

**Severity:** Moderate. The bias isn't fatal — it's a framing trap, not an action. Correctable before investment.

**Confidence:** 0.85

**So What? (next-day action):** Rewrite the strategic question from "how do we productize this?" to "what evidence would we need to see before committing builder-time to a product path?" Force the question into an evidence frame, not a narrative one.

---

### §F2: Planning fallacy is empirically documented in this codebase

**Evidence:**
- CLAUDE.md records a failed build: "Initial approach was wrong: tried to build V1 in miniature (custom MapLibre + manual GeoTIFF → PNG overlays). Three things broke: large-file downloads failed silently... WGS84-image-rendered-in-Mercator produces 'slightly out of place' overlays... half-built layers + clearly-pending layers communicate 'this thing doesn't work.'"
- The pivot to a "designed communicative artifact" was the *correct* adjustment — but it took significant effort to discover.
- The current prototype is a demonstration, not data infrastructure. Claiming "V1" invites conflating the two.

**Reasoning chain:** Planning fallacy (Kahneman & Tversky) causes underestimation of time, costs, and risks of future tasks while overestimating benefits. The "V1 in miniature" failure is direct evidence: ambition exceeded what was tractable solo. Productization multiplies ambition (payment infra, support, compliance, iteration velocity, customer acquisition) without multiplying builder capacity.

**Debiasing move:** Apply the *reference class* rule. Ask: "How long did a similar-complexity pivot take before? (Answer: weeks to months for the raster-to-designed-artifact pivot.) What is the reference class for building payment + support + customer acquisition for a solo geospatial tool? (Answer: 12–24 months minimum, typically longer.)" If the productization timeline feels shorter than the reference class, the plan is biased.

**Severity:** High. Planning fallacy directly predicts project overruns and burnout.

**Confidence:** 0.90

**So What?:** Before committing to productization, write a pre-mortem: "It's 12 months from now and the product failed. What happened?" Use that to identify the likeliest failure modes and whether they're addressable.

---

### §F3: Sunk-cost bias is live and load-bearing

**Evidence:**
- 20 hand-curated regions with per-region dossiers, legal_ownership data, land_standing block — substantial invested effort.
- The Atlantic interview (Jul 3–4 2026) was prepared for with a repositioning effort and an interview brief.
- The July 2026 reciprocity reframe involved changing hero copy, presets, region blurbs, meta/OG/Twitter/JSON-LD, and deeper.html.
- Gustaf "holds the r4 practitioner-reality-check seat" — a social position maintained by ongoing effort.

**Reasoning chain:** Sunk-cost fallacy (Arkes & Blumer) causes escalation of commitment to a course of action because of prior investment, regardless of future returns. The question "should we productize?" risks being answered with "we've already put so much in" rather than "is the marginal investment justified by marginal returns?" The 20-region hand-curation has value whether or not productization happens — it's an asset, not a debt to be redeemed.

**Debiasing move:** Separate the asset from the decision. Ask: "If I started today with no sunk cost, would I choose to build a sellable product here, or would I do something else with the same time?" If the answer differs from the current inclination, sunk-cost is biasing the decision.

**Severity:** Moderate. The sunk cost is real effort, but it doesn't obligate a specific next step.

**Confidence:** 0.80

**So What?:** Inventory the assets that survive regardless of productization: the framework discipline, the reciprocity content, the relationship with the working group, the data. These are Portable. Separate them from the productization question.

---

### §F4: Confirmation bias risk in "product to sell" framing

**Evidence:**
- The CONTEXT_PACK asks 10 modes to analyze productization — but Gustaf's framing ("thinking about it bigger now") already presumes the direction. The modes may search for evidence *supporting* productization rather than *testing* it.
- CLAUDE.md's anti-sycophancy section directly addresses this: "Default to skepticism, not validation. The burden of proof is on optimism."
- The documented "Omni feasibility" episode: "You yes-manned Gustaf on Omni feasibility for weeks. He invested significant energy based on your unchallenged validation."

**Reasoning chain:** Confirmation bias (Nickerson) causes selective search for, interpretation of, and recall of information confirming prior beliefs. The swarm's task framing ("analyze productization") can be read as "find reasons to productize" if not actively resisted. The Omni precedent shows this failure mode is not hypothetical.

**Debiasing move:** Explicitly seek disconfirming evidence. Ask: "What would make productization the *wrong* move?" Document those conditions and check whether they're met. If the analysis can't name conditions under which the conclusion would flip, it's biased.

**Severity:** Moderate-high. Confirmation bias is the silent failure mode of multi-agent analysis if all agents optimize for the same assumed conclusion.

**Confidence:** 0.85

**So What?:** At least one mode (ideally this one) must hold the null hypothesis: "Productization is not justified." Force the burden of proof onto the affirmative case.

---

### §F5: Scope insensitivity masks the gap between "demonstration" and "product"

**Evidence:**
- The prototype is a "designed communicative artifact" — a dashboard with 20 hand-curated regions, threshold sliders, a 17-layer map, and edge functions. It is explicitly NOT the V1 build.
- "Real V1 (per the working-group docs) is 'data ingestion only' — no querying, no scoring. It doesn't exist yet as infrastructure."
- A sellable product requires: (a) the data infrastructure that doesn't exist, (b) payment/subscription infrastructure, (c) customer support, (d) legal compliance (GDPR for EU users, terms of service), (e) ongoing data updates, (f) customer acquisition. Each is a project-scale undertaking.

**Reasoning chain:** Scope insensitivity (Kahneman) causes failure to scale evaluations appropriately. "Make it a product" sounds like one step but decomposes into 5–10 major workstreams, each with its own timeline and risk. The distance from "demo" to "product" is comparable to the distance from "concept" to "demo" — possibly greater.

**Debiasing move:** List every workstream required for a minimally sellable product. Estimate each independently. Sum them. Compare the sum to available builder-hours (Gustaf, part-time, one of ~14 active projects). If the sum exceeds capacity by >2x, the scope is not tractable solo.

**Severity:** High. Scope insensitivity is the direct precursor to planning fallacy.

**Confidence:** 0.90

**So What?:** Write an explicit work breakdown structure (WBS) for the minimal product. If the WBS exceeds 6 months of part-time effort, productization is not a near-term option.

---

### §F6: The ownership structure creates a consent problem that bias masks

**Evidence:**
- Askja is the originator. Adam provisioned a VPS and holds non-negotiables (no composite scoring). Deca synthesized. Gustaf holds the r4 seat.
- "A product built ON TOP of the framework that Gustaf owns is a different animal from selling the shared working-group project itself."
- The collaboration protocol is explicit: `[COMMITTED]` decisions cannot be overwritten, only commented.
- No evidence in the documents that the working group has discussed or consented to productization.

**Reasoning chain:** The enthusiasm for productization may implicitly assume Gustaf can act unilaterally. But the framework discipline, the data schema, and several non-negotiables are shared IP with named contributors. Productizing without consent would violate the protocol and potentially damage relationships — a risk that enthusiasm-bias causes to be underweighted.

**Debiasing move:** Name the consent requirement explicitly. Ask: "Who must agree before productization proceeds? What happens if they don't?" If the answer is "I'll proceed anyway," the ownership reality is being bypassed, not resolved.

**Severity:** Moderate. The consent question is addressable, but it's a prerequisite, not a detail.

**Confidence:** 0.80

**So What?:** Before any productization work, draft a proposal to the working group describing the intended product, revenue model, and IP terms. Wait for response before proceeding.

---

### §F7: Optimism bias amplifies when external validation arrives (Atlantic interview)

**Evidence:**
- The Atlantic interview (Jul 3–4 2026) with journalist Hilary Beaumont validated external interest.
- The interview triggered a repositioning effort ("bioregioning reframe"), interview prep doc, and content changes.
- External validation tends to amplify optimism bias: "If The Atlantic is interested, this must be big."

**Reasoning chain:** A media request is a signal, but it's a noisy one. Journalists write about things that are *interesting*, not things that are *commercially viable*. The Atlantic covers "land selection for the apocalypse" as a trend piece, not a product endorsement. Treating media interest as market validation is a category error — but optimism bias makes it feel like confirmation.

**Debiasing move:** Separate signal types. Media interest = the topic is interesting. Customer willingness-to-pay = market exists. These are different claims requiring different evidence. The Atlantic interview provides the first, not the second.

**Severity:** Low-moderate. The interview is a positive signal; the error would be over-weighting it.

**Confidence:** 0.75

**So What?:** After the interview, regardless of coverage, run a lightweight customer-discovery experiment: contact 5–10 people who might pay for this tool, describe a hypothetical offering, and ask what they'd pay. That's the market signal; media is not.

---

### §F8: The reciprocity/de-commodification work directly contradicts "product to sell"

**Evidence:**
- July 2026 effort: "Gustaf repositioned the whole prototype... reciprocity as the spine... 'Candidate region / siting / shopping list' removed from framing copy... Contacts removed... 'where arriving would harm the community already there, the honest answer is not there.'"
- The Land standing dimension is "QUALITATIVE ONLY — never scored, ranked, or composited."
- CONTEXT_PACK.md: "A 'product to sell for finding land' risks re-commodifying exactly what was just de-commodified. This contradiction is not a footnote — for several of you it is the finding."

**Reasoning chain:** The reciprocity reframe is values-work that deliberately resists commodification. A product is, by definition, a commodity (something offered for sale in exchange for money). These are in direct tension. Pursuing productization without resolving this tension would either (a) hollow out the values framing, or (b) create a product that can't actually be sold because its core value proposition is anti-sale.

**Debiasing move:** Make the tension explicit and choose. Either: (1) the tool is a values-aligned gift/commons, not a product, or (2) there exists a revenue model compatible with the reciprocity values (e.g., foundation grants, community-funded, sliding scale). Option 2 exists but requires design, not assumption.

**Severity:** High. This isn't a bias about *facts* but about *identity*. Getting it wrong damages the project's coherence.

**Confidence:** 0.85

**So What?:** Before productization, write a 1-page statement reconciling reciprocity values with revenue. If the reconciliation is forced or unconvincing, productization is the wrong frame.

---

## Calibration Frame: What Evidence Justifies vs. Contraindicates "Going Bigger"

### Evidence that would JUSTIFY productization:

1. **Demonstrated willingness-to-pay**: 3+ distinct entities (land trusts, intentional communities, consultancies) independently expressing willingness to pay >$500/year for access or services.
2. **Working-group consent**: Explicit written agreement from Askja, Adam, and Deca on IP terms, revenue sharing, and product direction.
3. **Data infrastructure exists**: V1 data ingestion (not demonstration) is complete and maintainable without heroic effort.
4. **Capacity headroom**: Gustaf can commit >10 hrs/week sustained for 12+ months without sacrificing higher-value Portable work.
5. **Revenue model compatible with values**: A concrete business model (grants, community membership, consulting wrap) that doesn't require commodifying land-shopping.

### Evidence that would CONTRAINDICATE productization:

1. **No willingness-to-pay signal**: 0 of 10 contacted potential customers express interest at any price point.
2. **Working-group resistance**: Any contributor objects to commercialization.
3. **V1 infrastructure blocked**: The Tier-2 raster fetch wall (CMIP6, SoilGrids, GHSL) remains unresolved, blocking real V1.
4. **Capacity exhaustion**: Gustaf's ~14-project load means productization would compete with Portable investments (writing, frameworks, relationships).
5. **Values incoherence**: No reconciliation between reciprocity framing and commercial sale that doesn't feel forced.

### Current state against these criteria:

| Criterion | Status | Implication |
|-----------|--------|-------------|
| Willingness-to-pay | **Unknown** — no customer discovery done | Can't justify |
| Working-group consent | **Unknown** — not discussed | Can't justify |
| Data infrastructure | **Missing** — demo ≠ V1 | Can't justify |
| Capacity headroom | **Unlikely** — 1 of 14 projects, part-time | Contraindicates |
| Revenue-values fit | **Unresolved** — tension documented | Contraindicates |

**Calibration conclusion:** 0 of 5 justifying conditions are met; 2 of 5 contraindicating conditions are present. The evidence does not currently support productization.

---

## Base Rate: Solo Mission-Driven Geo-Tools → Sellable Products

### Reference class characteristics:
- Solo or small-team builder
- Mission-driven (values-laden, not pure commercial)
- Geospatial/mapping domain
- Open or semi-open data foundation

### Observed outcomes (informal survey of similar projects):

| Project | Outcome |
|---------|---------|
| OpenStreetMap | Commons, no direct revenue model |
| Mapbox | VC-funded, became commercial, values drift |
| QGIS | Grant-funded open-source, no product revenue |
| Land.id / Regrid | Commercial from inception, VC-backed |
| Felt.com | VC-backed, commercial |
| uMap | Open-source, community-funded |
| GeoNode | Open-source, foundation-supported |

**Pattern:** Mission-driven geo-tools either (a) become commons/open-source supported by grants/community, or (b) take VC and drift toward commercial optimization. Solo mission-driven geo-tools rarely become sustainable commercial products without external funding or significant team expansion.

**Base rate estimate:** <5% of solo mission-driven geo-tools achieve sustainable commercial revenue. Most become (1) unfunded open-source utilities that fade, (2) grant-supported commons, or (3) acquired by larger commercial players.

**Implication for this project:** The base rate is unfavorable. Productization is a low-probability path unless the project (a) takes external funding (which has its own costs), (b) becomes a commons/gift (not a "product to sell"), or (c) finds a narrow high-value niche (e.g., consulting/advisory services) that can sustain part-time effort.

---

## Risks Identified

| Risk | Likelihood | Impact | Notes |
|------|------------|--------|-------|
| Planning fallacy leads to burnout | High | High | Prior evidence (failed raster build); no capacity slack |
| Sunk-cost drives over-commitment | Moderate | Moderate | 20-region curation is real investment |
| Values/revenue incoherence damages credibility | Moderate | High | Reciprocity reframe + commercial sale = cognitive dissonance |
| Working-group consent not obtained | Unknown | High | IP terms unclear; could damage relationships |
| No market (willingness-to-pay = 0) | Unknown | High | No customer discovery done |
| Tied-tier investment rots | High | Moderate | Any infra built is substrate-dependent |

---

## Recommendations

| # | Recommendation | Priority | Effort | Tier | Benefit |
|---|----------------|----------|--------|------|---------|
| R1 | Run lightweight customer discovery before any build (5–10 interviews) | P0 | Low | Portable | Validates or falsifies market existence |
| R2 | Propose productization to working group and wait for consent | P0 | Low | Portable | Resolves IP/consent risk before investment |
| R3 | Write a 1-page values/revenue reconciliation document | P1 | Low | Portable | Forces explicit resolution of core tension |
| R4 | Write a pre-mortem ("it's 12 months out and this failed") | P1 | Low | Portable | Surfaces likely failure modes early |
| R5 | Estimate work-breakdown structure for minimal product; compare to capacity | P1 | Low | Portable | Detects scope insensitivity before commitment |
| R6 | Defer all Tied-tier productization work until R1–R5 are complete | P2 | Zero | — | Avoids sunk-cost lock-in before validation |

---

## New Ideas & Extensions

| Idea | Score | Notes |
|------|-------|-------|
| "Gift with optional patronage" model (Patreon/Ko-fi) | Incremental | Low friction, values-aligned, but unlikely to scale |
| Consulting/advisory service layered on framework | Significant | Gustaf's time is the product; framework is credibility |
| Foundation grant funding (e.g., Open Society, Shuttleworth) | Significant | Matches mission-driven base rate; requires application effort |
| Community land trust partnership (CLT buys service) | Significant | High values-fit; narrow market; requires relationship-building |
| License framework to existing geo-platform (Regrid, Land.id) | Radical | Exits builder burden; may require working-group consent |

---

## Assumptions Ledger

| Assumption | Status | Impact if wrong |
|------------|--------|-----------------|
| Gustaf's enthusiasm reflects genuine strategic interest, not transient excitement | Likely true | If transient, productization discussion is premature |
| Working group would consider productization | Unknown | If resistant, path is blocked |
| The reciprocity values are non-negotiable | Assumed true | If negotiable, product options expand (but values erode) |
| Solo capacity is limited (~14 projects, part-time) | True per CLAUDE.md | If capacity expands (team, funding), scope changes |
| No customer discovery has been done | True per CONTEXT_PACK | If discovery exists and I missed it, calibration changes |

---

## Questions for Project Owner

1. What triggered the "thinking about it bigger now" impulse — a specific event, the Atlantic interview, or a longer-simmering sense?
2. Have you discussed productization with Askja, Adam, or Deca? What were their reactions?
3. If customer discovery revealed 0 willingness-to-pay among the first 10 contacts, would you still want to productize?
4. How do you reconcile the July reciprocity reframe (de-commodifying) with "a product to sell"? Is there a revenue model you have in mind that doesn't feel like re-commodification?
5. What would "going bigger" look like if "product to sell" is the wrong frame? Are there non-commercial "bigger" options (foundation grant, community commons, coalition of land trusts) that feel aligned?

---

## Points of Uncertainty

- **Market size and willingness-to-pay**: Completely unvalidated. Could be zero; could be substantial. Cannot calibrate without evidence.
- **Working-group stance**: No data on whether Askja, Adam, Deca would consent, object, or have their own productization ideas.
- **Capacity allocation**: Gustaf's actual availability is claimed as limited but not quantified. The "1 of 14 projects" heuristic may be imprecise.
- **Atlantic interview aftermath**: Whether coverage happens and what effect it has is unknown.

---

## Agreements & Tensions with Other Perspectives

| Mode | Expected agreement | Expected tension |
|------|-------------------|------------------|
| L1 (Adversarial) | Likely to surface same skepticism; different framing | May be more aggressive in rejection |
| L3 (Devil's Advocate) | Should steelman productization; tension with my skepticism | May surface cases I've underweighted |
| M1 (System Design) | Will identify technical scope; likely to confirm scope insensitivity | May propose tractable increments I've missed |
| M2 (Product) | Will look for market paths; may conflict with my "no evidence" position | May identify customer segments I've dismissed |
| M4 (Business Model) | Will propose revenue models; tension if models require values compromise | May find values-compatible models I haven't seen |
| R3 (Future Scenario) | Will project multiple futures; may surface positive scenarios | May underweight base-rate pessimism |

---

## Confidence

**Overall confidence in analysis: 0.80**

**Calibration note:** This analysis applies standard debiasing frameworks (Kahneman, Arkes & Blumer, Nickerson) to project-specific evidence. Confidence is high on the bias identification (the patterns are textbook); lower on the specific severity ratings (which depend on Gustaf's internal state and the working group's unobserved positions). The base-rate estimate is informed by observation of similar projects but is not a formal study. The strongest claim is structural: the current evidence does not support productization, and the biases identified would predictably lead to over-commitment if unchecked. This analysis could be wrong if (a) customer discovery reveals strong demand I've discounted, (b) the working group enthusiastically consents, or (c) a values-compatible revenue model exists that I haven't identified. The null hypothesis ("productization is not currently justified") is the defensible position given available evidence.
