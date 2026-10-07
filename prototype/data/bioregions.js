// Per-region bioregion membership. QUALITATIVE CONTEXT ONLY: never scored, filtered on, ranked or composited.
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

export const bioregions = {
  "alentejo": {
    "place": "Alentejo plains and montado oak woodland",
    "primaryEcoregion": "Southwest Iberian Mediterranean sclerophyllous and mixed forests",
    "ecoregions": [
      {
        "id": 805,
        "name": "Southwest Iberian Mediterranean sclerophyllous and mixed forests",
        "biome": "Mediterranean Forests, Woodlands & Scrub",
        "share": 0.55
      },
      {
        "id": 793,
        "name": "Iberian sclerophyllous and semi-deciduous forests",
        "biome": "Mediterranean Forests, Woodlands & Scrub",
        "share": 0.45
      }
    ],
    "biome": "Mediterranean Forests, Woodlands & Scrub",
    "pointEcoregion": "Iberian sclerophyllous and semi-deciduous forests",
    "watershed": {
      "major": "Sado, Tejo (Sorraia) and Guadiana headwaters",
      "rivers": [
        "Sorraia",
        "Sado",
        "Guadiana"
      ],
      "drainsTo": "Atlantic Ocean (Tejo and Sado estuaries, Gulf of Cádiz)",
      "straddlesDivide": true,
      "riversCheckedAgainstNaturalEarth": [
        "Sorraia",
        "Sado",
        "Guadiana"
      ],
      "riversFromDossierOrKnowledge": []
    },
    "refPoint": [
      -7.9,
      38.6
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "galicia": {
    "place": "Atlantic Galicia: coastal rias and the interior Miño–Sil valleys",
    "primaryEcoregion": "Cantabrian mixed forests",
    "ecoregions": [
      {
        "id": 648,
        "name": "Cantabrian mixed forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.95
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "Cantabrian mixed forests",
    "watershed": {
      "major": "Miño–Sil and the Galician Atlantic coast catchments",
      "rivers": [
        "Miño",
        "Sil",
        "Ulla",
        "Tambre"
      ],
      "drainsTo": "Atlantic Ocean",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [
        "Sil"
      ],
      "riversFromDossierOrKnowledge": [
        "Miño",
        "Ulla",
        "Tambre"
      ]
    },
    "refPoint": [
      -8.4,
      42.9
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "transylvania": {
    "place": "Transylvanian Basin and the Carpathian arc",
    "primaryEcoregion": "Carpathian montane forests",
    "ecoregions": [
      {
        "id": 692,
        "name": "Carpathian montane forests",
        "biome": "Temperate Conifer Forests",
        "share": 0.55
      },
      {
        "id": 674,
        "name": "Pannonian mixed forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.45
      }
    ],
    "biome": "Temperate Conifer Forests",
    "pointEcoregion": "Carpathian montane forests",
    "watershed": {
      "major": "Mureș, Târnava and Olt",
      "rivers": [
        "Mureș",
        "Târnava",
        "Olt"
      ],
      "drainsTo": "Black Sea, by way of the Danube",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [
        "Mureș",
        "Olt"
      ],
      "riversFromDossierOrKnowledge": [
        "Târnava"
      ]
    },
    "refPoint": [
      25.0,
      46.0
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "connemara": {
    "place": "Connemara: Atlantic blanket bog, loughs and hill commonage",
    "primaryEcoregion": "Celtic broadleaf forests",
    "ecoregions": [
      {
        "id": 651,
        "name": "Celtic broadleaf forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.7
      },
      {
        "id": 672,
        "name": "North Atlantic moist mixed forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.3
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "Celtic broadleaf forests",
    "watershed": {
      "major": "Corrib and Galway Bay coastal catchments, with the Shannon to the east",
      "rivers": [
        "Corrib",
        "Shannon"
      ],
      "drainsTo": "Atlantic Ocean",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [
        "Shannon"
      ],
      "riversFromDossierOrKnowledge": [
        "Corrib"
      ]
    },
    "refPoint": [
      -9.4,
      53.0
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "pembrokeshire": {
    "place": "South-west Wales coast and the Preseli hills",
    "primaryEcoregion": "Celtic broadleaf forests",
    "ecoregions": [
      {
        "id": 651,
        "name": "Celtic broadleaf forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 1.0
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "Celtic broadleaf forests",
    "watershed": {
      "major": "Cleddau, Teifi and the Pembrokeshire coastal catchments",
      "rivers": [
        "Eastern Cleddau",
        "Western Cleddau",
        "Teifi"
      ],
      "drainsTo": "Celtic Sea and Cardigan Bay",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [],
      "riversFromDossierOrKnowledge": [
        "Eastern Cleddau",
        "Western Cleddau",
        "Teifi"
      ]
    },
    "refPoint": [
      -4.9,
      51.85
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "cevennes": {
    "place": "Cévennes: the southern edge of the Massif Central",
    "primaryEcoregion": "Northeast Spain and Southern France Mediterranean forests",
    "ecoregions": [
      {
        "id": 799,
        "name": "Northeast Spain and Southern France Mediterranean forests",
        "biome": "Mediterranean Forests, Woodlands & Scrub",
        "share": 0.7
      },
      {
        "id": 686,
        "name": "Western European broadleaf forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.3
      }
    ],
    "biome": "Mediterranean Forests, Woodlands & Scrub",
    "pointEcoregion": "Northeast Spain and Southern France Mediterranean forests",
    "watershed": {
      "major": "Hérault, Gardon and Cèze (Mediterranean slope) with the Tarn and Lot headwaters (Atlantic slope)",
      "rivers": [
        "Hérault",
        "Gardon",
        "Cèze",
        "Tarn",
        "Lot"
      ],
      "drainsTo": "Mediterranean Sea and Atlantic Ocean (the region straddles the divide)",
      "straddlesDivide": true,
      "riversCheckedAgainstNaturalEarth": [
        "Tarn",
        "Lot"
      ],
      "riversFromDossierOrKnowledge": [
        "Hérault",
        "Gardon",
        "Cèze"
      ]
    },
    "refPoint": [
      3.85,
      44.2
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "south-tirol": {
    "place": "South Tyrol: the Adige (Etsch) valley and the Dolomite flanks",
    "primaryEcoregion": "Alps conifer and mixed forests",
    "ecoregions": [
      {
        "id": 689,
        "name": "Alps conifer and mixed forests",
        "biome": "Temperate Conifer Forests",
        "share": 1.0
      }
    ],
    "biome": "Temperate Conifer Forests",
    "pointEcoregion": "Alps conifer and mixed forests",
    "watershed": {
      "major": "Adige (Etsch), with the Drava (Drau) headwaters in the east",
      "rivers": [
        "Adige",
        "Eisack",
        "Rienz",
        "Drau"
      ],
      "drainsTo": "Adriatic Sea, and Black Sea by way of the Drava and Danube in the far east",
      "straddlesDivide": true,
      "riversCheckedAgainstNaturalEarth": [
        "Adige",
        "Drau"
      ],
      "riversFromDossierOrKnowledge": [
        "Eisack",
        "Rienz"
      ]
    },
    "refPoint": [
      11.35,
      46.5
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "asturias": {
    "place": "Asturias: the Cantabrian mountains and coast",
    "primaryEcoregion": "Cantabrian mixed forests",
    "ecoregions": [
      {
        "id": 648,
        "name": "Cantabrian mixed forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.75
      },
      {
        "id": 800,
        "name": "Northwest Iberian montane forests",
        "biome": "Mediterranean Forests, Woodlands & Scrub",
        "share": 0.2
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "Cantabrian mixed forests",
    "watershed": {
      "major": "Nalón, Narcea, Sella and the Cantabrian coastal catchments",
      "rivers": [
        "Nalón",
        "Narcea",
        "Sella"
      ],
      "drainsTo": "Cantabrian Sea (Bay of Biscay)",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [
        "Narcea"
      ],
      "riversFromDossierOrKnowledge": [
        "Nalón",
        "Sella"
      ]
    },
    "refPoint": [
      -5.85,
      43.3
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "saxony-anhalt": {
    "place": "Elbe–Saale lowlands and the Harz foreland",
    "primaryEcoregion": "Central European mixed forests",
    "ecoregions": [
      {
        "id": 654,
        "name": "Central European mixed forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.65
      },
      {
        "id": 686,
        "name": "Western European broadleaf forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.15
      },
      {
        "id": 664,
        "name": "European Atlantic mixed forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.15
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "Central European mixed forests",
    "watershed": {
      "major": "Elbe, Saale and Bode",
      "rivers": [
        "Elbe",
        "Saale",
        "Bode"
      ],
      "drainsTo": "North Sea, by way of the Elbe",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [
        "Elbe",
        "Saale"
      ],
      "riversFromDossierOrKnowledge": [
        "Bode"
      ]
    },
    "refPoint": [
      11.6,
      51.95
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "estonia-rural": {
    "place": "Central Estonian plain: hemiboreal forest, bog and farmland",
    "primaryEcoregion": "Sarmatic mixed forests",
    "ecoregions": [
      {
        "id": 679,
        "name": "Sarmatic mixed forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 1.0
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "Sarmatic mixed forests",
    "watershed": {
      "major": "Pärnu (Gulf of Riga), with the Emajõgi and Lake Peipus catchment to the east",
      "rivers": [
        "Pärnu",
        "Emajõgi"
      ],
      "drainsTo": "Gulf of Riga, and the Gulf of Finland by way of Lake Peipus and the Narva (Baltic Sea)",
      "straddlesDivide": true,
      "riversCheckedAgainstNaturalEarth": [
        "Pärnu",
        "Emajõgi"
      ],
      "riversFromDossierOrKnowledge": []
    },
    "refPoint": [
      25.0,
      58.6
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "cascadia": {
    "place": "Willamette Valley and the Cascade foothills",
    "primaryEcoregion": "Central-Southern Cascades Forests",
    "ecoregions": [
      {
        "id": 352,
        "name": "Central-Southern Cascades Forests",
        "biome": "Temperate Conifer Forests",
        "share": 0.4
      },
      {
        "id": 403,
        "name": "Willamette Valley oak savanna",
        "biome": "Temperate Grasslands, Savannas & Shrublands",
        "share": 0.35
      },
      {
        "id": 351,
        "name": "Central Pacific Northwest coastal forests",
        "biome": "Temperate Conifer Forests",
        "share": 0.25
      }
    ],
    "biome": "Temperate Conifer Forests",
    "pointEcoregion": "Willamette Valley oak savanna",
    "watershed": {
      "major": "Willamette",
      "rivers": [
        "Willamette",
        "Santiam",
        "Clackamas"
      ],
      "drainsTo": "Pacific Ocean, by way of the Columbia",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [
        "Willamette",
        "Clackamas"
      ],
      "riversFromDossierOrKnowledge": [
        "Santiam"
      ]
    },
    "refPoint": [
      -123.0,
      44.5
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "vermont": {
    "place": "Green Mountains with the Champlain and Connecticut valleys",
    "primaryEcoregion": "New England-Acadian forests",
    "ecoregions": [
      {
        "id": 338,
        "name": "New England-Acadian forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.85
      },
      {
        "id": 334,
        "name": "Eastern Great Lakes lowland forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.15
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "New England-Acadian forests",
    "watershed": {
      "major": "Connecticut and Lake Champlain (Winooski, Lamoille)",
      "rivers": [
        "Connecticut",
        "Winooski",
        "Lamoille"
      ],
      "drainsTo": "Long Island Sound, and the St Lawrence by way of Lake Champlain and the Richelieu",
      "straddlesDivide": true,
      "riversCheckedAgainstNaturalEarth": [
        "Connecticut",
        "Winooski",
        "Lamoille"
      ],
      "riversFromDossierOrKnowledge": []
    },
    "refPoint": [
      -72.7,
      44.0
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "southern-appalachians": {
    "place": "Southern Blue Ridge and the French Broad valley",
    "primaryEcoregion": "Appalachian-Blue Ridge forests",
    "ecoregions": [
      {
        "id": 331,
        "name": "Appalachian-Blue Ridge forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.75
      },
      {
        "id": 330,
        "name": "Appalachian Piedmont forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.25
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "Appalachian-Blue Ridge forests",
    "watershed": {
      "major": "French Broad and Tennessee, with Catawba and Broad on the eastern flank",
      "rivers": [
        "French Broad",
        "Nolichucky",
        "Pigeon",
        "Catawba"
      ],
      "drainsTo": "Gulf of Mexico, by way of the Tennessee, Ohio and Mississippi (the eastern flank drains to the Atlantic)",
      "straddlesDivide": true,
      "riversCheckedAgainstNaturalEarth": [
        "French Broad",
        "Nolichucky",
        "Pigeon",
        "Catawba"
      ],
      "riversFromDossierOrKnowledge": []
    },
    "refPoint": [
      -82.6,
      35.6
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "driftless": {
    "place": "Driftless Area: the unglaciated upper Mississippi hills and coulees",
    "primaryEcoregion": "Upper Midwest US forest-savanna transition",
    "ecoregions": [
      {
        "id": 343,
        "name": "Upper Midwest US forest-savanna transition",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 1.0
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "Upper Midwest US forest-savanna transition",
    "watershed": {
      "major": "Upper Mississippi tributaries: Wisconsin, Kickapoo, Black, Turkey",
      "rivers": [
        "Wisconsin",
        "Black",
        "Turkey",
        "Kickapoo"
      ],
      "drainsTo": "Gulf of Mexico, by way of the Mississippi",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [
        "Wisconsin",
        "Black",
        "Turkey"
      ],
      "riversFromDossierOrKnowledge": [
        "Kickapoo"
      ]
    },
    "refPoint": [
      -90.8,
      43.5
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "ozarks": {
    "place": "Ozark Plateau: karst hills of the White River country",
    "primaryEcoregion": "Ozark Highlands mixed forests",
    "ecoregions": [
      {
        "id": 340,
        "name": "Ozark Highlands mixed forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.75
      },
      {
        "id": 341,
        "name": "Ozark Mountain forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.25
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "Ozark Highlands mixed forests",
    "watershed": {
      "major": "White River (with the Buffalo, Current and Eleven Point nearby)",
      "rivers": [
        "White",
        "North Fork White",
        "Current"
      ],
      "drainsTo": "Gulf of Mexico, by way of the White and the Mississippi",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [
        "White",
        "North Fork White"
      ],
      "riversFromDossierOrKnowledge": [
        "Current"
      ]
    },
    "refPoint": [
      -92.8,
      36.3
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "northern-new-mexico": {
    "place": "Southern Rocky Mountains meeting the Rio Grande rift and the Taos Plateau",
    "primaryEcoregion": "Colorado Rockies forests",
    "ecoregions": [
      {
        "id": 353,
        "name": "Colorado Rockies forests",
        "biome": "Temperate Conifer Forests",
        "share": 0.6
      },
      {
        "id": 429,
        "name": "Colorado Plateau shrublands",
        "biome": "Deserts & Xeric Shrublands",
        "share": 0.25
      },
      {
        "id": 402,
        "name": "Western shortgrass prairie",
        "biome": "Temperate Grasslands, Savannas & Shrublands",
        "share": 0.15
      }
    ],
    "biome": "Temperate Conifer Forests",
    "pointEcoregion": "Colorado Plateau shrublands",
    "watershed": {
      "major": "Upper Rio Grande (Rio Pueblo de Taos, Rio Hondo, Red River, Rio Chama)",
      "rivers": [
        "Rio Grande",
        "Rio Chama"
      ],
      "drainsTo": "Gulf of Mexico, by way of the Rio Grande",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [
        "Rio Grande",
        "Rio Chama"
      ],
      "riversFromDossierOrKnowledge": []
    },
    "refPoint": [
      -105.6,
      36.4
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "nova-scotia": {
    "place": "Acadian forest and the Fundy and Northumberland shores of mainland Nova Scotia",
    "primaryEcoregion": "New England-Acadian forests",
    "ecoregions": [
      {
        "id": 338,
        "name": "New England-Acadian forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.8
      },
      {
        "id": 335,
        "name": "Gulf of St. Lawrence lowland forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.2
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "New England-Acadian forests",
    "watershed": {
      "major": "Shubenacadie and Salmon (Bay of Fundy), with the River Philip and East River (Northumberland Strait)",
      "rivers": [
        "Shubenacadie",
        "Salmon"
      ],
      "drainsTo": "Bay of Fundy and Gulf of St Lawrence",
      "straddlesDivide": true,
      "riversCheckedAgainstNaturalEarth": [
        "Shubenacadie",
        "Salmon"
      ],
      "riversFromDossierOrKnowledge": []
    },
    "refPoint": [
      -63.0,
      45.4
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "kootenays": {
    "place": "Columbia Mountains: the Selkirk and Purcell ranges and the Kootenay lakes",
    "primaryEcoregion": "Northern Rockies conifer forests",
    "ecoregions": [
      {
        "id": 361,
        "name": "Northern Rockies conifer forests",
        "biome": "Temperate Conifer Forests",
        "share": 1.0
      }
    ],
    "biome": "Temperate Conifer Forests",
    "pointEcoregion": "Northern Rockies conifer forests",
    "watershed": {
      "major": "Kootenay and upper Columbia (Slocan, Duncan, Lardeau)",
      "rivers": [
        "Kootenay",
        "Columbia",
        "Slocan",
        "Duncan"
      ],
      "drainsTo": "Pacific Ocean, by way of the Columbia",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [
        "Kootenay",
        "Columbia",
        "Slocan",
        "Duncan"
      ],
      "riversFromDossierOrKnowledge": []
    },
    "refPoint": [
      -117.0,
      49.5
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "quebec-eastern-townships": {
    "place": "Appalachian foothills south-east of the St Lawrence lowlands",
    "primaryEcoregion": "New England-Acadian forests",
    "ecoregions": [
      {
        "id": 338,
        "name": "New England-Acadian forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.7
      },
      {
        "id": 334,
        "name": "Eastern Great Lakes lowland forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.3
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "New England-Acadian forests",
    "watershed": {
      "major": "Saint-François, Yamaska and Richelieu headwaters (Memphrémagog, Missisquoi)",
      "rivers": [
        "Saint-François",
        "Yamaska",
        "Richelieu"
      ],
      "drainsTo": "St Lawrence River and Gulf",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [
        "Saint-François",
        "Yamaska",
        "Richelieu"
      ],
      "riversFromDossierOrKnowledge": []
    },
    "refPoint": [
      -72.0,
      45.4
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "oaxaca": {
    "place": "Oaxaca: central valleys between the Sierra Madre del Sur and the Sierra Norte",
    "primaryEcoregion": "Sierra Madre del Sur pine-oak forests",
    "ecoregions": [
      {
        "id": 558,
        "name": "Sierra Madre del Sur pine-oak forests",
        "biome": "Tropical & Subtropical Coniferous Forests",
        "share": 0.35
      },
      {
        "id": 557,
        "name": "Sierra Madre de Oaxaca pine-oak forests",
        "biome": "Tropical & Subtropical Coniferous Forests",
        "share": 0.25
      },
      {
        "id": 547,
        "name": "Southern Pacific dry forests",
        "biome": "Tropical & Subtropical Dry Broadleaf Forests",
        "share": 0.15
      }
    ],
    "biome": "Tropical & Subtropical Coniferous Forests",
    "pointEcoregion": "Southern Pacific dry forests",
    "watershed": {
      "major": "Atoyac–Verde (Pacific slope) with the Papaloapan (Gulf slope) in the Sierra Norte",
      "rivers": [
        "Atoyac",
        "Verde",
        "Papaloapan"
      ],
      "drainsTo": "Pacific Ocean and Gulf of Mexico (the region straddles the divide)",
      "straddlesDivide": true,
      "riversCheckedAgainstNaturalEarth": [
        "Atoyac"
      ],
      "riversFromDossierOrKnowledge": [
        "Verde",
        "Papaloapan"
      ]
    },
    "refPoint": [
      -96.7,
      17.1
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "scottish-highlands": {
    "place": "North-west Highlands: sea-loch glens from Lochaber to Sutherland",
    "primaryEcoregion": "Caledon conifer forests",
    "ecoregions": [
      {
        "id": 691,
        "name": "Caledon conifer forests",
        "biome": "Temperate Conifer Forests",
        "share": 0.5
      },
      {
        "id": 672,
        "name": "North Atlantic moist mixed forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.5
      }
    ],
    "biome": "Temperate Conifer Forests",
    "pointEcoregion": "North Atlantic moist mixed forests",
    "watershed": {
      "major": "West-flowing sea-loch catchments, with the Oykel, Shin and Conon to the east",
      "rivers": [
        "Oykel",
        "Shin",
        "Conon"
      ],
      "drainsTo": "The Minch and Atlantic Ocean in the west, the Dornoch and Cromarty Firths in the east",
      "straddlesDivide": true,
      "riversCheckedAgainstNaturalEarth": [],
      "riversFromDossierOrKnowledge": [
        "Oykel",
        "Shin",
        "Conon"
      ]
    },
    "refPoint": [
      -5.1,
      57.8
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "north-karelia-kainuu": {
    "place": "Eastern Finnish lakeland and taiga: Karelian and Kainuu uplands",
    "primaryEcoregion": "Scandinavian and Russian taiga",
    "ecoregions": [
      {
        "id": 717,
        "name": "Scandinavian and Russian taiga",
        "biome": "Boreal Forests/Taiga",
        "share": 1.0
      }
    ],
    "biome": "Boreal Forests/Taiga",
    "pointEcoregion": "Scandinavian and Russian taiga",
    "watershed": {
      "major": "Vuoksi (Saimaa) in North Karelia and Oulujoki in Kainuu",
      "rivers": [
        "Vuoksi",
        "Pielisjoki",
        "Oulujoki"
      ],
      "drainsTo": "Gulf of Finland by way of Lake Ladoga and the Neva, and the Gulf of Bothnia by way of the Oulujoki",
      "straddlesDivide": true,
      "riversCheckedAgainstNaturalEarth": [
        "Vuoksi"
      ],
      "riversFromDossierOrKnowledge": [
        "Pielisjoki",
        "Oulujoki"
      ]
    },
    "refPoint": [
      29.7,
      63.3
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "millevaches": {
    "place": "Montagne limousine: the granite plateau of the western Massif Central",
    "primaryEcoregion": "Western European broadleaf forests",
    "ecoregions": [
      {
        "id": 686,
        "name": "Western European broadleaf forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.95
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "Western European broadleaf forests",
    "watershed": {
      "major": "Vienne and Creuse (Loire), Vézère, Corrèze and Dordogne headwaters",
      "rivers": [
        "Vienne",
        "Creuse",
        "Vézère",
        "Corrèze"
      ],
      "drainsTo": "Atlantic Ocean, by way of the Loire and the Gironde",
      "straddlesDivide": true,
      "riversCheckedAgainstNaturalEarth": [
        "Vienne",
        "Creuse",
        "Vézère"
      ],
      "riversFromDossierOrKnowledge": [
        "Corrèze"
      ]
    },
    "refPoint": [
      2.0,
      45.65
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "teruel-uplands": {
    "place": "Iberian System uplands: Albarracín, Gúdar–Javalambre and the Maestrazgo",
    "primaryEcoregion": "Iberian sclerophyllous and semi-deciduous forests",
    "ecoregions": [
      {
        "id": 793,
        "name": "Iberian sclerophyllous and semi-deciduous forests",
        "biome": "Mediterranean Forests, Woodlands & Scrub",
        "share": 0.65
      },
      {
        "id": 792,
        "name": "Iberian conifer forests",
        "biome": "Mediterranean Forests, Woodlands & Scrub",
        "share": 0.3
      }
    ],
    "biome": "Mediterranean Forests, Woodlands & Scrub",
    "pointEcoregion": "Iberian sclerophyllous and semi-deciduous forests",
    "watershed": {
      "major": "Headwaters of the Tajo, Turia, Júcar, Jiloca and Mijares",
      "rivers": [
        "Jiloca",
        "Turia",
        "Mijares",
        "Tajo"
      ],
      "drainsTo": "Mediterranean Sea (Ebro, Turia, Júcar) and Atlantic Ocean (Tajo)",
      "straddlesDivide": true,
      "riversCheckedAgainstNaturalEarth": [
        "Jiloca",
        "Turia",
        "Mijares",
        "Tajo"
      ],
      "riversFromDossierOrKnowledge": []
    },
    "refPoint": [
      -1.2,
      40.5
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "valle-maira": {
    "place": "Cottian Alps: the Occitan valleys of Cuneo",
    "primaryEcoregion": "Alps conifer and mixed forests",
    "ecoregions": [
      {
        "id": 689,
        "name": "Alps conifer and mixed forests",
        "biome": "Temperate Conifer Forests",
        "share": 0.45
      },
      {
        "id": 799,
        "name": "Northeast Spain and Southern France Mediterranean forests",
        "biome": "Mediterranean Forests, Woodlands & Scrub",
        "share": 0.25
      },
      {
        "id": 795,
        "name": "Italian sclerophyllous and semi-deciduous forests",
        "biome": "Mediterranean Forests, Woodlands & Scrub",
        "share": 0.2
      }
    ],
    "biome": "Temperate Conifer Forests",
    "pointEcoregion": "Alps conifer and mixed forests",
    "watershed": {
      "major": "Maira, with Varaita and Grana (Po basin)",
      "rivers": [
        "Maira",
        "Varaita",
        "Po"
      ],
      "drainsTo": "Adriatic Sea, by way of the Po",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [
        "Varaita",
        "Po"
      ],
      "riversFromDossierOrKnowledge": [
        "Maira"
      ]
    },
    "refPoint": [
      7.1,
      44.45
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "finger-lakes": {
    "place": "Finger Lakes: the Cayuga and Seneca lake basins at the edge of the Appalachian Plateau",
    "primaryEcoregion": "Allegheny Highlands forests",
    "ecoregions": [
      {
        "id": 328,
        "name": "Allegheny Highlands forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.7
      },
      {
        "id": 334,
        "name": "Eastern Great Lakes lowland forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.3
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "Allegheny Highlands forests",
    "watershed": {
      "major": "Seneca–Oneida–Oswego (Lake Ontario basin)",
      "rivers": [
        "Seneca",
        "Cayuga Inlet",
        "Oswego"
      ],
      "drainsTo": "Lake Ontario and the St Lawrence",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [],
      "riversFromDossierOrKnowledge": [
        "Seneca",
        "Cayuga Inlet",
        "Oswego"
      ]
    },
    "refPoint": [
      -76.75,
      42.55
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "virginia-piedmont": {
    "place": "Virginia Piedmont: rolling uplands below the Blue Ridge",
    "primaryEcoregion": "Appalachian Piedmont forests",
    "ecoregions": [
      {
        "id": 330,
        "name": "Appalachian Piedmont forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.45
      },
      {
        "id": 331,
        "name": "Appalachian-Blue Ridge forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.25
      },
      {
        "id": 339,
        "name": "Northeast US Coastal forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.15
      },
      {
        "id": 399,
        "name": "Southeast US conifer savannas",
        "biome": "Temperate Grasslands, Savannas & Shrublands",
        "share": 0.15
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "Appalachian Piedmont forests",
    "watershed": {
      "major": "James (Rivanna), Rappahannock (Rapidan) and York (North Anna)",
      "rivers": [
        "Rivanna",
        "Rapidan",
        "North Anna",
        "South Anna"
      ],
      "drainsTo": "Chesapeake Bay",
      "straddlesDivide": true,
      "riversCheckedAgainstNaturalEarth": [
        "Rapidan",
        "North Anna",
        "South Anna"
      ],
      "riversFromDossierOrKnowledge": [
        "Rivanna"
      ]
    },
    "refPoint": [
      -78.2,
      38.0
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "bas-saint-laurent": {
    "place": "Lower St Lawrence south shore and the Notre-Dame Mountains",
    "primaryEcoregion": "New England-Acadian forests",
    "ecoregions": [
      {
        "id": 338,
        "name": "New England-Acadian forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 0.85
      },
      {
        "id": 373,
        "name": "Eastern Canadian forests",
        "biome": "Boreal Forests/Taiga",
        "share": 0.15
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "New England-Acadian forests",
    "watershed": {
      "major": "Rimouski, Mitis and Trois-Pistoles to the estuary; Saint John (Madawaska) inland",
      "rivers": [
        "Rimouski",
        "Mitis",
        "Madawaska",
        "Saint John"
      ],
      "drainsTo": "St Lawrence estuary and Bay of Fundy",
      "straddlesDivide": true,
      "riversCheckedAgainstNaturalEarth": [
        "Madawaska",
        "Saint John"
      ],
      "riversFromDossierOrKnowledge": [
        "Rimouski",
        "Mitis"
      ]
    },
    "refPoint": [
      -68.9,
      47.9
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "ne-missouri-se-iowa": {
    "place": "Dissected till plains and tallgrass prairie on the Mississippi border",
    "primaryEcoregion": "Central Tallgrass prairie",
    "ecoregions": [
      {
        "id": 388,
        "name": "Central Tallgrass prairie",
        "biome": "Temperate Grasslands, Savannas & Shrublands",
        "share": 0.8
      },
      {
        "id": 387,
        "name": "Central US forest-grasslands transition",
        "biome": "Temperate Grasslands, Savannas & Shrublands",
        "share": 0.2
      }
    ],
    "biome": "Temperate Grasslands, Savannas & Shrublands",
    "pointEcoregion": "Central Tallgrass prairie",
    "watershed": {
      "major": "Des Moines, Skunk and Salt, with the Chariton (Missouri River) to the west",
      "rivers": [
        "Des Moines",
        "Skunk",
        "Salt",
        "Chariton"
      ],
      "drainsTo": "Gulf of Mexico, by way of the Mississippi and the Missouri",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [
        "Des Moines",
        "Skunk",
        "Salt",
        "Chariton"
      ],
      "riversFromDossierOrKnowledge": []
    },
    "refPoint": [
      -92.0,
      40.5
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  },
  "downeast-maine": {
    "place": "Downeast Maine: the Gulf of Maine coast and Acadian forest",
    "primaryEcoregion": "New England-Acadian forests",
    "ecoregions": [
      {
        "id": 338,
        "name": "New England-Acadian forests",
        "biome": "Temperate Broadleaf & Mixed Forests",
        "share": 1.0
      }
    ],
    "biome": "Temperate Broadleaf & Mixed Forests",
    "pointEcoregion": "New England-Acadian forests",
    "watershed": {
      "major": "St Croix, Machias, Narraguagus and the other Washington County coastal rivers",
      "rivers": [
        "Saint Croix",
        "Machias",
        "Narraguagus"
      ],
      "drainsTo": "Gulf of Maine (Atlantic Ocean)",
      "straddlesDivide": false,
      "riversCheckedAgainstNaturalEarth": [
        "Saint Croix"
      ],
      "riversFromDossierOrKnowledge": [
        "Machias",
        "Narraguagus"
      ]
    },
    "refPoint": [
      -67.6,
      44.9
    ],
    "method": "RESOLVE Ecoregions 2017 within 100 km of refPoint, land area, shares rounded to 5%, entries under 10% dropped"
  }
};
