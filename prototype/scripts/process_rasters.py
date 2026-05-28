"""Process raster sources into PNG overlays for MapLibre image sources.

For each raster:
  1. Read with rasterio
  2. Clip to Europe bbox (in WGS84 lat/lon)
  3. Apply per-layer color ramp + transparency
  4. Save as PNG to data/processed/<layer>.png
  5. Save corner coordinates + metadata to data/processed/<layer>.json

MapLibre then renders each PNG as a static raster overlay positioned by its bounds.
This is the MVP path — no tiling, no PMTiles, no GDAL CLI. Browser does the projection.
"""

import json
import sys
from pathlib import Path

import numpy as np
import rasterio
from rasterio.windows import from_bounds
from PIL import Image

ROOT = Path(__file__).parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"
OUT.mkdir(parents=True, exist_ok=True)

# Europe extent: west, south, east, north
EUROPE = (-12.0, 35.0, 40.0, 72.0)

# Target image size for the Europe extent (degrees → pixels)
# Europe span: 52° wide × 37° tall. At ~30 px/deg = 1560 × 1110.
PX_PER_DEG = 30
EU_W = int((EUROPE[2] - EUROPE[0]) * PX_PER_DEG)  # 1560
EU_H = int((EUROPE[3] - EUROPE[1]) * PX_PER_DEG)  # 1110


def lerp(a, b, t):
    return a + (b - a) * t


def colorize(data, mask, color_lo, color_hi, vmin=None, vmax=None, alpha=200):
    """Map normalized values to an RGBA gradient between color_lo and color_hi.

    data: 2D numpy array
    mask: boolean array, True where data is invalid (nodata)
    color_lo, color_hi: (r, g, b) tuples for low/high ends
    alpha: 0-255, applied where data is valid
    """
    if vmin is None:
        vmin = float(np.nanpercentile(data[~mask], 2)) if (~mask).any() else 0.0
    if vmax is None:
        vmax = float(np.nanpercentile(data[~mask], 98)) if (~mask).any() else 1.0

    if vmax <= vmin:
        vmax = vmin + 1.0

    norm = np.clip((data - vmin) / (vmax - vmin), 0.0, 1.0)

    r = (lerp(color_lo[0], color_hi[0], norm)).astype(np.uint8)
    g = (lerp(color_lo[1], color_hi[1], norm)).astype(np.uint8)
    b = (lerp(color_lo[2], color_hi[2], norm)).astype(np.uint8)
    a = np.full(data.shape, alpha, dtype=np.uint8)
    a[mask] = 0

    return np.dstack([r, g, b, a]), vmin, vmax


def read_clip(path, band=1, resample_to=(EU_H, EU_W)):
    """Read a band from a raster, clip to Europe extent, resample to target shape."""
    with rasterio.open(path) as src:
        # If the raster CRS is not lat/lon, we'd need transform; assume WGS84 for our sources
        window = from_bounds(*EUROPE, transform=src.transform)
        data = src.read(
            band,
            window=window,
            out_shape=resample_to,
            resampling=rasterio.enums.Resampling.average,
            boundless=True,
            fill_value=src.nodata if src.nodata is not None else -9999,
        )
        nodata = src.nodata if src.nodata is not None else -9999
    data = data.astype(np.float32)
    mask = (data == nodata) | np.isnan(data)
    return data, mask


def save(name, rgba, vmin, vmax, layer_meta):
    out_png = OUT / f"{name}.png"
    out_json = OUT / f"{name}.json"
    Image.fromarray(rgba, "RGBA").save(out_png, optimize=True)
    meta = dict(layer_meta)
    meta["bounds"] = list(EUROPE)
    meta["value_range"] = {"min": vmin, "max": vmax}
    out_json.write_text(json.dumps(meta, indent=2))
    print(f"  -> {out_png.name} ({out_png.stat().st_size/1024:.0f} KB), range {vmin:.2f}–{vmax:.2f}")


# =========================================================================
# Layer processors
# =========================================================================

def process_climate():
    """CMIP6 projected mean annual temperature (absolute, 2041-2060).

    BIO1 band of the bioclim stack = mean annual temperature.
    Shows the actual projected temperature regime, not the anomaly — visually
    clearer and doesn't require a second baseline download.
    """
    fut_path = RAW / "cmip6-bio-ssp245-2050.tif"
    if not fut_path.exists():
        print("  [skip climate — file not ready]")
        return

    fut, fut_mask = read_clip(fut_path, band=1)  # BIO1 = mean annual temp
    # WorldClim CMIP6 stores BIO1 in °C * 10 OR °C depending on version; check range
    # 2.1 BIO1 is stored as °C (float). If we see values in -300..+500 it's scaled by 10.
    valid = fut[~fut_mask]
    if len(valid) > 0 and (valid.max() > 60 or valid.min() < -60):
        # Scaled by 10
        fut = fut / 10.0

    rgba, vmin, vmax = colorize(
        fut, fut_mask,
        color_lo=(58, 100, 138),  # cool blue (cold)
        color_hi=(180, 70, 50),   # warm red (hot)
        vmin=-5.0, vmax=22.0,  # European range at mid-century
        alpha=190,
    )
    save("climate-trajectory", rgba, vmin, vmax, {
        "metric": "Mean annual temperature, 2041–2060 (projected)",
        "source": "WorldClim CMIP6 (MPI-ESM1-2-HR, SSP2-4.5)",
        "vintage": "projection target 2041–2060",
        "native_unit": "~18 km raster",
        "license": "WorldClim terms; CMIP6 attribution",
        "color_lo": "#3a648a",
        "color_hi": "#b44632",
        "units": "°C",
    })


def process_soil_carbon():
    """SoilGrids 2.0 SOC 0-30cm via /vsicurl/ on the VRT."""
    vrt_url = "/vsicurl/https://files.isric.org/soilgrids/latest/data/soc/soc_0-30cm_mean.vrt"
    print("  [SoilGrids: streaming via VRT — needs network]")
    try:
        data, mask = read_clip(vrt_url, band=1, resample_to=(EU_H, EU_W))
    except Exception as e:
        print(f"  [skip soil — {e}]")
        return
    # SoilGrids stores SOC ×10 in g/kg; divide
    data = data / 10.0
    rgba, vmin, vmax = colorize(
        data, mask,
        color_lo=(247, 240, 222),  # pale
        color_hi=(74, 58, 26),  # rich earth
        vmin=5, vmax=80,
        alpha=200,
    )
    save("soil-carbon", rgba, vmin, vmax, {
        "metric": "Soil organic carbon, top 30 cm (g/kg)",
        "source": "SoilGrids 2.0 (ISRIC)",
        "vintage": "2020",
        "native_unit": "250 m raster (resampled)",
        "license": "CC BY 4.0",
        "color_lo": "#f7f0de",
        "color_hi": "#4a3a1a",
        "units": "g/kg",
    })


def process_population():
    """GHSL POP 2030 1km global, log-transformed."""
    import zipfile, io
    zip_path = RAW / "ghsl-pop-2030-1km.zip"
    if not zip_path.exists():
        print("  [skip population — zip not ready]")
        return
    # Extract the TIF inside
    with zipfile.ZipFile(zip_path) as zf:
        tif_names = [n for n in zf.namelist() if n.endswith(".tif")]
        if not tif_names:
            print("  [skip population — no TIF in zip]")
            return
        extracted = RAW / "ghsl-pop-2030.tif"
        with zf.open(tif_names[0]) as src, open(extracted, "wb") as dst:
            dst.write(src.read())

    data, mask = read_clip(extracted, band=1)
    # Log-transform (population is wildly skewed)
    data = np.where(data > 0, np.log1p(data), 0)
    mask = mask | (data == 0)
    rgba, vmin, vmax = colorize(
        data, mask,
        color_lo=(246, 242, 235),  # paper
        color_hi=(106, 90, 74),  # warm grey
        vmin=0.5, vmax=8.0,  # log1p of 0.5 to ~3000 persons/cell
        alpha=180,
    )
    save("population", rgba, vmin, vmax, {
        "metric": "Population per 1 km cell (log scale)",
        "source": "GHS-POP R2023A (JRC)",
        "vintage": "2030 projection",
        "native_unit": "1 km raster",
        "license": "Free open data (JRC)",
        "color_lo": "#f6f2eb",
        "color_hi": "#6a5a4a",
        "units": "persons per cell (log-displayed)",
    })


# =========================================================================
# Main
# =========================================================================

if __name__ == "__main__":
    targets = sys.argv[1:] if len(sys.argv) > 1 else ["climate", "soil", "population"]
    if "climate" in targets:
        print("== climate-trajectory ==")
        process_climate()
    if "soil" in targets:
        print("== soil-carbon ==")
        process_soil_carbon()
    if "population" in targets:
        print("== population ==")
        process_population()
