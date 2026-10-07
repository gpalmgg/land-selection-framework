# Climate — Finger Lakes (Cayuga and Seneca lake country), United States

**Headline finding:** Over the five-county footprint (Tompkins, Schuyler, Seneca, Yates, Cayuga) the WorldClim CMIP6 ensemble puts mean annual temperature at 11.2 C for 2041-2060 under SSP2-4.5, up about 3.1 C from the 1970-2000 baseline of 8.1 C. That is cool-temperate by the slate's standards (Vermont 9.0, Driftless 10.6 after re-verification, Southern Appalachians 15.5 in the live cells), and the footprint spans a wide range of elevation (73 to 607 m in the Global Solar Atlas sample), so the single figure hides valley-floor and plateau-top differences.

**Key data point (with vintage):** WorldClim CMIP6 v2.1 BIO1, SSP2-4.5, 2041-2060, 2.5 arcmin (about 4 km here), 17-GCM ensemble mean (GFDL-ESM4 returned HTTP 404 and is excluded, as in the other regions' re-verification): zonal mean over the exact five-county footprint (475 cells, all-touched) = **11.19 C**; spread across GCMs 9.71 (INM-CM5-0) to 12.92 (UKESM1-0-LL); 3x3-cell mean at the coordinates (-76.75, 42.55) = 10.99 C (pt range 9.53-12.72). Baseline WorldClim 2.1 BIO1 1970-2000 zonal mean over the same footprint = **8.09 C** (same 475 cells). Retrieved 2026-10-04.

**Supporting facts:**
- The cell value is a projection of the mean annual temperature, so state and trajectory are in one number; the delta versus the historical baseline is +3.1 C (both rasters WorldClim 2.1, same grid; ensemble versus single historical surface, so read it as indicative).
- Cayuga and Seneca lakes are among the deepest lakes in the United States (133 m and 188 m per Wikipedia); the lakes "provide a lake effect" that retains residual summer warmth in winter and winter cold in spring (Wikipedia, Finger Lakes, Temperature Moderation). The 4 km grid cannot resolve this; treat it as qualitative.
- The Northeast is the fastest-warming region of the contiguous US per NCA5 ch. 21 (Vermont dossier relied on the same chapter); the NCA5 page opened here states extreme precipitation events (top 1 percent of daily totals) have increased by about 60 percent in the region, the largest increase in the US, and a 49 percent increase in days with 2 inches or more of rain between 1958 and 2022.
- Test of the pre-selection claim ("plateau among the less heat-and-drought-exposed zones"): partly supported. Water stress is very low (see water.md). Temperature is mid-pack: cooler than the Southern Appalachians and Ozarks, warmer than Vermont. The claim cannot be tested for drought or heat-days with the sources opened; no heat-day or drought-index dataset was opened.

**Practitioner-relevant nuance:** The vulnerability named in the sources is heavy rain and flooding, not heat. Valley-floor and lakeshore parcels carry flood exposure that a 4 km temperature raster says nothing about; check flood mapping before any commitment.

**Sources:**
1. WorldClim future climate (CMIP6) data page. https://www.worldclim.org/data/cmip6/cmip6climate.html (rasters read via https://geodata.ucdavis.edu/cmip6/2.5m/<GCM>/ssp245/wc2.1_2.5m_bioc_<GCM>_ssp245_2041-2060.tif)
2. WorldClim 2.1 historical climate (1970-2000), wc2.1_2.5m_bio.zip, BIO1. https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_2.5m_bio.zip
3. NCA5 Chapter 21, Northeast. https://nca5.climate.us/chapter/21/
4. Wikipedia, Finger Lakes (lake depths, lake effect). https://en.wikipedia.org/wiki/Finger_Lakes
