# North America data — verification gate (before anything ships)

**Status:** 10 dossiers researched, compiled into `prototype/data/regions-na.staging.js` (dormant, not imported, not live). This is the human-verification gate the project's data-honesty bar requires. **Nothing here is on the live site.** Verify against the dossiers in `prototype/data/research-dossier/<id>/`, then merge.

Region IDs: `cascadia`, `vermont`, `southern-appalachians`, `driftless`, `ozarks`, `northern-new-mexico`, `nova-scotia`, `kootenays`, `quebec-eastern-townships`, `oaxaca`.

## Compiled values (midpoints, native units) + confidence

| region | climate °C | water | SOC g/kg | forest %/dec | solar | conflict | regen | pop | weakest cell |
|---|---|---|---|---|---|---|---|---|---|
| Cascadia | 12.5 | 0.15 | 50 | −3 | 1150 | 0 | **47** | 55 | forest (low) |
| Vermont | 9.0 | 0.08 | 20 | −0.5 | 1250 | 0 | 30 | 27 | — (cleanest) |
| S. Appalachians | 15.5 | 0.08 | 50 | 0 | 1400 | 0 | 25 | 47 | climate/soil (med) |
| Driftless | 11.75 | 0.08 | 23 | +1.5 | 1365 | 0 | 20 | 13 | forest (low) |
| Ozarks | 17.5 | 0.15 | 20 | −1 ⚠ | 1440 | 0 | 5 | 4.5 | forest (contradiction) |
| N. New Mexico | 10.5 | 0.85 | 7 | **−10** | **2150** | 0 | 20 | 6 | forest (low) |
| Nova Scotia | 9.3 | 0.08 | 40 | **−8** | 1100 | 0 | 5 | 18.4 | forest (high conf, out of range) |
| Kootenays | 10 | 0.08 | 40 | **−5** | 1100 | 0 | 10 | 2.8 | forest (fire-variable) |
| Québec E.T. | 8.0 | 0.08 | 32 | +1.0 | 1088 | 0 | 10 | 33 | forest (low) |
| Oaxaca | 19 | 0.2 | 40 | **UNVERIFIED** | 2000 | **UNVERIFIED** | 10 | 44 | 2 unverified cells |

## MUST resolve before the relevant region ships

1. **Oaxaca `forest_change` = UNVERIFIED.** Top-5 Mexican deforestation state, but the GFW dynamic dashboard wasn't queryable by the agent. Needs a direct Hansen/GFW query for the Oaxaca polygon. **Oaxaca cannot ship until this has a real number.**
2. **Oaxaca `conflict` = UNVERIFIED.** Mexico is the one NA region where conflict is NOT auto-zero. Agent found ~99 events via an ACLED *proxy* (state-level), but the criterion is specifically UCDP-GED-within-200km, which was not pulled. Needs the real UCDP figure. **Oaxaca cannot ship until this is resolved.**
3. **Ozarks `forest_change`** — the dossier contradicts itself (summary table said −1 to −2 /decade; prose said +1 to +2). Currently staged at −1, low confidence. Pick a defensible number against the dossier.

## Low-confidence cells to scrutinise (sourced, but triangulated not pixel-extracted)
- **`forest_change` almost everywhere** is low/med — most agents could not extract a clean Hansen %/decade and inferred from state/national FIA. This whole column deserves the hardest look.
- **climate / soil / water** for several regions were triangulated from regional literature rather than a direct WorldClim/SoilGrids/Aqueduct pixel read (flagged `med`). Defensible, but verify the ones that drive a threshold decision.

## Criterion ranges need widening for NA (this touches EU too)
Editing a criterion's `rangeMin/rangeMax` in `regions.js` re-normalises the EU bars as well — **re-check EU rendering after any change.**

| criterion | current | NA needs | why |
|---|---|---|---|
| `regen_network` | 0–30 | raise max to ~50 | Cascadia 47; S. App 25; Vermont 30 (at ceiling) |
| `solar_pv` | 800–2000 | raise max to ~2200 | N. New Mexico 2150; Oaxaca 2000 (at ceiling) |
| `forest_change` | −5..+5 | **design question, not just a number** | N. New Mexico −10 and Nova Scotia −8 are fire / industrial-forestry loss. Do those belong on the same axis as Europe's slow deforestation/recovery trend? Widening the floor to −12 flattens all EU bars toward centre. **This is a Collective call**, not a mechanical fix. |

## Slate sign-off (locked decision #3)
The 10-region slate is a proposal. Confirm it with The Collective before any NA region goes live.

## Closest to ship-ready (for batch ordering)
No UNVERIFIED cells + mostly high/med: **Vermont, Nova Scotia, Driftless, Québec, Kootenays.** Hold **Oaxaca** for last (2 unverified cells, hardest legal story). Cascadia/S. App/Ozarks/N.NM need the `forest_change` look.

## To merge after verification
1. Resolve UNVERIFIED + low-confidence cells against dossiers.
2. Apply agreed range changes in `regions.js` `criteria` (re-check EU bars).
3. Append verified `naRegions` → `regions` array and `naValues` → `values` object in `regions.js` (drop the `conf` field on merge — it isn't a rendered field).
4. Local-verify (server + Playwright): switcher auto-appears (2 continents), toggle works, EU unchanged, mobile 390px.
5. Deploy; the NA tab reveals itself.
