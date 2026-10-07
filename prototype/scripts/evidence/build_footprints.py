#!/usr/bin/env python3
"""Build the footprint registry: data/footprints.json + data/footprints/<id>.geojson.

    prototype/.venv/bin/python prototype/scripts/evidence/build_footprints.py            # build
    prototype/.venv/bin/python prototype/scripts/evidence/build_footprints.py --check    # verify only

A footprint is the area a region's value cells are computed over (the evidence pipeline
reads it through common.load_footprint). Registry entry:

    { kind: 'polygon'|'bbox'|'disc', bounds: [w,s,e,n], description, basis, areaKm2,
      marker: [lon,lat], polygonFile: 'footprints/<id>.geojson' | null,
      radiusKm (disc only), simplifyTolerance (polygon only) }

Where the footprints come from
  * The 10 new regions bring their own polygons (upgrade-2026-10/regions/<id>/raw/
    footprint_union.geojson; north-karelia-kainuu: work/footprint.geojson). They are
    dissolved to one geometry in EPSG:4326, area is measured in EPSG:6933 on the
    full-resolution geometry, then the shipped copy is simplified to a 30 KB budget
    (tolerance 0.005, 0.02 for the Scottish Highlands, parts under 1 km2 dropped).
    The full-resolution files stay in regions/ and are never deployed.
  * The 20 existing regions get the administrative unit named in their title when one
    exists (Natural Earth admin-1, Census cartographic boundaries, an OSM boundary),
    otherwise the evidence window recorded in upgrade-2026-10/reverify/<id>.md|json, and
    where neither is stated a 50 km disc around the marker, each said in `basis`.

Region ids and marker coordinates are read from data via dump_regions.mjs, never typed.
Network inputs are fetched through common.fetch (size, hash and integrity asserted) into
upgrade-2026-10/verify/scratch/EV-FOOT/ and reused on later runs.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common as c  # noqa: E402

SCRATCH = c.U / "verify" / "scratch" / "EV-FOOT"
BUDGET = 30_000
MARKER_MAX_KM = 25.0
NE_URL = "https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip"
CB_URL = "https://www2.census.gov/geo/tiger/GENZ2023/shp/cb_2023_us_county_500k.zip"
NOMINATIM_RDCK = ("https://nominatim.openstreetmap.org/lookup?osm_ids=R2218360&format=geojson"
                  "&polygon_geojson=1&polygon_threshold=0.0003")
UA = "User-Agent: land-selection-framework-footprints/1.0 (research prototype)"

# --------------------------------------------------------------------------- the 10 new regions
# source: path (relative to upgrade-2026-10) of the full-resolution polygon.
NEW = {
    "bas-saint-laurent": dict(
        src="regions/bas-saint-laurent/raw/footprint_union.geojson",
        description="Bas-Saint-Laurent: the eight MRCs of Quebec administrative region 01 (Gaspesie excluded)",
        basis=("union of the eight 2021 Statistics Canada census divisions 2407-2414 (Kamouraska, Riviere-du-Loup, "
               "Temiscouata, Les Basques, Rimouski-Neigette, La Mitis, La Matanie, La Matapedia), Cartographic "
               "Boundary Files 2021 (coastline-clipped); regions/bas-saint-laurent/raw/footprint_union.geojson; "
               "area in EPSG:6933")),
    "downeast-maine": dict(
        src="regions/downeast-maine/raw/footprint_union.geojson",
        description="Washington County, Maine (FIPS 23029) in full",
        basis=("US Census Bureau TIGERweb State_County polygon for Washington County, Maine (FIPS 23029; total area "
               "incl. water); regions/downeast-maine/raw/footprint_union.geojson; area in EPSG:6933")),
    "finger-lakes": dict(
        src="regions/finger-lakes/raw/footprint_union.geojson",
        description="Five New York counties around Cayuga and Seneca lakes (Tompkins, Schuyler, Seneca, Yates, Cayuga)",
        basis=("union of US Census TIGERweb Census2020 county polygons for Tompkins, Schuyler, Seneca, Yates and Cayuga "
               "counties, NY (total area incl. water); regions/finger-lakes/raw/footprint_union.geojson; area in EPSG:6933")),
    "millevaches": dict(
        src="regions/millevaches/raw/footprint_union.geojson",
        description="The 124 communes of the Parc naturel regional de Millevaches en Limousin (2019 charter perimeter)",
        basis=("union of the 124 commune contours (65 Correze, 43 Creuse, 16 Haute-Vienne) from geo.api.gouv.fr "
               "(Etalab open licence), matched to the park's 2019 commune list; regions/millevaches/raw/"
               "footprint_union.geojson; area in EPSG:6933")),
    "ne-missouri-se-iowa": dict(
        src="regions/ne-missouri-se-iowa/raw/footprint_union.geojson",
        description="Seven counties on the Missouri-Iowa line (Schuyler, Scotland, Clark MO; Appanoose, Davis, Van Buren, Lee IA)",
        basis=("union of US Census Bureau cartographic boundary 2023 county polygons for Schuyler, Scotland and Clark "
               "counties (MO) and Appanoose, Davis, Van Buren and Lee counties (IA), total area incl. water; "
               "regions/ne-missouri-se-iowa/raw/footprint_union.geojson (NAD83, treated as WGS84); area in EPSG:6933")),
    "north-karelia-kainuu": dict(
        src="regions/north-karelia-kainuu/work/footprint.geojson",
        description="North Karelia (13 municipalities) and the southern five Kainuu municipalities (Kajaani, Sotkamo, Kuhmo, Paltamo, Ristijarvi)",
        basis=("union of 18 municipal polygons from Statistics Finland 2026 municipal boundaries (inland water included); "
               "Hyrynsalmi, Suomussalmi and Puolanka excluded (statutory reindeer herding area, Reindeer Husbandry Act "
               "848/1990 s.2); regions/north-karelia-kainuu/work/footprint.geojson; area in EPSG:6933")),
    "scottish-highlands": dict(
        src="regions/scottish-highlands/raw/footprint_union.geojson",
        tolerance=0.02,
        description="Highland Council wards 1 (North, West and Central Sutherland), 5 (Wester Ross, Strathpeffer and Lochalsh) and 11 (Caol and Mallaig)",
        basis=("union of three Highland Council 2022 electoral wards (S13002990, S13002994, S13003000) from the ONS Open "
               "Geography Portal Wards (December 2024) Boundaries UK BFC; regions/scottish-highlands/raw/"
               "footprint_union.geojson; shipped copy simplified at tolerance 0.02 with islands under 1 km2 dropped; "
               "area in EPSG:6933 on the full-resolution geometry")),
    "teruel-uplands": dict(
        src="regions/teruel-uplands/raw/footprint_union.geojson",
        description="180 municipalities of six comarcas of Teruel province (Comunidad de Teruel, Jiloca, Cuencas Mineras, Sierra de Albarracin, Gudar-Javalambre, Maestrazgo)",
        basis=("union of GADM 4.1 level-4 municipal polygons (geodata.ucdavis.edu gadm41_ESP_4, 2022) matched one-to-one to "
               "the 180 INE municipality codes listed in the IAEST fichas; regions/teruel-uplands/raw/"
               "footprint_union.geojson; area in EPSG:6933")),
    "valle-maira": dict(
        src="regions/valle-maira/raw/footprint_union.geojson",
        description="The 13 member comuni of the Unione Montana Valle Maira, province of Cuneo",
        basis=("union of 13 OpenStreetMap admin_level 8 relations (ODbL) matched by ref:ISTAT code to the Unione Montana "
               "Valle Maira members; regions/valle-maira/raw/footprint_union.geojson; area in EPSG:6933")),
    "virginia-piedmont": dict(
        src="regions/virginia-piedmont/raw/footprint_union.geojson",
        description="Three Virginia counties (Louisa, Fluvanna, Orange)",
        basis=("union of US Census TIGERweb Census2020 county polygons for Louisa (51109), Fluvanna (51065) and Orange "
               "(51137) counties, VA (total area incl. water); regions/virginia-piedmont/raw/footprint_union.geojson; "
               "area in EPSG:6933")),
}


# --------------------------------------------------------------------------- the 20 existing regions
def _window(marker, half_deg):
    lon, lat = marker
    return [round(lon - half_deg, 4), round(lat - half_deg, 4), round(lon + half_deg, 4), round(lat + half_deg, 4)]


# kind 'bbox' with fixed bounds, 'window' (bbox of +-half_deg around the marker), 'ne' (Natural Earth
# admin-1 selection), 'cb' (Census county selection), 'disc', or a named custom builder.
EXISTING = {
    "alentejo": dict(
        kind="bbox", bounds=[-9.0, 37.0, -6.9, 39.7],
        description="Alentejo NUTS II region (box)",
        basis=("box -9.0..-6.9E, 37.0..39.7N approximating the Alentejo NUTS II region (PT18, named in the region title), "
               "the area the 2026-10 reverify used for the Aqueduct 4.0 area-weighted water stress and the Atlas count; "
               "the box is larger than the unit (NUTS II area 31,604 km2: it also takes in coast, sea and a strip of "
               "Spain), and areaKm2 is the box; the 2026-10 reverify note for alentejo")),
    "galicia": dict(
        kind="bbox", bounds=[-9.3, 41.8, -6.8, 43.8],
        description="Galicia autonomous community (box)",
        basis=("box -9.3..-6.8E, 41.8..43.8N approximating the Galicia autonomous community named in the region title, "
               "the area the 2026-10 reverify used for the Aqueduct 4.0 area-weighted water stress (0.22); the box is larger "
               "than the unit and areaKm2 is the box; the 2026-10 reverify note for galicia")),
    "cevennes": dict(
        kind="bbox", bounds=[3.3, 44.0, 4.3, 44.7],
        description="Cevennes park area (box)",
        basis=("box 3.3..4.3E, 44.0..44.7N around the Parc national des Cevennes area (938 km2 core plus 2,035 km2 adhesion "
               "area per fr.wikipedia), the park-area box used by the 2026-10 reverify for Aqueduct 4.0 and SoilGrids; "
               "the 2026-10 reverify note for cevennes")),
    "transylvania": dict(
        kind="window", half=0.75,
        description="Transylvania: 1.5 degree box around the marker (no single administrative unit)",
        basis=("Transylvania is a historical region with no single administrative unit; the footprint is the +-0.75 degree "
               "box around the marker that the 2026-10 reverify used for the SoilGrids window, with the Eurostat NUTS 2 "
               "Centru and Nord-Vest densities as the population cross-check; the 2026-10 reverify note for transylvania")),
    "connemara": dict(
        kind="connemara",
        description="West Cork (Cork county west of 8.7W) and Connemara (Galway county west of 9.0W), two parts",
        basis=("two-part region; values are over the union; marker unchanged. Union of the County Cork part west of 8.7W "
               "and the County Galway part west of 9.0W (Natural Earth 10m admin-1 county polygons, public domain), the "
               "West Cork and Connemara areas whose basins the 2026-10 reverify used (Cork and Galway County Development "
               "Plans); the 2026-10 reverify note for connemara. Splitting into two regions is recommended for a later round")),
    "pembrokeshire": dict(
        kind="bbox", bounds=[-5.6, 51.65, -4.7, 52.05],
        description="Pembrokeshire county (box)",
        basis=("county box -5.6..-4.7E, 51.65..52.05N used by the 2026-10 reverify for the SoilGrids window; "
               "Pembrokeshire is the single Aqueduct basin covering the county; the 2026-10 reverify note for pembrokeshire")),
    "south-tirol": dict(
        kind="ne", adm0="ITA", names=["Bozen"],
        description="South Tirol (province of Bolzano / Bozen)",
        basis=("province of Bolzano / Bozen, Natural Earth 10m admin-1 (public domain); the province is the unit the 2026-10 "
               "reverify used for the Aqueduct area-weighting (0.148 over five basins) and the ASTAT language census; "
               "the 2026-10 reverify note for south-tirol")),
    "asturias": dict(
        kind="ne", adm0="ESP", names=["Asturias"],
        description="Principality of Asturias",
        basis=("Asturias province / principality, Natural Earth 10m admin-1 (public domain); the unit the 2026-10 reverify "
               "used for the Aqueduct area-weighting over seven basins; the 2026-10 reverify note for asturias")),
    "saxony-anhalt": dict(
        kind="ne", adm0="DEU", names=["Sachsen-Anhalt"],
        description="Saxony-Anhalt (federal state)",
        basis=("Land Sachsen-Anhalt, Natural Earth 10m admin-1 (public domain); the state is the unit the 2026-10 reverify "
               "used for Hansen forest change (geoBoundaries polygon) and the state density; "
               "the 2026-10 reverify note for saxony-anhalt")),
    "estonia-rural": dict(
        kind="ne", adm0="EST", names=None,
        description="Estonia (all fifteen counties)",
        basis=("union of the 15 Estonian counties, Natural Earth 10m admin-1 (public domain); the region is the whole country "
               "(KAOKS rules and Statistics Estonia density are national); the 2026-10 reverify note for estonia-rural")),
    "nova-scotia": dict(
        kind="ne", adm0="CAN", names=["Nova Scotia"],
        description="Nova Scotia province including Cape Breton",
        basis=("province of Nova Scotia, Natural Earth 10m admin-1 (public domain); the unit the 2026-10 reverify used for "
               "the WorldClim ensemble (8.5 C province-wide); the 2026-10 reverify note for nova-scotia")),
    "kootenays": dict(
        kind="rdck",
        description="Regional District of Central Kootenay (RDCK)",
        basis=("Regional District of Central Kootenay boundary, OpenStreetMap relation 2218360 (ODbL) via Nominatim, "
               "2026-10-05, includes lake area (StatCan 2021 land area 22,078 km2); the unit the 2026-10 reverify used "
               "for population, Aqueduct and Hansen; the 2026-10 reverify note for kootenays")),
    "vermont": dict(
        kind="cb", statefp="50", names=None,
        description="Vermont (state)",
        basis=("union of the 14 Vermont county polygons, US Census Bureau cartographic boundary 2023 (500k, total area incl. "
               "water); the state is the unit the 2026-10 reverify used for the WorldClim, Aqueduct and population cells; "
               "the 2026-10 reverify note for vermont")),
    "cascadia": dict(
        kind="cb", statefp="41", names=["Marion", "Polk", "Yamhill", "Linn", "Benton", "Lane"], expect=6,
        description="Six core Willamette Valley counties (Marion, Polk, Yamhill, Linn, Benton, Lane)",
        basis=("union of the six core Willamette Valley county polygons, US Census Bureau cartographic boundary 2023 "
               "(500k, total area incl. water); the six-county definition the 2026-10 reverify used for the population "
               "cell (45 /km2) and the Aqueduct check over Census TIGER counties; the 2026-10 reverify note for cascadia")),
    "southern-appalachians": dict(
        kind="cb", statefp="37", expect=17,
        names=["Avery", "Buncombe", "Cherokee", "Clay", "Graham", "Haywood", "Henderson", "Jackson", "Macon", "Madison",
               "McDowell", "Mitchell", "Polk", "Rutherford", "Swain", "Transylvania", "Yancey"],
        description="Seventeen western North Carolina mountain counties",
        basis=("union of the 17 standard WNC mountain county polygons (Avery, Buncombe, Cherokee, Clay, Graham, Haywood, "
               "Henderson, Jackson, Macon, Madison, McDowell, Mitchell, Polk, Rutherford, Swain, Transylvania, Yancey), US "
               "Census Bureau cartographic boundary 2023 (total area incl. water); the set the 2026-10 reverify used for "
               "population (45.9 /km2); the 2026-10 reverify note for southern-appalachians")),
    "driftless": dict(
        kind="window", half=0.5,
        description="Driftless Area: 1 degree box around the marker (no single administrative unit)",
        basis=("the Driftless Area crosses four states and has no administrative unit; the footprint is the +-0.5 degree box "
               "around the marker that the 2026-10 reverify used for the area-weighted Aqueduct 4.0 value (0.50), with "
               "Vernon and Crawford counties (WI, Census 2020) as the population cross-check; "
               "the 2026-10 reverify note for driftless")),
    "ozarks": dict(
        kind="window", half=0.5,
        description="Ozarks: 1 degree box around the marker (no single administrative unit)",
        basis=("the Ozarks span parts of Missouri, Arkansas and Oklahoma and have no administrative unit; the footprint is "
               "the 1 degree box (+-0.5) around the marker that the 2026-10 reverify used for the deduplicated "
               "area-weighted Aqueduct 4.0 value (0.72); the 2026-10 reverify note for ozarks")),
    "northern-new-mexico": dict(
        kind="window", half=0.5,
        description="Northern New Mexico: 1 degree box around Taos (no single administrative unit)",
        basis=("northern New Mexico is not an administrative unit; the footprint is the 1 degree box (+-0.5) around the "
               "marker that the 2026-10 reverify used for the deduplicated area-weighted Aqueduct 4.0 value (0.42), "
               "with +-30 km Hansen windows around Taos; the 2026-10 reverify note for northern-new-mexico")),
    "quebec-eastern-townships": dict(
        kind="window", half=0.75,
        description="Eastern Townships: 1.5 degree box around Sherbrooke (no single administrative unit)",
        basis=("the Eastern Townships are a historical region and not an administrative unit; the footprint is the "
               "+-0.75 degree box around the marker that the 2026-10 reverify used for the SoilGrids window; "
               "the 2026-10 reverify note for quebec-eastern-townships")),
    "oaxaca": dict(
        kind="disc", radiusKm=50.0,
        description="Oaxaca highlands: 50 km disc around the marker",
        basis=("no administrative unit is named in the region title (Oaxaca highlands); 50 km disc around the marker, the "
               "default where none is stated; the 2026-10 reverify used marker-centred +-0.25 degree windows and the 100 km "
               "conflict rim; the 2026-10 reverify note for oaxaca")),
}

FIELDS = ("kind", "bounds", "description", "basis", "areaKm2", "marker", "polygonFile")


# --------------------------------------------------------------------------- builders
def _ne_table():
    import geopandas as gpd
    info = c.fetch(NE_URL, SCRATCH / "ne_10m_admin_1_states_provinces.zip", min_bytes=5_000_000)
    return gpd.read_file(f"zip://{info['path']}")


def _cb_table():
    import geopandas as gpd
    info = c.fetch(CB_URL, SCRATCH / "cb_2023_us_county_500k.zip", min_bytes=5_000_000)
    g = gpd.read_file(f"zip://{info['path']}")
    return g.to_crs(c.WGS84) if g.crs is not None and g.crs.to_epsg() != 4326 else g


def _rdck():
    from shapely.geometry import shape
    info = c.fetch(NOMINATIM_RDCK, SCRATCH / "nominatim_rdck_R2218360.json", min_bytes=2000, kind="json", headers=[UA])
    with open(info["path"], encoding="utf-8") as fh:
        gj = json.load(fh)
    return shape(gj["features"][0]["geometry"])


def _full_geometry(rid, spec, marker, tables):
    """Full-resolution geometry in EPSG:4326 for an existing region, or None for bbox/disc kinds."""
    kind = spec["kind"]
    if kind == "ne":
        ne = tables.setdefault("ne", _ne_table())
        sel = ne[ne.adm0_a3 == spec["adm0"]]
        if spec["names"]:
            sel = sel[sel.name.isin(spec["names"])]
        if len(sel) == 0:
            raise RuntimeError(f"{rid}: no Natural Earth admin-1 match for {spec}")
        return c.dissolve(sel.geometry)
    if kind == "cb":
        cb = tables.setdefault("cb", _cb_table())
        sel = cb[cb.STATEFP == spec["statefp"]]
        if spec.get("names"):
            sel = sel[sel.NAME.isin(spec["names"])]
        expect = spec.get("expect")
        if expect is not None and len(sel) != expect:
            raise RuntimeError(f"{rid}: expected {expect} counties, found {len(sel)}")
        if len(sel) == 0:
            raise RuntimeError(f"{rid}: no county match for {spec}")
        return c.dissolve(sel.geometry)
    if kind == "rdck":
        return _rdck()
    if kind == "connemara":
        from shapely.geometry import box
        ne = tables.setdefault("ne", _ne_table())
        irl = ne[ne.adm0_a3 == "IRL"]
        cork = c.dissolve(irl[irl.name == "Cork"].geometry).intersection(box(-11.0, 51.0, -8.7, 52.5))
        galway = c.dissolve(irl[irl.name == "Galway"].geometry).intersection(box(-11.0, 52.5, -9.0, 54.5))
        return c.dissolve([cork, galway])
    return None


def _entry_for_polygon(rid, geom_full, spec, marker, tolerance):
    area = c.area_km2(geom_full)
    shipped, tol_used, size = c.simplify_to_budget(geom_full, tolerance=tolerance, min_part_km2=1.0, budget_bytes=BUDGET)
    path = c.FOOTPRINT_DIR / f"{rid}.geojson"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(c.feature_collection_bytes(shipped, {"id": rid, "kind": "footprint"}))
    w, s, e, n = shipped.bounds
    return {
        "kind": "polygon",
        "bounds": [round(w, 4), round(s, 4), round(e, 4), round(n, 4)],
        "description": spec["description"],
        "basis": spec["basis"],
        "areaKm2": round(area, 1),
        "marker": [marker[0], marker[1]],
        "polygonFile": f"footprints/{rid}.geojson",
        "simplifyTolerance": round(tol_used, 4),
    }


def build():
    import geopandas as gpd
    regs = c.regions_list(with_new=True)
    ids = [r["id"] for r in regs]
    marker = {r["id"]: (r["lon"], r["lat"]) for r in regs}
    unknown = [i for i in ids if i not in NEW and i not in EXISTING]
    if unknown:
        raise SystemExit(f"regions with no footprint spec (add them to NEW or EXISTING): {unknown}")
    stale = [i for i in list(NEW) + list(EXISTING) if i not in ids]
    if stale:
        print(f"note: specs for regions not in the data (dropped or not shipped), skipped: {stale}")

    tables: dict = {}
    reg: dict = {}
    for r in regs:
        rid = r["id"]
        mk = marker[rid]
        if rid in NEW:
            spec = NEW[rid]
            src = c.U / spec["src"]
            g = gpd.read_file(src)
            if g.crs is not None and g.crs.to_epsg() != 4326:
                g = g.to_crs(c.WGS84)
            geom = c.dissolve(g.geometry)
            reg[rid] = _entry_for_polygon(rid, geom, spec, mk, spec.get("tolerance", 0.005))
            continue
        spec = EXISTING[rid]
        kind = spec["kind"]
        if kind in ("bbox", "window"):
            b = spec["bounds"] if kind == "bbox" else _window(mk, spec["half"])
            from shapely.geometry import box
            reg[rid] = {"kind": "bbox", "bounds": [float(x) for x in b], "description": spec["description"],
                        "basis": spec["basis"], "areaKm2": round(c.area_km2(box(*b)), 1),
                        "marker": [mk[0], mk[1]], "polygonFile": None}
        elif kind == "disc":
            d = c.disc(mk[0], mk[1], spec["radiusKm"])
            w, s, e, n = d.bounds
            reg[rid] = {"kind": "disc", "bounds": [round(w, 4), round(s, 4), round(e, 4), round(n, 4)],
                        "description": spec["description"], "basis": spec["basis"],
                        "areaKm2": round(c.area_km2(d), 1), "marker": [mk[0], mk[1]], "polygonFile": None,
                        "radiusKm": spec["radiusKm"]}
        else:
            geom = _full_geometry(rid, spec, mk, tables)
            reg[rid] = _entry_for_polygon(rid, geom, spec, mk, 0.005)
        print(f"  {rid}: {reg[rid]['kind']} {reg[rid]['areaKm2']} km2")

    # remove polygon files of regions that are no longer in the registry
    keep = {f"{rid}.geojson" for rid, e in reg.items() if e["polygonFile"]}
    if c.FOOTPRINT_DIR.is_dir():
        for p in c.FOOTPRINT_DIR.glob("*.geojson"):
            if p.name not in keep:
                p.unlink()
    c.FOOTPRINT_JSON.write_text(json.dumps(reg, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {c.FOOTPRINT_JSON} ({len(reg)} regions)")
    return reg


# --------------------------------------------------------------------------- check
REAL_SOURCES = ("Natural Earth", "Census", "TIGER", "OpenStreetMap", "Statistics", "GADM", "geo.api.gouv.fr", "ONS",
                "reverify", "INE", "Eurostat", "regions/")


def check() -> int:
    from shapely.geometry import shape
    errors: list[str] = []

    def err(msg):
        errors.append(msg)

    if not c.FOOTPRINT_JSON.is_file():
        print(f"FAIL: {c.FOOTPRINT_JSON} missing")
        return 1
    reg = c.registry()
    regs = c.regions_list(with_new=True)
    ids = [r["id"] for r in regs]
    if sorted(ids) != sorted(reg):
        err(f"registry ids differ from dump_regions --with-new: only-in-data={sorted(set(ids) - set(reg))} "
            f"only-in-registry={sorted(set(reg) - set(ids))}")
    if len(ids) != len(reg):
        err(f"count mismatch: dump_regions {len(ids)} vs registry {len(reg)}")
    mk = {r["id"]: (r["lon"], r["lat"]) for r in regs}

    seen_files = set()
    for rid, e in reg.items():
        for f in FIELDS:
            if f not in e:
                err(f"{rid}: missing field {f}")
        if any(f not in e for f in FIELDS):
            continue
        if e["kind"] not in ("polygon", "bbox", "disc"):
            err(f"{rid}: bad kind {e['kind']}")
        if rid in mk and [float(e["marker"][0]), float(e["marker"][1])] != [float(mk[rid][0]), float(mk[rid][1])]:
            err(f"{rid}: marker {e['marker']} differs from data {mk[rid]}")
        b = e["bounds"]
        if not (len(b) == 4 and b[0] < b[2] and b[1] < b[3] and -180 <= b[0] and b[2] <= 180 and -90 <= b[1] and b[3] <= 90):
            err(f"{rid}: bad bounds {b}")
        if not (isinstance(e["areaKm2"], (int, float)) and e["areaKm2"] > 0):
            err(f"{rid}: bad areaKm2 {e['areaKm2']}")
        if not e["description"].strip():
            err(f"{rid}: empty description")
        if len(e["basis"]) < 60 or not any(s in e["basis"] for s in REAL_SOURCES):
            err(f"{rid}: basis does not name a real source")
        if e["kind"] == "disc" and not e.get("radiusKm"):
            err(f"{rid}: disc without radiusKm")
        if e["kind"] == "polygon":
            pf = e["polygonFile"]
            if not pf:
                err(f"{rid}: polygon without polygonFile")
                continue
            p = c.P / "data" / pf
            seen_files.add(p.name)
            if not p.is_file():
                err(f"{rid}: {pf} missing")
                continue
            size = p.stat().st_size
            if size > BUDGET:
                err(f"{rid}: {pf} is {size} bytes > {BUDGET}")
            try:
                gj = json.loads(p.read_text(encoding="utf-8"))
                if gj.get("type") != "FeatureCollection" or len(gj["features"]) != 1:
                    err(f"{rid}: {pf} is not a one-feature FeatureCollection")
                g = shape(gj["features"][0]["geometry"])
                if not g.is_valid or g.is_empty:
                    err(f"{rid}: {pf} geometry invalid or empty")
                if g.geom_type not in ("Polygon", "MultiPolygon"):
                    err(f"{rid}: {pf} geometry type {g.geom_type}")
                a = c.area_km2(g)
                # areaKm2 is the full-resolution area; the shipped copy is simplified and small parts are dropped
                if abs(a - e["areaKm2"]) / e["areaKm2"] > 0.08:
                    err(f"{rid}: shipped polygon area {a:.1f} differs from areaKm2 {e['areaKm2']} by more than 8%")
                gb = g.bounds
                if max(abs(gb[i] - b[i]) for i in range(4)) > 1e-3:
                    err(f"{rid}: bounds {b} differ from polygon bounds {list(gb)}")
            except Exception as ex:  # noqa: BLE001
                err(f"{rid}: {pf} unreadable: {ex}")
                continue
        else:
            if e.get("polygonFile"):
                err(f"{rid}: {e['kind']} must have polygonFile null")
            if e["kind"] == "bbox":
                from shapely.geometry import box
                a = c.area_km2(box(*b))
                if abs(a - e["areaKm2"]) > 1.0:
                    err(f"{rid}: bbox area {a:.1f} != areaKm2 {e['areaKm2']}")
        try:
            dist = c.marker_distance_km(rid)
            if dist > MARKER_MAX_KM:
                err(f"{rid}: marker is {dist:.1f} km from the footprint (> {MARKER_MAX_KM})")
        except Exception as ex:  # noqa: BLE001
            err(f"{rid}: marker distance failed: {ex}")

    if c.FOOTPRINT_DIR.is_dir():
        extra = sorted(p.name for p in c.FOOTPRINT_DIR.glob("*.geojson") if p.name not in seen_files)
        if extra:
            err(f"unreferenced polygon files: {extra}")

    if errors:
        print(f"FAIL: {len(errors)} problem(s)")
        for m in errors:
            print("  -", m)
        return 1
    kinds = {}
    for e in reg.values():
        kinds[e["kind"]] = kinds.get(e["kind"], 0) + 1
    print(f"OK: {len(reg)} footprints ({', '.join(f'{k}={v}' for k, v in sorted(kinds.items()))}); "
          f"count equals dump_regions --with-new ({len(ids)}); every polygon <= {BUDGET} bytes, valid, "
          f"marker within {MARKER_MAX_KM:g} km")
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="verify the registry and files only (no network, no writes)")
    args = ap.parse_args(argv)
    if args.check:
        return check()
    build()
    return check()


if __name__ == "__main__":
    sys.exit(main())
