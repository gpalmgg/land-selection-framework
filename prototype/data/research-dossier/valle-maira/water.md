# Water — Valle Maira, Italy

**Headline finding:** WRI Aqueduct 4.0 gives a 2050 business-as-usual water-stress ratio of 0.40 (High, 40–80 percent category) for the footprint, but that number belongs to a very large HydroBASINS unit, not to the valley: the footprint is only 3 percent of the basin that scores it.

**Key data point (with vintage):** area-weighted `bau50_ws_x_r` (raw 0–1 ratio, 2050 BAU) over the footprint: **0.403** (3 basins; 565.9 km² of 568.8 km² lies in HydroBASINS L6 pfaf_id 214069, ratio 0.403, category "High (40–80%)"; 1.7 km² in 214068, ratio 0.439; 1.2 km² in 216022, ratio 0.232, "Medium-high (20–40%)"). Baseline (`bws_raw`) area-weighted: 0.331 ("Medium-High 20–40%"). Water-stress score (`bau50_ws_x_s`) of the dominant basin: 3.01. Computed 2026-10-04 from Aqueduct40_waterrisk_download_Y2023M07D05.gdb (layers `future_annual`, `baseline_annual`).

**Supporting facts:**
- Basin 214069 is 17,492 km² (EPSG:3035) and spans roughly 4.7–8.9°E, 43.5–46.0°N, i.e. well beyond the Maira valley; its ratio is dominated by withdrawals on the Piedmont plain. The upper valley's own supply was not measured here.
- By law all surface and underground waters belong to the State demanio (D.Lgs. 152/2006 art. 144 c.1) and non-drinking uses are allowed only where resources suffice and quality is not harmed (art. 144 c.4); waters on which residents of a comune or frazione exercise usi civici are beni collettivi (Law 168/2017 art. 3 c.1 f).
- The Unione Montana's inner-areas strategy page lists an "irrigation network" among its themes (page opened); no concession or operator data was opened.

**Practitioner-relevant nuance:** a high basin-scale ratio can coexist with a snow-fed headwater valley; equally the Maira is an Alpine torrent with summer low flows. Neither is measured here, so the cell is a basin-scale warning, not a verdict. Ask each commune and frazione who holds the aqueduct and the irrigation rights before anything else.

**Sources:**
1. WRI Aqueduct 4.0 data: https://www.wri.org/aqueduct (GDB read locally, 2023-07-05 release)
2. D.Lgs. 152/2006 art. 144: https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.legislativo:2006-04-03;152~art144 (opened 2026-10-04)
3. Law 168/2017 art. 3: https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:legge:2017-11-20;168~art3 (opened 2026-10-04)
4. Unione Montana Valle Maira, SNAI page: https://www.unionemontanavallemaira.it/Menu?IDVoceMenu=332295 (opened by the standing task, 2026-10-04)
