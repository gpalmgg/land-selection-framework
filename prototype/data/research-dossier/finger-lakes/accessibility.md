# Accessibility — Finger Lakes (Cayuga and Seneca lake country), United States

**Headline finding:** A hospital sits 19.6 km from the coordinates (Cayuga Medical Center at Ithaca), eight within 50 km and 35 within 100 km in the OpenStreetMap snapshot the site uses; hospitals sit in or beside each county (Schuyler Hospital, Soldiers & Sailors Memorial Hospital in Penn Yan, Geneva General, Auburn Community). Population density is moderate and uneven: 46 persons/km2 over the footprint (Census 2020, land area), 86 in Tompkins and 21-43 in the other four counties.

**Key data point (with vintage):** US Census 2020 decennial counts via Census TIGERweb (tigerWMS_Census2020, layer Counties, POP100/AREALAND): Schuyler 17,898 (850.4 km2 land), Tompkins 105,740 (1,229.3), Cayuga 76,248 (1,791.2), Yates 24,774 (875.8), Seneca 33,814 (838.4); total **258,474 on 5,585.06 km2 land = 46.28 persons/km2**; excluding Tompkins 152,734 / 4,355.75 = 35.06. JRC GHSL POP R2023A, projected 2030, summed over the footprint (centre-in, 6,390 1-km cells) = 230,454, divided by the footprint's total area 6,381.3 km2 (includes lake surface) = **36.1 persons/km2**; GHSL 2020 same method = 260,439 (40.8). The criterion value uses the GHSL figure.

**Supporting facts:**
- Hospital proximity (OSM amenity=hospital, geodesic, 2026-05 snapshot): Cayuga Medical Center at Ithaca 19.59 km, Schuyler Hospital 23.72, Soldiers & Sailors Memorial 28.81, Geneva General 41.29, Auburn Community 46.07, Guthrie Cortland 46.51, Ira Davenport 47.53, Guthrie Corning 49.49. Geodesic, not a drive-time isochrone.
- Population trend: five-county total 260,532 (2010 Census) to 258,474 (2020) = -0.8 percent; Tompkins +4.1 percent, the other four -2.3 to -4.7 percent (-3.9 percent combined). NYS data portal estimates 258,470 (2020 base) to 253,282 (2024 postcensal) = -2.0 percent, with all five counties lower in 2024 than 2020.
- The Cornell and Ithaca College core is a hub; the Ithaca housing market is not an entry route (see the land standing entry).

**Practitioner-relevant nuance:** The 19.6 km distance is measured from a point between the lakes, not from Ithaca. Distances to specialists and winter drive times were not modelled. Median age and migration were not retrievable (api.census.gov required a key; data.census.gov and QuickFacts returned 403).

**Sources:**
1. US Census Bureau TIGERweb, Census 2020 and Census 2010 county layers. https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Census2020/MapServer
2. JRC GHSL GHS-POP R2023A (E2020, E2030, 1 km, Mollweide). https://ghsl.jrc.ec.europa.eu/ghs_pop2023.php
3. NYS Open Data, Annual Population Estimates for New York State and Counties (krt9-ym2k). https://data.ny.gov/resource/krt9-ym2k.json
4. OpenStreetMap hospitals, prototype/data/raw/hospitals/hospitals-na.geojson (Overpass snapshot, ODbL). https://overpass-api.de
