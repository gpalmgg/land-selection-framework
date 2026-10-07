# Water — Finger Lakes (Cayuga and Seneca lake country), United States

**Headline finding:** Projected baseline water stress for 2050 (business-as-usual) is very low across almost all of the footprint: area-weighted ratio 0.015. One small south-eastern basin (about 242 km2, 3.8 percent of the footprint) reads Medium-high (0.24). The region sits across a drainage divide: the Cayuga and Seneca basins drain north via the Oswego River to Lake Ontario, the southern fringe drains toward the Susquehanna.

**Key data point (with vintage):** WRI Aqueduct 4.0, `future_annual`, field `bau50_ws_x_r` (2050 BAU water stress, raw ratio), HydroBASINS level-6 polygons intersected with the exact footprint (6,381.3 km2) and area-weighted: **0.0149**. Basins: 725540 (5,222.9 km2, ratio 0.0023, Low <10%), 725551 (604.4 km2, 0.0054, Low), 731607 (311.9 km2, 0.0692, Low), 731606 (241.8 km2, 0.2407, Medium-high 20-40%), 731608 (0.26 km2, 0.2193). Basin containing the coordinates: 725540 (0.0023). Baseline `bws_raw` area-weighted = 0.0127, so the 2050 BAU projection is a small rise from baseline. File used: Aq40_Y2023D07M05.gdb (prototype/data/raw/aqueduct-extract).

**Supporting facts:**
- Aqueduct measures withdrawals against available supply; low stress is not a statement about water quality or flood risk. Harmful algal blooms in the Finger Lakes (named in the brief) were not researched with an opened source and are not asserted here.
- NY regulates large withdrawals under ECL section 15-1501 (water supply withdrawal permits; exemptions include existing agricultural withdrawals registered or reported before 15 February 2012, fire suppression, closed-loop geothermal). The threshold volume is defined in section 15-1502, not opened here.
- New York is a member state of the Great Lakes-St. Lawrence River Basin Water Resources Compact (glslcompactcouncil.org lists eight states including New York; coordinated laws since 2008). The Susquehanna River Basin Commission (SRBC) covers the southern fringe; its thresholds were not retrievable (srbc.gov pages returned no regulatory text) and are not stated.
- Municipal water example: the Southern Cayuga Lake Intermunicipal Water Commission (Bolton Point) is "a joint entity of its five member municipalities", serving the Towns of Dryden, Ithaca and Lansing and the Villages of Cayuga Heights and Lansing, drawing from Cayuga Lake via the Southern Cayuga Lake Intake and Water Treatment Facility.

**Practitioner-relevant nuance:** The basin divide matters for permitting: the north-draining majority sits under the Great Lakes compact framework, the southern fringe under SRBC. Check which side a parcel is on. The one Medium-high basin (731606) is in the south-east of the footprint; if a parcel lies there, the footprint average does not apply.

**Sources:**
1. WRI Aqueduct 4.0 data (Aq40 geodatabase). https://www.wri.org/aqueduct
2. NY ECL section 15-1501, Water supply withdrawal permits. https://www.nysenate.gov/legislation/laws/ENV/15-1501
3. Great Lakes-St. Lawrence River Basin Water Resources Council. https://www.glslcompactcouncil.org/
4. Southern Cayuga Lake Intermunicipal Water Commission (Bolton Point). https://www.boltonpoint.org/
5. Wikipedia, Finger Lakes (drainage: Lake Ontario via the Oswego River; some nearby lakes Susquehanna). https://en.wikipedia.org/wiki/Finger_Lakes
