# Accessibility and People — North Karelia and Kainuu, Finland

**Headline finding:** A depopulating, ageing footprint with two hubs (Joensuu, Kajaani) and a very thin rural middle; health-service access by the OSM proxy is reasonable but flatters acute care.

**Key data point (with vintage):** 219,348 residents at 31 Dec 2025 on 29,841 km2 of land = **7.4 per km2** (4.1 outside Joensuu and Kajaani); down 13.5% from 253,464 in 1990. JRC GHSL 2030 gives 214,995 people = 7.2 per km2. Statistics Finland tables 11ra, 14wx and 11a2, retrieved 2026-10-04.

**Supporting facts:**
- Population change 1990 to 2025: the 14 smaller municipalities 124,574 to 76,809 (-38%); Joensuu 67,363 to 79,129; Kontiolahti 10,450 to 15,060; Liperi 11,500 to 11,980; 15 of 18 municipalities shrank. Whole counties: North Karelia -11%, Kainuu -25%.
- Projection 2024 (Statistics Finland): 220,356 (2024), 215,592 (2030), 208,607 (2040), 206,034 (2045).
- Net intermunicipal migration (all 18): -538 (2020), -298, -1,055, -1,261, -1,406, -1,468 (2025); international migration not included.
- Age 2025: mean 46.9 (national 44.1), 29.6% aged 65+ (national 23.8%); outside the two hubs 50.5 and 35.4%. Under-15 share 12.7%. Foreign citizens 5.4% (3.4% outside the hubs). Population in rural areas 45.2% (81.4% outside the hubs).
- Municipal densities per km2 of land: Ristijärvi 1.4, Kuhmo 1.5, Ilomantsi 1.6 ... Kajaani 19.8, Joensuu 33.2.
- Health proxy (OSM `amenity=hospital`, haversine from the coordinates): nearest tagged facility 23.0 km (Terveyskeskus, Lieksa area), 2 within 50 km, 17 within 100 km; these are mostly primary health centres. The North Karelia central hospital (Joensuu) is 78.9 km away and Kuhmo health station 93 km.
- Language and entry: Finnish opens village associations and Leader groups; Joensuu runs a moving agent and International House Joensuu; Ilomantsi gives free counselling in Finnish and English (see standing-notes.md).

**Practitioner-relevant nuance:** The population figures describe communities that are shrinking and ageing; several municipalities are within reach of a hub for services, many are not. Winter road access and emergency response times were not researched.

**Sources:**
1. Statistics Finland PxWeb, tables 11ra, 14wx, 11a2. https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/vaerak/11ra.px
2. JRC GHSL, GHS-POP R2023A epoch 2030, 1 km, tiles R2_C20 and R2_C21. https://ghsl.jrc.ec.europa.eu/ghs_pop2023.php
3. OpenStreetMap hospital snapshot used by scripts/process_hospital_proximity.py (data/raw/hospitals/hospitals-eu.geojson).
4. City of Joensuu, Move to Joensuu. https://www.joensuu.fi/en/city-and-development/our-joensuu/move-to-joensuu/
