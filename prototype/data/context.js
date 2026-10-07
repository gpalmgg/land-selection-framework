// Climate and water context per region: Köppen-Geiger class shares (Beck et al. 2023, four periods) and WRI Aqueduct 4.0 indicators.
// Generated 2026-10-05 by EV-INT-CONTEXT from the 2026-10 evidence-out files (koppen and aqueduct, one set per region id) (registry source ids beck-koppen-2023, aqueduct-40).
// Native facts only: area fractions and dataset ratios, never scored, filtered on, ranked or colour-ranked. Aqueduct classes are WRI's own and are never
// combined or rescaled. ratio = area-weighted mean over the intersected basins; class = the class with the largest intersected area (classShares shows the
// spread, so a footprint spanning basins of different stress is visible, not averaged away). stress2050Bau.class is spelled like WRI's baseline classes
// ("Medium - High"); the future-scenario spelling WRI publishes is kept in publishedClass when it differs. coverage = fraction of the footprint with a real
// value (sea and area outside any HydroBASINS sub-basin are not in the basin data). basins = distinct HydroBASINS level 6 sub-basins in the baseline layer.
// Regions whose Köppen or Aqueduct stage failed would be omitted here, never invented.
// Loaded lazily by src/data.js loadDrawerData(), never on first paint.
export const context = {
  "alentejo": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "alentejo",
      "periods": {
        "1961–1990": {
          "dominant": "Csa",
          "shares": {
            "Csa": 0.8891,
            "Csb": 0.1109
          }
        },
        "1991–2020": {
          "dominant": "Csa",
          "shares": {
            "Csa": 0.9619,
            "Csb": 0.0381
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Csa",
          "shares": {
            "Csa": 0.9954,
            "Csb": 0.0046
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Csa",
          "shares": {
            "Csa": 0.9991,
            "Csb": 0.0009
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "alentejo",
      "basins": 10,
      "baselineStress": {
        "ratio": 0.7105,
        "class": "Extremely High (>80%)",
        "classShares": {
          "Extremely High (>80%)": 0.4935,
          "Low - Medium (10-20%)": 0.2329,
          "Medium - High (20-40%)": 0.1927,
          "Low (<10%)": 0.0806,
          "No Data": 0.0004
        }
      },
      "stress2050Bau": {
        "ratio": 1.5053,
        "class": "Extremely High (>80%)",
        "classShares": {
          "Extremely High (>80%)": 0.654,
          "High (40-80%)": 0.1749,
          "Low - Medium (10-20%)": 0.1532,
          "Medium - High (20-40%)": 0.0179
        },
        "scenario": "SSP3-7.0",
        "publishedClass": "Extremely high (>80%)"
      },
      "droughtRisk": "Medium - High (0.6-0.8)",
      "interannualVariability": "Medium - High (0.50-0.75)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low (0 to 1 in 1,000)",
      "coverage": {
        "baseline": 0.916,
        "stress2050Bau": 0.9161
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
      "caveats": [
        "baseline basin coverage 0.916 of the footprint is below 0.95 (78 basins; the footprint includes area outside any HydroBASINS sub-basin, for example sea)",
        "future basin coverage 0.916 of the footprint is below 0.95 (9 basins; the footprint includes area outside any HydroBASINS sub-basin, for example sea)",
        "baseline bws: basins with a real value cover 0.916 of the footprint (below 0.95)",
        "bau2050 water stress: basins with a real value cover 0.916 of the footprint (below 0.95)",
        "baseline water stress: the area-weighted mean 0.711 falls in the class High (40-80%) while the class with the largest area is Extremely High (>80%) (the footprint spans basins of different stress; both numbers are kept)"
      ]
    }
  },
  "asturias": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "asturias",
      "periods": {
        "1961–1990": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.7904,
            "Csb": 0.1725,
            "Dfc": 0.0297,
            "Dfb": 0.0041,
            "ET": 0.0016,
            "Cfc": 0.0014,
            "Dsb": 0.0004
          }
        },
        "1991–2020": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.5909,
            "Csb": 0.3883,
            "Dfc": 0.01,
            "Dfb": 0.0098,
            "Dsb": 0.0005,
            "ET": 0.0004,
            "Cfa": 0.0001
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Csb",
          "shares": {
            "Csb": 0.7027,
            "Cfb": 0.2391,
            "Csa": 0.044,
            "Cfa": 0.008,
            "Dfb": 0.003,
            "Dsb": 0.0024,
            "Dfc": 0.0008
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Csb",
          "shares": {
            "Csb": 0.6192,
            "Csa": 0.2067,
            "Cfb": 0.1506,
            "Cfa": 0.0191,
            "Dfb": 0.0023,
            "Dsb": 0.0017,
            "Dfc": 0.0003
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "asturias",
      "basins": 8,
      "baselineStress": {
        "ratio": 0.1354,
        "class": "Low - Medium (10-20%)",
        "classShares": {
          "Low - Medium (10-20%)": 0.5078,
          "Medium - High (20-40%)": 0.2804,
          "Low (<10%)": 0.2096,
          "No Data": 0.0013,
          "Extremely High (>80%)": 0.0009
        }
      },
      "stress2050Bau": {
        "ratio": 0.1821,
        "class": "Low - Medium (10-20%)",
        "classShares": {
          "Low - Medium (10-20%)": 0.5074,
          "Medium - High (20-40%)": 0.2817,
          "Low (<10%)": 0.2099,
          "Extremely High (>80%)": 0.001
        },
        "scenario": "SSP3-7.0",
        "publishedClass": "Low-medium (10-20%)"
      },
      "droughtRisk": "Low - Medium (0.2-0.4)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low - Medium (1 in 1,000 to 2 in 1,000)",
      "coverage": {
        "baseline": 0.9902,
        "stress2050Bau": 0.9902
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "bas-saint-laurent": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "bas-saint-laurent",
      "periods": {
        "1961–1990": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.7732,
            "Dfc": 0.2268
          }
        },
        "1991–2020": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9706,
            "Dfc": 0.0294
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9993,
            "Dfc": 0.0007
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9932,
            "Dfa": 0.0068
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "bas-saint-laurent",
      "basins": 13,
      "baselineStress": {
        "ratio": 0.06,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.7237,
          "Low - Medium (10-20%)": 0.2761,
          "No Data": 0.0002
        }
      },
      "stress2050Bau": {
        "ratio": 0.0793,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.7238,
          "Low - Medium (10-20%)": 0.2762
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Low (0.0-0.2)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Medium - High (0.66-1.00)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Medium - High (2 in 1,000 to 6 in 1,000)",
      "coverage": {
        "baseline": 0.9998,
        "stress2050Bau": 0.9998
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "cascadia": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "cascadia",
      "periods": {
        "1961–1990": {
          "dominant": "Csb",
          "shares": {
            "Csb": 0.823,
            "Dsb": 0.1425,
            "Dsc": 0.0328,
            "ET": 0.001,
            "Csc": 0.0003,
            "Cfb": 0.0003
          }
        },
        "1991–2020": {
          "dominant": "Csb",
          "shares": {
            "Csb": 0.8676,
            "Dsb": 0.1055,
            "Dsc": 0.0257,
            "ET": 0.0006,
            "Csc": 0.0006
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Csb",
          "shares": {
            "Csb": 0.8589,
            "Csa": 0.0837,
            "Dsb": 0.0514,
            "Dsc": 0.0059,
            "ET": 0.0001
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Csb",
          "shares": {
            "Csb": 0.6553,
            "Csa": 0.3103,
            "Dsb": 0.0308,
            "Dsc": 0.0036,
            "ET": 0.0001
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "cascadia",
      "basins": 4,
      "baselineStress": {
        "ratio": 0.023,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.9989,
          "Low - Medium (10-20%)": 0.0011
        }
      },
      "stress2050Bau": {
        "ratio": 0.0261,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.9989,
          "Medium - High (20-40%)": 0.0011
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Low - Medium (0.2-0.4)",
      "interannualVariability": "Low (<0.25)",
      "seasonalVariability": "Low (<0.33)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low - Medium (1 in 1,000 to 2 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "cevennes": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "cevennes",
      "periods": {
        "1961–1990": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.5101,
            "Dfb": 0.2424,
            "Csa": 0.1216,
            "Csb": 0.1037,
            "Cfa": 0.0151,
            "Dfc": 0.0071
          }
        },
        "1991–2020": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.5889,
            "Csa": 0.1452,
            "Cfa": 0.1109,
            "Dfb": 0.1057,
            "Csb": 0.0485,
            "Dfc": 0.0008
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.5145,
            "Csa": 0.3712,
            "Cfa": 0.078,
            "Dfb": 0.0199,
            "Csb": 0.0163
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.4473,
            "Csa": 0.4417,
            "Cfa": 0.0976,
            "Csb": 0.0073,
            "Dfb": 0.006
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "cevennes",
      "basins": 7,
      "baselineStress": {
        "ratio": 0.0447,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.892,
          "Medium - High (20-40%)": 0.108
        }
      },
      "stress2050Bau": {
        "ratio": 0.0603,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.892,
          "Medium - High (20-40%)": 0.108
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Medium (0.4-0.6)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low - Medium (1 in 1,000 to 2 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "connemara": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "connemara",
      "periods": {
        "1961–1990": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.9999,
            "Cfc": 0.0001
          }
        },
        "1991–2020": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 1
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 1
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 1
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "connemara",
      "basins": 3,
      "baselineStress": {
        "ratio": 0.0119,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.9991,
          "No Data": 0.0009
        }
      },
      "stress2050Bau": {
        "ratio": 0.0114,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 1
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Medium (0.4-0.6)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Medium - High (2 in 1,000 to 6 in 1,000)",
      "coverage": {
        "baseline": 0.9969,
        "stress2050Bau": 0.9968
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "downeast-maine": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "downeast-maine",
      "periods": {
        "1961–1990": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 1
          }
        },
        "1991–2020": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 1
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 1
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfa",
          "shares": {
            "Dfa": 0.5275,
            "Dfb": 0.471,
            "Cfb": 0.0015
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "downeast-maine",
      "basins": 3,
      "baselineStress": {
        "ratio": 0.0087,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.9871,
          "No Data": 0.0129
        }
      },
      "stress2050Bau": {
        "ratio": 0.0093,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 1
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Low (0.0-0.2)",
      "interannualVariability": "Low (<0.25)",
      "seasonalVariability": "Low (<0.33)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Medium - High (2 in 1,000 to 6 in 1,000)",
      "coverage": {
        "baseline": 0.8822,
        "stress2050Bau": 0.8823
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
      "caveats": [
        "baseline basin coverage 0.894 of the footprint is below 0.95 (7 basins; the footprint includes area outside any HydroBASINS sub-basin, for example sea)",
        "future basin coverage 0.882 of the footprint is below 0.95 (2 basins; the footprint includes area outside any HydroBASINS sub-basin, for example sea)",
        "baseline bws: basins with a real value cover 0.882 of the footprint (below 0.95)",
        "bau2050 water stress: basins with a real value cover 0.882 of the footprint (below 0.95)"
      ]
    }
  },
  "driftless": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "driftless",
      "periods": {
        "1961–1990": {
          "dominant": "Dfa",
          "shares": {
            "Dfa": 0.8222,
            "Dfb": 0.1778
          }
        },
        "1991–2020": {
          "dominant": "Dfa",
          "shares": {
            "Dfa": 0.9029,
            "Dfb": 0.0971
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfa",
          "shares": {
            "Dfa": 1
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfa",
          "shares": {
            "Dfa": 1
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "driftless",
      "basins": 3,
      "baselineStress": {
        "ratio": 0.334,
        "class": "High (40-80%)",
        "classShares": {
          "High (40-80%)": 0.5717,
          "Low (<10%)": 0.4283
        }
      },
      "stress2050Bau": {
        "ratio": 0.5044,
        "class": "High (40-80%)",
        "classShares": {
          "High (40-80%)": 0.5718,
          "Low - Medium (10-20%)": 0.4282
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Medium (0.4-0.6)",
      "interannualVariability": "Medium - High (0.50-0.75)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low - Medium (1 in 1,000 to 2 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
      "caveats": [
        "baseline water stress: the area-weighted mean 0.334 falls in the class Medium-high (20-40%) while the class with the largest area is High (40-80%) (the footprint spans basins of different stress; both numbers are kept)"
      ]
    }
  },
  "estonia-rural": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "estonia-rural",
      "periods": {
        "1961–1990": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9981,
            "Dfc": 0.0019
          }
        },
        "1991–2020": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 1
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9664,
            "Cfb": 0.0336
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9121,
            "Cfb": 0.0879
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "estonia-rural",
      "basins": 13,
      "baselineStress": {
        "ratio": 0.1349,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.4277,
          "Low - Medium (10-20%)": 0.4117,
          "Medium - High (20-40%)": 0.1515,
          "No Data": 0.0091
        }
      },
      "stress2050Bau": {
        "ratio": 0.137,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.4316,
          "Low - Medium (10-20%)": 0.4155,
          "Medium - High (20-40%)": 0.1528
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Medium (0.4-0.6)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Medium - High (2 in 1,000 to 6 in 1,000)",
      "coverage": {
        "baseline": 0.9875,
        "stress2050Bau": 0.9877
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
      "caveats": [
        "baseline water stress: the area-weighted mean 0.135 falls in the class Low-medium (10-20%) while the class with the largest area is Low (<10%) (the footprint spans basins of different stress; both numbers are kept)",
        "2050 business-as-usual water stress: the area-weighted mean 0.137 falls in the class Low-medium (10-20%) while the class with the largest area is Low (<10%) (the footprint spans basins of different stress; both numbers are kept)"
      ]
    }
  },
  "finger-lakes": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "finger-lakes",
      "periods": {
        "1961–1990": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.8988,
            "Dfa": 0.1012
          }
        },
        "1991–2020": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.5859,
            "Dfa": 0.4141
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfa",
          "shares": {
            "Dfa": 0.9957,
            "Dfb": 0.0043
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfa",
          "shares": {
            "Dfa": 0.8295,
            "Cfa": 0.1705
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "finger-lakes",
      "basins": 5,
      "baselineStress": {
        "ratio": 0.0127,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.962,
          "Medium - High (20-40%)": 0.038,
          "Low - Medium (10-20%)": 0
        }
      },
      "stress2050Bau": {
        "ratio": 0.0149,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.962,
          "Medium - High (20-40%)": 0.038
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Low - Medium (0.2-0.4)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low - Medium (1 in 1,000 to 2 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "galicia": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "galicia",
      "periods": {
        "1961–1990": {
          "dominant": "Csb",
          "shares": {
            "Csb": 0.9663,
            "Cfb": 0.0277,
            "Dsb": 0.0043,
            "Dsc": 0.0015,
            "Dfc": 0.0001
          }
        },
        "1991–2020": {
          "dominant": "Csb",
          "shares": {
            "Csb": 0.9104,
            "Cfb": 0.0853,
            "Dsb": 0.0032,
            "Csa": 0.0008,
            "Dsc": 0.0004
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Csb",
          "shares": {
            "Csb": 0.8667,
            "Csa": 0.0918,
            "Cfb": 0.0409,
            "Dsb": 0.0006
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Csb",
          "shares": {
            "Csb": 0.7749,
            "Csa": 0.1967,
            "Cfb": 0.0281,
            "Dsb": 0.0004
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "galicia",
      "basins": 9,
      "baselineStress": {
        "ratio": 0.1713,
        "class": "Low - Medium (10-20%)",
        "classShares": {
          "Low - Medium (10-20%)": 0.8004,
          "High (40-80%)": 0.0746,
          "Medium - High (20-40%)": 0.0636,
          "Low (<10%)": 0.0532,
          "No Data": 0.0068,
          "Extremely High (>80%)": 0.0014
        }
      },
      "stress2050Bau": {
        "ratio": 0.2193,
        "class": "Medium - High (20-40%)",
        "classShares": {
          "Medium - High (20-40%)": 0.5273,
          "Low - Medium (10-20%)": 0.3427,
          "High (40-80%)": 0.0751,
          "Low (<10%)": 0.0536,
          "Extremely High (>80%)": 0.0014
        },
        "scenario": "SSP3-7.0",
        "publishedClass": "Medium-high (20-40%)"
      },
      "droughtRisk": "Medium (0.4-0.6)",
      "interannualVariability": "Medium - High (0.50-0.75)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Medium - High (2 in 1,000 to 6 in 1,000)",
      "coverage": {
        "baseline": 0.7659,
        "stress2050Bau": 0.766
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
      "caveats": [
        "baseline basin coverage 0.771 of the footprint is below 0.95 (43 basins; the footprint includes area outside any HydroBASINS sub-basin, for example sea)",
        "future basin coverage 0.766 of the footprint is below 0.95 (8 basins; the footprint includes area outside any HydroBASINS sub-basin, for example sea)",
        "baseline bws: basins with a real value cover 0.766 of the footprint (below 0.95)",
        "bau2050 water stress: basins with a real value cover 0.766 of the footprint (below 0.95)"
      ]
    }
  },
  "kootenays": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "kootenays",
      "periods": {
        "1961–1990": {
          "dominant": "Dfc",
          "shares": {
            "Dfc": 0.5236,
            "Dfb": 0.3648,
            "ET": 0.0691,
            "Dsb": 0.0297,
            "Dsc": 0.0127
          }
        },
        "1991–2020": {
          "dominant": "Dfc",
          "shares": {
            "Dfc": 0.4107,
            "Dfb": 0.2869,
            "Dsb": 0.1747,
            "Dsc": 0.0687,
            "ET": 0.0448,
            "Dfa": 0.0093,
            "Dsa": 0.003,
            "Csb": 0.0013,
            "Cfb": 0.0006
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.4094,
            "Dfc": 0.2794,
            "Dsb": 0.1897,
            "Dsa": 0.043,
            "Dfa": 0.0411,
            "Csa": 0.021,
            "Cfa": 0.0088,
            "ET": 0.0059,
            "Dsc": 0.0017
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.434,
            "Dsb": 0.209,
            "Dfc": 0.1927,
            "Csa": 0.0533,
            "Dsa": 0.0484,
            "Dfa": 0.0369,
            "Cfa": 0.0224,
            "ET": 0.0018,
            "Dsc": 0.0015
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "kootenays",
      "basins": 16,
      "baselineStress": {
        "ratio": 0.0036,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 1
        }
      },
      "stress2050Bau": {
        "ratio": 0.0041,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 1
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Low (0.0-0.2)",
      "interannualVariability": "Low (<0.25)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "High (6 in 1,000 to 1 in 100)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "millevaches": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "millevaches",
      "periods": {
        "1961–1990": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 1
          }
        },
        "1991–2020": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 1
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.9672,
            "Cfa": 0.0328
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.8004,
            "Cfa": 0.1996
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "millevaches",
      "basins": 4,
      "baselineStress": {
        "ratio": 0.1209,
        "class": "Low - Medium (10-20%)",
        "classShares": {
          "Low - Medium (10-20%)": 0.5278,
          "Low (<10%)": 0.4701,
          "Medium - High (20-40%)": 0.0021
        }
      },
      "stress2050Bau": {
        "ratio": 0.1737,
        "class": "Medium - High (20-40%)",
        "classShares": {
          "Medium - High (20-40%)": 0.5299,
          "Low (<10%)": 0.4701
        },
        "scenario": "SSP3-7.0",
        "publishedClass": "Medium-high (20-40%)"
      },
      "droughtRisk": "Medium (0.4-0.6)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low - Medium (1 in 1,000 to 2 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
      "caveats": [
        "2050 business-as-usual water stress: the area-weighted mean 0.174 falls in the class Low-medium (10-20%) while the class with the largest area is Medium-high (20-40%) (the footprint spans basins of different stress; both numbers are kept)"
      ]
    }
  },
  "ne-missouri-se-iowa": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "ne-missouri-se-iowa",
      "periods": {
        "1961–1990": {
          "dominant": "Dfa",
          "shares": {
            "Dfa": 1
          }
        },
        "1991–2020": {
          "dominant": "Dfa",
          "shares": {
            "Dfa": 1
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfa",
          "shares": {
            "Dfa": 1
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfa",
          "shares": {
            "Dfa": 0.9433,
            "Cfa": 0.0567
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "ne-missouri-se-iowa",
      "basins": 5,
      "baselineStress": {
        "ratio": 0.0144,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 1
        }
      },
      "stress2050Bau": {
        "ratio": 0.0192,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.999,
          "Low - Medium (10-20%)": 0.001
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Medium (0.4-0.6)",
      "interannualVariability": "Medium - High (0.50-0.75)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low - Medium (1 in 1,000 to 2 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "north-karelia-kainuu": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "north-karelia-kainuu",
      "periods": {
        "1961–1990": {
          "dominant": "Dfc",
          "shares": {
            "Dfc": 1
          }
        },
        "1991–2020": {
          "dominant": "Dfc",
          "shares": {
            "Dfc": 0.8978,
            "Dfb": 0.1022
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9734,
            "Dfc": 0.0266
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 1
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "north-karelia-kainuu",
      "basins": 7,
      "baselineStress": {
        "ratio": 0.0146,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 1
        }
      },
      "stress2050Bau": {
        "ratio": 0.0156,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 1
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Low - Medium (0.2-0.4)",
      "interannualVariability": "Low (<0.25)",
      "seasonalVariability": "Low (<0.33)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "High (6 in 1,000 to 1 in 100)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "northern-new-mexico": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "northern-new-mexico",
      "periods": {
        "1961–1990": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.6085,
            "Dfc": 0.2025,
            "BSk": 0.1887,
            "ET": 0.0003
          }
        },
        "1991–2020": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.6906,
            "BSk": 0.202,
            "Dfc": 0.1074
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.6627,
            "BSk": 0.2969,
            "Dfc": 0.0145,
            "Dfa": 0.0128,
            "Cfb": 0.0087,
            "Cfa": 0.0043
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.6213,
            "BSk": 0.3353,
            "Dfa": 0.0181,
            "Cfb": 0.0155,
            "Cfa": 0.0064,
            "Dfc": 0.0034
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "northern-new-mexico",
      "basins": 6,
      "baselineStress": {
        "ratio": 0.4232,
        "class": "Low - Medium (10-20%)",
        "classShares": {
          "Low - Medium (10-20%)": 0.6621,
          "Arid and Low Water Use": 0.2762,
          "High (40-80%)": 0.0618
        }
      },
      "stress2050Bau": {
        "ratio": 0.421,
        "class": "Low - Medium (10-20%)",
        "classShares": {
          "Low - Medium (10-20%)": 0.662,
          "Arid and low water use": 0.2763,
          "High (40-80%)": 0.0617
        },
        "scenario": "SSP3-7.0",
        "publishedClass": "Low-medium (10-20%)"
      },
      "droughtRisk": "Low - Medium (0.2-0.4)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Low - Medium (0-2 cm/y)",
      "riverineFloodRisk": "Low (0 to 1 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
      "caveats": [
        "baseline water stress: the area-weighted mean 0.423 falls in the class High (40-80%) while the class with the largest area is Low - Medium (10-20%) (the footprint spans basins of different stress; both numbers are kept)",
        "2050 business-as-usual water stress: the area-weighted mean 0.421 falls in the class High (40-80%) while the class with the largest area is Low-medium (10-20%) (the footprint spans basins of different stress; both numbers are kept)"
      ]
    }
  },
  "nova-scotia": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "nova-scotia",
      "periods": {
        "1961–1990": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9966,
            "Dfc": 0.0034
          }
        },
        "1991–2020": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9979,
            "Dfc": 0.0021
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.995,
            "Cfb": 0.005
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9547,
            "Cfb": 0.0452,
            "Dfa": 0.0001
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "nova-scotia",
      "basins": 9,
      "baselineStress": {
        "ratio": 0.0244,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.9934,
          "No Data": 0.0066
        }
      },
      "stress2050Bau": {
        "ratio": 0.0281,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 1
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Low (0.0-0.2)",
      "interannualVariability": "Low (<0.25)",
      "seasonalVariability": "Low (<0.33)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low - Medium (1 in 1,000 to 2 in 1,000)",
      "coverage": {
        "baseline": 0.9899,
        "stress2050Bau": 0.9896
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "oaxaca": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "oaxaca",
      "periods": {
        "1961–1990": {
          "dominant": "Cwb",
          "shares": {
            "Cwb": 0.7472,
            "BSh": 0.2097,
            "BSk": 0.0165,
            "Cfb": 0.0127,
            "Aw": 0.0097,
            "Cwa": 0.002,
            "Cfa": 0.0015,
            "Cwc": 0.0007,
            "Am": 0.0001
          }
        },
        "1991–2020": {
          "dominant": "Cwb",
          "shares": {
            "Cwb": 0.7827,
            "BSh": 0.1447,
            "Aw": 0.0589,
            "Cfb": 0.0069,
            "Cwa": 0.0039,
            "Cfa": 0.0017,
            "Am": 0.001,
            "BSk": 0.0002
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Cwb",
          "shares": {
            "Cwb": 0.6037,
            "BSh": 0.1739,
            "Aw": 0.1669,
            "Cwa": 0.0522,
            "Am": 0.0028,
            "Cfa": 0.0003,
            "Cfb": 0.0002
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Cwb",
          "shares": {
            "Cwb": 0.531,
            "BSh": 0.2207,
            "Aw": 0.1849,
            "Cwa": 0.0601,
            "Am": 0.0033
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "oaxaca",
      "basins": 5,
      "baselineStress": {
        "ratio": 0.0472,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 1
        }
      },
      "stress2050Bau": {
        "ratio": 0.0624,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 1
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Medium (0.4-0.6)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low (0 to 1 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "ozarks": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "ozarks",
      "periods": {
        "1961–1990": {
          "dominant": "Cfa",
          "shares": {
            "Cfa": 0.997,
            "Dfa": 0.003
          }
        },
        "1991–2020": {
          "dominant": "Cfa",
          "shares": {
            "Cfa": 1
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Cfa",
          "shares": {
            "Cfa": 1
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Cfa",
          "shares": {
            "Cfa": 1
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "ozarks",
      "basins": 5,
      "baselineStress": {
        "ratio": 0.4298,
        "class": "High (40-80%)",
        "classShares": {
          "High (40-80%)": 0.8608,
          "Low - Medium (10-20%)": 0.111,
          "Low (<10%)": 0.0282
        }
      },
      "stress2050Bau": {
        "ratio": 0.7204,
        "class": "High (40-80%)",
        "classShares": {
          "High (40-80%)": 0.8608,
          "Medium - High (20-40%)": 0.0835,
          "Low - Medium (10-20%)": 0.0514,
          "Low (<10%)": 0.0044
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Medium (0.4-0.6)",
      "interannualVariability": "High (0.75-1.00)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low (0 to 1 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "pembrokeshire": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "pembrokeshire",
      "periods": {
        "1961–1990": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.9996,
            "Csb": 0.0004
          }
        },
        "1991–2020": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 1
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 1
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 1
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded.",
      "caveats": [
        "52% of the footprint cells are sea / no data (excluded from shares)"
      ]
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "pembrokeshire",
      "basins": 2,
      "baselineStress": {
        "ratio": 0.0539,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.9922,
          "No Data": 0.0078
        }
      },
      "stress2050Bau": {
        "ratio": 0.0611,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 1
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Medium - High (0.6-0.8)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low - Medium (1 in 1,000 to 2 in 1,000)",
      "coverage": {
        "baseline": 0.4965,
        "stress2050Bau": 0.4976
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
      "caveats": [
        "baseline basin coverage 0.500 of the footprint is below 0.95 (7 basins; the footprint includes area outside any HydroBASINS sub-basin, for example sea)",
        "future basin coverage 0.498 of the footprint is below 0.95 (1 basins; the footprint includes area outside any HydroBASINS sub-basin, for example sea)",
        "baseline bws: basins with a real value cover 0.496 of the footprint (below 0.95)",
        "bau2050 water stress: basins with a real value cover 0.498 of the footprint (below 0.95)"
      ]
    }
  },
  "quebec-eastern-townships": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "quebec-eastern-townships",
      "periods": {
        "1961–1990": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9983,
            "Dfc": 0.0017
          }
        },
        "1991–2020": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 1
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.6804,
            "Dfa": 0.3196
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfa",
          "shares": {
            "Dfa": 0.5864,
            "Dfb": 0.4136
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "quebec-eastern-townships",
      "basins": 7,
      "baselineStress": {
        "ratio": 0.0799,
        "class": "Low - Medium (10-20%)",
        "classShares": {
          "Low - Medium (10-20%)": 0.6893,
          "Low (<10%)": 0.3107
        }
      },
      "stress2050Bau": {
        "ratio": 0.0897,
        "class": "Low - Medium (10-20%)",
        "classShares": {
          "Low - Medium (10-20%)": 0.6893,
          "Low (<10%)": 0.3107
        },
        "scenario": "SSP3-7.0",
        "publishedClass": "Low-medium (10-20%)"
      },
      "droughtRisk": "Low (0.0-0.2)",
      "interannualVariability": "Low (<0.25)",
      "seasonalVariability": "Low (<0.33)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low - Medium (1 in 1,000 to 2 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
      "caveats": [
        "baseline water stress: the area-weighted mean 0.080 falls in the class Low (<10%) while the class with the largest area is Low - Medium (10-20%) (the footprint spans basins of different stress; both numbers are kept)",
        "2050 business-as-usual water stress: the area-weighted mean 0.090 falls in the class Low (<10%) while the class with the largest area is Low-medium (10-20%) (the footprint spans basins of different stress; both numbers are kept)"
      ]
    }
  },
  "saxony-anhalt": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "saxony-anhalt",
      "periods": {
        "1961–1990": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9901,
            "Cfb": 0.0083,
            "Dfc": 0.0016
          }
        },
        "1991–2020": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.9574,
            "Dfb": 0.0419,
            "Dfc": 0.0008
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.9974,
            "Dfb": 0.0026
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.649,
            "Cfa": 0.3497,
            "Dfb": 0.0013
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "saxony-anhalt",
      "basins": 6,
      "baselineStress": {
        "ratio": 0.2978,
        "class": "High (40-80%)",
        "classShares": {
          "High (40-80%)": 0.4483,
          "Low (<10%)": 0.3545,
          "Low - Medium (10-20%)": 0.1465,
          "Medium - High (20-40%)": 0.0507
        }
      },
      "stress2050Bau": {
        "ratio": 0.3161,
        "class": "High (40-80%)",
        "classShares": {
          "High (40-80%)": 0.4483,
          "Low (<10%)": 0.3545,
          "Medium - High (20-40%)": 0.1972
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Medium (0.4-0.6)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low (<0.33)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low - Medium (1 in 1,000 to 2 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
      "caveats": [
        "baseline water stress: the area-weighted mean 0.298 falls in the class Medium-high (20-40%) while the class with the largest area is High (40-80%) (the footprint spans basins of different stress; both numbers are kept)",
        "2050 business-as-usual water stress: the area-weighted mean 0.316 falls in the class Medium-high (20-40%) while the class with the largest area is High (40-80%) (the footprint spans basins of different stress; both numbers are kept)"
      ]
    }
  },
  "scottish-highlands": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "scottish-highlands",
      "periods": {
        "1961–1990": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.6811,
            "Cfc": 0.2912,
            "ET": 0.0216,
            "Dfc": 0.006
          }
        },
        "1991–2020": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.8537,
            "Cfc": 0.1439,
            "ET": 0.0016,
            "Dfc": 0.0008
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.9531,
            "Cfc": 0.0468,
            "Dfc": 0.0002
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.9793,
            "Cfc": 0.0206,
            "Dfc": 0
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "scottish-highlands",
      "basins": 3,
      "baselineStress": {
        "ratio": 0.0048,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.9983,
          "No Data": 0.0017
        }
      },
      "stress2050Bau": {
        "ratio": 0.0049,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 1
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Medium (0.4-0.6)",
      "interannualVariability": "Low (<0.25)",
      "seasonalVariability": "Low (<0.33)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low (0 to 1 in 1,000)",
      "coverage": {
        "baseline": 0.9955,
        "stress2050Bau": 0.9955
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "south-tirol": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "south-tirol",
      "periods": {
        "1961–1990": {
          "dominant": "ET",
          "shares": {
            "ET": 0.363,
            "Dfb": 0.3195,
            "Dfc": 0.2819,
            "Cfb": 0.0342,
            "Cfa": 0.0014
          }
        },
        "1991–2020": {
          "dominant": "Dfc",
          "shares": {
            "Dfc": 0.3873,
            "Dfb": 0.307,
            "ET": 0.2395,
            "Cfa": 0.034,
            "Cfb": 0.0322
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.4193,
            "Dfc": 0.3611,
            "ET": 0.1026,
            "Cfa": 0.0713,
            "Cfb": 0.0457
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.4785,
            "Dfc": 0.3123,
            "Cfa": 0.0983,
            "ET": 0.0655,
            "Cfb": 0.0454
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "south-tirol",
      "basins": 5,
      "baselineStress": {
        "ratio": 0.1257,
        "class": "Low - Medium (10-20%)",
        "classShares": {
          "Low - Medium (10-20%)": 0.9644,
          "Low (<10%)": 0.0297,
          "Medium - High (20-40%)": 0.0059
        }
      },
      "stress2050Bau": {
        "ratio": 0.1483,
        "class": "Low - Medium (10-20%)",
        "classShares": {
          "Low - Medium (10-20%)": 0.9644,
          "Low (<10%)": 0.0298,
          "Medium - High (20-40%)": 0.0059
        },
        "scenario": "SSP3-7.0",
        "publishedClass": "Low-medium (10-20%)"
      },
      "droughtRisk": "Medium (0.4-0.6)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low (<0.33)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Medium - High (2 in 1,000 to 6 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "southern-appalachians": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "southern-appalachians",
      "periods": {
        "1961–1990": {
          "dominant": "Cfa",
          "shares": {
            "Cfa": 0.4039,
            "Dfb": 0.3024,
            "Cfb": 0.2937
          }
        },
        "1991–2020": {
          "dominant": "Cfa",
          "shares": {
            "Cfa": 0.5409,
            "Cfb": 0.365,
            "Dfb": 0.0941
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Cfa",
          "shares": {
            "Cfa": 0.8067,
            "Cfb": 0.1872,
            "Dfb": 0.0061
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Cfa",
          "shares": {
            "Cfa": 0.8559,
            "Cfb": 0.143,
            "Dfb": 0.0011
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "southern-appalachians",
      "basins": 8,
      "baselineStress": {
        "ratio": 0.2008,
        "class": "Low - Medium (10-20%)",
        "classShares": {
          "Low - Medium (10-20%)": 0.4128,
          "Low (<10%)": 0.348,
          "High (40-80%)": 0.1449,
          "Medium - High (20-40%)": 0.0943
        }
      },
      "stress2050Bau": {
        "ratio": 0.1997,
        "class": "Low - Medium (10-20%)",
        "classShares": {
          "Low - Medium (10-20%)": 0.4128,
          "Low (<10%)": 0.3479,
          "High (40-80%)": 0.1449,
          "Medium - High (20-40%)": 0.0943
        },
        "scenario": "SSP3-7.0",
        "publishedClass": "Low-medium (10-20%)"
      },
      "droughtRisk": "Low - Medium (0.2-0.4)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low (<0.33)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low (0 to 1 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
      "caveats": [
        "baseline water stress: the area-weighted mean 0.201 falls in the class Medium-high (20-40%) while the class with the largest area is Low - Medium (10-20%) (the footprint spans basins of different stress; both numbers are kept)"
      ]
    }
  },
  "teruel-uplands": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "teruel-uplands",
      "periods": {
        "1961–1990": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.9,
            "Dfb": 0.0567,
            "Cfa": 0.0173,
            "Csb": 0.0122,
            "BSk": 0.0109,
            "Dsb": 0.0029
          }
        },
        "1991–2020": {
          "dominant": "Cfb",
          "shares": {
            "Cfb": 0.6823,
            "Cfa": 0.2122,
            "BSk": 0.0538,
            "Csb": 0.0279,
            "Dfb": 0.0204,
            "Dsb": 0.0029,
            "Csa": 0.0005
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Cfa",
          "shares": {
            "Cfa": 0.5876,
            "BSk": 0.2314,
            "Cfb": 0.1461,
            "Csb": 0.0195,
            "Csa": 0.0142,
            "Dfb": 0.0012
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Cfa",
          "shares": {
            "Cfa": 0.5423,
            "BSk": 0.3469,
            "Cfb": 0.0636,
            "Csa": 0.0422,
            "Csb": 0.005
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "teruel-uplands",
      "basins": 6,
      "baselineStress": {
        "ratio": 0.6465,
        "class": "Medium - High (20-40%)",
        "classShares": {
          "Medium - High (20-40%)": 0.7436,
          "Extremely High (>80%)": 0.2244,
          "High (40-80%)": 0.0206,
          "Low (<10%)": 0.0114
        }
      },
      "stress2050Bau": {
        "ratio": 1.358,
        "class": "Extremely High (>80%)",
        "classShares": {
          "Extremely High (>80%)": 0.9886,
          "High (40-80%)": 0.0114
        },
        "scenario": "SSP3-7.0",
        "publishedClass": "Extremely high (>80%)"
      },
      "droughtRisk": "Medium - High (0.6-0.8)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low - Medium (1 in 1,000 to 2 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
      "caveats": [
        "baseline water stress: the area-weighted mean 0.646 falls in the class High (40-80%) while the class with the largest area is Medium - High (20-40%) (the footprint spans basins of different stress; both numbers are kept)"
      ]
    }
  },
  "transylvania": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "transylvania",
      "periods": {
        "1961–1990": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.8711,
            "Dfc": 0.1068,
            "ET": 0.0221
          }
        },
        "1991–2020": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9029,
            "Dfc": 0.0884,
            "ET": 0.0087
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.515,
            "Dfa": 0.4294,
            "Dfc": 0.0378,
            "Cfa": 0.0178
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.3737,
            "Dfa": 0.3264,
            "Cfa": 0.2751,
            "Dfc": 0.0249
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "transylvania",
      "basins": 5,
      "baselineStress": {
        "ratio": 0.3648,
        "class": "Medium - High (20-40%)",
        "classShares": {
          "Medium - High (20-40%)": 0.614,
          "High (40-80%)": 0.3441,
          "Low (<10%)": 0.0419
        }
      },
      "stress2050Bau": {
        "ratio": 0.4152,
        "class": "Medium - High (20-40%)",
        "classShares": {
          "Medium - High (20-40%)": 0.6141,
          "High (40-80%)": 0.3439,
          "Low (<10%)": 0.0419
        },
        "scenario": "SSP3-7.0",
        "publishedClass": "Medium-high (20-40%)"
      },
      "droughtRisk": "Medium - High (0.6-0.8)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low (<0.33)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "High (6 in 1,000 to 1 in 100)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
      "caveats": [
        "2050 business-as-usual water stress: the area-weighted mean 0.415 falls in the class High (40-80%) while the class with the largest area is Medium-high (20-40%) (the footprint spans basins of different stress; both numbers are kept)"
      ]
    }
  },
  "valle-maira": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "valle-maira",
      "periods": {
        "1961–1990": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.3641,
            "Dfc": 0.2943,
            "ET": 0.2084,
            "Cfb": 0.1332
          }
        },
        "1991–2020": {
          "dominant": "Dfc",
          "shares": {
            "Dfc": 0.361,
            "Dfb": 0.3319,
            "Cfb": 0.1762,
            "ET": 0.1031,
            "Cfa": 0.0279
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.3953,
            "Dfc": 0.2632,
            "Cfb": 0.1955,
            "Cfa": 0.145,
            "ET": 0.0011
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.4275,
            "Cfa": 0.2105,
            "Dfc": 0.1826,
            "Cfb": 0.1794
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "valle-maira",
      "basins": 3,
      "baselineStress": {
        "ratio": 0.3307,
        "class": "Medium - High (20-40%)",
        "classShares": {
          "Medium - High (20-40%)": 0.9972,
          "Low - Medium (10-20%)": 0.0028
        }
      },
      "stress2050Bau": {
        "ratio": 0.4029,
        "class": "High (40-80%)",
        "classShares": {
          "High (40-80%)": 0.9971,
          "Medium - High (20-40%)": 0.0029
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Medium (0.4-0.6)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low (0 to 1 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "vermont": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "vermont",
      "periods": {
        "1961–1990": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9963,
            "Dfa": 0.003,
            "Dfc": 0.0007
          }
        },
        "1991–2020": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.9072,
            "Dfa": 0.0928
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Dfb",
          "shares": {
            "Dfb": 0.5099,
            "Dfa": 0.4901
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Dfa",
          "shares": {
            "Dfa": 0.7058,
            "Dfb": 0.2942
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "vermont",
      "basins": 5,
      "baselineStress": {
        "ratio": 0.0584,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.529,
          "Low - Medium (10-20%)": 0.471
        }
      },
      "stress2050Bau": {
        "ratio": 0.0624,
        "class": "Low (<10%)",
        "classShares": {
          "Low (<10%)": 0.5291,
          "Low - Medium (10-20%)": 0.4709
        },
        "scenario": "SSP3-7.0"
      },
      "droughtRisk": "Low - Medium (0.2-0.4)",
      "interannualVariability": "Low - Medium (0.25-0.50)",
      "seasonalVariability": "Low (<0.33)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low - Medium (1 in 1,000 to 2 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them."
    }
  },
  "virginia-piedmont": {
    "koppen": {
      "source": {
        "id": "beck-koppen-2023",
        "name": "Beck et al. 2023, Köppen-Geiger maps at 1 km",
        "url": "https://www.nature.com/articles/s41597-023-02549-6",
        "licence": "CC BY 4.0",
        "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
        "retrieved": "2026-10-04"
      },
      "footprint": "virginia-piedmont",
      "periods": {
        "1961–1990": {
          "dominant": "Cfa",
          "shares": {
            "Cfa": 1
          }
        },
        "1991–2020": {
          "dominant": "Cfa",
          "shares": {
            "Cfa": 1
          }
        },
        "2041–2070 SSP2-4.5": {
          "dominant": "Cfa",
          "shares": {
            "Cfa": 1
          }
        },
        "2071–2099 SSP2-4.5": {
          "dominant": "Cfa",
          "shares": {
            "Cfa": 1
          }
        }
      },
      "note": "Shares are the fraction of the footprint land area in each class at 1 km; sea and no-data cells are excluded."
    },
    "water": {
      "source": {
        "id": "aqueduct-40",
        "name": "WRI Aqueduct 4.0",
        "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
        "licence": "CC BY 4.0 (WRI Aqueduct data)",
        "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
        "retrieved": "2023-08-04"
      },
      "footprint": "virginia-piedmont",
      "basins": 4,
      "baselineStress": {
        "ratio": 0.209,
        "class": "Low - Medium (10-20%)",
        "classShares": {
          "Low - Medium (10-20%)": 0.5515,
          "Medium - High (20-40%)": 0.4485
        }
      },
      "stress2050Bau": {
        "ratio": 0.2687,
        "class": "Medium - High (20-40%)",
        "classShares": {
          "Medium - High (20-40%)": 0.8279,
          "High (40-80%)": 0.1721
        },
        "scenario": "SSP3-7.0",
        "publishedClass": "Medium-high (20-40%)"
      },
      "droughtRisk": "Low - Medium (0.2-0.4)",
      "interannualVariability": "Extremely High (>1.00)",
      "seasonalVariability": "Low - Medium (0.33-0.66)",
      "groundwaterTrend": "Insignificant Trend",
      "riverineFloodRisk": "Low (0 to 1 in 1,000)",
      "coverage": {
        "baseline": 1,
        "stress2050Bau": 1
      },
      "scenarioNote": "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use “three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080.",
      "note": "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
      "caveats": [
        "baseline water stress: the area-weighted mean 0.209 falls in the class Medium-high (20-40%) while the class with the largest area is Low - Medium (10-20%) (the footprint spans basins of different stress; both numbers are kept)"
      ]
    }
  }
};
