# Soil: Virginia Piedmont (Louisa, Fluvanna and Orange), USA

**Headline finding:** Modest Piedmont topsoil carbon: 19.8 g/kg organic carbon over 0-30 cm (footprint mean), with a tight spread (10th to 90th percentile 16.5 to 23.3 g/kg) and nowhere near the slider ceiling.

**Key data point (with vintage):** SoilGrids 2.0 (ISRIC) soil organic carbon, mean prediction, 250 m, depth-weighted 0-30 cm (0-5 cm x 5, 5-15 cm x 10, 15-30 cm x 15), 46,681 pixels inside the footprint: **mean 19.84 g/kg, median 19.52 g/kg**, p10 16.45, p90 23.25, maximum 59.95; none above 150 g/kg. The 0-5 cm layer alone averages 60.9 g/kg (forest litter horizon) and the 15-30 cm layer 7.6 g/kg, so the depth convention matters; the cell uses 0-30 cm like the other re-verified regions. Computed 2026-10-04.

**Supporting facts:**
- EPA Level III ecoregions of the footprint (EPA Virginia ecoregion shapefile, opened): Piedmont (45) on 88.5 percent of the area (Level IV: Northern Inner Piedmont 65.4 percent and Northern Outer Piedmont 23.1 percent) and Northern Piedmont (64) on 11.5 percent (Triassic Lowlands 2.5, Piedmont Uplands 9.0).
- Tree cover is 70 percent of the footprint (Hansen year-2000 canopy of 30 percent or more), so much of the topsoil carbon sits in forest litter.
- NRCS SSURGO was not queried in this run (web soil survey is interactive); SoilGrids is the criterion's stated source.

**Practitioner-relevant nuance:** A SoilGrids 250 m mean hides farm-scale variation (floodplain bottoms, red-clay uplands). Treat 19.8 g/kg as the regional state and take a soil test on any ground you work.

**Sources:**
1. SoilGrids 2.0, https://soilgrids.org (VRT tiles at https://files.isric.org/soilgrids/latest/data/soc/, opened 2026-10-04)
2. EPA, Ecoregions of Virginia (Level III/IV shapefile), https://dmap-prod-oms-edc.s3.us-east-1.amazonaws.com/ORD/Ecoregions/va/va_eco.zip (linked from https://www.epa.gov/eco-research/ecoregion-download-files-state-region-3, opened 2026-10-04)
3. Hansen et al., Global Forest Change v1.11 (treecover2000), https://storage.googleapis.com/earthenginepartners-hansen/GFC-2023-v1.11/ (opened 2026-10-04)
