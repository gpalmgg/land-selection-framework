# Data Confidence Audit — for the Atlantic interview

**Date:** 2026-07-03 · **Method:** 37-agent adversarial audit (20 region fact-checkers + independent recheck on every flagged value, each verifying against primary sources — dataset APIs, statute text, treaty records, statistics offices). 0 agent errors. Two-stage: a value only counts as "wrong" if a *second, independent* agent went to the primary source and confirmed it.

---

## Bottom line

The dataset is **solid where it matters most for this interview**, and the errors that exist are in *numbers and citations*, not in the reputationally-dangerous territorial claims.

- **160 numeric values checked:** 46 confirmed, 99 plausible midpoints, 13 questionable, 1 wrong, 1 unverifiable.
- **98 land-standing claims checked:** 71 confirmed, 24 plausible, 3 needed fixing (all citation/tenure wording — none territorial).
- **14 flags survived independent recheck** → real corrections. **3 flags were reversed** on recheck (the first agent was wrong; original value stood) — the two-stage design working as intended.

### The single most reassuring result
**Every Indigenous-nation and treaty attribution came back confirmed or plausible. Zero wrong.** Beaumont is from Nova Scotia and will read this with an Indigenous-land lens — and the North American territorial claims hold:

| Region | Claim | Verdict |
|---|---|---|
| **Nova Scotia** | Unceded Mi'kma'ki · Peace and Friendship Treaties | ✅ confirmed |
| Cascadia | 1855 Willamette Valley Treaty *cession* (not "unceded") | ✅ confirmed |
| Vermont | N'dakinna · unceded Western Abenaki | ✅ confirmed |
| S. Appalachians | Cherokee · 1835 New Echota · Trail of Tears · Qualla Boundary | ✅ confirmed |
| Ozarks | Osage · 1808 Fort Clark · Quapaw | ✅ confirmed |
| Kootenays | Unceded Sinixt / Ktunaxa / Syilx | ✅ confirmed |
| Québec E.T. | Unceded W8banaki / Ndakina · Odanak & Wôlinak | ✅ confirmed |
| Oaxaca | Zapotec / Mixtec / Chatino comunal lands | ✅ confirmed |
| Driftless | Ho-Chunk homeland · Sauk & Meskwaki historic presence | ✅ confirmed |

If she pushes on "did you get the Indigenous history right" — you can say yes with confidence, and that you had it independently verified against treaty records.

---

## ✅ Already fixed (8 objective, journalist-clickable errors)

These are corrected in `data/regions.js` and `data/land-standing.js` (each with an inline `// 2026-07 audit` comment). They were the kind a reporter could disprove in seconds by clicking the source.

1. **Solar PV systematically overstated** — the dataset appears to have read *GHI* (horizontal irradiation) where it should read *PVOUT* (panel yield). Fixed against the Global Solar Atlas API at each region's own coordinates:
   - Alentejo **1865 → 1650** · Connemara **975 → 940** · Cévennes **1550 → 1420** · Northern NM **2150 → 1840** (relabelled "Exceptional" → "Excellent"; 2150 implied Atacama-class yield).
   - *The qualitative story ("excellent/elite solar") still holds everywhere — only the digits were inflated.*
2. **Transylvania citation** — the `sourceUrl` opened an unrelated 2014 decree *promoting a police officer*, not Law 17/2014. Fixed to the correct document (`/156290`).
3. **Nova Scotia tenure wording** — said the 10% non-resident deed-transfer tax is avoided by holding land "as vacant or agricultural." Its own cited NS Finance PDF says the opposite: vacant *residential* land **is** taxed. Reworded to match the source.
4. **Asturias** — "six UNESCO Biosphere Reserves" → **seven** (Ponga declared the 7th in July 2018).
5. **Northern NM soil-carbon vintage** — "2001–2024" was impossible for a SoilGrids 2.0 product (a 2020 release, observations 1905–2016). Fixed to 2020; the value (7 g/kg) stands.

---

## ⚠️ Flagged for your call (judgment / editorial — NOT auto-changed)

These are medium-confidence or touch curated editorial choices, so I left them for you. Each shows the audit's recommendation.

| Region · field | Current | Audit says | My read |
|---|---|---|---|
| **Saxony-Anhalt** · forest_change | `0.2%/decade "Stable (managed forestry)"` | Relabel as **loss** — Harz spruce collapse (~⅔ of Harz spruce dead, ~28k ha, 2018–23). Magnitude uncertain (~−5%/decade). | **Worth fixing the label before print** — "Stable" next to a famous dieback is the softest science claim in the set. Suggest at least changing the label to name the Harz dieback. |
| **Kootenays** · climate | `10 °C · ClimateNA/AdaptWest` (but URL points to WorldClim) | Value ~3–6 °C above valley normals; lower to **~7.5 °C** and state elevation band; fix source/URL mismatch. | Med-confidence. Either lower it or add "(valley bottom)". Source/URL mismatch is worth fixing regardless. |
| **Connemara** · regen_network | `10 sites · anchor "Cloughjordan, The Hollies"` | **Cloughjordan is in Co. Tipperary** (~150 km away, out of region). GEN lists only ~2 Irish sites nationally. | The anchor error is factual — drop Cloughjordan or relabel as an informal-scene estimate. |
| **Galicia** · regen_network | `4 sites · Red Ibérica de Ecoaldeas` | RIE lists **0** Galician members; ~3 via GEN directory. Re-source. | Curated proxy — your call, but the source attribution is checkable. |
| **Asturias** · regen_network | `30 sites · Biosphere Reserves portal` | Portal doesn't enumerate regen sites; keep 30 only as a *qualitative density proxy* + re-source. | Editorial. Fine as a proxy if labelled as one. |
| **Cascadia** · soil_carbon | `50 g/kg "Willamette/forest"` | Valley-floor topsoil ~26–36 (where you'd actually farm); 50 blends in forest-floor soil. | Framing choice — defensible, but be ready to say it's a regional blend. |
| **Vermont** · forest_change | `−0.5%/decade` | Understates the ~1%/decade sprawl loss; consider −1.0. Also Act 250 → Act 181 (2024) is phasing in through 2026. | Minor; the Act 181 trajectory note is good to know if asked about policy. |
| Ozarks · climate | label cites "NOAA NCEI/NCA5" but URL is WorldClim | Source-label/URL mismatch; 17.5 °C not traceable to one product. | Cosmetic but clickable. |

---

## If she probes, here's the honest answer

- **"Where did the solar numbers come from?"** → Global Solar Atlas PVOUT; a few were inflated by a GHI/PVOUT mix-up and are now corrected. *(Fixed.)*
- **"West Cork / Connemara is two different places 150 km apart."** → True. It's a "mild Atlantic Ireland" archetype reported as one midpoint; defensible as an archetype, shakier region-by-region. Own it as a prototype-level simplification.
- **"Isn't a single climate number misleading in mountains?"** (Cévennes, Kootenays, South Tirol) → Yes — elevation dominates and the single figure is a midpoint. This is exactly why the framework keeps *native units + state/trajectory* and defers composite scoring; the honest answer is "one number under-describes a gradient."
- **"Is this a real data pipeline?"** → No — it's a designed communicative prototype using hand-curated best-available midpoints to show what V1 will produce. V1 is ingestion-only; querying/scoring is a deferred V2. *(The `science` forge track is adding this honesty box to `deeper.html` right now.)*

---

## Provenance of this audit
Full machine output: `w65twpf1g` workflow result (309 KB JSON). Per-agent transcripts in the workflow journal. Re-runnable. This sheet is a working doc — not deployed.
