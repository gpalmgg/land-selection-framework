# Accessibility and demography: Virginia Piedmont (Louisa, Fluvanna and Orange), USA

**Headline finding:** Rural by density (about 34 people per km2 of land) but in the middle of a growth corridor: the three counties added roughly 11 percent in five years and the Weldon Cooper Center projects another 35 percent by 2050 over the 2020 count. Charlottesville, with the nearest hospitals, is 24.5 km from the region point and sits just outside the footprint; Richmond is 84 km and Washington DC 143 km.

**Key data point (with vintage):** Census 2020 (TIGERweb county layer, opened 2026-10-04): Louisa 37,596, Orange 36,254, Fluvanna 27,249 = **101,099** people on 2,908.97 km2 of land (883.16 + 743.63 + 1,282.17) = **34.8 per km2**; Louisa 29.3, Fluvanna 36.6, Orange 41.0 per km2. JRC GHSL POP R2023A, 2030 raster (1 km, Mollweide), centre-in sum over the footprint 98,216 people on 2,968 cells, 2,964.3 km2 incl. water = **33.1 per km2** (2020 raster 100,903 = 34.0 per km2). Weldon Cooper Center projections (July 2025): 2030 total 114,363 (29,125 + 44,679 + 40,559); 2040 122,352; 2050 136,307 (33,885 + 54,467 + 47,955).

**Supporting facts:**
- 2025 estimates (US Census Bureau county totals, as cited in Wikipedia; secondary): Louisa 42,924 (+14.2 percent on 2020), Orange 40,083 (+10.6), Fluvanna 28,975 (+6.3); three-county total 111,982 (+10.8). Median age 2020: Louisa 45.2, Orange 44.6, Fluvanna 44.5 (Wikipedia citing Census).
- Louisa's growth is attributed to retirees settling near Lake Anna and to its location "an hour's drive or less from Richmond, Fredericksburg and Charlottesville" (Wikipedia).
- OSM hospital snapshot (the repo's amenity=hospital layer): nearest hospital Sentara Martha Jefferson Hospital, Charlottesville, 21.6 km (outside the footprint); then University of Virginia Medical Center 26.5 km and UVA HealthSouth Rehabilitation Hospital 28.7 km; Culpeper Medical Center 53.2 km. 3 hospitals within 50 km, 34 within 100 km. No hospital point lies inside the three counties. Geodesic distance only; not drive time.
- Roads (Louisa): I-64, US 15, 33, 250, 522, SR 22, 208, 231 (Wikipedia).

**Practitioner-relevant nuance:** The people count understates the pressure: growth is exurban, from three metros at once. A quiet county road today is a subdivision frontage in a decade; the right rate of arrival is the community's, not the market's.

**Sources:**
1. US Census Bureau TIGERweb 2020 counties (POP100, AREALAND), saved at raw/census2020_tigerweb.json (opened 2026-10-04)
2. JRC GHSL GHS-POP R2023A (E2020, E2030, 54009, 1000 m, tile R5_C12), https://ghsl.jrc.ec.europa.eu/ghs_pop2023.php (downloaded 2026-10-04)
3. Weldon Cooper Center, Virginia Population Projections (July 2025), https://www.coopercenter.org/virginia-population-projections (file VAPopProjections_Total_2030-2050_1July2025.xlsx, opened 2026-10-04)
4. Wikipedia county articles (Louisa, Fluvanna, Orange), https://en.wikipedia.org/wiki/Orange_County,_Virginia (opened 2026-10-04)
5. OpenStreetMap hospitals snapshot in the repo, prototype/data/raw/hospitals/hospitals-na.geojson (ODbL)
