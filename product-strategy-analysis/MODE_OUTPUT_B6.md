# Analogical (B6) Analysis

## Thesis

The structural analogies most relevant to this project — Indigenous data sovereignty frameworks, community land trusts, guidance-not-for-sale wisdom traditions, and certification bodies — converge on a finding that **"product to sell" is likely the wrong frame**. The project's core identity (reciprocity, host-community standing, qualitative-not-scored data on whose land this is) has structural parallels to knowledge systems that resist commodification *by design*. The analogies that work well commercially (Red Hat, Mapbox) share data/software as commodity infrastructure with services on top; this project's differentiator IS the framework's values — making the value itself non-extractable as product. Where productization has worked for mission-driven land/place tools (e.g., LandForGood, FarmLink), the revenue model is services, training, and brokerage — not data licensing. The likeliest sustainable structure is a **cooperative or trust holding the framework**, with revenue from **practitioner consulting, community placement services, and network access** — not from selling the framework or data product itself. This aligns with GEN's membership model and the CLT structure the target communities already know.

---

## Top Findings

### §F1: The closest structural analog is not a tech product — it's a certification body or credentialing institution

**Evidence:** Demeter (biodynamic certification), B-Corp, FSC (Forest Stewardship Council), and Certified Naturally Grown all share this structure: a values-laden framework that gates access or validates claims; revenue from membership, certification fees, and training; the framework itself not sold as a product. The Land Selection Framework's "Land standing" dimension and threshold-filtering logic structurally resemble a credentialing gate ("does this region meet your criteria, and do you understand whose land it is?") more than a data product.

**Reasoning chain:** 
1. The project's value lies in its criteria inventory, the reciprocity dimension, and the framework's discipline (no composites, native units, state+trajectory) — all of which are *standards*, not datasets.
2. Certification bodies monetize the *application* of standards (certification fees, training, audits), not the standard itself.
3. A "buy access to the data product" model would compete with free public datasets (Aqueduct, UCDP, OSM) that the framework already aggregates.
4. The differentiation is the *curation, discipline, and values* — which is what certification bodies sell.

**Severity:** High — this reframes the entire product strategy question.

**Confidence:** 0.75

**So What?** Draft a one-page sketch of what a "Regenerative Land Criteria Certification" service would look like: who pays, what they get, what the fee structure is, and how the working group's shared ownership maps to certification-body governance.

---

### §F2: Indigenous data sovereignty frameworks (CARE, OCAP) structurally conflict with "product to sell"

**Evidence:** The Land standing dimension explicitly names Indigenous territories, treaty/cession status, and obligation to host communities. CARE Principles (Collective benefit, Authority to control, Responsibility, Ethics) and OCAP (Ownership, Control, Access, Possession) are the recognized frameworks for data about or affecting Indigenous peoples. Both frameworks assert that affected communities must control how such data is used and who profits from it.

**Reasoning chain:**
1. The Land standing data for North American regions includes Mi'kma'ki, Abenaki, Ho-Chunk, Cherokee, Kalapuya, Sinixt, Ktunaxa, Syilx, Pueblo, and Osage territorial information.
2. Selling a "product" built on descriptions of whose unceded land this is — without consent from and benefit-sharing with those nations — is structurally incompatible with CARE/OCAP.
3. Even if legally permissible (the data is publicly sourced), it is ethically misaligned with the reciprocity frame the project claims.
4. The Atlantic interview framing ("land selection for the apocalypse") risks exactly this: affluent settlers paying for a tool to find land on unceded territory, with Indigenous communities bearing the cost of new arrivals and receiving none of the revenue.

**Severity:** Critical — this is not a feature gap but a structural contradiction in the "product to sell" frame itself.

**Confidence:** 0.85

**So What?** Before any productization, conduct a governance review against CARE principles and decide whether (a) to remove Indigenous territorial data from any paid tier, (b) to establish a benefit-sharing protocol with affected nations, or (c) to abandon the product-for-sale frame entirely. Document the decision transparently.

---

### §F3: The Red Hat / Mapbox "open-core + paid services" model does not transfer cleanly

**Evidence:** Red Hat (enterprise support on free Linux), Mapbox (open-source maps + commercial API/tiles), and similar open-core models share a structure: the *core* is commodity infrastructure anyone can run; the *paid layer* is operational excellence, support, SLA, or proprietary features. The Land Selection Framework's core is the criteria framework, reciprocity dimension, and curated regional values — none of which are commodity infrastructure.

**Reasoning chain:**
1. Red Hat's commercial value is "someone else runs Linux at enterprise SLA" — the commodity (Linux) is free.
2. Mapbox's commercial value is "someone else processes, hosts, and serves tiles at scale" — the underlying map data (OSM) is free.
3. The Land Selection Framework's underlying data (Aqueduct, UCDP, OSM, Hansen) is also free.
4. But the value-add is not operational infrastructure (anyone can spin up a MapLibre instance); it's the *curation, framework, and values frame*.
5. Curation and values are harder to charge for than infrastructure, because they are not operationally demanding and are easily replicated if published openly.

**Severity:** Medium — rules out a common tech-product revenue model; redirects toward services.

**Confidence:** 0.80

**So What?** Stop modeling against SaaS/data-product analogies. Explore service models instead: paid consulting engagements with land-seeking communities, placement brokerage, or training/workshop revenue.

---

### §F4: Community Land Trusts (CLTs) provide the closest structural analog for the ownership question

**Evidence:** CLTs hold land in perpetuity for community benefit, with governance shared between residents, community members, and public-interest representatives. The Land Selection Framework is a shared working-group project with multiple contributors (Askja as originator, Adam, Deca, Gustaf, Monty, Alaska); Gustaf holds the r4 seat but does not own the project. The CLT structure mirrors this: no single owner, perpetual mission-lock, shared governance.

**Reasoning chain:**
1. "Product to sell" requires deciding who owns the product and receives the revenue.
2. A single-owner (Gustaf) product would misattribute the working group's collaborative work.
3. A CLT-like model (a cooperative, foundation, or Zweckbetrieb) holds the framework in common and distributes any revenue per governance rules.
4. This maps to CLT economics: long-term stewardship trumps extraction; mission-lock prevents sale or dilution.

**Severity:** High — the ownership question must be resolved before any productization; CLT structure suggests the path.

**Confidence:** 0.70

**So What?** Bring a CLT-analog proposal (cooperative, foundation, or stewardship trust) to the working group at r5 before any commercial activity. Make the governance structure explicit.

---

### §F5: GEN (Global Ecovillage Network) is structurally a membership network, not a product vendor — and that may be the right model

**Evidence:** GEN's revenue comes from membership dues, conferences, training programs, and project grants — not from selling data products. The target market for this framework (intentional-community founders, land-seeking groups) is GEN's membership base. GEN already has the relationships, trust, and distribution.

**Reasoning chain:**
1. Building a product to sell TO the regen-community network competes with GEN's role as the network hub.
2. Building a service or tool WITH GEN (or as a GEN working group / affiliate) aligns rather than competes.
3. GEN's economics (membership + training + grants) is a working model for values-laden community infrastructure.
4. "Sell it as a product" positions Gustaf/working group as vendors; "partner with GEN" positions them as contributors.

**Severity:** Medium — opportunity cost of the wrong positioning.

**Confidence:** 0.70

**So What?** Explore GEN affiliation or partnership before independent productization. Draft a one-page partnership proposal and send it to GEN's relevant working group.

---

### §F6: Mission-locked commercial entities (Patagonia, Kickstarter PBC) require scale this project does not have

**Evidence:** Patagonia achieved mission-lock after decades of profitable scale. Kickstarter converted to PBC after establishing dominant market position. Mission-lock at early stage (before product-market fit, revenue, or team) adds governance overhead without corresponding protective value.

**Reasoning chain:**
1. Mission-lock structures (PBC, Benefit Corp, stewardship trust) protect against mission drift once there is something to protect.
2. The Land Selection Framework has no revenue, no validated customer, and a working prototype only.
3. Premature governance complexity (founding a foundation, establishing a board, drafting bylaws) is overhead with no current payoff.
4. The working-group collaboration protocol is lightweight and functional for the current stage.

**Severity:** Low — clarifies sequencing, not the end-state.

**Confidence:** 0.75

**So What?** Delay formal mission-lock incorporation until after (a) a validated revenue stream and (b) working-group consensus on governance. Document the intent in the r5 handoff request but do not incorporate prematurely.

---

### §F7: The "land broker / placement service" analog (FarmLink, LandForGood) is the most actionable commercial model

**Evidence:** FarmLink and LandForGood (both US-based farm/land linking services) monetize *services* built on land information: consulting, matchmaking between landowners and seekers, training programs, land access workshops. They do not sell data products. Their revenue covers staff and operations; scale is modest but sustainable.

**Reasoning chain:**
1. LandForGood charges for farmer advising, workshops, landowner succession planning — all high-touch, high-value, low-scale.
2. This model is compatible with the reciprocity frame: you are paid for your expertise and time, not for selling land information.
3. Gustaf's position (practitioner embedded in ecovillages, consulting experience, relationship network) maps well to a consulting-led model.
4. The prototype + V1 data become *supporting infrastructure* for a consulting practice, not the product itself.

**Severity:** High — this is the most structurally sound path to revenue.

**Confidence:** 0.80

**So What?** Draft a service offering: "Land-seeking community consulting" — scope, pricing, delivery. Use the prototype as sales collateral, not the product.

---

### §F8: The re-commodification risk is not hypothetical — the Atlantic interview is an active test case

**Evidence:** The Atlantic inquiry ("land selection for the apocalypse") explicitly frames the tool for wealthy preppers/climate-migrants. This is the commodification frame the July 2026 reframe was designed to resist. The interview is scheduled for July 3-4, 2026 — meaning this decision is live, not hypothetical.

**Reasoning chain:**
1. Press coverage shapes public perception and market positioning.
2. An Atlantic feature framing this as "apocalypse land shopping" would attract exactly the buyer persona the reciprocity frame rejects.
3. A successful product launch on the back of that press would lock in the commodified frame.
4. The interview is an inflection point: how Gustaf answers will shape whether productization is even possible without betraying the project's identity.

**Severity:** High — the decision is days away, not months.

**Confidence:** 0.85

**So What?** Use the interview to explicitly name the reciprocity frame and the limits of the tool — "this is not a shopping list, and some places the honest answer is 'not there.'" Let the framing pre-empt the wrong buyers.

---

## Risks Identified

1. **Re-commodification risk:** Any "product to sell" framing risks undoing the July 2026 bioregioning/reciprocity reframe and attracting the wrong users (affluent land-shoppers vs. communities seeking to belong).

2. **CARE/OCAP compliance risk:** Selling data that describes Indigenous territories without consent or benefit-sharing violates Indigenous data sovereignty principles the project claims to respect.

3. **Ownership conflict risk:** Productizing a shared working-group project without explicit governance creates attribution, revenue-sharing, and consent conflicts.

4. **GEN disintermediation risk:** Selling a product TO the regen-community network positions the working group as vendor rather than contributor, potentially alienating the natural partner.

5. **Thin-market risk:** The actual paying market for a values-laden land-siting tool is small (hundreds, not thousands of community founders per year globally); SaaS economics do not work.

6. **Builder-capacity risk:** Gustaf is a solo, part-time builder across 14 active projects; a product launch requires operational capacity the current setup cannot sustain.

---

## Recommendations

| Priority | Recommendation | Effort | Tier | Benefit |
|----------|---------------|--------|------|---------|
| P0 | **Use the Atlantic interview to set the reciprocity frame**, not sell the product. Explicitly say "this is not a shopping list." | Low (hours) | Portable | Prevents wrong-market lock-in |
| P1 | **Conduct a CARE-principles review** of the Land standing data before any paid tier includes it. Decide: remove, benefit-share, or abandon paid model. | Medium (days) | Portable | Ethical alignment, reputational protection |
| P1 | **Draft a working-group governance proposal** (CLT-analog: cooperative, foundation, or stewardship trust) for r5 discussion. | Medium (days) | Portable | Resolves ownership before revenue |
| P2 | **Sketch a consulting service offering** ("land-seeking community advising") using the prototype as collateral, not product. Price it. | Low (days) | Semi-portable | Actionable revenue path |
| P2 | **Explore GEN partnership** before independent launch. One-page proposal, send to GEN Education or Land working group. | Low (days) | Portable | Distribution, legitimacy, alignment |
| P3 | **Draft a "certification" model spec** — what would a Regenerative Land Criteria certification look like? Who pays, what do they get? | Medium (week) | Semi-portable | Alternative revenue structure |
| P4 | **Delay formal incorporation** until revenue stream validated and working-group consensus reached. | Zero | N/A | Avoids premature overhead |

---

## New Ideas & Extensions

| Idea | Score | Notes |
|------|-------|-------|
| **Consulting practice** using prototype as sales collateral | Incremental | Fits current capacity; validates demand |
| **GEN-affiliated working group** (not independent product) | Significant | Changes positioning from vendor to contributor; requires GEN buy-in |
| **"Regenerative Land Criteria Certification"** for communities/sites | Significant | Certification-body model; requires credibility and scale |
| **Benefit-sharing protocol with Indigenous nations** for any revenue from Land standing data | Radical | CARE-aligned but complex governance; requires nation-by-nation consent |
| **Cooperative / stewardship trust ownership** of the framework | Significant | CLT-analog; resolves ownership; requires working-group consensus |
| **V2 as "placement service"** — matchmaking land-seekers with suitable regions + hosts | Significant | FarmLink analog; high-touch, low-scale, sustainable |

---

## Assumptions Ledger

| Assumption | Confidence | Impact if wrong |
|------------|------------|-----------------|
| The target market (intentional-community founders) is small (hundreds/yr globally) | 0.70 | If larger, SaaS economics might work |
| The reciprocity frame is load-bearing for project identity | 0.85 | If negotiable, more commercial options open |
| Gustaf's consulting capacity is limited by other projects | 0.75 | If capacity expands, consulting model scales |
| GEN is the natural distribution partner | 0.65 | Other networks (Transition Towns, permaculture, land trusts) may fit better |
| Working-group contributors will want governance voice in any commercial activity | 0.80 | If Askja/Adam/Deca consent to Gustaf-led commercialization, simpler path |

---

## Questions for Project Owner

1. Has anyone in the working group discussed commercial intent — and would Askja, Adam, or Deca object to a product launch built on shared work?

2. Have you consulted with any Indigenous governance body (e.g., First Nations Data Governance Strategy, Mi'kmaw Ethics Watch) about including territorial data in a paid product?

3. What is your actual consulting/advising capacity — could you service 5 paid engagements per quarter while maintaining other projects?

4. Have you had any contact with GEN about the framework — and would they consider hosting it as an affiliate project or working group?

5. Is the reciprocity frame negotiable, or is it definitional (i.e., would you rather not commercialize than compromise it)?

---

## Points of Uncertainty

1. **Market size:** No customer discovery has been done. The paying market could be 50 communities/year or 500. This determines whether any product model is viable.

2. **Working-group consent:** The governance question is unresolved. Until r5, it is unclear whether Askja (the originator) would support commercialization at all.

3. **CARE applicability:** CARE principles are designed for research data. Whether they apply to a derivative tool (not primary data collection) is an open legal/ethical question.

4. **GEN appetite:** Whether GEN would welcome an affiliate project or see it as competitive is unknown without conversation.

5. **Builder runway:** Gustaf's actual capacity to build, market, and service a product while maintaining 14 other projects is untested.

---

## Agreements & Tensions with Other Perspectives

**Likely agreements:**
- Financial viability analysis (likely B3/B4): the market is small and economics are thin — we agree.
- Risk/resilience analysis (likely B2): re-commodification is a live threat — we agree.
- Values/ethics analysis (likely B7/B8): CARE alignment is critical — we agree.

**Likely tensions:**
- Growth/scaling analysis (likely B5): analogies suggest "scale via partnership" not "scale via product." May conflict with growth-oriented frames.
- Tech/product analysis (likely B1): I conclude the tech is not the product; the service is. Tech-focused analysis may see more product opportunity.
- Innovation analysis (likely B9): I conclude the innovation is the framework/values, not the tech. May conflict with novelty-focused frames.

---

## Confidence

**Overall confidence: 0.70**

**Calibration note:** Analogical reasoning is strongest when the source domain is structurally similar. The strongest analogs here (CARE/OCAP, CLTs, certification bodies) are close fits; the weakest (Red Hat, Patagonia) are poor fits, which itself is informative. Confidence is limited by (a) lack of customer discovery data, (b) unresolved working-group governance, and (c) uncertainty about GEN's or Indigenous nations' actual reception. If customer discovery reveals a larger, less values-sensitive market, this analysis would need revision. If the working group rejects commercialization, it is moot.
