# Bioregion pipeline

Qualitative landscape context only (never scored). Sources: RESOLVE Ecoregions 2017 (CC BY 4.0; clipped and simplified here),
Natural Earth rivers (public domain), HydroBASINS v1c (analysis only, not shipped). See `bioregionSources` in `data/bioregions.js`.

`run_all.sh` rebuilds everything; `copy_final.sh` installs it into `data/` and `data/processed/`. Scripts chdir into
`upgrade-2026-10/tracks/bio-data` (override with `BIO_DATA`) where the raw downloads live.
`regions30.py` reads `data/regions.js` and falls back to `upgrade-2026-10/regions/<id>/data.json` for regions not in it yet.
Adding a region needs a `place` and `watershed` entry in `make_bioregions_js.py` (dict `C`); dropping one means deleting it from `C`.
