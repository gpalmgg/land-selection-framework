# Track 4 — New Criteria Candidates (Verified Public Datasets)

Research brief for the Land Selection Framework bioregioning tool.
Scope: candidate criteria backed by a real, free, mappable public dataset. Regions span Europe + North America.
Discipline constraint: native units, no composite scoring, source/vintage/license visible per value; map layers only from verified public tile/WMS/WMTS or ArcGIS-REST services the browser can consume.

Verification date: 2026-07-03. Every endpoint below was surfaced via web search; "Tile-availability" flags whether the service exposes something a MapLibre/Leaflet client can consume (XYZ, WMS, WMTS, or ArcGIS-REST export) vs. download-only.

**Legend for the tile-availability flag:**
- **DIRECT** — standard OGC WMS/WMTS or XYZ, browser-consumable now.
- **ARCGIS-REST** — ArcGIS MapServer/ImageServer; consumable via `export`/`exportImage` REST as a raster source, and most also expose an OGC WMS interface. Slightly more wiring than XYZ.
- **DOWNLOAD-ONLY** — GeoTIFF/zip only; would require self-hosting/processing to map. Not shippable under current discipline without a processing step.

---

## 1. Biodiversity intactness / ecological integrity

Four sub-candidates were checked. They differ sharply on mappability.

### 1a. Biodiversity Intactness Index (BII) — NHM/PREDICTS
- **Measures:** modelled % of original species abundance remaining relative to an intact baseline (0–1). The single best "how wrecked is the ecological community here" number.
- **Source/provider:** Natural History Museum London (PREDICTS project). v2.1.1 "Open Access, Limited Release."
- **Resolution / native unit:** ~10 km global raster (approx at equator).
- **Vintage:** rasters for 2000, 2005, 2010, 2015, 2020 (v2 series covers 2000–2023 in some releases).
- **License:** **CC-BY-NC-SA** (non-commercial). Attribution + share-alike + non-commercial. Acceptable for this non-commercial tool but flag the NC clause explicitly.
- **URL:** https://data.nhm.ac.uk/dataset/bii-developed-by-nhm-v2-1-1-limited-release ; overview https://www.nhm.ac.uk/our-science/services/data/biodiversity-intactness-index.html
- **Tile-availability:** **DOWNLOAD-ONLY** (zip of GeoTIFFs). No official WMS/tile service. The old Biodiversity Trends Explorer is dead. Mirrored on Google Earth Engine community catalog (https://gee-community-catalog.org/projects/bii/) — useful for processing, not for direct browser tiles. To ship it you'd self-tile the 10 km raster. NC license also complicates a public tool.

### 1b. RESOLVE Ecoregions 2017
- **Measures:** which of 846 terrestrial ecoregions (14 biomes, 8 realms) a place belongs to — a naming/identity layer, not a condition score. Directly relevant to "belong to a place": it tells you the ecological unit you'd be joining.
- **Source/provider:** RESOLVE; served by UNEP-WCMC and Esri Living Atlas.
- **Resolution / native unit:** vector polygons (ecoregion boundaries).
- **Vintage:** 2017.
- **License:** CC-BY 4.0 (RESOLVE/Dinerstein et al.).
- **URL:** https://data-gis.unep-wcmc.org/server/rest/services/Bio-geographicalRegions/Resolve_Ecoregions/MapServer ; hub https://hub.arcgis.com/datasets/37ea320eebb647c6838c23f72abae5ef
- **Tile-availability:** **ARCGIS-REST + DIRECT.** UNEP-WCMC MapServer/FeatureServer exposes GeoServices, **WMS and WFS**, plus GeoJSON export. Genuinely mappable now. Best treated as a categorical/context overlay (name the ecoregion in the region drawer), not a scored surface — fits discipline cleanly.

### 1c. Forest Landscape Integrity Index (FLII)
- **Measures:** continuous 0–10 index of forest condition by degree of human modification / lost connectivity. Sharper "intactness" signal than BII for forested regions, and served as tiles.
- **Source/provider:** Grantham et al. 2020 (forestlandscapeintegrity.com); mirrored on Esri/ArcGIS Hub.
- **Resolution / native unit:** ~300 m raster.
- **Vintage:** 2019 (published 2020).
- **License:** CC-BY 4.0.
- **URL:** https://hub.arcgis.com/datasets/3e5820bb80b54b83b9e52f310b461d3a ; source https://www.forestlandscapeintegrity.com/
- **Tile-availability:** **ARCGIS-REST** (ImageServer on ArcGIS Hub — consumable via `exportImage`). Confirmed hosted as a mappable service. Only covers forested land (NoData elsewhere), so it reads as a forest-specific overlay, not universal.

### 1d. Key Biodiversity Areas / Half-Earth
- **KBAs:** authoritative, but the KBA polygons carry **use restrictions** and require registration/agreement for redistribution — not cleanly open for a public map. Flag as **restricted**, deprioritize.
- **Half-Earth (E.O. Wilson Foundation):** map viewer exists but underlying priority layers are not a clean CC-licensed tile service. Deprioritize.

**Section verdict:** RESOLVE Ecoregions (identity/context, cleanest license + WMS) and FLII (condition, ArcGIS-REST) are the two shippable ones. BII is the most decision-relevant conceptually but is download-only + NC-licensed.

---

## 2. Wind & micro-hydro energy potential

### 2a. Global Wind Atlas (GWA 3/4) — DTU + World Bank
- **Measures:** mean wind speed and wind power density at 10/50/100/150/200 m. Core off-grid-viability input for a 50–100 yr settlement.
- **Source/provider:** DTU Wind + World Bank Group.
- **Resolution / native unit:** 250 m raster (downscaled from ERA5 2008–2017 via WRF→WAsP).
- **Vintage:** GWA v3 (2019, ERA5 2008–2017); GWA 4.0 current app.
- **License:** CC-BY 4.0 (DTU/World Bank).
- **URL:** app https://globalwindatlas.info/ ; GIS files https://globalwindatlas.info/download/gis-files ; World Bank catalog https://datacatalog.worldbank.org/search/dataset/0038957/Global-Wind-Atlas ; DTU Figshare v3 https://data.dtu.dk/articles/dataset/Global_Wind_Atlas_v3/9420803
- **Tile-availability:** **PARTIAL / effectively DOWNLOAD-ONLY for standard clients.** GWA does **not** run a conventional GeoServer WMS. Its web app serves pre-processed raster tiles for low zoom + on-the-fly tiles from Cloud-Optimized GeoTIFFs via AWS Lambda (see nazka-mapps teardown: https://medium.com/nazka-mapps/looking-under-the-hood-of-the-global-wind-atlas-5cffa5783a38). There's an EMD "Global Atlas Services" API (https://help.emd.dk/mediawiki/index.php/EMD-API_-_Global_Atlas_Services) but it's point-query/commercial-leaning, not open tiles. Cleanest path to ship: download the CC-BY COG (mean wind speed 100 m) and self-tile, or point a COG-aware client at the public COG. Flag as "mappable with a processing step," not plug-and-play WMS.

### 2b. Micro-hydro / run-of-river potential
- **Measures:** small-scale run-of-river hydropower potential.
- **Findings:** No single authoritative, free, **mappable-as-tiles** global layer exists. A ~90 m global run-of-river potential map has been published (academic, ScienceDirect) but is paper-bound / not an open tile service. Regional atlases exist (HYPOSO map viewer — Africa/Latin America only, not our regions; energydata.info hosts scattered national point datasets).
- **License/URL:** fragmented; energydata.info https://energydata.info/dataset?vocab_topics=Hydropower
- **Tile-availability:** **NONE clean for Europe/NA.** Do not ship. If micro-hydro matters, derive a proxy from stream order + head + discharge yourself (out of scope for a public-tile criterion).

**Section verdict:** Wind is decision-relevant and CC-BY but needs a self-tiling step (no OGC WMS). Micro-hydro has no shippable public tile layer — drop it.

---

## 3. Aridity & Köppen-Geiger climate class

### 3a. Global Aridity Index v3 (CGIAR-CSI)
- **Measures:** Aridity Index (P/PET) — hyper-arid → humid classification. Directly water-future relevant; complements the existing water-stress layer with a *climatic* (not withdrawal-based) signal.
- **Source/provider:** CGIAR-CSI (Zomer et al. 2022, Scientific Data).
- **Resolution / native unit:** 30 arc-sec (~1 km) global raster; baseline period 1970–2000.
- **Vintage:** v3, published 2022.
- **License:** **CC-BY 4.0.** Clean.
- **URL:** figshare DOI 10.6084/m9.figshare.7504448 ; https://www.global-ai-pet.org/ ; paper https://www.nature.com/articles/s41597-022-01493-1
- **Tile-availability:** **DOWNLOAD-ONLY** (GeoTIFF on figshare). No official WMS. Self-tiling required. Static, well-behaved single-band raster — easy to process into XYZ once, then it's Portable-ish content.

### 3b. Köppen-Geiger 1 km (Beck et al.)
- **Measures:** categorical climate class (present + future under SSP scenarios). High "belong to a place" legibility — people understand "Csa Mediterranean" intuitively; future maps show class drift over the 50–100 yr horizon, which is exactly this tool's timescale.
- **Source/provider:** Beck et al. 2018 (Scientific Data) + Beck et al. 2023 v2 (constrained CMIP6, 1901–2099).
- **Resolution / native unit:** 1 km GeoTIFF, 8-bit categorical.
- **Vintage:** 2018 (present 1980–2016 + future 2071–2100); v2 2023 (historical periods + 2041–2070 & 2071–2099 across 7 SSPs).
- **License:** free for use, attribution requested (gloh2o.org terms; effectively open — confirm exact wording on the page before shipping).
- **URL:** https://www.gloh2o.org/koppen/ ; figshare https://figshare.com/articles/dataset/6396959 ; v2 paper https://www.nature.com/articles/s41597-023-02549-6
- **Tile-availability:** **DOWNLOAD-ONLY** (GeoTIFF). No official WMS. Categorical → self-tile with a fixed color legend. The **future-scenario** version is the standout differentiator for this project's timescale.

**Section verdict:** Both are download-only but both are single clean rasters that tile once and stay static (no update treadmill). Köppen present+future is the more distinctive add given the 50–100 yr framing; Aridity has the cleaner license.

---

## 4. Wildfire risk

### 4a. USFS Wildfire Risk to Communities (US only)
- **Measures:** burn probability, wildfire hazard potential, risk to potential structures, exposure type. The definitive US wildfire layer.
- **Source/provider:** USDA Forest Service, Rocky Mountain Research Station (FSim). Directed by Congress (2018 Appropriations Act).
- **Resolution / native unit:** 270 m raster (Wildfire Hazard Potential); risk products at similar scale.
- **Vintage:** 3rd Edition (2023 data), service updated Feb 2024.
- **License:** **US federal — public domain** (no copyright). Cleanest possible.
- **URL (verified REST):**
  - Probabilistic Wildfire Risk MapServer: https://apps.fs.usda.gov/arcx/rest/services/RDW_Wildfire/ProbabilisticWildfireRisk/MapServer
  - Wildfire Hazard Potential 2023 MapServer: https://apps.fs.usda.gov/arcx/rest/services/RDW_Wildfire/RMRS_WildfireHazardPotential_2023/MapServer
  - Image services on https://data-usfs.hub.arcgis.com (burn probability, risk to potential structures, exposure type)
- **Tile-availability:** **ARCGIS-REST — mappable now.** MapServer `export` + ImageServer `exportImage` consumable as a dynamic raster source. Coverage: **CONUS only** (plus AK/HI in some products) — nothing for Europe or Mexico. So it's a US-only overlay.

### 4b. Copernicus EFFIS — Fire Danger Forecast (Europe + MENA)
- **Measures:** meteorological fire danger (Canadian FWI), today + up to ~6–10 day forecast; plus MODIS burnt-area polygons (historical fire footprint).
- **Source/provider:** EFFIS, part of Copernicus Emergency Management Service (JRC).
- **Resolution / native unit:** ECMWF-driven FWI grid (coarse, ~8–16 km meteorological); burnt-area as vector polygons.
- **Vintage:** operational/daily (forecast) + rolling burnt-area archive.
- **License:** EFFIS data license — free to use with attribution/terms; **confirm exact terms** at https://forest-fire.emergency.copernicus.eu/about-effis/data-license before shipping.
- **URL (verified WMS):** WMS server `https://maps.effis.emergency.copernicus.eu/gwis` (also `/effis`); layers include burnt-area polygons (e.g. `modis.ba.poly`) and land-cover context. Data & services page: https://forest-fire.emergency.copernicus.eu/applications/data-and-services
- **Tile-availability:** **DIRECT (WMS).** Standard OGC WMS, browser-consumable. Caveat: the *forecast* danger layer is time-varying (daily) — better to ship a **static "fire regime" signal** (MODIS burnt-area density) than a forecast that dates instantly. Coverage Europe/MENA; nothing for NA.

### 4c. Global single-layer wildfire
- No single authoritative free global wildfire-risk tile service spanning all regions. You'd stitch USFS (US) + EFFIS (EU). Mexico has no clean equivalent public tile service found. Flag the coverage gap.

**Section verdict:** Wildfire is highly decision-relevant and *both* major regions have real mappable services (USFS ARCGIS-REST, EFFIS WMS) — but they're **two separate regional layers with a Mexico gap**, and the honest version ships fire-history/hazard, not daily forecast.

---

## 5. Air-temperature climatology & growing-degree-days / frost-free season

- **Measures:** growing-season length, GDD, frost-free days — direct food-sovereignty / what-can-I-grow signal. Currently a named honest-gap on the site (no clean public tiles for air-temp climatology).
- **Best sources:**
  - **CHELSA v2.1 / BIOCLIM+** (WSL Switzerland): includes `gdd` (growing degree days), `fcf` (frost change frequency), growing-season indices, at 30 arc-sec (~1 km), 1980–2018. License CC-BY (EnviDat). URL https://www.chelsa-climate.org/ ; BIOCLIM+ https://www.envidat.ch/dataset/bioclim_plus
  - **WorldClim v2.1** bioclim (30 arc-sec) — derived GDD/season via bioclim vars; CC-BY-SA 4.0 (non-standard, share-alike). https://www.worldclim.org/
  - **TerraClimate** (monthly, ~4 km) — good for deriving frost-free season; public domain-ish. http://www.climatologylab.org/terraclimate.html
- **Vintage:** CHELSA 1980–2018; WorldClim 1970–2000.
- **Tile-availability:** **DOWNLOAD-ONLY** across all three. CHELSA/WorldClim/TerraClimate serve GeoTIFF/NetCDF, **no official WMS**. To fill this gap you must download (CHELSA `gdd` is the most directly relevant single variable), tile once, ship static. This is a real content-processing task, not a wiring task — but CHELSA `gdd` is the single highest-value download to close the existing honest-gap.

**Section verdict:** Closes a *named existing gap* and is arguably the most useful new *agronomic* criterion, but requires self-tiling a CHELSA GeoTIFF. No plug-and-play tile service exists. Decision-relevance high, wiring cost medium.

---

## 6. Soil quality beyond carbon

### 6a. SoilGrids 2.0 (ISRIC) — additional properties
- **Measures:** pH (H2O), sand/silt/clay texture, CEC, bulk density, coarse fragments, total nitrogen, depth-to-bedrock — the "can this soil actually grow food / build with" layer beyond the carbon the site already shows.
- **Source/provider:** ISRIC — World Soil Information.
- **Resolution / native unit:** 250 m raster, six standard depth intervals (0–5, 5–15 … cm).
- **Vintage:** SoilGrids 2.0 (2020–2021 release).
- **License:** **CC-BY 4.0.** Clean.
- **URL (verified WMS/WCS):** https://maps.isric.org — per-property WMS, e.g. pH: `https://maps.isric.org/mapserv?map=/map/phh2o.map` ; WCS docs https://docs.isric.org/globaldata/soilgrids/wcs.html ; QGIS/ArcMap WMS guide https://docs.isric.org/globaldata/soilgrids/wms_from_qgis_arcmap.html
- **Tile-availability:** **DIRECT (WMS).** Standard MapServer WMS per property, browser-consumable. Same provider family the site likely already uses for soil carbon → lowest marginal integration cost. pH and texture (clay %) are the two highest-value new properties. Note ISRIC WMS can be slow (like the dynamic-WMS layers already flagged in the site's soil/precipitation layers) — expect the same paint latency.

### 6b. National soil surveys (higher fidelity, patchy coverage)
- **USDA gNATSGO/SSURGO** (US): very high resolution, authoritative. Public domain. Served via USDA/Esri ArcGIS REST (Soil Data Access + Web Soil Survey ImageServer). US-only.
- **ESDAC** (European Soil Data Centre, JRC): rich, but many products are **request/registration-gated** and not cleanly open WMS — flag as restricted.
- **Tile-availability:** gNATSGO ARCGIS-REST (US-only); ESDAC largely download/registration. For a multi-region tool, SoilGrids' global CC-BY WMS is the pragmatic choice; national surveys are a per-region upgrade, not a base layer.

**Section verdict:** SoilGrids 2.0 pH + texture over WMS is the **single cleanest new criterion** — global, CC-BY, standard WMS, same provider as existing soil carbon, directly decision-relevant.

---

## 7. Groundwater / aquifer stress & recharge

- **Measures:** groundwater table decline / groundwater stress — critical for 50–100 yr water security, and distinct from surface water-stress the site already shows.
- **Best source: WRI Aqueduct 4.0** — includes **Groundwater Table Decline** and Water Stress/Depletion indicators.
  - **Provider:** World Resources Institute (PCR-GLOBWB 2 hydrology).
  - **Native unit:** HydroSHEDS v1 **level-6 basin polygons** (union of basins/provinces/aquifers) — categorical risk classes, not a continuous raster. Native-unit + no-scoring friendly.
  - **Vintage:** Aqueduct 4.0 (2023).
  - **License:** **CC-BY 4.0.**
  - **URL:** https://www.wri.org/data/aqueduct-water-risk-atlas ; data dictionary https://github.com/wri/Aqueduct40/blob/master/data_dictionary_water-risk-atlas.md ; also in Esri Living Atlas.
  - **Tile-availability:** **ARCGIS-REST (Living Atlas) + DOWNLOAD (GeoPackage).** WRI itself distributes GeoPackage/GIS files (download); the Esri Living Atlas hosting exposes a FeatureServer/MapServer consumable via ArcGIS REST. If the site already uses Aqueduct for surface water-stress (per project notes it processed Aqueduct extracts), **adding the Groundwater Table Decline field from the same dataset is near-zero marginal cost** — same geometries, different attribute.
- **GRACE-based recharge:** NASA/JPL GRACE groundwater storage anomaly exists (GLDAS/GRACE-DA) but is coarse (~0.25–1°, ~25–100 km), better as a trend signal than a place-selection layer; served via NASA GES DISC (download/OPeNDAP), no clean public tile service. Deprioritize vs. Aqueduct.
- **National aquifer maps:** exist per-country (USGS, BGS, BGR) but heterogeneous — not a unified layer.

**Section verdict:** Aqueduct 4.0 Groundwater Table Decline is the pragmatic pick — CC-BY, basin polygons, and (critically) likely reuses geometry/pipeline the site already has for surface water-stress. Highest decision-relevance-per-integration-cost in the whole brief *if* Aqueduct is already wired.

---

## 8. Ranked shortlist — strongest additions

Ranked on the three-way test: **decision-relevance × genuinely mappable public tiles × clean license.** Bonus weight for low marginal integration cost (reuses existing wiring) and for closing a *named* existing gap.

### #1 — SoilGrids 2.0 pH + texture (Section 6a)
Global, 250 m, **CC-BY 4.0**, **standard WMS** at maps.isric.org, same provider family as the existing soil-carbon layer → lowest wiring cost of any true-new criterion. Soil beyond carbon is core to "can this land actually feed and house a community." Only caveat: ISRIC dynamic-WMS paint latency (already a known pattern on the site). **Ship first.**

### #2 — Aqueduct 4.0 Groundwater Table Decline (Section 7)
**CC-BY 4.0**, basin-polygon native unit (no-scoring-friendly), and almost certainly reuses the Aqueduct geometry/pipeline the project already processed for surface water-stress → adding an attribute, not a new integration. Groundwater security over 50–100 yr is exactly this tool's timescale and is *distinct* from the surface-water signal already shown. **Ship second — verify current Aqueduct wiring first.**

### #3 — Wildfire (USFS ARCGIS-REST + EFFIS WMS) (Section 4)
Both target regions have **real, mappable, public** services (USFS public-domain MapServer/ImageServer; EFFIS OGC WMS). High and rising decision-relevance for a "flourish over a century" frame. Costs: **two regional layers + a Mexico gap**, and honesty demands shipping fire-history/hazard rather than daily forecast. Strong but not clean-single-layer. **Ship third, as a paired regional overlay with an explicit coverage caveat.**

### #4 — Köppen-Geiger present + **future** climate class (Section 3b)
Download-only (self-tile once, then static — no update treadmill), attribution-only license. Wins its slot on **distinctiveness**: the future-scenario maps show climate-class *drift* across 2041–2099, which speaks directly to the 50–100 yr belonging horizon better than any other candidate. Categorical + legible + honest about uncertainty (ships with confidence maps). **Ship fourth — highest "differentiator" value, medium wiring cost.**

### Honorable mentions / deliberate cuts
- **RESOLVE Ecoregions (WMS, CC-BY)** — nearly made the list; cheap, clean, mappable. Cut only because it's identity/context rather than a decision *criterion*. Good low-cost add to the region drawer regardless.
- **CHELSA growing-degree-days** — highest *agronomic* value and closes a **named existing gap**, but download-only + real processing task. Strong #5; promote if the food-sovereignty angle gets priority.
- **Global Wind Atlas** — decision-relevant, CC-BY, but no OGC WMS (COG + Lambda tiling) → needs self-tiling; more wiring than its slot earns right now.
- **BII (NHM)** — most conceptually on-theme for a reciprocity/ecological-integrity framing, but **CC-BY-NC-SA + download-only** kills it for a plug-and-play public map. Revisit only if you self-host and the NC clause is acceptable.
- **Cut entirely:** micro-hydro (no public tile layer for our regions), KBA/Half-Earth (use-restricted), GRACE recharge (too coarse, no tiles).

---

## Sources
- BII (NHM): https://www.nhm.ac.uk/our-science/services/data/biodiversity-intactness-index.html · https://data.nhm.ac.uk/dataset/bii-developed-by-nhm-v2-1-1-limited-release · https://gee-community-catalog.org/projects/bii/
- RESOLVE Ecoregions 2017: https://data-gis.unep-wcmc.org/server/rest/services/Bio-geographicalRegions/Resolve_Ecoregions/MapServer · https://hub.arcgis.com/datasets/37ea320eebb647c6838c23f72abae5ef
- Forest Landscape Integrity Index: https://www.forestlandscapeintegrity.com/ · https://hub.arcgis.com/datasets/3e5820bb80b54b83b9e52f310b461d3a
- Global Wind Atlas: https://globalwindatlas.info/ · https://globalwindatlas.info/download/gis-files · https://datacatalog.worldbank.org/search/dataset/0038957/Global-Wind-Atlas · https://data.dtu.dk/articles/dataset/Global_Wind_Atlas_v3/9420803 · https://medium.com/nazka-mapps/looking-under-the-hood-of-the-global-wind-atlas-5cffa5783a38
- Micro-hydro: https://energydata.info/dataset?vocab_topics=Hydropower
- Global Aridity Index v3: https://www.nature.com/articles/s41597-022-01493-1 · https://www.global-ai-pet.org/ · figshare DOI 10.6084/m9.figshare.7504448
- Köppen-Geiger 1 km: https://www.gloh2o.org/koppen/ · https://www.nature.com/articles/s41597-023-02549-6 · https://figshare.com/articles/dataset/6396959
- USFS Wildfire Risk to Communities: https://apps.fs.usda.gov/arcx/rest/services/RDW_Wildfire/ProbabilisticWildfireRisk/MapServer · https://apps.fs.usda.gov/arcx/rest/services/RDW_Wildfire/RMRS_WildfireHazardPotential_2023/MapServer · https://data-usfs.hub.arcgis.com
- EFFIS: https://forest-fire.emergency.copernicus.eu/applications/data-and-services · https://maps.effis.emergency.copernicus.eu/gwis · https://forest-fire.emergency.copernicus.eu/about-effis/data-license
- CHELSA / WorldClim / TerraClimate: https://www.chelsa-climate.org/ · https://www.envidat.ch/dataset/bioclim_plus · https://www.worldclim.org/ · http://www.climatologylab.org/terraclimate.html
- SoilGrids 2.0: https://soilgrids.org/ · https://maps.isric.org · https://docs.isric.org/globaldata/soilgrids/wcs.html · https://docs.isric.org/globaldata/soilgrids/wms_from_qgis_arcmap.html
- WRI Aqueduct 4.0: https://www.wri.org/data/aqueduct-water-risk-atlas · https://github.com/wri/Aqueduct40/blob/master/data_dictionary_water-risk-atlas.md
