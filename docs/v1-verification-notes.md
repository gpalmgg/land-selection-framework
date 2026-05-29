# V1 Verification Notes

**Produced:** 2026-05-28, r4 round. Spec Step 10 deliverable.
**Honest scope:** what was actually verified mechanically during this r4 round, separated from what still needs a human eyeball.

---

## What was mechanically verified (this round)

- **Loader self-check** — `scripts/v1_loader.py` loads every Tier-1 criterion without error and the expected feature counts match the source file metadata:

  | criterion | expected | loaded | ✓ |
  |-----------|----------|--------|---|
  | water_stress    | 995 EU + 2,039 NA = **3,034** | 3,034 | ✓ |
  | water_depletion | 995 EU + 2,039 NA = **3,034** | 3,034 | ✓ |
  | conflict        | 14,546 EU + 16,333 NA = **30,879** | 30,879 | ✓ |
  | regen_network   | 30 EU + 76 NA = **106** | 106 | ✓ |
  | legal_ownership | 20 jurisdictions | 20 | ✓ |

- **Metadata sidecar attachment** — every loaded GeoDataFrame's `.attrs` carries its sidecar metadata (source, vintage, license, native_unit, time_framing, sovereignty_axes). Verified in the loader self-check.

- **GeoPackage exports** — `scripts/export_v1.py` produces `<criterion>.gpkg` for all 5 layers in `data/v1-exports/`. File sizes plausible (3.7 MB conflict, 4.3 MB water_*, smaller for the others). Plus a `forest_change.README.md` pointing at the GFW XYZ URL.

- **Schema validation, legal_ownership** — all 20 entries pass: required-fields present, enums (foreign_ownership.allowed, regulatory_direction, multi_household_residence_as_of_right, residency_required_for_purchase) within allowed values, every `source_url` is a real URL, zero em-dashes, zero HTML entities.

- **Cross-doc consistency** — `legal_ownership` referenced in all four V1 docs (criteria-inventory, data-source-inventory, v1-data-priorities, coverage-report) plus the metadata sidecar.

## What STILL needs a human eyeball (per Spec: "at least one human eyeballs the dataset rendered in QGIS against known reality")

This is the Spec's "sanity check" gate. Mechanical loader checks don't substitute for it. Each Tier-1 layer should be opened from `data/v1-exports/` in QGIS and visually checked:

| layer | what to confirm against known reality |
|-------|---------------------------------------|
| water_stress.gpkg | High stress in Mediterranean basins, Central Asia analogue, US Southwest where bbox extends; low in NW Europe, Pacific NW |
| water_depletion.gpkg | Aquifer-drawdown signal differs from stress (e.g. Ogallala area, North China analogue if visible) |
| conflict.gpkg | Ukraine dominates 2022+ EU events; Mexico/Central America signal in NA bbox (Oaxaca region in particular, by design) |
| regen_network.gpkg | Sparse, recognizable clusters (Cévennes, Cascadia, Asheville area). Honest undercount vs full GEN directory |
| legal_ownership.gpkg | 20 region centroids in correct countries; properties readable in QGIS attribute table |
| forest_change (XYZ) | GFW tile loss pulses visible in Amazon, Borneo, Russia boreal (when zoomed out beyond EU/NA bbox) |

## Verification notes
- **Tier-2 criteria are not verified here** because they are not ingested layers. Their per-region curated values exist in `prototype/data/regions.js` and are validated against their dossier sources at the per-cell level, but this is a different verification regime than the Spec's "ingested-layer QGIS sanity check."
- **conflict NA bbox** intentionally includes Central America (captures the Oaxaca signal). Documented in `conflict.metadata.yaml`.
- **regen_network** undercount vs the full GEN directory (300+ sites) is a real coverage limitation, surfaced wherever the layer is used. Not a verification failure; it is the documented limitation.

## Anomalies recorded (none yet)
*(Add anomalies here on QGIS eyeball; empty so far.)*
