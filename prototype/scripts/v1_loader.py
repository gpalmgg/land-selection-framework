"""V1 canonical loader, returns a GeoDataFrame per criterion with metadata attached.

Spec Step 10 deliverable: "a single canonical loader function per criterion, returning
a GeoDataFrame (or equivalent) with metadata as attributes."

Usage:
    from v1_loader import load, criteria, load_metadata
    gdf = load('water_stress')                       # both continents
    gdf_eu = load('water_stress', continent='europe')
    gdf_legal = load('legal_ownership')
    print(gdf.attrs)                                  # sidecar metadata
"""
from pathlib import Path

import geopandas as gpd
import pandas as pd
import yaml

ROOT = Path(__file__).parent.parent
PROCESSED = ROOT / "data" / "processed"

# Each criterion maps to one or more processed files. forest_change is served
# as XYZ raster tiles (Hansen/GFW), no stored file, documented but not loadable.
LAYERS = {
    "water_stress":    {"files": [("water-stress.geojson", "europe"),    ("water-stress-na.geojson", "north-america")]},
    "water_depletion": {"files": [("water-depletion.geojson", "europe"), ("water-depletion-na.geojson", "north-america")]},
    "conflict":        {"files": [("conflict.geojson", "europe"),        ("conflict-na.geojson", "north-america")]},
    "regen_network":   {"files": [("ecovillages.geojson", "europe"),     ("ecovillages-na.geojson", "north-america")]},
    "legal_ownership":        {"files": [("legal-ownership.geojson", "both")]},
    "land_cost":              {"files": [("land-cost.geojson", "both")]},
    "hospital_proximity":     {"files": [("hospital-proximity.geojson", "both")]},
    "demographic_trajectory": {"files": [("demographic-trajectory.geojson", "both")]},
    "soil_contamination":     {"files": [("soil-contamination.geojson", "both")]},
    "water_source_control":   {"files": [("water-source-control.geojson", "both")]},
}

# Sidecar metadata filename per criterion.
SIDECAR = {
    "water_stress":           "water-stress.metadata.yaml",
    "water_depletion":        "water-depletion.metadata.yaml",
    "conflict":               "conflict.metadata.yaml",
    "regen_network":          "ecovillages.metadata.yaml",
    "legal_ownership":        "legal-ownership.metadata.yaml",
    "land_cost":              "land-cost.metadata.yaml",
    "hospital_proximity":     "hospital-proximity.metadata.yaml",
    "demographic_trajectory": "demographic-trajectory.metadata.yaml",
    "soil_contamination":     "soil-contamination.metadata.yaml",
    "water_source_control":   "water-source-control.metadata.yaml",
}

criteria = list(LAYERS.keys())


def load_metadata(criterion: str) -> dict:
    """Return the sidecar metadata dict for `criterion`."""
    path = PROCESSED / SIDECAR[criterion]
    return yaml.safe_load(path.read_text())


def load(criterion: str, continent: str | None = None) -> gpd.GeoDataFrame:
    """Load a V1 Tier-1 criterion as a GeoDataFrame.

    Parameters
    ----------
    criterion : one of `criteria`
    continent : optional 'europe' | 'north-america' filter

    Returns
    -------
    GeoDataFrame with .attrs populated from the criterion's metadata sidecar.
    """
    if criterion not in LAYERS:
        raise KeyError(f"Unknown criterion {criterion!r}; available: {criteria}")
    frames = []
    for fname, cont in LAYERS[criterion]["files"]:
        if continent and cont != continent and cont != "both":
            continue
        gdf = gpd.read_file(PROCESSED / fname)
        if cont != "both":
            gdf["continent"] = cont
        frames.append(gdf)
    if not frames:
        raise ValueError(f"No layers matched continent={continent!r} for {criterion}")
    out = pd.concat(frames, ignore_index=True) if len(frames) > 1 else frames[0]
    out = gpd.GeoDataFrame(out, geometry="geometry", crs=frames[0].crs)
    out.attrs = load_metadata(criterion)
    return out


if __name__ == "__main__":
    print(f"V1 Tier-1 criteria loadable via load(<name>): {len(criteria)} criteria")
    for c in criteria:
        gdf = load(c)
        kind = gdf.geometry.geom_type.iloc[0]
        meta = gdf.attrs
        print(f"  {c:<18s} {len(gdf):>6d} features ({kind:<10s}) [{meta.get('source','?')}]")
