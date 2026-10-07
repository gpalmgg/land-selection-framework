import bio_env
import json
d=json.load(open('out/final/bioregions.json'))
hdr='''// Per-region bioregion membership. QUALITATIVE CONTEXT ONLY: never scored, filtered on, ranked or composited.
// Generated 2026-10-04 by prototype/scripts/bio/make_bioregions_js.py + emit_js.py (re-run to refresh).
//
// Ecoregion membership is computed, not hand-typed: RESOLVE Ecoregions 2017 polygons intersected with a
// 100 km disc around each region's reference point (regions.js coords), land area only, shares rounded to 5%.
// It describes the landscape around the reference point, NOT the administrative footprint. Where a footprint is
// larger than the disc (Scottish Highlands, North Karelia and Kainuu, Bas-Saint-Laurent, Teruel uplands) the
// list is an indication, and the copy must say "around", never "within".
//
// `place` is a descriptive landscape label written by this project from the region dossier and the ecoregion
// and watershed facts. It is NOT an official, Indigenous or bioregional-movement name; those names belong to
// Land standing (land-standing.js), where they are sourced to the nations themselves.
//
// `watershed` names the drainage the region sits in. Rivers were cross-checked against Natural Earth named
// rivers within 100 km and HydroBASINS v1c level 05/06 (analysis only; HydroBASINS polygons are NOT shipped,
// see the HydroSHEDS licence note in sources below).
//
// Schema per region id:
//   { refPoint:[lon,lat], method, place, ecoregions: [{ id, name, biome, share }], primaryEcoregion, pointEcoregion, biome,
//     watershed: { major, rivers: [..], drainsTo, straddlesDivide,
//                  riversCheckedAgainstNaturalEarth: [..],   // names found within 100 km of the reference point
//                  riversFromDossierOrKnowledge: [..] }      // names NOT in Natural Earth: the data WP verifies each against the region dossier or the national basin authority before status 'verified'
//   }

export const bioregionSources = {
  ecoregions: {
    name: "RESOLVE Ecoregions 2017",
    citation: "Dinerstein, E. et al. (2017) An Ecoregion-Based Approach to Protecting Half the Terrestrial Realm. BioScience 67(6): 534-545.",
    url: "https://ecoregions.appspot.com/",
    download: "https://storage.googleapis.com/teow2016/Ecoregions2017.zip",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    vintage: "2017 (files dated 2018-11-07, attribute table 2019-05-07)",
    checked: "2026-10-04",
    note: "Polygons are clipped to the region windows, simplified (0.03 degree tolerance, about 3 km) and re-hosted; attribution and the change note are shown with the layer."
  },
  rivers: {
    name: "Natural Earth 10m rivers and lake centerlines",
    url: "https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/",
    license: "Public domain",
    licenseUrl: "https://www.naturalearthdata.com/about/terms-of-use/",
    vintage: "v5.x (as downloaded 2026-10-04)",
    checked: "2026-10-04"
  },
  hydrobasins: {
    name: "HydroBASINS v1c (HydroSHEDS)",
    citation: "Lehner, B., Grill, G. (2013) Global river hydrography and network routing. Hydrological Processes 27(15): 2171-2186.",
    url: "https://www.hydrosheds.org/products/hydrobasins",
    license: "HydroSHEDS v1 licence agreement (free for non-commercial and commercial use; distribution only as part of a derivative work, never as a stand-alone product)",
    licenseUrl: "https://data.hydrosheds.org/file/technical-documentation/HydroSHEDS_TechDoc_v1_4.pdf",
    use: "Analysis only: used to check which drainage each region sits in. No HydroBASINS polygons are shipped.",
    checked: "2026-10-04"
  }
};

export const biomeNames = {
  1: "Tropical & Subtropical Moist Broadleaf Forests", 2: "Tropical & Subtropical Dry Broadleaf Forests",
  3: "Tropical & Subtropical Coniferous Forests", 4: "Temperate Broadleaf & Mixed Forests",
  5: "Temperate Conifer Forests", 6: "Boreal Forests/Taiga", 8: "Temperate Grasslands, Savannas & Shrublands",
  12: "Mediterranean Forests, Woodlands & Scrub", 13: "Deserts & Xeric Shrublands", 14: "Mangroves"
};

export const bioregions = '''
body=json.dumps(d,indent=2,ensure_ascii=False)+';\n'
open('out/final/bioregions.js','w').write(hdr+body)
print(len(hdr+body))
