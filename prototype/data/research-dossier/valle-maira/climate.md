# Climate — Valle Maira, Italy

**Headline finding:** Over the 13-comune footprint the 2041–2060 mean annual temperature is 8.0 °C (WorldClim CMIP6 v2.1, SSP2-4.5, 17-GCM mean), about 2.5 °C above the WorldClim 1970–2000 baseline of 5.5 °C for the same cells. That figure is a whole-valley mean that includes slopes above 2,000 m; the 500–1,500 m band where people live is far warmer (about 11.9 °C in 2041–2060).

**Key data point (with vintage):** zonal mean of WorldClim CMIP6 BIO1 over the footprint, 2041–2060, SSP2-4.5, 17 GCMs (GFDL-ESM4 file returned HTTP 404 and is missing, as for the other new regions): **8.03 °C** (62 grid cells of 2.5 arc-minutes, all-touched mask). Spread across the 17 GCMs: 7.17 °C (MPI-ESM1-2-HR) to 9.57 °C (UKESM1-0-LL). The 11-comune mountain sub-aggregate (without Dronero and Villar San Costanzo, 53 cells) gives 7.12 °C (6.25–8.67). 3x3-cell mean around the coordinates [7.1, 44.45]: 6.97 °C (6.10–8.50 across GCMs). Computed 2026-10-04.

**Supporting facts:**
- Elevation bands from the WorldClim 2.5' elevation raster, same cells (2041–2060 ensemble mean / 1970–2000 baseline): below 1,000 m 13.7 / 11.1 °C (10 cells); 500–1,500 m 11.9 / 9.3 °C (24 cells); 1,000–1,500 m 10.6 / 8.0 °C (14 cells); 1,500–2,200 m 7.5 / 4.9 °C (19 cells); above 2,200 m 3.8 / 1.3 °C (19 cells). Cell elevations run 550–2,748 m (mean 1,718 m). The fitted lapse rate is about −0.59 °C per 100 m (r = −0.998).
- Warming signal: +2.5 °C footprint-wide between the 1970–2000 baseline and 2041–2060.
- Present-day air temperature from the Global Solar Atlas at the coordinates (1,348 m): 7.8 °C; at 107 sample points the GSA TEMP/ELE fit is −0.57 °C per 100 m.
- Regional scenarios (ARPA Piemonte, scenarios page): about +2 °C by end of century under RCP4.5 and +4 °C under the tendential scenario, larger above 700 m; winter precipitation +10–15 percent (RCP4.5), summer decreases up to 30 percent by century end (RCP8.5); heavy-rain days (30 mm) +10–20 percent. These are context and are NOT relabelled SSP2-4.5.

**Practitioner-relevant nuance:** the criterion filters on the single number, and 8.0 °C reads as a cold place. Read it with the band: villages and borgate sit roughly 600–1,500 m, where the same scenario gives 10.5–12 °C, comparable to South Tirol's mid-mountain 12.0. The 2.5-arc-minute grid is coarse for a valley this steep, so solana versus ombra slopes are invisible here.

**Sources:**
1. WorldClim future climate, CMIP6 downscaled: https://www.worldclim.org/data/cmip6/cmip6climate.html (files read: https://geodata.ucdavis.edu/cmip6/2.5m/<GCM>/ssp245/wc2.1_2.5m_bioc_<GCM>_ssp245_2041-2060.tif)
2. WorldClim 2.1 historical bioclim and elevation, 2.5': https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_2.5m_bio.zip and wc2.1_2.5m_elev.zip
3. Global Solar Atlas LTA API (TEMP, ELE): https://api.globalsolaratlas.info/data/lta?loc=44.45,7.1 (retrieved 2026-10-04)
4. ARPA Piemonte, Scenari climatici futuri in Piemonte: https://www.arpa.piemonte.it/scheda-informativa/scenari-climatici-futuri-piemonte (opened 2026-10-04)
5. ARPA Piemonte, Impatti del cambiamento climatico: https://www.arpa.piemonte.it/scheda-informativa/impatti-cambiamento-climatico (opened 2026-10-04)

**Verify-pass correction (2026-10-04):** the 8.03 C figure above is an unweighted mean of all-touched cells. The area-weighted zonal mean over the same 17 GCMs is 8.17 C (GCM range 7.31 to 9.71), so the shipped cell value is 8.2. Settlement-band and baseline figures remain unweighted cell means.
