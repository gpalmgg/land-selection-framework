# Water — North Karelia and Kainuu, Finland

**Headline finding:** Water stress is very low everywhere in the footprint; the open question is who holds the water and what flows into it, not how much there is.

**Key data point (with vintage):** WRI Aqueduct 4.0 `bau50_ws_x_r` (2050 business as usual, raw 0-1 ratio) area-weighted over the 7 HydroBASINS level-6 basins that intersect the footprint = **0.0156**; basin values run 0.0001 to 0.0325 and every basin is category 0 "Low (<10%)". The basin at the coordinates (243229, 52% of the footprint) is 0.0079; the Kainuu basin 243600 (32%) is 0.0269. North Karelia part 0.0096, Kainuu part 0.0264. Computed 2026-10-04 from the Aqueduct 4.0 geodatabase (`future_annual`). The shipped map polygon at the coordinates reads score 0.0, "Low (<10%)", and the depletion layer 0.036 "Low (<5%)".

**Supporting facts:**
- Basins by footprint area: 243229 (18,607 km2), 243600 (11,300 km2), 243228 (3,171 km2), 243222 (1,990 km2), 243227 (261 km2), 243224 (240 km2), 243590 (32 km2). The brief names the Vuoksi-Saimaa/Ladoga system (North Karelia) and the Oulujoki system (Kainuu); the mapping of those names to these Pfafstetter ids was not checked against SYKE (UNVERIFIED).
- Precipitation 550-650 mm a year in North Karelia, to about 700 mm on watersheds (FMI); 690-770 mm projected for Kainuu this century.
- Water Act 587/2011 ch.2 s.1: water in wells and tanks belongs to the owner of the well; other open water and groundwater are controlled by the owner of the water or land area within the Act's limits. Groundwater abstraction above 250 m3 a day needs a permit.
- Shared lake and land areas are run by joint-area associations (osakaskunta) under the Joint Areas Act 758/1989.
- The Terrafame nickel-zinc mine at Sotkamo is the large industrial discharger found (Oulujoki basin); see soil.md and legal.md for the contamination regime.

**Practitioner-relevant nuance:** Lake frontage is the value and the constraint at once: building on a shore needs a plan (Land Use Act s.72), and the water belongs to private owners and joint-area associations, so a newcomer joins an osakaskunta rather than buying "the lake".

**Sources:**
1. WRI Aqueduct 4.0 Floods and Water Risk geodatabase (`Aq40_Y2023D07M05.gdb`, local copy). https://www.wri.org/aqueduct
2. Water Act 587/2011, Finlex. https://www.finlex.fi/fi/lainsaadanto/2011/587
3. Joint Areas Act 758/1989 (Yhteisaluelaki), Finlex. https://www.finlex.fi/fi/lainsaadanto/1989/758
4. FMI ilmasto-opas regional articles (see climate.md).
