# V1 layer automated sanity report

**Generated:** 2026-06-03

> **CAVEAT:** this is automated structural sanity, NOT a replacement for QGIS visual eyeball. It catches gross errors (typos, missing regions, wildly-out-of-range values) but NOT positional drift like 'this polygon is 30 km east of where it should be'.

## Top-line verdict: **CLEAN**

All 12 layers passed automated checks.

Regions parsed from `regions.js`: **20**
Continents: europe, north-america
GeoPackages dir: `/Users/gustafpalm/Projects/land-selection-framework/prototype/data/v1-exports`
GeoJSON dir: `/Users/gustafpalm/Projects/land-selection-framework/prototype/data/processed`

## Per-layer results
### water_stress (areal)
- gpkg: `water_stress.gpkg` — 3034 features
- OK — feature count 3034 within expected band [2500,3500]
- bbox: (-126.00, 14.00) to (40.00, 71.18) — OK
- geojson `water-stress.geojson` — 995 features
- geojson `water-stress-na.geojson` — 2039 features
### water_depletion (areal)
- gpkg: `water_depletion.gpkg` — 3034 features
- OK — feature count 3034 within expected band [2500,3500]
- bbox: (-126.00, 14.00) to (40.00, 71.18) — OK
- geojson `water-depletion.geojson` — 995 features
- geojson `water-depletion-na.geojson` — 2039 features
### forest_change (tile-served)
- OK — forest_change has README; layer is XYZ-tile-served (Hansen GFC v1.11) — no local file to validate
### conflict (presence)
- gpkg: `conflict.gpkg` — 30879 features
- OK — feature count 30879 within expected band [20000,40000]
- bbox: (-117.30, 14.01) to (39.99, 59.93) — OK
- longitude distribution: EU-side (>-15)=14546, NA-side (<-50)=16333, mid-Atlantic=0
- OK — conflict has both continents represented
- geojson `conflict.geojson` — 14546 features
- geojson `conflict-na.geojson` — 16333 features
### regen_network (presence)
- gpkg: `regen_network.gpkg` — 106 features
- OK — feature count 106 within expected band [50,300]
- bbox: (-123.61, 18.52) to (15.83, 57.65) — OK
- longitude distribution: EU-side (>-15)=30, NA-side (<-50)=76, mid-Atlantic=0
- OK — regen_network has both continents represented
- geojson `ecovillages.geojson` — 30 features
- geojson `ecovillages-na.geojson` — 76 features
### legal_ownership (per-jurisdiction)
- gpkg: `legal_ownership.gpkg` — 20 features
- OK — feature count is 20
- bbox: (-123.00, 17.10) to (25.00, 58.60) — OK
- OK — region_ids exactly match the 20 regions
- OK — per-region coordinates align with regions.js (<=2 deg)
- OK — key fields fully populated
### land_cost (per-jurisdiction)
- gpkg: `land_cost.gpkg` — 20 features
- OK — feature count is 20
- bbox: (-123.00, 17.10) to (25.00, 58.60) — OK
- OK — region_ids exactly match the 20 regions
- OK — per-region coordinates align with regions.js (<=2 deg)
- OK — key fields fully populated
- OK — `price_per_ha_low` all in [0,5000000] (min=1235.00, max=47100.00)
- OK — `price_per_ha_high` all in [0,5000000] (min=4120.00, max=1100000.00)
### hospital_proximity (per-jurisdiction)
- gpkg: `hospital_proximity.gpkg` — 20 features
- OK — feature count is 20
- bbox: (-123.00, 17.10) to (25.00, 58.60) — OK
- OK — region_ids exactly match the 20 regions
- OK — per-region coordinates align with regions.js (<=2 deg)
- OK — key fields fully populated
- OK — `nearest_hospital_km` all in [0,500] (min=1.49, max=35.32)
- OK — `hospitals_within_50km` all in [0,10000] (min=1.00, max=75.00)
- OK — `hospitals_within_100km` all in [0,10000] (min=6.00, max=165.00)
- OK — continent/longitude alignment OK
### demographic_trajectory (per-jurisdiction)
- gpkg: `demographic_trajectory.gpkg` — 20 features
- OK — feature count is 20
- bbox: (-123.00, 17.10) to (25.00, 58.60) — OK
- OK — region_ids exactly match the 20 regions
- OK — per-region coordinates align with regions.js (<=2 deg)
- OK — key fields fully populated
### soil_contamination (per-jurisdiction)
- gpkg: `soil_contamination.gpkg` — 20 features
- OK — feature count is 20
- bbox: (-123.00, 17.10) to (25.00, 58.60) — OK
- OK — region_ids exactly match the 20 regions
- OK — per-region coordinates align with regions.js (<=2 deg)
- OK — key fields fully populated
### water_source_control (per-jurisdiction)
- gpkg: `water_source_control.gpkg` — 20 features
- OK — feature count is 20
- bbox: (-123.00, 17.10) to (25.00, 58.60) — OK
- OK — region_ids exactly match the 20 regions
- OK — per-region coordinates align with regions.js (<=2 deg)
- OK — key fields fully populated
### climate_buffering (per-jurisdiction)
- gpkg: `climate_buffering.gpkg` — 20 features
- OK — feature count is 20
- bbox: (-123.00, 17.10) to (25.00, 58.60) — OK
- OK — region_ids exactly match the 20 regions
- OK — per-region coordinates align with regions.js (<=2 deg)
- OK — key fields fully populated
