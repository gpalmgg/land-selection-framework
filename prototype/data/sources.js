// Provenance and licence registry. One entry per data source the site shows a number from.
//
// Every cell, criterion and map layer points here with a `sourceId`; renderers print
//   Source name (link) · vintage · licence (link, or "licence not confirmed") · retrieved date · method chip
// and take the LICENCE from the registry (see licenseOf below), not from the criterion, so a cell
// whose source differs from its criterion's usual one (a UKCP18 climate cell, a national census) shows its own terms.
//
// Entry shape:
//   { name, short, url, license, licenseUrl | null, licenseStatus: 'confirmed' | 'unconfirmed',
//     checked: 'YYYY-MM-DD', attribution, version, licenseNote?, commercialUseNote? }
//
// Rules this file keeps:
//  * `confirmed` means the provider's own page was opened on `checked` and the licence label below is copied from it.
//    The label is the provider's wording; where the page names a licence without a version, that is said in licenseNote.
//  * `unconfirmed` means the page could not be opened or states nothing. The licence then reads exactly
//    "licence not confirmed". A licence is never inferred from a dataset's reputation, and the old attribution
//    strings that claim one are kept in licenseNote as claims, not as facts.
//  * Where an older string in the data (criterion licence, layer attribution) and the provider page disagree, the
//    stricter wording is used here; the differences are listed in the 2026-10 licence-conflicts evidence note.
//  * Land standing and Reciprocity stay qualitative; nothing in this file scores or ranks a source.
//
// `sourceAliases` maps every distinct `source` string used today by cells, criteria, land standing and region depth
// to a registry id. A composite string such as "Hansen GFC v1.11 / USDA FIA" maps to the globally registered
// dataset named in it; the second publisher stays visible in the cell's own `source` text.

export const SOURCES_CHECKED = '2026-10-05';

export const sources = {
  // ---------------------------------------------------------------- climate
  'worldclim-cmip6': {
    name: 'WorldClim 2.1, CMIP6 downscaled future climate',
    short: 'WorldClim 2.1',
    url: 'https://www.worldclim.org/data/cmip6/cmip6climate.html',
    license: 'WorldClim terms: free for academic and other non-commercial use; redistribution or commercial use needs prior permission',
    licenseUrl: 'https://www.worldclim.org/about.html',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Fick and Hijmans 2017; WorldClim 2.1',
    version: '2.1 (CMIP6 downscaled, SSP2-4.5)',
    licenseNote: 'Provider wording: "The data are freely available for academic use and other non-commercial use. Redistribution or commercial use is not allowed without prior permission." Maps made with WorldClim data may appear in published research articles.',
    commercialUseNote: 'Showing derived regional numbers in a non-commercial tool is within the terms. If the working group commercialises, ask for permission or swap to CHELSA (check its CC BY terms by opening its licence page first; not done here).',
  },

  // ---------------------------------------------------------------- water
  'aqueduct-40': {
    name: 'WRI Aqueduct 4.0 Water Risk',
    short: 'WRI Aqueduct 4.0',
    url: 'https://www.wri.org/data/aqueduct-global-maps-40-data',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Source: WRI Aqueduct 4.0, World Resources Institute, accessed on the retrieval date shown',
    version: '4.0 (2023)',
    licenseNote: 'The dataset page lists "License: Creative Commons" without a version. The version comes from WRI\'s Open Data Commitment ("We have adopted the Creative Commons Attribution 4.0 International License as our standard license for publications and data") and the Aqueduct FAQ ("The Aqueduct 4.0 database is licensed through Creative Commons ... as long as there is attribution"). Both opened 2026-10-05.',
  },
  'aqueduct-floods': {
    name: 'WRI Aqueduct Floods (GLOFRIS; Winsemius, Ward, Luo), tiles via the UNICEF CCRI ArcGIS rehost',
    short: 'Aqueduct Floods',
    url: 'https://www.wri.org/data/aqueduct-floods-hazard-maps',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'WRI Aqueduct Floods (GLOFRIS; Winsemius, Ward, Luo); tiles via the UNICEF Children\'s Climate Risk Index datasets',
    version: 'Aqueduct Floods (2020 release); river flooding historical, RCP4.5, RCP8.5; coastal RCP8.5',
    licenseNote: 'The WRI Floods dataset page (opened) carries no licence field, and the rehosted ArcGIS items (owner ddh_EXTERNAL) carry no licence text either. WRI says CC BY 4.0 is its standard licence for data (Open Data Commitment), which is a likely but unstated answer for this dataset. Rehost provenance: the tiles are served by a third party, not by WRI.',
  },

  // ---------------------------------------------------------------- soil
  'soilgrids-2': {
    name: 'ISRIC SoilGrids 2.0',
    short: 'SoilGrids 2.0',
    url: 'https://www.isric.org/explore/soilgrids',
    license: 'CC BY 4.0',
    licenseUrl: 'https://www.isric.org/explore/soilgrids',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'ISRIC World Soil Information, SoilGrids 2.0 (Poggio et al. 2021)',
    version: '2.0',
    licenseNote: 'ISRIC page: "The SoilGrids maps are publicly available on the SoilGrids website under the CC-BY 4.0 License."',
  },
  'isric-wms': {
    name: 'ISRIC SoilGrids web map service (maps.isric.org), soil organic carbon 0-30 cm',
    short: 'ISRIC WMS',
    url: 'https://maps.isric.org/',
    license: 'CC BY 4.0',
    licenseUrl: 'https://www.isric.org/explore/soilgrids',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'ISRIC World Soil Information, SoilGrids 2.0',
    version: 'SoilGrids 2.0 ocs_0-30cm_mean',
    licenseNote: 'The service serves the SoilGrids 2.0 maps, which ISRIC states are published under CC-BY 4.0. The WMS GetCapabilities document says Fees "None" and AccessConstraints "None" and carries no separate licence text.',
  },

  // ---------------------------------------------------------------- forest
  'hansen-gfc': {
    name: 'Hansen/UMD/Google/USGS/NASA Global Forest Change',
    short: 'Hansen GFC',
    url: 'https://storage.googleapis.com/earthenginepartners-hansen/GFC-2023-v1.11/download.html',
    license: 'CC BY 4.0',
    licenseUrl: 'https://storage.googleapis.com/earthenginepartners-hansen/GFC-2023-v1.11/download.html',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Source: Hansen/UMD/Google/USGS/NASA (Hansen et al. 2013, Science 342:850-853)',
    version: 'v1.11 (2000-2023)',
    licenseNote: 'Provider page: "licensed under a Creative Commons Attribution 4.0 International License ... even commercially".',
  },
  'gfw-umd-loss': {
    name: 'Global Forest Watch, UMD tree cover loss (tile service)',
    short: 'GFW tree cover loss',
    url: 'https://data-api.globalforestwatch.org/dataset/umd_tree_cover_loss',
    license: 'CC BY 4.0',
    licenseUrl: 'http://creativecommons.org/licenses/by/4.0/',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Hansen/UMD/Google/USGS/NASA, via Global Forest Watch',
    version: 'umd_tree_cover_loss v1.13',
    licenseNote: 'The Global Forest Watch data API record for umd_tree_cover_loss gives "license": "CC BY 4.0".',
  },

  // ---------------------------------------------------------------- energy
  'gsa-pvout': {
    name: 'Global Solar Atlas (World Bank Group / ESMAP / Solargis), PV power potential',
    short: 'Global Solar Atlas',
    url: 'https://globalsolaratlas.info',
    license: 'CC BY 4.0, with a mandatory addition: any conflict under the licence goes to WIPO mediation and then UNCITRAL arbitration',
    licenseUrl: 'https://globalsolaratlas.info/support/terms-of-use',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Data obtained from the Global Solar Atlas 2.0, a free web application developed and operated by Solargis s.r.o. on behalf of the World Bank Group, utilizing Solargis data, with funding provided by the Energy Sector Management Assistance Program (ESMAP). https://globalsolaratlas.info',
    version: 'v2.7',
    licenseNote: 'Terms of use: "The Works are licensed under the Creative Commons 4.0 Attribution International license, CC BY 4.0, except where expressly stated that another license applies, with the following mandatory and binding addition" (the WIPO mediation / UNCITRAL arbitration clause).',
  },

  // ---------------------------------------------------------------- population and land
  'ghsl-pop-r2023a': {
    name: 'JRC Global Human Settlement Layer, GHS-POP R2023A',
    short: 'GHS-POP R2023A',
    url: 'https://human-settlement.emergency.copernicus.eu/ghs_pop2023.php',
    license: 'CC BY 4.0',
    licenseUrl: 'https://human-settlement.emergency.copernicus.eu/faq.php',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'European Commission, Joint Research Centre (JRC), GHSL; reuse authorised with proper acknowledgment of the source',
    version: 'R2023A (1975-2030)',
    licenseNote: 'GHSL FAQ: "The GHSL data are provided under the Creative Commons Attribution 4.0 International (CC BY 4.0) license." The same page cites the European Commission Reuse and Copyright Notice. The old criterion string "Open (JRC)" is superseded.',
  },
  'gpw-v4': {
    name: 'SEDAC Gridded Population of the World v4.11, population density (NASA Earthdata / GIBS tiles)',
    short: 'GPW v4.11',
    url: 'https://www.earthdata.nasa.gov/data/catalog/sedac-ciesin-sedac-gpwv4-popdens-r11-4.11',
    license: 'Openly shared, without restriction, in accordance with the EOSDIS Data Use and Citation Guidance',
    licenseUrl: 'https://www.earthdata.nasa.gov/data/catalog/sedac-ciesin-sedac-gpwv4-popdens-r11-4.11',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'CIESIN, Columbia University, SEDAC: Gridded Population of the World v4.11, via NASA GIBS',
    version: 'v4.11 (2020 population density)',
    licenseNote: 'NASA Earthdata catalog page wording. The map attribution in the layer registry says "CC-BY 4.0"; that wording was not found on the page opened (the SEDAC site itself timed out), so it is not repeated here.',
  },
  'viirs-black-marble': {
    name: 'NASA Black Marble (VIIRS night lights), via NASA GIBS',
    short: 'Black Marble',
    url: 'https://blackmarble.gsfc.nasa.gov/',
    license: 'Available through NASA\'s open science policy',
    licenseUrl: 'https://blackmarble.gsfc.nasa.gov/',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'NASA Earth Observatory; NOAA; DoD; Black Marble 2016 (via NASA GIBS)',
    version: 'Black Marble 2016 composite, GIBS Level 8',
    licenseNote: 'Black Marble page: "Data are available through NASA\'s open science policy". NASA GIBS describes its imagery as served "in a free, open, and interoperable manner". No named licence (such as CC BY) is stated.',
  },
  'malaria-atlas-travel': {
    name: 'Malaria Atlas Project, travel time to cities 2015 (Weiss et al. 2018)',
    short: 'MAP travel time',
    url: 'https://malariaatlas.org/project-resources/accessibility-to-cities/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Malaria Atlas Project; Weiss et al. 2018, Nature 553:333-336',
    version: '2015 travel time to cities',
    licenseNote: 'The project page and the GeoServer capabilities (Fees "none", AccessConstraints "none") state no licence. The layer registry attribution says "CC-BY 4.0"; that is a claim not found on the pages opened.',
  },
  'esri-sentinel2-lc': {
    name: 'Esri / Impact Observatory / Microsoft Sentinel-2 10 m Land Use/Land Cover (Esri image service)',
    short: 'Esri 10 m land cover',
    url: 'https://www.arcgis.com/home/item.html?id=cfcb7609de5f478eb7666240902d4d3d',
    license: 'Esri Master License Agreement (the image service); the source land-cover data is licensed CC BY 4.0',
    licenseUrl: 'https://www.arcgis.com/home/item.html?id=cfcb7609de5f478eb7666240902d4d3d',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Esri, Impact Observatory, Microsoft',
    version: 'Sentinel-2 10m Land Use/Land Cover Time Series',
    licenseNote: 'Esri item page: "This work is licensed under the Esri Master License Agreement." and "The source LULC data is licensed under a Creative Commons by Attribution (CC BY 4.0) license." The layer attribution that said only CC-BY 4.0 described the source data, not the service terms.',
  },
  'esa-worldcover-2021': {
    name: 'ESA WorldCover 2021 v2 (Terrascope WMTS)',
    short: 'ESA WorldCover 2021',
    url: 'https://esa-worldcover.org/en/data-access',
    license: 'CC BY 4.0 ("free of charge, without restriction of use")',
    licenseUrl: 'https://esa-worldcover.org/en/data-access',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: '© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by the ESA WorldCover consortium',
    version: 'v200 (2021)',
    licenseNote: 'Provider page: "The ESA WorldCover product is provided free of charge, without restriction of use. For the full license information see the Creative Commons Attribution 4.0 International License."',
  },
  'ucdp-ged': {
    name: 'UCDP Georeferenced Event Dataset (GED)',
    short: 'UCDP GED',
    url: 'https://ucdp.uu.se/downloads/',
    license: 'CC BY 4.0',
    licenseUrl: 'https://ucdp.uu.se/downloads/',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Uppsala Conflict Data Program (UCDP), Georeferenced Event Dataset; cite the publications listed with each dataset',
    version: 'v25.1 (some cells still v24.1)',
    licenseNote: 'Provider page: "All datasets are free of charge and licensed under CC BY 4.0".',
  },
  'beck-koppen-2023': {
    name: 'Beck et al. 2023, Koppen-Geiger climate classification maps at 1 km, 1901-2099',
    short: 'Koppen-Geiger (Beck 2023)',
    url: 'https://doi.org/10.6084/m9.figshare.21789074',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Beck, H.E. et al. (2023) High-resolution (1 km) Koppen-Geiger maps for 1901-2099 based on constrained CMIP6 projections. Scientific Data 10:724',
    version: 'Figshare v2',
    licenseNote: 'Figshare API record 21789074 gives license "CC BY 4.0" (https://creativecommons.org/licenses/by/4.0/).',
  },

  // ---------------------------------------------------------------- hazard layers
  'gem-seismic-2023': {
    name: 'GEM Global Seismic Hazard Map 2023 (NRCan-hosted ArcGIS service)',
    short: 'GEM seismic hazard',
    url: 'https://www.globalquakemodel.org/product/global-seismic-hazard-map',
    license: 'CC BY-NC-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'GEM Foundation, Global Seismic Hazard Map (version 2023.1)',
    version: '2023.1',
    licenseNote: 'Zenodo record 10.5281/zenodo.8409647 gives "cc-by-nc-sa-4.0". The ArcGIS service item says the product "is available under multiple Creative Commons licenses (depending on the format)", which may require Attribution, Non-commercial and ShareAlike. The map attribution that said only "CC-BY" is superseded.',
    commercialUseNote: 'Non-commercial: the item states a specific licence agreement is needed for commercial use. Keep the map layer off any commercial offer.',
  },

  // ---------------------------------------------------------------- map layers and basemaps
  'openlandmap-precip': {
    name: 'OpenLandMap, long-term mean precipitation (SM2RAIN)',
    short: 'OpenLandMap precipitation',
    url: 'https://openlandmap.org/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'OpenLandMap / OpenGeoHub; SM2RAIN precipitation',
    version: 'olm:precipitation_sm2rain_ltm (2007-2018)',
    licenseNote: 'The openlandmap.org front page and the GeoServer capabilities (Fees "none", AccessConstraints "none") state no licence. The layer registry attribution says CC-BY-SA 4.0; that is a claim not found on the pages opened.',
  },
  'esri-hillshade': {
    name: 'Esri World Hillshade',
    short: 'Esri World Hillshade',
    url: 'https://www.arcgis.com/home/item.html?id=1b243539f4514b6ba35e7d995890db1d',
    license: 'Esri Master License Agreement',
    licenseUrl: 'https://www.arcgis.com/home/item.html?id=1b243539f4514b6ba35e7d995890db1d',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Esri, Vantor, Airbus DS, USGS, NGA, NASA, CGIAR, N Robinson, NCEAS, NLS, OS, NMA, Geodatastyrelsen, Rijkswaterstaat, GSA, Geoland, FEMA, Intermap and the GIS user community',
    version: 'World Hillshade map service',
    licenseNote: 'Item page: "This work is licensed under the Esri Master License Agreement." The item also says the layer is not intended for exporting tiles for offline use.',
  },
  'eox-s2cloudless': {
    name: 'EOxCloudless Sentinel-2 cloudless mosaic, 2021 (EOX WMTS)',
    short: 'EOxCloudless 2021',
    url: 'https://cloudless.eox.at/',
    license: 'CC BY-NC-SA 4.0 (EOxCloudless WM(T)S layers 2018-2025: free for non-commercial use with attribution)',
    licenseUrl: 'https://cloudless.eox.at/license-non-commercial',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'EOxCloudless https://cloudless.eox.at by EOX IT Services GmbH (Contains modified Copernicus Sentinel data 2021)',
    version: 's2cloudless 2021',
    licenseNote: 'EOX licence page: "For the years 2018 to 2025, EOxCloudless WM(T)S layers is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License." Only the 2016 layer is CC BY 4.0. The old attribution said only "EOX IT Services GmbH · Copernicus / ESA".',
    commercialUseNote: 'Commercial use (web services, dashboards, client-facing work, consulting deliverables) needs an EOX Commercial Attribution-RestrictedUse 1.2 licence. Switch the satellite layer or buy the licence before commercialising.',
  },
  'opentopomap': {
    name: 'OpenTopoMap',
    short: 'OpenTopoMap',
    url: 'https://opentopomap.org/about',
    license: 'CC-BY-SA',
    licenseUrl: 'https://opentopomap.org/about',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Kartendaten: © OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: © OpenTopoMap (CC-BY-SA)',
    version: 'tile service',
    licenseNote: 'Provider page (German): "OpenTopoMap steht unter der Lizenz CC-BY-SA". No licence version is stated on the page. Required credit text: "Kartendaten: OpenStreetMap-Mitwirkende, SRTM | Kartendarstellung: OpenTopoMap (CC-BY-SA)". Map data is OpenStreetMap (ODbL, see osm-odbl) and SRTM.',
  },
  'osm-odbl': {
    name: 'OpenStreetMap contributors',
    short: 'OpenStreetMap',
    url: 'https://www.openstreetmap.org/copyright',
    license: 'Open Data Commons Open Database License (ODbL) 1.0',
    licenseUrl: 'https://www.openstreetmap.org/copyright',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: '© OpenStreetMap contributors',
    version: 'rolling',
    licenseNote: 'Provider page: "OpenStreetMap is open data, licensed under the Open Data Commons Open Database License (ODbL) by the OpenStreetMap Foundation (OSMF)." Credit OpenStreetMap and its contributors; share-alike applies to altered or extended data.',
  },

  // ---------------------------------------------------------------- bioregion context

  // ---------------------------------------------------------------- the suite's own data and community directories
  'living-atlas-wave1': {
    name: 'Living Atlas Baseline Census, wave 1',
    short: 'Living Atlas wave 1',
    url: 'https://atlas.regencommunity.tools',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Living Atlas Baseline Census wave 1, the regen-community suite\'s own dataset',
    version: 'wave 1, frozen 2026-07-24, SHA-256 359f06ebd29eefaaa99dfe56c33f39a871136c2987b4b6f1170e5203f9201178',
    licenseNote: 'The suite\'s own dataset: reuse terms are set by the working group and are not stated on the page opened. It is a floor of web-verifiable activity, not a census.',
  },
  'community-project-pages': {
    name: 'Project and community websites cited for individual sites (Cloughjordan, Lilleoru, Sieben Linden, Terre & Humanisme, Mihai Eminescu Trust, Bioland-Suedtirol, Asturias Biosphere Reserves)',
    short: 'Project websites',
    url: 'https://ecovillage.org/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Each project or organisation named in the cell\'s source text; used for facts, not republished',
    version: 'as retrieved',
    licenseNote: 'Organisation websites are editorial pages. A fact is cited with its link; the page text is not copied or redistributed.',
  },

  // ---------------------------------------------------------------- national and regional statistics offices

  // ---------------------------------------------------------------- governments, statutes, planning and land-market publications
  'welsh-government': {
    name: 'Welsh Government (gov.wales), planning policy including TAN 6 One Planet Development',
    short: 'Welsh Government',
    url: 'https://www.gov.wales/planning-permission-one-planet-developments-open-countryside',
    license: 'Open Government Licence',
    licenseUrl: 'https://www.gov.wales/copyright-statement',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Welsh Government (Crown copyright)',
    version: 'as retrieved',
    licenseNote: 'Copyright statement: "You may use and re-use the information featured in this website (not including logos) free of charge in any format or medium, under the terms of the Open Government Licence". No OGL version is stated.',
  },
  'official-statutes-eu': {
    name: 'Official statutes and gazettes, Europe (Portugal DRE, Galicia DOG / Spanish BOE, Romania legislatie.just.ro, South Tirol Lexbrowser, Germany gesetze-im-internet, Estonia Riigi Teataja, Asturias)',
    short: 'Official statutes (Europe)',
    url: 'https://dre.pt/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'The official gazette or legislation portal named in the cell\'s source text',
    version: 'consolidated texts as retrieved',
    licenseNote: 'Official publication; reuse per the publisher. A statute is cited by name and link for orientation, not reproduced; the site states it is not legal advice.',
  },
  'official-statutes-na': {
    name: 'Official statutes and legal databases, North America (BC Laws, CanLII, Quebec, Oregon, North Carolina, New Mexico via Justia, Wisconsin, Mexico Ley Agraria via Justia)',
    short: 'Official statutes (N. America)',
    url: 'https://www.bclaws.gov.bc.ca/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'The legislature, gazette or legal database named in the cell\'s source text (CanLII and Justia are third-party rehosts)',
    version: 'consolidated texts as retrieved',
    licenseNote: 'Official publication; reuse per the publisher. Cited by name and link for orientation, not reproduced.',
  },
  'official-planning-guidance': {
    name: 'Government planning, tax and programme pages (Cork County Council development plan, Vermont Act 250 and Current Use, Wisconsin use-value assessment, Nova Scotia Finance)',
    short: 'Planning and tax guidance',
    url: 'https://www.corkcoco.ie/en/cork-county-development-plan-2022-2028',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'The authority named in the cell\'s source text',
    version: 'as retrieved',
    licenseNote: 'Official publication; reuse per the publisher. Cited by name and link, not reproduced.',
  },
  'land-market-reports': {
    name: 'Land-market reports (SAFER Occitanie, Spanish MAPA, USDA NASS Land Values, Farm Credit Canada)',
    short: 'Land-market reports',
    url: 'https://www.nass.usda.gov/Publications/Todays_Reports/reports/land0824.pdf',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'The publisher named in the cell\'s source text',
    version: 'as retrieved',
    licenseNote: 'Published price statistics; reuse per the publisher. Figures are cited with their link and year.',
  },
};

// Registry entries researched in 2026-10 that no shipped cell, trajectory, layer, context, legal-pathway, Land standing or depth entry names
// today (regional census offices, national climate services and basemap vendors that the final data replaced with the global datasets).
// Kept out of `sources` so the registry holds only what is used (tests/sources.test.mjs fails orphans under REQUIRE_V2); move an entry
// back into `sources`, and add its alias, when a cell or layer starts to cite it.
export const reserveSources = {
  'worldclim-hist': {
    name: 'WorldClim 2.1, historical climate 1970-2000',
    short: 'WorldClim 2.1 (historical)',
    url: 'https://www.worldclim.org/data/worldclim21.html',
    license: 'WorldClim terms: free for academic and other non-commercial use; redistribution or commercial use needs prior permission',
    licenseUrl: 'https://www.worldclim.org/about.html',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Fick and Hijmans 2017; WorldClim 2.1',
    version: '2.1 (historical monthly climate 1970-2000)',
    licenseNote: 'Same terms page as the CMIP6 files.',
    commercialUseNote: 'Same as worldclim-cmip6: fine for a non-commercial tool; ask permission or swap to CHELSA (licence page not yet opened) before commercialising.',
  },
  'met-office-ukcp18': {
    name: 'Met Office UKCP18 climate projections',
    short: 'UKCP18',
    url: 'https://www.metoffice.gov.uk/research/approach/collaboration/ukcp/summaries/climate-change-projections-over-land',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Met Office UKCP18 (Crown copyright)',
    version: 'UKCP18',
    licenseNote: 'The provider pages that could be opened state no licence for the summary figures. Not inferred.',
  },
  'meteo-france-drias': {
    name: 'Meteo-France DRIAS future climate',
    short: 'DRIAS',
    url: 'https://meteofrance.com/changement-climatique/quel-climat-futur/le-climat-futur-en-france',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Meteo-France, DRIAS',
    version: 'DRIAS',
    licenseNote: 'The DRIAS and Meteo-France pages opened state no licence for the quoted figures.',
  },
  'met-eireann-translate': {
    name: 'EPA Research 471, Met Eireann TRANSLATE high-resolution climate projections for Ireland',
    short: 'EPA / Met Eireann TRANSLATE',
    url: 'https://www.epa.ie/publications/research/climate-change/research-471-updated-high-resolution-climate-projections-for-ireland.php',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Environmental Protection Agency (Ireland), Research 471; Met Eireann TRANSLATE',
    version: 'EPA Research 471',
    licenseNote: 'Report page not opened for licence terms.',
  },
  'adaptwest-climatena': {
    name: 'AdaptWest / ClimateNA climate normals and projections for North America',
    short: 'AdaptWest ClimateNA',
    url: 'https://adaptwest.databasin.org/pages/adaptwest-climatena/',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'AdaptWest Project, ClimateNA (credit the creator)',
    version: 'ClimateNA via AdaptWest',
    licenseNote: 'The AdaptWest ClimateNA page states "These data are made available under a CC-BY 4.0 license."',
  },
  'noaa-nca5': {
    name: 'NOAA NCEI / Fifth National Climate Assessment (NCA5) regional chapters',
    short: 'NOAA NCA5',
    url: 'https://www.ncei.noaa.gov/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'NOAA NCEI; U.S. Global Change Research Program, NCA5',
    version: 'NCA5',
    licenseNote: 'No licence statement was found on the pages opened. US federal publications are often unrestricted, but that is not inferred here.',
  },
  'ouranos-cmip6': {
    name: 'Ouranos CMIP6 regional climate analysis (Quebec)',
    short: 'Ouranos',
    url: 'https://www.ouranos.ca/en',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Ouranos consortium',
    version: 'CMIP6 regional summary',
    licenseNote: 'Terms not opened.',
  },
  'wicci-cmip6': {
    name: 'Wisconsin Initiative on Climate Change Impacts (WICCI) CMIP6 summary',
    short: 'WICCI',
    url: 'https://wicci.wisc.edu/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Wisconsin Initiative on Climate Change Impacts (WICCI)',
    version: 'CMIP6 regional summary',
    licenseNote: 'Terms not opened.',
  },
  'hydrobasins': {
    name: 'HydroBASINS v1c (HydroSHEDS)',
    short: 'HydroBASINS',
    url: 'https://www.hydrosheds.org/products/hydrobasins',
    license: 'HydroSHEDS version 1 License Agreement: free for non-commercial and commercial use; distribution only as part of a derivative work, never as a stand-alone product',
    licenseUrl: 'https://data.hydrosheds.org/file/technical-documentation/HydroSHEDS_TechDoc_v1_4.pdf',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Lehner and Grill 2013, Hydrological Processes 27(15); HydroSHEDS (https://www.hydrosheds.org)',
    version: 'v1c, levels 05 and 06',
    licenseNote: 'Provider page: "freely available for scientific, educational and commercial use ... distributed under the same license agreement as the HydroSHEDS core products". The agreement text (Appendix A of the technical documentation v1.4, opened) restricts distribution as a stand-alone product. Used for analysis only; no HydroBASINS polygons are shipped.',
  },
  'esri-canvas-basemap': {
    name: 'Esri World Light Gray and Dark Gray Canvas (base and reference tiles)',
    short: 'Esri Gray Canvas',
    url: 'https://www.arcgis.com/home/item.html?id=979c6cc89af9449cbeb5342a439c6a76',
    license: 'Esri Master License Agreement',
    licenseUrl: 'https://www.arcgis.com/home/item.html?id=979c6cc89af9449cbeb5342a439c6a76',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Esri, TomTom, Garmin, FAO, NOAA, USGS, © OpenStreetMap contributors, and the GIS User Community',
    version: 'Light Gray Canvas / Dark Gray Canvas map services',
    licenseNote: 'Item pages (Light and Dark Gray Canvas): "This work is licensed under the Esri Master License Agreement." The service copyright text reads "Esri, HERE, Garmin, (c) OpenStreetMap contributors, and the GIS user community". Attribution must be displayed with the map.',
    commercialUseNote: 'Esri\'s developer documentation presents API-key authentication as the route for applications that use its services; the keyless tile URLs used here are governed by the Esri Master License Agreement and carry no promise of continued free availability on the pages opened. For production use at scale, prefer a keyed Esri account or a fallback basemap (openfreemap-positron).',
  },
  'openfreemap-positron': {
    name: 'OpenFreeMap Positron (failover basemap)',
    short: 'OpenFreeMap',
    url: 'https://openfreemap.org/',
    license: 'MIT (the OpenFreeMap project); map data from OpenStreetMap, ODbL 1.0',
    licenseUrl: 'https://openfreemap.org/',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'OpenFreeMap © OpenMapTiles Data from OpenStreetMap',
    version: 'positron style, OpenMapTiles schema',
    licenseNote: 'Provider page: "The license of this project is MIT. Map data is from OpenStreetMap." and "Attribution is required. ... OpenFreeMap © OpenMapTiles Data from OpenStreetMap. You do not need to display the OpenFreeMap part, but it is nice if you do."',
  },
  'openmaptiles': {
    name: 'OpenMapTiles vector tile schema',
    short: 'OpenMapTiles',
    url: 'https://openmaptiles.org/docs/',
    license: 'BSD + CC-BY (the schema); OpenStreetMap data stays under ODbL',
    licenseUrl: 'https://openmaptiles.org/docs/',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: '© OpenMapTiles © OpenStreetMap contributors',
    version: 'schema',
    licenseNote: 'Provider page: "The OpenMapTiles vector tile schema is open source and licensed under BSD + CC-BY ... you are still obliged to follow the original ODbL license and attribute OpenStreetMap data properly as well as attribute the OpenMapTiles project itself."',
  },
  'resolve-ecoregions-2017': {
    name: 'RESOLVE Ecoregions 2017 (Dinerstein et al.)',
    short: 'RESOLVE Ecoregions 2017',
    url: 'https://ecoregions.appspot.com/',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Dinerstein, E. et al. (2017) An Ecoregion-Based Approach to Protecting Half the Terrestrial Realm. BioScience 67(6):534-545',
    version: '2017',
    licenseNote: 'Provider page: "Download data: Shapefile (150mb zip) Licensed under CC-BY 4.0".',
  },
  'natural-earth': {
    name: 'Natural Earth (vector and raster map data)',
    short: 'Natural Earth',
    url: 'https://www.naturalearthdata.com/',
    license: 'Public domain',
    licenseUrl: 'https://www.naturalearthdata.com/about/terms-of-use/',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Made with Natural Earth (free vector and raster map data, naturalearthdata.com)',
    version: 'v5.x',
    licenseNote: 'Terms of use: "All versions of Natural Earth raster + vector map data found on this website are in the public domain."',
  },
  'gen-ecovillage-directory': {
    name: 'Global Ecovillage Network (GEN) directory and regional networks',
    short: 'GEN directory',
    url: 'https://ecovillage.org/projects/map/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Global Ecovillage Network (GEN) and its regional networks (GEN Canada, NuMundo); the cell names the page used',
    version: 'directory entries as retrieved',
    licenseNote: 'The ecovillage.org pages opened state no reuse licence. The old criterion string "GEN open data; ODbL" is a claim not found there (ODbL belongs to the OpenStreetMap part, see osm-odbl).',
  },
  'fic-directory': {
    name: 'Foundation for Intentional Community (FIC) Communities Directory, ic.org',
    short: 'FIC directory',
    url: 'https://www.ic.org/community-directory/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Foundation for Intentional Community, Communities Directory (ic.org)',
    version: 'directory entries as retrieved',
    licenseNote: 'No reuse licence found on the directory page opened.',
  },
  'statistical-office-pt': {
    name: 'Statistics Portugal (INE), Censos 2021',
    short: 'INE Portugal',
    url: 'https://www.ine.pt/scripts/db_censos_2021.html',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Instituto Nacional de Estatistica (Statistics Portugal), Censos 2021',
    version: 'Censos 2021',
    licenseNote: 'Official publication; reuse per the publisher. The INE pages opened state no licence text.',
  },
  'statistical-office-es-galicia': {
    name: 'Instituto Galego de Estatistica (IGE)',
    short: 'IGE Galicia',
    url: 'https://www.ige.gal/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Instituto Galego de Estatistica (IGE)',
    version: 'as retrieved',
    licenseNote: 'Official publication; reuse per the publisher. The legal-notice page could not be rendered.',
  },
  'statistical-office-es-asturias': {
    name: 'SADEI, Sociedad Asturiana de Estudios Economicos e Industriales (Asturias statistics)',
    short: 'SADEI',
    url: 'https://www.sadei.es/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'SADEI, estadisticas de Asturias',
    version: 'as retrieved',
    licenseNote: 'Official publication; reuse per the publisher. No licence text found on the pages opened.',
  },
  'statistical-office-ro': {
    name: 'Romanian National Institute of Statistics (INS), Population and Housing Census 2021',
    short: 'INS Romania',
    url: 'https://www.recensamantromania.ro/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Institutul National de Statistica (Romania), Recensamantul Populatiei 2021',
    version: 'Census 2021',
    licenseNote: 'Official publication; reuse per the publisher. The INS site returned an error page when opened.',
  },
  'statistical-office-ie': {
    name: 'Central Statistics Office (CSO) Ireland, Census 2022',
    short: 'CSO Ireland',
    url: 'https://www.cso.ie/en/census/census2022/',
    license: 'CC BY 4.0',
    licenseUrl: 'https://www.cso.ie/en/aboutus/whoweare/copyrightpolicy/',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Central Statistics Office (Ireland); acknowledge the source',
    version: 'Census 2022',
    licenseNote: 'CSO copyright policy: "Statistical information on this website is accessible free of charge and licensed under Creative Commons Attribution (CC BY 4.0)."',
  },
  'statistical-office-uk': {
    name: 'Office for National Statistics (ONS), Census 2021',
    short: 'ONS',
    url: 'https://www.ons.gov.uk/visualisations/customprofiles/build/',
    license: 'Open Government Licence (OGL); some ONS content is exempt',
    licenseUrl: 'https://www.ons.gov.uk/help/termsandconditions',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Office for National Statistics, Census 2021 (Crown copyright)',
    version: 'Census 2021',
    licenseNote: 'ONS terms: "Most content on this website is subject to Crown copyright protection and is published under the Open Government Licence (OGL). Some content is exempt from the OGL." The page does not state an OGL version.',
  },
  'statistical-office-fr': {
    name: 'INSEE (Institut national de la statistique et des etudes economiques)',
    short: 'INSEE',
    url: 'https://www.insee.fr/',
    license: 'Licence Ouverte / Open Licence version 2.0 (Etalab)',
    licenseUrl: 'https://www.insee.fr/fr/information/2008466',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Source : Insee',
    version: 'as retrieved',
    licenseNote: 'INSEE legal page: public information on the site is made available "sous la Licence Ouverte / Open Licence version 2.0 (Etalab)", free reuse including commercial, crediting "Source : Insee" and the last-update date, without altering the meaning.',
  },
  'statistical-office-it-bz': {
    name: 'ASTAT, South Tirol provincial statistics institute',
    short: 'ASTAT',
    url: 'https://astat.provinz.bz.it/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'ASTAT, Landesinstitut fuer Statistik / Istituto provinciale di statistica, Provincia autonoma di Bolzano',
    version: 'as retrieved',
    licenseNote: 'Official publication; reuse per the publisher. The ASTAT page opened carries no licence text.',
  },
  'statistical-office-ee': {
    name: 'Statistics Estonia (Statistikaamet)',
    short: 'Statistics Estonia',
    url: 'https://www.stat.ee/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Statistikaamet (Statistics Estonia)',
    version: 'as retrieved',
    licenseNote: 'Official publication; reuse per the publisher. The terms-of-use pages tried returned "not found".',
  },
  'statistical-office-de-st': {
    name: 'Statistisches Landesamt Sachsen-Anhalt',
    short: 'Statistik Sachsen-Anhalt',
    url: 'https://www.statistik.sachsen-anhalt.de/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'Statistisches Landesamt Sachsen-Anhalt',
    version: 'as retrieved',
    licenseNote: 'Official publication; reuse per the publisher. No licence text found on the page opened.',
  },
  'statistical-office-ca': {
    name: 'Statistics Canada, Census of Population 2021',
    short: 'Statistics Canada',
    url: 'https://www12.statcan.gc.ca/census-recensement/2021/',
    license: 'Statistics Canada Open Licence',
    licenseUrl: 'https://www.statcan.gc.ca/en/terms-conditions/open-licence',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'Source: Statistics Canada, Census of Population 2021, used under the Statistics Canada Open Licence',
    version: 'Census 2021',
    licenseNote: 'Licence page: Statistics Canada "grants you a worldwide, royalty-free, non-exclusive licence to use, reproduce, publish, freely distribute, or sell the Information".',
  },
  'statistical-office-us': {
    name: 'US Census Bureau, 2020 Census / QuickFacts',
    short: 'US Census',
    url: 'https://www.census.gov/quickfacts/',
    license: 'licence not confirmed',
    licenseUrl: null,
    licenseStatus: 'unconfirmed',
    checked: '2026-10-05',
    attribution: 'U.S. Census Bureau, 2020 Census (cite the Census Bureau as the source)',
    version: '2020 Census',
    licenseNote: 'Official publication; reuse per the publisher. The Census citation page asks users to cite the Census Bureau as the source and states no named licence.',
  },
  'statistical-office-mx': {
    name: 'INEGI (Instituto Nacional de Estadistica y Geografia), Censo de Poblacion y Vivienda 2020',
    short: 'INEGI',
    url: 'https://en.www.inegi.org.mx/programas/ccpv/2020/',
    license: 'Terminos de Libre Uso de la Informacion del INEGI (INEGI free-use terms)',
    licenseUrl: 'https://www.inegi.org.mx/inegi/terminos.html',
    licenseStatus: 'confirmed',
    checked: '2026-10-05',
    attribution: 'INEGI, Censo de Poblacion y Vivienda 2020',
    version: 'Census 2020',
    licenseNote: 'INEGI terms page: "Puede utilizar la informacion del INEGI con apego a lo dispuesto en los Terminos de Libre Uso de la Informacion del INEGI."',
  },
};

// Every distinct `source` string used today by cells (regions.js and the North America staging values), criteria,
// land standing and region depth, mapped to a registry id. See the header for how composite strings were mapped.
export const sourceAliases = {};

const A = (id, ...labels) => { for (const l of labels) sourceAliases[l] = id; };

// climate
A('worldclim-cmip6',
  'WorldClim CMIP6 v2.1', 'WorldClim CMIP6 (SSP2-4.5)', 'WorldClim CMIP6 v2.1 / NCA5', 'WorldClim CMIP6 v2.1 / NOAA NCA5',
  'WorldClim CMIP6 v2.1 / NS climate assessment', 'WorldClim CMIP6 / Vázquez-Aguirre et al.');
// water, soil, forest, solar, conflict
A('aqueduct-40', 'WRI Aqueduct 4.0', 'WRI Aqueduct 4.0 / USGS');
A('soilgrids-2', 'SoilGrids 2.0 (ISRIC)', 'Adhikari et al. Geoderma / SoilGrids 2.0', 'SoilGrids 2.0 / NM rangeland studies',
  'SoilGrids 2.0 / NRCS OSD', 'SoilGrids 2.0 / SLC 3.2', 'SoilGrids 2.0 / SLC v3.2', 'SoilGrids 2.0 / Soil Landscapes of Canada',
  'SoilGrids 2.0 / UVM Soil Lab');
A('hansen-gfc', 'Hansen Global Forest Change v1.11', 'Hansen GFC v1.11 (pending)', 'Hansen GFC v1.11 / Statistics Québec',
  'Hansen GFC v1.11 / USDA FIA', 'Hansen GFC v1.11 / fire records', 'USDA FIA / Hansen GFC v1.11', 'USDA FS / Hansen GFC v1.11');
A('gsa-pvout', 'Global Solar Atlas v2.7', 'Global Solar Atlas v2.7 / NRCan', 'Global Solar Atlas v2.7 / NREL NSRDB',
  'Global Solar Atlas v2.7 / World Bank', 'CanmetENERGY / NRCan', 'NREL NSRDB / Global Solar Atlas v2.7');
A('ucdp-ged', 'UCDP GED v25.1', 'UCDP GED v24.1', 'UCDP GED v24.1 (pending)');
// regenerative network
A('living-atlas-wave1', 'Living Atlas baseline census, wave 1');
A('community-project-pages', 'Cloughjordan Ecovillage', 'Lilleoru Centre', 'Ökodorf Sieben Linden', 'Terre & Humanisme',
  'Mihai Eminescu Trust, Saxon villages', 'Bioland-Südtirol', 'Reservas de la Biosfera de Asturias');
// population
A('ghsl-pop-r2023a', 'JRC GHSL POP R2023A', 'JRC GHSL R2023', 'JRC GHSL / US Census');
// land standing and region depth
A('welsh-government', 'Welsh Government, TAN 6 One Planet Development');
A('official-statutes-eu',
  'Portuguese Land Law DL 555/99 (consolidated, 2024)', 'Portuguese Land Law DL 555/99 (consolidated)',
  'Lei 13/1989 das Comunidades de Montes Veciñais en Man Común', 'Lei 13/1989, de montes veciñais en man común (texto consolidado, BOE)',
  'Legea 17/2014 (sale of agricultural land outside city limits)', 'Grundstücksverkehrsgesetz (GrdstVG)',
  'LP 17/2001, Legge provinciale sui masi chiusi / Höfegesetz', 'Decreto Legislativo 1/2004 (urbanismo Asturias)',
  'Restrictions on Acquisition of Immovables Act / KAOKS (consolidated)');
A('official-statutes-na',
  'ALR Use Regulation, BC Reg 30/2019', 'CanLII, SQ 2025, c 5 (Bill 86, assented March 25, 2025)',
  'Ley Agraria (1992, reformed), Artículos 76-82 and 98-107', 'NC General Statutes §§105-277.2 to 105-277.7, Present-Use Value Programme',
  'NC General Statutes §§105-277.2–105-277.7, Present-Use Value Programme',
  'New Mexico Statutes §73-2-28 (2025), Acequia and community ditch associations',
  'Oregon Revised Statutes Chapter 215, County Planning; Zoning; Farm Land', 'Wisconsin Statute §710.02, Foreign Ownership of Land');
A('official-planning-guidance',
  'Cork County Development Plan 2022 to 2028', 'Cork County Development Plan 2022–2028',
  'Act 250 Program and History, Vermont Land Use Review Board', 'Vermont Department of Taxes, Current Use Program',
  'Wisconsin Statute §70.32(2), Use-Value Agricultural Assessment',
  'Nova Scotia Finance, Non-Resident Provincial Deed Transfer Tax guidelines');
A('land-market-reports',
  'SAFER Occitanie, Le prix des terres 2024', 'USDA NASS, Land Values 2024 Summary',
  'MAPA, Precios medios anuales de las tierras de uso agrario, resultados 2024',
  'Farm Credit Canada, 2024 FCC Farmland Values Report (BC and Kootenay region)',
  'Farm Credit Canada, 2024 FCC Farmland Values Report (published March 2025)');

// Resolve a free-text `source` string (as printed in a cell, criterion, land standing or depth entry) to a registry id,
// or null when it is not a known string. Renderers should prefer an explicit `sourceId` on the cell.
export function sourceIdFor(sourceText) {
  return Object.prototype.hasOwnProperty.call(sourceAliases, sourceText) ? sourceAliases[sourceText] : null;
}

const NOT_CONFIRMED = 'licence not confirmed';
const text = (x) => (typeof x === 'string' && x.trim() ? x.trim() : null);

// Licence text for a cell: the cell's own override first, then its registry entry, then the criterion's licence.
// The registry beats the criterion, so a UKCP18 cell shows UKCP18's status (not WorldClim's terms), and an entry whose
// licence is unconfirmed says so. Pure and DOM-free, safe in Node and the edge runtime.
// `registry` is injectable for tests and for callers that load a different registry version.
export function licenseOf(cell, criterion, registry = sources) {
  const own = text(cell && cell.license);
  if (own) return own;
  const entry = cell && cell.sourceId ? registry[cell.sourceId] : null;
  const reg = entry && text(entry.license);
  if (reg) return reg;
  return text(criterion && criterion.license) || NOT_CONFIRMED;
}

// Link to the licence text (or null). Follows the same precedence as licenseOf; a cell-level licence override carries
// its own `licenseUrl` when it has one, never the registry's.
export function licenseUrlOf(cell, criterion, registry = sources) {
  if (cell && text(cell.license)) return text(cell.licenseUrl);
  const entry = cell && cell.sourceId ? registry[cell.sourceId] : null;
  if (entry && text(entry.license)) return entry.licenseUrl || null;
  return text(criterion && criterion.licenseUrl);
}
