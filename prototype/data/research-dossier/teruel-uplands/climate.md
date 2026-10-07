# Climate — Teruel uplands and the Maestrazgo, Spain (Aragon)

**Headline finding:** A cold continental-Mediterranean upland: the footprint mean annual temperature is 10.3 C for 1970-2000 and 12.7 C for 2041-2060 under SSP2-4.5 (17-GCM ensemble), a rise of about 2.5 C. Altitude (municipal seats 643-1,695 m) is the only buffer, and the binding limits at mid-century are water and fire, not heat.

**Key data point (with vintage):** WorldClim CMIP6 v2.1 BIO1, 2041-2060, SSP2-4.5, 2.5 arcmin, 17-GCM ensemble mean over the 180-municipality footprint (785 cells, all_touched): **12.73 C**. Across GCMs 11.92-13.69; across cells p10-p90 10.83-14.39, min 8.88, max 15.72. Value at the marker (-1.2, 40.5), 3x3 cells: 13.61 (GCM range 12.79-14.57). Baseline WorldClim 2.1 1970-2000, same footprint: 10.26 (p10-p90 8.38-11.89); marker 3x3: 11.11. Computed 2026-10-04.

**Supporting facts:**
- GFDL-ESM4 (the 18th GCM) returned HTTP 404 from geodata.ucdavis.edu, so the ensemble has 17 members, as for the Millevaches footprint.
- Municipal seat altitudes in the footprint (es.wikipedia Anexo, IAEST altimetric zones): minimum 643 m (Alcaine), maximum 1,695 m (Valdelinares), median 1,114 m; area-weighted mean 1,115 m. Sampled terrain heights in the Global Solar Atlas run: 677-1,936 m.
- Hot lowlands lie 116-146 km away (Valencia, Zaragoza; geodesic from Teruel city).
- The 2.5 arcmin grid (about 4.6 km) smooths the relief; the cell mean sits between valley floors and sierras.
- Not opened: AEMET and AdapteCCa regional scenarios; no frost-day or heat-day indices.

**Practitioner-relevant nuance:** A footprint mean hides a 6 C spread between the Jiloca and Turia valleys and the sierras of Gudar, Javalambre and Albarracin. The figure is a regime, not a promise for any one village.

**Sources:**
1. WorldClim CMIP6 future climate, 2.5 arcmin, SSP2-4.5 2041-2060 (opened via https://geodata.ucdavis.edu/cmip6/2.5m/<GCM>/ssp245/). https://www.worldclim.org/data/cmip6/cmip6climate.html
2. WorldClim 2.1 historical climate 1970-2000 (BIO1 read from wc2.1_2.5m_bio.zip). https://www.worldclim.org/data/worldclim21.html
3. es.wikipedia, Anexo: Municipios de la provincia de Teruel (altitude column). https://es.wikipedia.org/wiki/Anexo:Municipios_de_la_provincia_de_Teruel
4. Global Solar Atlas LTA API (elevation field). https://globalsolaratlas.info
