# Soil — Finger Lakes (Cayuga and Seneca lake country), United States

**Headline finding:** SoilGrids 2.0 puts depth-weighted topsoil organic carbon (0-30 cm) at a mean of 33 g/kg over the five-county footprint (median 31.4; 10th-90th percentile 23.6-45.4), moderate and nowhere near the 150 g/kg slider ceiling (0 percent of pixels above it).

**Key data point (with vintage):** SoilGrids 2.0 (ISRIC, 250 m) `soc_<depth>_mean.vrt`, layers 0-5, 5-15 and 15-30 cm, read in the Interrupted Goode Homolosine projection over the footprint (88,293 valid pixels, centre-in mask). Layer means (dg/kg): 830.1 / 326.0 / 168.9. Depth-weighted per pixel with weights 5, 10, 15 cm (sum 30), then dg/kg to g/kg: **mean 33.15, median 31.42, p10 23.62, p90 45.42, max 81.07 g/kg**. Check: (83.0x5 + 32.6x10 + 16.9x15)/30 = 33.1. Product vintage 2020 (SoilGrids 2.0).

**Supporting facts:**
- SoilGrids is a modelled global surface; local SSURGO (NRCS) maps are the proper source for parcel decisions and were not opened.
- Land in farms in the five counties (USDA Census of Agriculture 2022): cropland 67,433 (Tompkins), 44,056 (Schuyler), 83,602 (Seneca), 82,958 (Yates), 176,139 acres (Cayuga), 454,188 acres total; 607,092 acres of farmland overall (sum of the five county profiles) (about 2,457 km2, 44 percent of the footprint's land area).
- Lead and industrial legacy soils are documented at specific urban and depot sites (see legal.md and stability.md); none of the regional average figures reflect them.

**Practitioner-relevant nuance:** A footprint mean of 33 g/kg hides the contrast between valley-floor and lake-plain cropland and thin plateau-top soils. Use SSURGO at parcel scale.

**Sources:**
1. SoilGrids 2.0, ISRIC. https://soilgrids.org (data via https://files.isric.org/soilgrids/latest/data/soc/)
2. USDA NASS Census of Agriculture 2022, county data (Quick Stats bulk file qs.census2022.txt.gz, AG LAND, CROPLAND - ACRES). https://www.nass.usda.gov/datasets/qs.census2022.txt.gz
