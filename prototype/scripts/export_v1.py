"""Export V1 Tier-1 layers to GeoPackage for QGIS consumption (Spec Step 10).

Output: data/v1-exports/<criterion>.gpkg per loadable criterion, plus a
forest_change.README.md noting it is XYZ-tile-served (no stored file).
"""
from pathlib import Path

from v1_loader import load, criteria

ROOT = Path(__file__).parent.parent
OUT = ROOT / "data" / "v1-exports"
OUT.mkdir(parents=True, exist_ok=True)


def main():
    print(f"Exporting V1 layers to {OUT.relative_to(ROOT)}/")
    for c in criteria:
        gdf = load(c)
        path = OUT / f"{c}.gpkg"
        gdf.to_file(path, driver="GPKG")
        print(f"  {c:<18s} -> {path.name:<28s} ({len(gdf)} features)")
    note = OUT / "forest_change.README.md"
    note.write_text(
        "# forest_change is tile-served, not a stored file\n\n"
        "Source: Hansen Global Forest Change v1.11 / Global Forest Watch (CC BY 4.0).\n\n"
        "To add to QGIS:\n"
        "  Layer -> Add Layer -> Add XYZ Layer\n"
        "  URL: https://tiles.globalforestwatch.org/umd_tree_cover_loss/v1.13/dynamic/{z}/{x}/{y}.png\n\n"
        "Native resolution 30 m global, vintage 2001-2023.\n"
    )
    print(f"  forest_change      -> {note.name} (tile-reference, not a layer file)")


if __name__ == "__main__":
    main()
