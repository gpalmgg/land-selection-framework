# DRAFT — r4 reciprocity commentary for the source-docs

**Status:** draft for Gustaf's approval. NOT yet appended to the source-docs (those are the immutable source of truth — append only on your sign-off). Written to slot into `Land Project v1 r4 Overview.md` as a dated addendum after the existing 2026-05-29 r4 commentary.

---

## r4 Commentary — Addendum: Reciprocity & host-community standing (@Gustaf, practitioner reality-check, 2026-06-30)

**Provenance:** this addendum is the part of the practitioner reality-check the first r4 pass (2026-05-29) didn't reach. The earlier pass argued the *mechanics* — criteria completeness, the ship gate, the filtering/scoring split — from inside the build. This one steps outside the build to name something the whole framing is missing. It is grounded in the same 20-region evidence base, read against an eco-village-embedded perspective on what actually determines whether a settlement is welcomed or resented over decades. Points that are judgment rather than evidence are marked `[opinion]`. **Nothing here overwrites the `[COMMITTED]` decisions above — including Decision 6 (subjective dimensions out of V1) and Decision 7 (the four sovereignty axes). It is additive commentary, and it specifically does *not* propose re-opening Decision 7.** What it proposes is a fifth consideration to sit *beside* the four axes, plus a V1-legal move that needs no new scoring.

### The thing the framing doesn't see: all four sovereignty axes are the *incomer's* sovereignty

Read Decision 7 again with one question in mind — *whose* sovereignty? Geopolitical: state stability around **us**. Legal: property rights and freedom from interference for **us**. Material: food/water/energy independence for **our** settlement. Social: **our** community's self-governance, and — tellingly — "civil-society openness to newcomers," which the Specifications mapping (Social sovereignty → Askja #3) spells out as *how welcoming the locals are to the incomers.*

Every axis is the arriving settlers' own sovereignty. The one place the people already on the land appear, they appear as a *property of the destination* — a measure of how receptive they'll be to us. There is no axis, anywhere in the four, for **the sovereignty and standing of those already rooted in the place.** The framework has a complete vocabulary for *our* self-determination and no vocabulary at all for *theirs*.

This isn't a drafting oversight to patch inside Decision 7. It's a worldview the tool inherits by default if no one names it. And in our actual region slate it is not abstract:

- **The North American regions sit on living Indigenous territory.** The Kootenays are Sinixt, Ktunaxa, and Syilx land (the Sinixt were declared "extinct" by Canada in 1956 and had that ruling overturned by the Supreme Court in 2021 — this is contested, active sovereignty, not history). Nova Scotia is **Mi'kma'ki**, held under Peace and Friendship treaties that never ceded land. The Oaxaca regions are Zapotec, Mixtec, and Chatino territory.
- **We already encountered this — and coded it as friction to the buyer.** Our own `legal_ownership` layer records Oaxaca's *ejido / comunal + usos y costumbres* and treats it as an acquisition constraint ("hard for an outsider to get title"). That is exactly backwards as a framing. *Usos y costumbres* is not an obstacle in our path; it is **Indigenous self-governance functioning as designed.** The framework met host-community sovereignty face-to-face in the data and filed it under "things that make it hard for us to buy in." `[opinion, but I'd stake the contribution on it]`
- **Europe has rooted standing too**, even without the colonial frame — old commons regimes, *vicinales*/*comunales*, depopulating rural communities (our own `demographic_trajectory` layer shows which), village social fabric that an arriving group can either join or hollow out. The Galician minifundio tangle and the South Tirol *Maso Chiuso* aren't just title puzzles; they're the legal shells of communities that already live there.

### Why this matters more than a missing criterion: the green-colonialism failure mode

Say it plainly, because the polite version lets it happen: **a land-selection tool that helps relatively privileged, mostly Western groups scan continents for "available" land is one design decision away from being an instrument of green colonialism — a land grab with better intentions and a permaculture logo.** "Optimal location for a regenerative settlement" and "someone else's home and territory" are frequently the *same coordinates*. The tool's entire value proposition — wide search scope, attributes over listings, find the best land — is also the exact shape of the extractive move if reciprocity isn't built in as discipline. The framework is admirably honest about MAUP, about vintage, about not faking precision. It is currently silent about the one thing that could make the whole project do harm at scale. That silence is the gap. `[opinion]`

The discipline that prevents it has a name, and it's the one our whole field runs on: **reciprocity.** Not "are the locals open to us" (that's the incomer asking what they can extract from the welcome). The reciprocal question is: *what does our arriving give and take here, who was already in relationship with this land, and do they have standing in whether we come?* In practice — and I'll put the practitioner's line on the record because the tool should be able to surface a "no" — **where arriving would harm the community already there, the honest answer is not to go.** A tool that can only ever return "here are good places for you" and never "this is not yours to take" is not neutral. It's complicit by omission.

### What I'm actually proposing — two moves, both framework-legal

**1. A fifth consideration for V2 criteria discovery: *host-community standing* (proposed, not committed; does NOT reopen Decision 7).**

Add a fifth consideration *alongside* the four sovereignty axes — call it **host-community standing** or **reciprocity / prior relationship** — that asks the question the four axes structurally can't: *whose land is this already, under what tenure and what law (including treaty and customary law), and what would arriving here ask of, or take from, them?* This is a V2 *criteria-discovery* question (Spec Step 3 territory, the same place `legal_ownership` / `land_cost` / `climate_buffering` were proposed), not a V1 ingestion mandate. I'm flagging it for the group to react to, not landing it by propose-and-proceed.

It must obey the same disciplines as everything else:

- **Never a composite, never a score, never a weight.** This is Adam's rule and it applies with full force here — *especially* here. A numeric "reciprocity score" would be obscene: it would let a group buy down an Indigenous nation's standing against cheaper land. It is a **qualitative dimension** that the user reads and reckons with, exactly like `legal_ownership`'s `regime`/`restriction` fields. It informs a human conscience; it does not compute a verdict.
- **State + trajectory, native units, source + vintage + license** — same as every criterion. State = current tenure / territory / treaty status. Trajectory = e.g. land-back movements, rematriation, depopulation-and-renewal in rural Europe.
- It is the *objective-but-hard-to-measure* kind (Decision 6's "in" column), not the subjective kind. Treaty status, unceded/contested designation, customary-tenure regime, and land-claim activity are documentable facts with sources — closer to `legal_ownership` than to "vibes." This keeps it cleanly on the right side of Decision 6.

**2. A V1-now move that needs no new scoring and breaks no committed decision: surface what's already in the dossiers as visible host-context.**

We don't have to wait for V2 to stop coding Indigenous sovereignty as buyer-friction. V1 can — today, within the no-querying/no-scoring discipline — **surface land-tenure, territory/treaty status, and a plain "what arriving here asks of the place and its people" note as visible qualitative context per region.** This is pure display of sourced fact: no filter, no weight, no composite, fully inside Decision 4 and the V1 scope. It's the same per-jurisdiction Tier-1 pattern we already proved five times this round (dossier prose → human-verifiable JSON → `compile_per_jurisdiction.py` → GeoJSON), pointed at a question we'd so far only asked from the buyer's side.

And the honest disclosure: **the deployed demonstration prototype already does a version of this** — the per-region "what living here asks of you" depth content (`data/region-depth.js`), and now a structured per-region "Land standing" block (`data/land-standing.js`: whose land, tenure, how to enter in good faith, what it asks), surfaced in the region drawer and on the indexable region pages. The artifact is ahead of the docs on this; the docs should catch up.

### The one-line version, for the chat

The framework is rigorous about protecting the people *arriving*. It says nothing about the people *already there*. Until it does, we're building a better map for a land grab. Reciprocity — host-community standing, treated as visible qualitative context and never as a score — is the discipline that turns this from extraction into arrival-in-good-relationship. That's the practitioner's reality-check, and it's the one I'd most want the group to sit with. `[opinion]`

---

## Proposed Collaboration Log entry

| r4 (addendum, 2026-06-30) | @Gustaf | Practitioner reality-check | Added a reciprocity / host-community-standing finding: all four of Decision 7's sovereignty axes describe the *incoming settlers'* sovereignty, with no axis for the standing of those already rooted in a place (Indigenous nations across the NA slate — Mi'kma'ki, Sinixt/Ktunaxa/Syilx, Zapotec/Mixtec/Chatino — and rooted rural communities/commons in Europe). Names the green-colonialism failure mode and proposes, additively (no overwrite of Decision 6 or 7): (a) a fifth V2 criteria-discovery consideration, "host-community standing," as a qualitative dimension only — never a composite or score, per Adam's rule; and (b) a V1-legal move to surface land-tenure / territory / "what arriving asks" as visible per-region qualitative context, which the deployed prototype now does. |

---

## Proposed additions to the Handoff Request [r4 → r5]

**Add to "What r5 is asked to do":**

- **@Askja & @Deca (originator + synthesiser) — react to the reciprocity addendum (2026-06-30).** Does "host-community standing" belong as a fifth consideration alongside Decision 7's four axes (a *companion* to them, explicitly not a reopening of the committed four-axis decision)? Is the green-colonialism risk one the framework should name in the Overview's Mission/Decisions, rather than leave implicit?
- **@Monty (academic) — locate this against the literature.** Indigenous data sovereignty (CARE / OCAP principles), unceded/treaty-territory designation as a documentable layer, land-back and rematriation as trajectory signals. Is there a defensible, source-able way to encode host-community standing as objective-but-hard-to-measure (Decision 6 "in" column) without sliding into the subjective?
- **@Adam (GIS) — confirm the discipline holds.** Host-community standing must stay a qualitative dimension — never a composite, never a weight, never a score (your r1 non-negotiable, which this addendum leans on rather than bends). Agree it can ship as per-jurisdiction qualitative context under the same pattern as `legal_ownership`?

**Add to "Specific decisions waiting on group sync":**

6. **Decide** whether to (a) adopt "host-community standing / reciprocity" as a fifth V2 criteria-discovery consideration alongside Decision 7's four axes, and (b) authorise the V1-now move to surface land-tenure / territory / "what arriving asks" as visible per-region qualitative context (no scoring, no filtering — pure sourced display, inside V1 scope). Recommended NOT to run by propose-and-proceed: this touches the project's ethical center and warrants explicit group assent, not default-on-silence.

**Add to "Open questions still owed by the group":**

- r4 addition (2026-06-30): does the project want a "who this tool should not serve / where the honest answer is not to go" gate stated anywhere in the documents? Currently there is none. The practitioner position is that its absence is itself a design decision the group should make consciously rather than by omission.
