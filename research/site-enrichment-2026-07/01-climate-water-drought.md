# Track 1 — Climate, Water & Drought Frontier (2024–2026)

**Research brief for the Land Selection Framework bioregioning tool.**
Compiled 2026-07-03. Horizon of interest: mid-century (2041–2060) and the 50–100 year settlement window.
Default scenario for cross-region comparability: **SSP2-4.5** (or its CMIP5 analogue RCP4.5 where national services haven't re-run on CMIP6).

**How to read this:** numbers are pulled from peer-reviewed papers, national climate services, or agency products. Where a figure is regional-average rather than pixel-specific, it's flagged. Speculation is flagged inline as `[SPECULATION]`. Every candidate dataset is tagged for **cost** (free/public vs. gated) and **serveability** (WMS / XYZ tiles / GeoTIFF-only) — the last is what determines whether the site can actually add it as a map layer.

---

## 1. Recent downscaled climate projections (2024–2026 literature)

Mid-century (roughly 2041–2060/2070), SSP2-4.5 unless noted. Reference baselines differ by source and are stated per row — do not subtract across baselines.

### Europe

**Alentejo (PT)** — Portugal's warmest region and the sharpest warming/drying signal in this set. National RNA2100 / APA projections and the CMIP6 deep-learning downscaling for Iberia (Baño-Medina et al., *GMD* 17, 229, 2024) put Iberia-wide SSP2-4.5 warming at **up to ~3.5 °C by mid-century** at the high end of the ensemble; interior-south (Alentejo) sits above the Iberian mean. Heat-related mortality work for Alentejo (Sci Total Environ / PMC11662523, 2024) uses a mean annual warming near **+3.3 °C by the 2040s** and summer max-temp increases of **+4.5 to +9.5 °C** across scenarios/models. Precipitation: annual decline with a strong summer-drying skew (see §5 for hot-day counts).
- Source: https://gmd.copernicus.org/articles/17/229/2024/ ; https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11662523/ ; RNA2100 WP2 https://rna2100.apambiente.pt/ (PDF too large to auto-extract — cite the portal).

**Galicia / Asturias (ES)** — Atlantic Spain, the wet NW. AEMET's downscaled EURO-CORDEX/CMIP6 projections (AdaptECCA viewer) provide SSP2-4.5 medium-term (2041–2070) fields; the regionalized numbers were not extractable from search snippets. **[GAP — pull exact Galicia/Asturias °C and % from the AdaptECCA viewer directly.]** Qualitative signal: milder warming than interior/Mediterranean Spain, but the "semi-arid climate becomes Spain's most common type by ~2050" framing is a *national* statement, not NW-specific.
- Source: https://predictia.es/en/projects/adaptecca-viewer.html ; https://climate.copernicus.eu/spain

**Cévennes / Languedoc — Occitanie (FR)** — Météo-France (DRIAS / TRACC). Regional mean annual temperature **+2.2 °C by 2050** vs. 1976–2005; summer (JJA) **+2.3 to +2.7 °C**, winter **+1.9 to +2.2 °C**. Extreme-heat days (>35 °C) rise from ~1/yr today to **~7.7 days/yr** regionally by 2050. Summers markedly drier. Note: the headline 2050 figure quoted by Météo-France is the **TRACC reference trajectory**, not strictly SSP2-4.5 — comparable in magnitude but flag the framework.
- Source: https://meteofrance.com/changement-climatique/quel-climat-futur-en-occitanie ; https://www.drias-climat.fr/

**West Cork / Connemara (IE)** — Met Éireann TRANSLATE (Frontiers in Climate, 2023) and EPA Climate Projections 2020. Mid-century (2041–2060) warming **+1.0 to +1.6 °C** vs. 1981–2000, largest in the east (so West Cork/Connemara on the milder end). Precipitation: significant annual/spring/**summer decline, summer −0 to −13 % under RCP4.5**; winter increase noted only under high-emission ensemble with low confidence. Net: a comparatively gentle mid-century signal — this is one of the more climate-stable regions in the set.
- Source: https://www.frontiersin.org/articles/10.3389/fclim.2023.1166828/full ; https://www.met.ie/epa-climate-projections-2020

**Pembrokeshire / West Wales (UK)** — UKCP18 is the authoritative national product (probabilistic + 12 km/2.2 km strands). **[GAP — not searched this round; pull UKCP18 mid-century RCP4.5/SSP2-4.5 for SW Wales from the UKCP User Interface.]** Expected pattern (regional analogue to Ireland): modest warming ~+1.2–1.7 °C, wetter winters, drier summers.
- Source: https://www.metoffice.gov.uk/research/approach/collaboration/ukcp

**Transylvania (RO)** — Romanian national scenarios / CMIP6 (World Bank CCKP). Under RCP4.5, near-future (2021–2050 vs. 1971–2000) shows heatwave frequency **+50–60 %** and duration **+30–50 %**, strongest in southern Romania — Transylvania (intra-Carpathian, higher elevation) is buffered relative to the southern lowlands. Heat-stress change >20 % nationwide except the Black Sea coast. Exact Transylvania-specific °C/% not isolated in sources — use CCKP for pixel values.
- Source: https://link.springer.com/article/10.1007/s00704-023-04412-5 ; https://climateknowledgeportal.worldbank.org/country/romania/climate-data-projections

**South Tirol (IT), Saxony-Anhalt (DE), rural Estonia (EE)** — **[GAP — not individually searched.]** Fastest path to numbers: WorldClim CMIP6 2041–2060 SSP245 GeoTIFFs (see §2, dataset A) sampled at each centroid, or the national services (CMCC/Provincia di Bolzano for South Tirol; DWD for Saxony-Anhalt; Estonian Environment Agency for EE). South Tirol's alpine setting means elevation-dependent warming amplification; Saxony-Anhalt sits in the dry central-German rain-shadow (Mitteldeutsches Trockengebiet) and is a drying-risk candidate; Estonia is a "warming-but-wetting, low-current-stress" northern case.

### North America

**Cascadia / Willamette (OR, USA)** — AdaptWest ClimateNA v7.x (CMIP6, downscaled to PRISM/WorldClim baselines) is the reference product; UW Climate Impacts Group PNW tool gives the 2050s (2040–2069) ensemble. West-of-Cascades signal: continued winter warming, **summer drying**, and above all a **snowpack → water-timing** problem (see §3). Use the AdaptWest 1-km grids for exact MAT/MAP deltas.
- Source: https://adaptwest.databasin.org/pages/adaptwest-climatena/ ; https://cig.uw.edu/resources/analysis-tools/pacific-northwest-climate-projection-tool/

**Vermont (USA)** — Vermont Climate Assessment 2021 (UVM) + NOAA State Climate Summary 2022. Warming trajectory **+5 to +9 °F (~+2.8 to +5 °C) by 2100** scenario-dependent; mid-century most-likely exceeds historical records. **Precipitation increases** (already +21 % since 1900), concentrated in winter/spring, with more falling as rain not snow and **rising extreme-precip/flood frequency**. Growing season lengthens 2–3 weeks by mid-century. Net: a *wetting*, flood-skewed trajectory — water-abundance is not the constraint; flood exposure is.
- Source: https://site.uvm.edu/vtclimateassessment/ ; https://statesummaries.ncics.org/chapter/vt/

**Southern Appalachians / Asheville (NC, USA)** — Downscaled projections (via ClimateCheck/First Street-class analyses over NCICS-region data): annual precip **~43.8″ → ~47.8″ by 2050** (increase), share of precip in heavy 2-day events **~40 % → ~45 %**. Days >89.3 °F rise from **~7/yr (1990) to ~45/yr by 2050**. The mountains function as a **climate refugium** (elevation buffering) but the 2024 Hurricane Helene flooding underscored the extreme-precip tail risk. Net: wetting + heat-days-up + acute flood tail.
- Source: https://climatecheck.com/northcarolina/asheville

**Driftless (WI, USA), Ozarks (AR, USA)** — **[GAP — not individually searched.]** Both sit in the US interior "wetter-annual, flashier-extremes, more summer heat-days" Midwest/Ozark pattern (NCA5, 2023). Fastest numbers: NCA5 regional chapters + ClimateNA/AdaptWest grids. Ozarks is the hotter/heat-day-exposed of the two (see §5); Driftless is a wetting + intense-rain-erosion case on its distinctive unglaciated terrain.

**Northern New Mexico / Taos (USA)** — NM Bureau of Geology Bulletin 164 + USGS. Statewide **+5 to +7 °F (~+2.8 to +3.9 °C) over ~50 years**; the defining signal is **snowpack loss and river decline** (see §3), not precip mean. This is the clearest *worsening* water case in the whole set.
- Source: https://geoinfo.nmt.edu/publications/monographs/bulletins/164/ ; https://www.usgs.gov/

**Nova Scotia / Cape Breton (CA)** — ClimateData.ca (ECCC, CMIP6 downscaled). Atlantic Canada is a **lower-warming** zone: national synthesis gives ≥+1.1 °C by 2050 across scenarios/seasons with Atlantic Canada + BC below the national mean. Precip up in most seasons, **summer −13 % under RCP4.5**. Coastal exposure (SLR + hurricanes, cf. Fiona 2022) is the live hazard, not water scarcity.
- Source: https://climatedata.ca/

**Kootenays / BC interior (CA), Québec Eastern Townships (CA)** — **[GAP — not individually searched.]** Both via ClimateData.ca. Kootenays: interior-mountain, snowpack-timing + **wildfire** the dominant signals (BC interior is the hottest wildfire frontier in Canada). Eastern Townships: southern-Québec analogue to Vermont — wetting, warming, extreme-precip up.

**Oaxaca highlands (MX)** — By 2050 Mexico warms **+2.0 to +4.0 °C** (central/north strongest); precip decline up to **−15 % in central Mexico**, drought intensity up nationwide. Maize yield modeled to fall **1,555 → 1,440 kg/ha by ~2055**; water demand **+~21.6 % by 2050 even on a low-carbon path**. Oaxaca's highland elevation buffers temperature somewhat, but rain-fed milpa systems are directly exposed to the drying + drought-intensity signal.
- Source: https://www.g20climaterisks.org/mexico/ ; https://en.wikipedia.org/wiki/Climate_change_in_Mexico

**Coverage note:** ≥8 regions with concrete numbers (Alentejo, Occitanie/Cévennes, West Cork/Ireland, Transylvania, Vermont, S. Appalachians, N. New Mexico, Willamette/Cascadia, Nova Scotia, Oaxaca). Named gaps: Galicia/Asturias, Pembrokeshire, South Tirol, Saxony-Anhalt, Estonia, Driftless, Ozarks, Kootenays, Eastern Townships — all fillable from WorldClim CMIP6 grids or the named national service.

---

## 2. Drought & aridity products (the site's current data-gap)

The site has **no real drought layer**. These are the authoritative, public, mappable options, ranked by how easily the site can consume them. **Tile/WMS availability is the decisive column.**

### A. WorldClim CMIP6 future climate — GeoTIFF grids (baseline for filling §1 gaps)
- **What:** downscaled monthly future T/precip, 9 GCMs × 4 SSPs, periods incl. **2041–2060**. Not a drought index per se, but the raw material to compute one.
- **Resolution:** 30 arc-sec (~1 km) up to 10 arc-min.
- **License:** free, CC BY 4.0-style, attribution.
- **Serveability:** **GeoTIFF only — no WMS/XYZ.** Would need local processing → self-hosted tiles.
- URL: https://www.worldclim.org/data/cmip6/cmip6_clim30s.html

### B. Global Aridity Index (Global-AI_PET_v3, Trabucco & Zomer 2022)
- **What:** aridity index (P/PET) + PET, the standard UNEP-definition aridity layer. Defines hyperarid→humid classes.
- **Resolution:** 30 arc-sec (~1 km); baseline 1970–2000.
- **License:** **free, CC BY 4.0.** DOI 10.6084/m9.figshare.7504448.
- **Serveability:** **GeoTIFF only — no WMS/XYZ.** Needs self-tiling. **Present-day only** (no built-in future).
- URL: https://www.nature.com/articles/s41597-022-01493-1 ; https://www.global-ai-pet.org/

### C. Köppen-Geiger present + future maps, 1 km (Beck et al. 2018; 2023 CMIP6 update)
- **What:** climate-classification shift. The 2023 update (Beck et al., constrained CMIP6) gives **1901–2099 at 1 km**, future periods **2041–2070** and **2071–2099** for **7 SSPs** — ideal for "your region's climate class in 2050" storytelling.
- **Resolution:** 1 km (~0.0083°).
- **License:** free (figshare), CC-BY.
- **Serveability:** **GeoTIFF only** (figshare zip, ~125 MB) — **no WMS/XYZ**; self-tile. Categorical raster → renders cleanly as tiles with the supplied legend.
- URL (2023 CMIP6): https://figshare.com/articles/dataset/21789074 ; original 2018: https://www.nature.com/articles/sdata2018214

### D. SPEI Global Drought Monitor (CSIC)
- **What:** Standardized Precipitation-Evapotranspiration Index — the reference meteorological-drought index, 1–48 month timescales.
- **Resolution:** 1° near-real-time monitor; **SPEIbase 0.5°** historical. Coarse — better as a regional indicator than a fine map layer.
- **License:** free (CSIC), CSV + gridded download.
- **Serveability:** interactive map at spei.csic.es/map/ but **no documented public WMS/XYZ**; US gridded SPEI (finer) is on Drought.gov as GeoTIFF + web-ready XYZ.
- URL: https://spei.csic.es/map/ ; US finer: https://www.drought.gov/data-maps-tools/us-gridded-standardized-precipitation-evapotranspiration-index-spei-nclimgriddaily

### E. Copernicus EDO/GDO — Combined Drought Indicator (Europe) ★ best drop-in for Europe
- **What:** operational CDI (SPI + soil-moisture + fAPAR anomaly) classing Watch/Warning/Alert. GDO = global twin (covers Oaxaca, US, Canada regions too).
- **Resolution:** ~5 km (1/24°), EPSG:4326; updated every 10 days, 2012–present.
- **License:** free, JRC, freely downloadable.
- **Serveability:** ★ **public WMS** — GetCapabilities live. **This is the one the site can wire directly.** Real-time monitor, not a 2050 projection.
- WMS: https://drought.emergency.copernicus.eu/api/wms?REQUEST=GetCapabilities&SERVICE=WMS&VERSION=1.1.1
- Portal: https://drought.emergency.copernicus.eu/ ; factsheet: https://drought.emergency.copernicus.eu/data/factsheets/factsheet_combinedDroughtIndicator_v4.pdf

### F. US Drought Monitor (UNL/NOAA/USDA) ★ best drop-in for the US
- **What:** the weekly authoritative US drought categorization (D0–D4).
- **Resolution:** vector polygons (not gridded), reprojected to WGS84.
- **License:** free, public.
- **Serveability:** ★ **public WMS** (WMS 1.0, EPSG:4326) + shapefile/KMZ/GeoJSON per week; North American Drought Monitor hub adds GeoServices/WMS/WFS covering **US + Canada + Mexico** (so Nova Scotia, Kootenays, Oaxaca get coverage via NADM).
- USDM GIS/WMS: https://droughtmonitor.unl.edu/DmData/GISData.aspx ; NADM: https://nadm-noaa.hub.arcgis.com/

**Recommendation for the site's drought layer:** ship **two real-time WMS layers now** — **EDO/GDO CDI** (Europe + global) and **US/NA Drought Monitor** (Americas). Both are free, standards-compliant WMS, no self-hosting. For the *50–100 yr projection* framing (which real-time monitors don't give), pair with the **Köppen-Geiger 2050 shift** map (dataset C, self-tiled) as the forward-looking layer. That combination is honest: "current drought state" (WMS) + "projected climate-class shift" (Köppen).

---

## 3. Water stress updates

### WRI Aqueduct 4.0 (2023, current version — no 5.0 as of mid-2026)
- **What:** 13 water-risk indicators; **future projections for 2030 / 2050 / 2080** on **CMIP6**, scenarios BAU **SSP3-7.0**, optimistic SSP1-2.6, pessimistic SSP5-8.5. Note: **Aqueduct's future set does NOT include SSP2-4.5** — its BAU is SSP3-7.0. Flag this when cross-referencing with §1's SSP2-4.5 climate numbers.
- **Resolution:** HydroSHEDS level-6 sub-basins (aggregable to province/country). Modeled from PCR-GLOBWB 2.
- **License:** free/public. **Serveability:** GeoJSON/shapefile + **available as ESRI Living Atlas layers and Google Earth Engine assets** (`WRI/Aqueduct_Water_Risk/V4/future_annual`) — so it can be served as tiles via GEE or Living Atlas, not a native WMS.
- Headline: **~60 % of world population** and **$70 trillion GDP (31 %)** exposed to high water stress by 2050 (up from 24 % of GDP in 2010).
- URL: https://www.wri.org/data/aqueduct-global-maps-40-data ; GEE: https://developers.google.com/earth-engine/datasets/catalog/WRI_Aqueduct_Water_Risk_V4_future_annual

### Basin-level signals for the regions' watersheds
- **Rio Grande (N. New Mexico / Taos):** the sharpest decline in the set. Statewide major-river **flow −16 % to −28 %** over ~50 yr; **−25 % groundwater recharge + streamflow by 2070**; peak snowmelt arriving earlier (USGS). Middle Rio Grande characterized as "dire." **Materially worsening.**
  - https://geoinfo.nmt.edu/publications/monographs/bulletins/164/ ; https://www.usgs.gov/news/state-news-release/future-peak-flow-along-rio-grande-may-arrive-early-due-climate-change
- **Willamette (Cascadia/OR):** snow accumulation **−25 %+ by ~2050**, **−65 % to −95 % snowpack by late century** (WW2100). Summer low-flow driven by >1200 m snow-dominated headwaters (<12 % of basin); **~15 % summer-flow decline per +1 °C**. Winter water abundant; **summer scarcity is the constraint.**
  - https://inr.oregonstate.edu/ww2100/key-findings
- **Sado/Guadiana (Alentejo):** Iberian Mediterranean basins — Aqueduct-class high/extremely-high baseline stress, worsening on the drying signal. **[GAP — pull the exact Aqueduct 2050 basin score for Sado + Guadiana.]**
- **French Broad (S. Appalachians/Asheville):** humid, precip-increasing — **not water-limited**; the risk is flood, not scarcity (Helene 2024).
- **Atlantic basins (Nova Scotia, Vermont, Eastern Townships):** wetting trajectory; scarcity not the constraint.

---

## 4. Wildfire & flood exposure (site gaps)

### Wildfire
**USFS Wildfire Risk to Communities (2nd ed., 2024) — US ★**
- **What:** burn probability, wildfire hazard potential, risk-to-structures. FSim simulator.
- **Resolution:** modeled at 270 m, upsampled to 30 m (LANDFIRE).
- **License:** free/public (US Forest Service).
- **Serveability:** ★ **ArcGIS Image Services / REST** (e.g. `apps.fs.usda.gov/.../RMRS_WRC_WildfireHazardPotential/ImageServer`) — directly tileable. Covers Cascadia, N. New Mexico, Ozarks, S. Appalachians, Vermont, Driftless.
- https://wildfirerisk.org/download/ ; https://data-usfs.hub.arcgis.com/

**Copernicus EFFIS / GWIS — Europe + global ★**
- **What:** fire danger (FWI), active fire, burnt area, and a pan-European **Wildfire Risk index** (danger × vulnerability: people/ecological/economic).
- **License:** free under license.
- **Serveability:** ★ **standard WMS** (multiple layers listed on EFFIS Data & Services). Covers Alentejo, Occitanie/Cévennes, Iberia, Transylvania; **GWIS** extends global (Oaxaca, N. America).
- https://forest-fire.emergency.copernicus.eu/applications/data-and-services ; https://gwis.jrc.ec.europa.eu/
- **Canada (Kootenays/BC, Nova Scotia):** use **CWFIS** (Canadian Wildland Fire Information System) — not searched this round, **[GAP]**, but it's the free national analogue with WMS.

**Relevance ranking (wildfire as a settlement constraint):** high & rising — Alentejo, Cévennes/Languedoc, Kootenays/BC interior, N. New Mexico, Cascadia (east-of-valley), Ozarks. Low — West Cork, Nova Scotia, Vermont, Eastern Townships, Estonia, Galicia is intermediate (Atlantic but heavy eucalyptus fuel load — real fire history).

### Flood (riverine + coastal)
**JRC/Copernicus River Flood Hazard (Europe + Global) ★**
- **What:** flood extent/depth by return period (10/20/50/100/200/500 yr).
- **Resolution:** **Europe 100 m** (Baugh et al./ESSD 2022); higher-res JRC variant at 3 arc-sec (30–75 m in Europe); global GloFAS maps also public.
- **License:** free/public (JRC Data Catalogue, EU Open Data Portal); GeoTIFF download. Operational GloFAS WMS is password-gated but the static hazard rasters are open.
- **Serveability:** GeoTIFF (self-tile); WMS partial/gated. Covers all European regions.
- https://data.jrc.ec.europa.eu/collection/id-0054 ; https://essd.copernicus.org/articles/14/1549/2022/

**Fathom Global Flood Map 3.0**
- **What:** fluvial/pluvial/coastal, defended + undefended, 5–1000 yr return, **with climate scenarios**. Powers First Street "Flood Factor."
- **Resolution:** 30 m global (FABDEM+); **~10 m for the US**.
- **License:** **commercial/gated** — API is paid; **exception:** free-of-charge non-commercial high-res country maps (incl. climate scenarios) for **16 countries via a World Bank agreement** (check whether any of the 20 regions' countries are on the list — **[VERIFY]**). Not a general drop-in.
- **Serveability:** API/tiles only under license. **Flag as gated.**
- https://www.fathom.global/product/global-flood-map/ ; https://datacatalog.worldbank.org/search/dataset/0065654/

**NOAA Sea Level Rise Viewer — US coasts ★**
- **What:** coastal inundation 0–10 ft above MHHW; depth, connectivity, flood-frequency.
- **Resolution:** DEM-based, tiles cached to zoom 16.
- **License:** free/public (NOAA Office for Coastal Management). **Covers all US coastal states except Alaska.**
- **Serveability:** ★ **ArcGIS MapServer / cached tiles** (`coast.noaa.gov/arcgis/rest/services/dc_slr/...`).
- **Coverage caveat:** US only — **does NOT cover Nova Scotia/Cape Breton (Canada)**. For NS coastal SLR use **CanCoast / ClimateData.ca** — **[GAP, not searched]**. Vermont/Eastern Townships/Driftless/Ozarks/Cascadia-inland are non-coastal → SLR irrelevant; NOAA SLR only matters here for coastal Cascadia (Willamette is inland-valley, low relevance).
- https://coast.noaa.gov/slr/ ; https://coast.noaa.gov/slrdata/

**Relevance ranking (flood as a settlement constraint):** Vermont + Eastern Townships (riverine, extreme-precip up — the defining hazard), S. Appalachians/Asheville (Helene-class riverine tail), Nova Scotia/Cape Breton (coastal + hurricane), Driftless (flash/erosion on steep unglaciated terrain). Low — Alentejo, N. New Mexico, interior Iberia (drought-dominated, not flood).

---

## 5. Heat / extreme-heat days (mid-century, hotter regions)

Threshold varies by source — stated per row. Not all use 35 °C; some use local percentile thresholds.

- **Alentejo (PT):** Portugal's hottest zone; current July 2026 events hit **41–44 °C** (IPMA). Mid-century summer max-temp **+4.5 to +9.5 °C** (model/scenario range); hot-day (>35 °C) counts rise steeply — RNA2100 WP2 has the exact indices. **[Pull exact >35 °C day count from RNA2100 WP2 PDF — not auto-extractable this round.]** Directionally the largest heat-day increase in the European set.
- **Occitanie / Cévennes-Languedoc (FR):** days >35 °C **~1 → ~7.7 days/yr by 2050** (Météo-France regional). Lowland Languedoc higher than the Cévennes uplands (elevation buffer).
- **Northern New Mexico / Taos (USA):** statewide **+5 to +7 °F** by ~2050; Taos's elevation (~2,100 m) buffers absolute heat vs. the Rio Grande lowlands, but the compounding heat + snowpack-loss + aridity signal is the real story (see §3).
- **Ozarks (AR, USA):** interior-South heat-day exposure among the highest in the North American set. **[GAP — pull NCA5 Southeast/Southern-Great-Plains heat-day projections + ClimateNA grids for exact >35 °C / >95 °F day counts.]**
- **Southern Appalachians / Asheville (NC, USA):** days **>89.3 °F: ~7/yr (1990) → ~45/yr by 2050.** Elevation makes this the *mildest* of the hot US regions — a genuine heat refugium relative to the surrounding Piedmont/Southeast lowlands.
- **Oaxaca highlands (MX):** national warming **+2 to +4 °C by 2050**; highland elevation buffers peak heat, but drought-intensity + rain-fed-crop exposure is the binding constraint, not raw heat-day counts.

**Product for a heat-days layer:** no clean public *projected-heat-day* WMS exists as a global drop-in. Options: (a) compute from WorldClim CMIP6 or NASA NEX-GDDP-CMIP6 daily (self-process → self-tile); (b) for the US, NCA5 / NOAA state-summary heat-day figures as tabular per-region context (like the site's existing curated values) rather than a map layer. **Honest gap — likely best handled as curated per-region numbers, not a tile layer.**

---

## 6. Regions gaining vs. losing climate/water viability on the 50–100 yr horizon

Synthesis. "Viability" here = the regenerative-settlement case over 50–100 yr, weighting **water security** heaviest, then heat/fire/flood tail risk.

### Materially WORSENING (water/heat/fire trajectory undercuts the settlement case)
1. **Northern New Mexico / Taos** — the clearest loss. River flow −16 to −28 %, recharge + streamflow −25 % by 2070, snowpack collapse, warming +5–7 °F, high wildfire. Aridification is structural, not cyclical. **A 50–100 yr regenerative bet here is a bet against the hydrology.**
2. **Alentejo** — strongest European warming/drying: +3.3 °C 2040s, summer max +4.5–9.5 °C, sharp precip decline, Sado/Guadiana high water stress, rising wildfire. Viable *only* with serious water-harvesting/drought-adapted design; the trajectory is against it.
3. **Oaxaca highlands** — drying (−15 % central-Mexico precip), drought-intensity up, water demand +21.6 % by 2050, rain-fed milpa directly exposed. Elevation buffers heat but not the water signal.
4. **Cévennes / Languedoc** — Mediterranean drying + hot-days ~8×, wildfire frontier. Cévennes uplands buffer heat vs. lowland Languedoc; still a drying/fire-worsening case.
5. **Kootenays / BC interior** — water less at risk than the SW US, but **wildfire is the dominant and worsening constraint** in Canada's hottest fire zone. `[Partly SPECULATION — flagged GAP on exact ClimateData.ca numbers.]`

### Roughly STABLE / mixed (modest change, manageable)
6. **West Cork / Connemara (IE)** — gentle warming (+1.0–1.6 °C), summer drying only −0–13 %, low fire/heat. One of the most climate-stable in the set. Constraint is wind/wet, not scarcity or heat.
7. **Galicia / Asturias (ES)** — Atlantic buffer; milder than interior Spain but real eucalyptus-driven fire history. **[Numbers gap.]**
8. **Transylvania (RO)** — intra-Carpathian elevation buffers the southern-Romania heat signal; a moderate case.
9. **Nova Scotia / Cape Breton (CA)** — low warming, wetter, water-secure; the live risk is **coastal SLR + hurricanes** (Fiona-class), not climate/water viability inland.
10. **South Tirol, Estonia, Saxony-Anhalt** — `[GAP]`. Estonia = low-current-stress northern warmer; Saxony-Anhalt = watch the central-German dry belt; South Tirol = alpine elevation-amplified warming but water-secure.

### Materially IMPROVING / relatively advantaged (the counterintuitive winners)
11. **Vermont** — *wetting* (+21 % precip since 1900, more to come), water-abundant, growing season +2–3 weeks. The catch: **flood/extreme-precip is the trade** — viability improves for water but demands flood-aware siting (valley floors out).
12. **Southern Appalachians / Asheville** — recognized **climate refugium**: elevation buffering, precip *increasing*, heat-days rising but from a low base (mildest of the hot US regions). Trade: acute flood tail (Helene 2024). Strong 50–100 yr case *if* sited above flood zones.
13. **Québec Eastern Townships** — southern-Québec analogue to Vermont: warming + wetting + longer growing season, water-secure. Same flood caveat. `[Numbers gap — ClimateData.ca.]`
14. **Cascadia / Willamette** — split verdict: **winter water abundant and increasing**, but **summer scarcity worsens** (snowpack −25%+ by 2050, −15% summer flow per +1 °C). Net viability depends entirely on summer water strategy + wildfire (east-of-valley). Valley-floor with winter storage = advantaged; snow-dependent = at risk.
15. **Driftless (WI)** — wetting-annual with flashier extreme rain on erosive unglaciated terrain; water-secure, heat moderate. Net mildly advantaged with erosion/flood-aware land management. `[Numbers gap.]`

**One-line synthesis:** the 50–100 yr water/climate axis splits the 20 regions cleanly — **the Mediterranean-and-Southwest arc (Alentejo, Cévennes/Languedoc, N. New Mexico, Oaxaca) is drying and losing viability; the humid-temperate Northeast arc (Vermont, Eastern Townships, S. Appalachians, Nova Scotia, Ireland, Driftless) is wetting and gaining it, trading scarcity risk for flood/extreme-precip risk.** Cascadia and the Kootenays are the swing cases where summer water and wildfire decide the outcome.

---

## Dataset shortlist for the site (what can actually be wired as a layer)

| Dataset | Domain | Cost | Tiles/WMS? | Drop-in? |
|---|---|---|---|---|
| **EDO/GDO Combined Drought Indicator** | drought, EU+global | Free | ★ **public WMS** | Yes — now |
| **US / North American Drought Monitor** | drought, Americas | Free | ★ **public WMS/WFS** | Yes — now |
| **EFFIS / GWIS wildfire** | fire, EU+global | Free | ★ **public WMS** | Yes — now |
| **USFS Wildfire Risk to Communities** | fire, US | Free | ★ **ArcGIS Image/REST** | Yes — now |
| **NOAA SLR Viewer** | coastal flood, US only | Free | ★ **cached ArcGIS tiles** | Yes (US coast only) |
| **Köppen-Geiger 2050/2070 (Beck 2023)** | climate-class shift | Free | GeoTIFF → self-tile | Yes, w/ processing |
| **WRI Aqueduct 4.0 future** | water stress 2050 | Free | GEE / Living Atlas | Yes via GEE tiles |
| **Global Aridity Index v3** | aridity (present) | Free | GeoTIFF → self-tile | Yes, w/ processing |
| **JRC river flood hazard** | riverine flood, EU/global | Free | GeoTIFF (WMS gated) | Partial |
| **WorldClim CMIP6 2041–60** | raw T/precip projections | Free | GeoTIFF → self-tile | Backfill only |
| **Fathom / First Street** | flood + climate | **Gated** | API (paid) | No (unless WB-free country) |
| **CanCoast / CWFIS (Canada)** | coastal/fire, Canada | Free | **[verify WMS — GAP]** | Likely |

**Immediate honest wins (free, standards WMS, no self-hosting):** EDO/GDO CDI, US/NADM Drought Monitor, EFFIS/GWIS wildfire, USFS Wildfire Risk, NOAA SLR (US coast). These five close four of the site's named gaps (drought, wildfire, coastal flood) with real, verifiable, public services.

---

## Named gaps to close in a follow-up pass
1. Exact SSP2-4.5 mid-century °C/% for **Galicia/Asturias, Pembrokeshire, South Tirol, Saxony-Anhalt, Estonia, Driftless, Ozarks, Kootenays, Eastern Townships** — via WorldClim CMIP6 grids or named national service.
2. **RNA2100 WP2 PDF** exact Alentejo >35 °C hot-day counts (file too large for auto-fetch — download + extract).
3. **Aqueduct 2050 basin scores** for Sado, Guadiana, French Broad, and each region's HydroBASIN.
4. **Canada:** confirm ClimateData.ca numbers for NS/Kootenays/Eastern Townships; confirm **CanCoast** (coastal) + **CWFIS** (fire) WMS endpoints.
5. **Fathom World Bank free-country list** — check whether PT/ES/FR/RO/IE/UK/DE/IT/EE/US/CA/MX qualify (mostly high-income → likely NOT free; verify).

## Sources
- Baño-Medina et al. 2024, *GMD* 17:229 (Iberia CMIP6 downscaling): https://gmd.copernicus.org/articles/17/229/2024/
- Alentejo heat-mortality (2024): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11662523/
- RNA2100 (APA Portugal): https://rna2100.apambiente.pt/
- AdaptECCA / AEMET (Spain): https://predictia.es/en/projects/adaptecca-viewer.html
- Météo-France Occitanie: https://meteofrance.com/changement-climatique/quel-climat-futur-en-occitanie
- Met Éireann TRANSLATE 2023: https://www.frontiersin.org/articles/10.3389/fclim.2023.1166828/full
- Romania heatwaves (Theor Appl Climatol 2023): https://link.springer.com/article/10.1007/s00704-023-04412-5 ; World Bank CCKP: https://climateknowledgeportal.worldbank.org/country/romania/climate-data-projections
- AdaptWest ClimateNA: https://adaptwest.databasin.org/pages/adaptwest-climatena/ ; UW CIG PNW tool: https://cig.uw.edu/resources/analysis-tools/pacific-northwest-climate-projection-tool/
- Vermont Climate Assessment 2021: https://site.uvm.edu/vtclimateassessment/ ; NCICS VT: https://statesummaries.ncics.org/chapter/vt/
- Asheville projections (ClimateCheck): https://climatecheck.com/northcarolina/asheville
- NM Bulletin 164: https://geoinfo.nmt.edu/publications/monographs/bulletins/164/ ; USGS Rio Grande: https://www.usgs.gov/news/state-news-release/future-peak-flow-along-rio-grande-may-arrive-early-due-climate-change
- ClimateData.ca (Canada): https://climatedata.ca/
- Mexico G20 risk atlas: https://www.g20climaterisks.org/mexico/ ; https://en.wikipedia.org/wiki/Climate_change_in_Mexico
- WorldClim CMIP6: https://www.worldclim.org/data/cmip6/cmip6_clim30s.html
- Global Aridity Index v3 (Sci Data 2022): https://www.nature.com/articles/s41597-022-01493-1 ; https://www.global-ai-pet.org/
- Köppen-Geiger (Beck 2018/2023): https://www.nature.com/articles/sdata2018214 ; https://figshare.com/articles/dataset/21789074
- SPEI Global Drought Monitor: https://spei.csic.es/map/ ; US gridded SPEI: https://www.drought.gov/data-maps-tools/us-gridded-standardized-precipitation-evapotranspiration-index-spei-nclimgriddaily
- Copernicus EDO/GDO CDI: https://drought.emergency.copernicus.eu/ ; WMS: https://drought.emergency.copernicus.eu/api/wms?REQUEST=GetCapabilities&SERVICE=WMS&VERSION=1.1.1
- US/NA Drought Monitor: https://droughtmonitor.unl.edu/DmData/GISData.aspx ; https://nadm-noaa.hub.arcgis.com/
- WRI Aqueduct 4.0: https://www.wri.org/data/aqueduct-global-maps-40-data ; GEE: https://developers.google.com/earth-engine/datasets/catalog/WRI_Aqueduct_Water_Risk_V4_future_annual
- USFS Wildfire Risk to Communities: https://wildfirerisk.org/download/ ; https://data-usfs.hub.arcgis.com/
- Copernicus EFFIS/GWIS: https://forest-fire.emergency.copernicus.eu/applications/data-and-services ; https://gwis.jrc.ec.europa.eu/
- JRC river flood hazard (ESSD 2022): https://data.jrc.ec.europa.eu/collection/id-0054 ; https://essd.copernicus.org/articles/14/1549/2022/
- Fathom Global Flood Map 3.0: https://www.fathom.global/product/global-flood-map/ ; World Bank free tier: https://datacatalog.worldbank.org/search/dataset/0065654/
- NOAA Sea Level Rise Viewer: https://coast.noaa.gov/slr/ ; https://coast.noaa.gov/slrdata/
- Willamette Water 2100: https://inr.oregonstate.edu/ww2100/key-findings
