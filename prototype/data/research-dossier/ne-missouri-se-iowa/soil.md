# Soil — Northeast Missouri / Southeast Iowa, United States

**Headline finding:** Topsoil carbon is moderate, not high: depth-weighted 0-30 cm soil organic carbon averages 17.9 g/kg over the footprint, and falls steeply with depth (33.6 g/kg at 0-5 cm, 11.0 at 15-30 cm). The brief expected a high value from mollisols; SoilGrids does not show it.

**Key data point (with vintage):** SoilGrids 2.0 SOC mean (ISRIC, 250 m, 2020 release), 134,625 pixels inside the footprint: 0-5 cm mean 33.64, median 31.6; 5-15 cm mean 20.38, median 19.9; 15-30 cm mean 10.99, median 10.6 g/kg (source dg/kg /10). Depth-weighted (5, 10, 15 cm weights) 0-30 cm: mean 17.90, median 17.53, p10 15.73, p90 20.50, max 42.65 g/kg; no pixels above 150. Computed 2026-10-04 (tools/soil.py).

**Supporting facts:**
- The cell uses the depth-weighted mean to match the method used for other re-verified cells; the 0-5 cm layer alone would give 33.6.
- Tree cover is 23.5 percent of the footprint (Hansen, year 2000), so the remainder is open land, mostly agricultural by the brief's description; land-cover shares were not computed.
- Dancing Rabbit reports 160 of its 280 acres in the federal Conservation Reserve Program and not farmed since 1987, with soil "regaining the health it lost during years of over-farming" (dancingrabbit.org, Our Land).

**Practitioner-relevant nuance:** SoilGrids is a modelled 250 m map. NRCS SSURGO was not queried, so parcel work still needs a soil survey.

**Sources:**
1. SoilGrids 2.0, https://soilgrids.org (files.isric.org/soilgrids/latest/data/soc/)
2. Dancing Rabbit Ecovillage, Our Land, https://www.dancingrabbit.org/ecovillage-life/our-land/
