# Climate — Bas-Saint-Laurent (St. Lawrence south shore), Canada (Québec)

**Headline finding:** A cold-maritime, boreal-mixed climate that WorldClim projects to warm by about 3.3 C between the 1970-2000 baseline (2.0 C) and 2041-2060 (5.3 C, SSP2-4.5 ensemble). It is cold by absolute value and warming by a large step against its own baseline.

**Key data point (with vintage):** 5.3 C mean annual temperature, 2041-2060, SSP2-4.5, WorldClim CMIP6 v2.1 BIO1 at 2.5 arc-minute, 17-GCM ensemble mean (GFDL-ESM4 file returned HTTP 404, so 17 of the 18 models used for other regions), zonal mean over the footprint (union of the eight MRCs, 22,188 km2 land area, 1,758 grid cells touched). Spread across the 17 models: 4.0 C (MPI-ESM1-2-HR) to 7.4 C (UKESM1-0-LL). Value at the suggested coordinates (-68.9, 47.9), 3x3-cell mean: 5.6 C (range 4.3 to 7.7). Retrieved 2026-10-04 from geodata.ucdavis.edu.

**Supporting facts:**
- Baseline: WorldClim 2.1 historical BIO1 (1970-2000), same footprint, zonal mean 2.04 C; 3x3 at the coordinates 2.33 C. Warming against that baseline: 5.33 - 2.04 = +3.29 C. The baseline period (1970-2000) differs from Ouranos' reference period (1991-2020), so the two figures are not interchangeable.
- Ouranos (opened 2026-10-04, https://www.ouranos.ca/en/climate-phenomena/temperatures-projected-changes): for southern Québec under the high-emissions scenario (SSP3-7.0), "average annual temperature increases of 2 to 3 C for 2050 and 4 to 6 C for 2080", relative to 1991-2020. Context only; not relabelled as SSP2-4.5.
- Global Solar Atlas TEMP layer (ERA, 1994-2025) at the coordinates: 3.8 C; elevations of the 315 sample points range from -4 m to 931 m (mean 316 m, p10-p90 134-484 m).
- The grid cell is about 4.6 km by 3.1 km at this latitude, finer than the 10-minute grids some earlier regions used; the footprint is large (about 150 km by 220 km), so the spread of the model ensemble (3.4 C) is larger than the spread across the footprint.

**Forest and disturbance (state + trajectory for the forest_change criterion):**
- Hansen Global Forest Change v1.11 (2001-2023), footprint masked (tiles 50N_080W and 50N_070W), year-2000 canopy of 30 percent or more: 84.4 percent of the footprint is forest by that definition (37.0 million 30 m pixels of 43.8 million). Loss 2001-2023: 16.05 percent of that forest; gain (2000-2012, all pixels): 8.15 percent of that forest; net = (8.15 - 16.05) / 2.3 decades = -3.44 percent per decade.
- Loss by year (percent of year-2000 forest): 0.37-0.84 per year in 2001-2012 (sum 6.47), then 0.51-1.03 per year in 2013-2023 (sum 9.57), with 2016-2023 all at 0.88-1.03. The mean annual pace rose about 60% after 2013 (0.54 to 0.87 per year); 2016-2023 ran at 1.6 to 1.9 times the 2001-2012 mean.
- Québec's Ministère des Ressources naturelles et des Forêts aerial survey of spruce budworm defoliation (Données Québec, "Tordeuse des bourgeons de l'épinette", file 2007-2013; the 1.2 GB 2014-today file was not processed in this run): inside the footprint, no mapped defoliation 2007-2011; 9,436 ha in 2012 and 61,184 ha in 2013 (light 43,924 ha, moderate 16,856 ha, severe 403 ha in 2013). The outbreak therefore reached this region in 2012-2013 (later years not measured here), which coincides with the acceleration in Hansen loss. The coincidence is not a causal proof: Hansen loss includes harvest, and salvage logging after the outbreak would also raise it.
- Hansen's gain layer covers 2000-2012 only and loss includes harvest-and-regrow cycles, so the net is a loss-leaning proxy, flagged the same way for every region.

**Practitioner-relevant nuance:** Absolute cold sets the growing season; a +3.3 C shift changes what grows where, and the Québec bioclimatic-domain boundaries (balsam fir-white birch versus sugar maple-yellow birch) named in the brief were not opened in this run, so no claim about a domain shift is made. Winter warming, freeze-thaw and estuary ice-cover loss and coastal erosion were NOT verified from an opened source in this run; they stay as gaps (see data-notes.md).

**Sources:**
1. WorldClim 2.1 CMIP6 downscaled projections, 2.5 min, SSP2-4.5, 2041-2060, per GCM: https://geodata.ucdavis.edu/cmip6/2.5m/<GCM>/ssp245/wc2.1_2.5m_bioc_<GCM>_ssp245_2041-2060.tif (opened by script 2026-10-04; method page https://www.worldclim.org/data/cmip6/cmip6climate.html).
2. WorldClim 2.1 historical bio variables, 2.5 min: https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_2.5m_bio.zip (BIO1).
3. Ouranos, Temperatures: projected changes: https://www.ouranos.ca/en/climate-phenomena/temperatures-projected-changes (opened 2026-10-04).
4. Hansen et al., Global Forest Change v1.11 (2001-2023): https://storage.googleapis.com/earthenginepartners-hansen/GFC-2023-v1.11/ (tiles 50N_080W, 50N_070W; opened by script).
5. MRNF Québec, Données sur les perturbations naturelles, spruce budworm: https://www.donneesquebec.ca/recherche/dataset/donnees-sur-les-perturbations-naturelles-insecte-tordeuse-des-bourgeons-de-lepinette (file TBE_Donnees_2007-2013.zip on diffusion.mffp.gouv.qc.ca; TBE_Donnees_2014-aujourdhui.zip is 1.2 GB and was not processed).
6. Global Solar Atlas LTA API (TEMP, ELE): https://api.globalsolaratlas.info/data/lta (retrieved 2026-10-04).
