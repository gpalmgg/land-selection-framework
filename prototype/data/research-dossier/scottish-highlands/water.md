# Water — Highlands (north-west Scotland), UK

**Headline finding:** Water stress is as low as the Aqueduct data goes: the 2050 business-as-usual withdrawal-to-supply ratio is 0.005 for the whole footprint, category Low (below 10 percent). The live questions are not scarcity but who supplies the water: public mains in the settlements and private supplies almost everywhere else.

**Key data point (with vintage):** WRI Aqueduct 4.0 (Aq40_Y2023D07M05.gdb, layer future_annual), field bau50_ws_x_r (business-as-usual 2050, withdrawals over available supply, raw ratio). Footprint intersected with HydroBASINS level-6 basins in an equal-area projection (EPSG:3035): two basins cover 11,606.1 km2 of the 11,606.6 km2 footprint. Basin 233023 covers 11,599.9 km2 (ratio 0.004923); basin 233024 covers 6.2 km2 (0.010085). Area-weighted mean **0.0049**, category Low (<10%) throughout. Baseline (bws_raw) area-weighted mean 0.0048. The Small Isles are masked (not in the footprint), so Aqueduct's small-island no-data does not arise. Computed 2026-10-04.

**Supporting facts:**
- Around 3 percent of Scotland's population drink from private water supplies not run by Scottish Water, mostly in remote and rural areas, from lochs, streams or boreholes (Scottish Government, DWQR). The Private Water Supplies (Scotland) Regulations 2006 are the regulating instrument named by the Drinking Water Quality Regulator. The Scottish Government funds councils to run a private supply grant scheme of up to GBP 800 per eligible person. A Highland-specific share was not found.
- Abstraction and engineering works used to fall under the Water Environment (Controlled Activities) (Scotland) Regulations 2011 (CAR). legislation.gov.uk now marks CAR 2011 as revoked on 1 November 2025 by the Environmental Authorisations (Scotland) Amendment Regulations 2025 (SSI 2025/165), whose Schedule 23 carries transitional provisions for existing water use licences and registrations under the 2018 Environmental Authorisations Regulations. What each abstraction threshold now is was not opened: UNVERIFIED.
- Scottish Water's own pages returned 403 to scripted requests and were not opened; its public ownership is therefore stated only as common knowledge and is UNVERIFIED here.

**Practitioner-relevant nuance:** The ratio is a regional basin figure and says nothing about whether a particular glen's burn runs in a dry May: the Adaptation Scotland summary projects summer rainfall down 8 percent by 2050 on a high pathway and drought events more frequent. The practical rule is the one the data cannot show: a supply is a source, a landowner's consent and a maintenance burden. A community landowner's housing or plot may or may not come with a mains connection.

**Sources:**
1. WRI Aqueduct 4.0 data. https://www.wri.org/data/aqueduct-global-maps-40-data
2. Scottish Government, private water supplies. https://www.gov.scot/policies/water/private-water-supplies/
3. Drinking Water Quality Regulator for Scotland, private water supplies. https://dwqr.scot/private-water-supplies/
4. legislation.gov.uk, Water Environment (Controlled Activities) (Scotland) Regulations 2011, introduction (revoked 1.11.2025). https://www.legislation.gov.uk/ssi/2011/209/introduction
5. legislation.gov.uk, Environmental Authorisations (Scotland) Amendment Regulations 2025 (SSI 2025/165). https://www.legislation.gov.uk/ssi/2025/165/contents
6. Adaptation Scotland, Climate Projections for Scotland - Summary (August 2025). https://adaptation.scot/app/uploads/2025/08/low-res-6440-climate-projections-report-aug-25.pdf
