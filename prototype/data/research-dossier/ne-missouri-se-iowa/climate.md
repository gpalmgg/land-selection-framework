# Climate Trajectory — Northeast Missouri / Southeast Iowa, United States

**Headline finding:** A seven-county footprint on the Missouri-Iowa line warms from a 1970-2000 mean of about 10.7 C to about 13.9 C in 2041-2060 under SSP2-4.5 (17-model mean, models spanning 12.4 to 15.3 C), roughly +3.3 C. There is no coastal, mountain or large-lake buffering: the land runs 150 to 325 m.

**Key data point (with vintage):** WorldClim v2.1 BIO1 zonal mean over the footprint (Schuyler, Scotland, Clark MO; Appanoose, Davis, Van Buren, Lee IA; 582 cells at 2.5 arc-minutes, all_touched): 13.94 C for 2041-2060 SSP2-4.5 (17 of 18 GCMs; GFDL-ESM4's file returned HTTP 404), against 10.67 C for the 1970-2000 baseline over the same cells. Value at 40.5 N, -92.0 W (3x3 cell mean) 14.11 C. Baseline annual precipitation (BIO12) 940 mm. Computed 2026-10-04 (tools/climate.py, tools/climate_base.py).

**Supporting facts:**
- Model spread (zonal means): lowest INM-CM5-0 12.42 C, highest HadGEM3-GC31-LL 15.32 C; most models sit 13.4 to 14.2 C.
- Cells are 2.5 arc-minutes (about 4.6 km), so the seven-county footprint holds 582 cells (the criterion text on the site says "~18 km raster", which belongs to a coarser grid); the spread reported is between models, not across the footprint.
- The existing Driftless cell (11.75 C) and Ozarks cell (17.5 C) use other methods; the 2026-10 re-verification found WorldClim 17-GCM 10.6 C for the Driftless.
- Difference between a CMIP6 future and the WorldClim historical grid includes some model bias; read +3.3 C as approximate.

**Practitioner-relevant nuance:** Heavy-rain, flood and drought-swing statistics from the Iowa and Missouri climate offices were not retrieved (the NCA5 Midwest chapter host did not resolve from this network); do not quote them from this file.

**Sources:**
1. WorldClim CMIP6 v2.1 downscaled projections, https://www.worldclim.org/data/cmip6/cmip6climate.html (files read from geodata.ucdavis.edu/cmip6/2.5m/<GCM>/ssp245/)
2. WorldClim v2.1 historical climate (1970-2000), https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_2.5m_bio.zip
3. US Census Bureau cartographic boundary 2023 counties (footprint), https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_county_500k.zip
