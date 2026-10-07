# Fixtures for scripts/evidence/merge/*.test.mjs (EV-MERGE-TOOLS)

Small hand-made inputs. Tests copy what they write into os.tmpdir(); nothing here is modified in place.

* `root/`      a prototype-like tree (data modules in house format, processed JSON and GeoJSON, a region page,
               a source-docs file that must never change, a minimal tests/schema.mjs)
* `reverify/`  two reverify files with one item of every shape the converter handles (right and wrong `old`, quoted
               hyphenated ids, a held item, low confidence, deeper.html, dossier markdown, multi-field path, array value)
* `packages/`  region packages: ship, ship-with-gaps (null cell + reason, keyed standing/depth, underscore keys), drop,
               no verdict, no verify.md, and a ship package that is invalid
* `stages/`    pipeline stage outputs in the two real shapes (flat cell-like and the local nested one, with a bare NaN)
* `staging/`   overlay files (registered new field, unregistered field, existing path, layer overlay, nested context path)
