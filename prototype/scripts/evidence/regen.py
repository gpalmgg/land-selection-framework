#!/usr/bin/env python3
"""Stage 6 of the canonical evidence pipeline (remote B): regen network, a FLOOR.

Metric   Count of entries in the Living Atlas Baseline Census, wave 1 (the "gold set") whose
         pin lies within 100 km of the region's footprint marker, plus up to three named
         anchors (public organisations, with their own website URL).
Source   ~/Projects/communities-database/baselines/wave-1-2026-06-communities-baseline.json,
         frozen 2026-07-24, SHA-256 359f06eb...1178 (WAVE-1-BASELINE.md). The file's SHA-256 is
         recomputed on every run and compared with the frozen value; a mismatch voids the
         baseline and the stage writes status 'failed' for every region (nothing is counted).
Gold set (WAVE-1-BASELINE.md): verification_status in {verified-active, recovered-cohousing}.
         That is every entry individually confirmed real and currently active from public web
         evidence. Counted ONLY from the gold set: 'uncertain', 'verified-but-inactive',
         'dead-link' and the rejected/off-map entries are never counted.
Pin rule (a documented tightening, so a centroid can never pose as a location): the entry needs
         numeric lat and lon, geo_status 'pinned', and geocode_precision other than 'country'
         (a country-level pin is the country's centroid, not the community's place). Distance is
         the great-circle distance (haversine) from the footprint marker, <= 100 km.
Floor    The number is a FLOOR of web-verifiable activity among directory-listed communities, not
         a census: unlisted communities, communities that dissolved before ever being listed, and
         places where the practice is not directory-listed (comunalidad in Oaxaca, repoblacion
         in Galicia, indigenous land-based living) are outside the frame, and the count is
         the Atlas's own coverage, richest in Western Europe. Every printed number must say
         "web-verifiable" (WAVE-1-BASELINE.md rule 3). Trajectory is not_available (a single
         wave; wave 2 is planned for June 2027).
Anchors  Up to 3 gold-set entries within 100 km that (a) have their own website URL (social-media,
         link-aggregator and directory hosts are skipped; one anchor per website host and per name),
         (b) are of entry_type community, and (c) do not look like a personal name. Entries inside the
         footprint come first, then the nearest to the marker; each carries `inside_footprint` so a
         label never calls an outside-footprint anchor "in-region". Names and website only: no
         email, phone, person or handle is ever read into the output. The order is distance, a
         presentation choice, not a ranking of quality.

Run (project virtualenv):
    prototype/.venv/bin/python prototype/scripts/evidence/regen.py \
        --regions alentejo,finger-lakes|all --out upgrade-2026-10/evidence-out [--verify]
    prototype/.venv/bin/python prototype/scripts/evidence/regen.py --verify upgrade-2026-10/evidence-out

Output  <out>/<region>/regen.json
"""
from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import math
import os
import re
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common  # noqa: E402
from common import U, load_footprint, registry  # noqa: E402
import solar as _solar  # noqa: E402  (sibling stage of this WP: shared report writer)

STAGE = "regen"
BASELINE = Path(os.path.expanduser("~/Projects/communities-database/baselines/wave-1-2026-06-communities-baseline.json"))
BASELINE_DISPLAY = "~/Projects/communities-database/baselines/wave-1-2026-06-communities-baseline.json"
FROZEN_SHA = "359f06ebd29eefaaa99dfe56c33f39a871136c2987b4b6f1170e5203f9201178"
RADIUS_KM = 100.0
GOLD = ("verified-active", "recovered-cohousing")
ATLAS_URL = "https://atlas.regencommunity.tools"
STATUSES = ("ok", "fallback", "failed")
MAX_ANCHORS = 3
SOCIAL_HOSTS = ("facebook.com", "fb.com", "instagram.com", "linkedin.com", "twitter.com", "x.com", "t.me",
                "telegram.me", "wa.me", "whatsapp.com", "youtube.com", "youtu.be", "tiktok.com", "linktr.ee",
                "linktree.com", "vk.com", "ok.ru", "wikipedia.org", "google.com", "goo.gl", "bit.ly",
                "substack.com", "medium.com", "patreon.com",
                # directories and federations list the community on THEIR page; the anchor must be its own site
                "ic.org", "gen-europe.org", "ecovillage.org", "thefec.org", "eurotopia.de", "ecovillage.fr")
ORG_WORDS = re.compile(
    r"(eco|village|vill|farm|ferme|hof|casa|finca|quinta|terra|tierra|centre|center|centro|collective|coop|cooperative|"
    r"commun|garden|jardin|land|project|projekt|projet|proyecto|retreat|school|schule|ecole|institute|foundation|"
    r"association|asociacion|society|network|alliance|trust|union|assembly|gemeinschaft|gemeinde|kommune|comune|"
    r"hamlet|settlement|cohousing|co-housing|house|haus|maison|mas|monastery|abbey|ashram|camp|lab|studio|"
    r"permaculture|regenerat|mountain|valley|river|lake|forest|wood|hill|sun|moon|earth|green|org|e\.v\.|gmbh|ltd|inc)",
    re.I)
# Expected counts from the track document's own calibration (Atlas gold set, 100 km), used as anchors.
CALIBRATION = {"vermont": 24, "cascadia": 16, "alentejo": 6, "galicia": 1, "connemara": 1, "oaxaca": 2}


# --------------------------------------------------------------------------- shared helpers


def now_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def resolve_regions(spec: str) -> list[str]:
    return _solar.resolve_regions(spec)


def read_json(path: Path):
    return _solar.read_json(path)


def write_json(path: Path, doc: dict) -> None:
    _solar.write_json(path, doc)


# --------------------------------------------------------------------------- baseline


def load_baseline() -> tuple[list[dict], dict]:
    """Return (entries, info). Raises RuntimeError when the file is absent, unreadable or its
    SHA-256 differs from the frozen value (a changed baseline is void)."""
    if not BASELINE.is_file():
        raise RuntimeError(f"baseline file not found at {BASELINE_DISPLAY}")
    digest = common.sha256_file(BASELINE)
    info = {"path": BASELINE_DISPLAY, "bytes": BASELINE.stat().st_size, "sha256": digest,
            "frozen_sha256": FROZEN_SHA, "matches": digest == FROZEN_SHA}
    if not info["matches"]:
        raise RuntimeError(f"baseline SHA-256 {digest} differs from the frozen {FROZEN_SHA}: the baseline is void")
    d = json.loads(BASELINE.read_text(encoding="utf-8"))
    entries = d["entries"]
    info["entries_total"] = len(entries)
    info["meta_snapshot_date"] = (d.get("meta") or {}).get("snapshot_date")
    return entries, info


def is_gold(e: dict) -> bool:
    return e.get("verification_status") in GOLD


def has_pin(e: dict) -> bool:
    lat, lon = e.get("lat"), e.get("lon")
    return (isinstance(lat, (int, float)) and isinstance(lon, (int, float)) and math.isfinite(lat) and math.isfinite(lon)
            and -90 <= lat <= 90 and -180 <= lon <= 180 and e.get("geo_status") == "pinned"
            and e.get("geocode_precision") != "country")


def clean_name(name: str) -> str:
    """Strip flag/emoji symbols and collapse spaces (names carry country flags in the source)."""
    s = re.sub(r"[\U0001F1E6-\U0001F1FF\U0001F300-\U0001FAFF☀-➿️‍]", "", name or "")
    return re.sub(r"\s+", " ", s).strip(" -—")


def looks_like_person(name: str) -> bool:
    """Conservative guard: 2-3 capitalised alphabetic words and no organisational word reads as a personal name."""
    toks = name.replace(",", " ").split()
    if not 2 <= len(toks) <= 3:
        return False
    if ORG_WORDS.search(name):
        return False
    return all(re.fullmatch(r"[A-ZÀ-Ý][a-zß-ÿ'\-.]+", t) for t in toks)


def own_site(url) -> str | None:
    if not isinstance(url, str) or not url.lower().startswith(("http://", "https://")):
        return None
    host = (urlparse(url).hostname or "").lower()
    if not host or any(host == h or host.endswith("." + h) for h in SOCIAL_HOSTS):
        return None
    return url


# --------------------------------------------------------------------------- compute


def compute_region(rid: str, geom, entries: list[dict], info: dict) -> dict:
    from shapely.geometry import Point
    lon0, lat0 = registry()[rid]["marker"]
    near = []
    for e in entries:
        if not (is_gold(e) and has_pin(e)):
            continue
        d = common.km_between(float(lon0), float(lat0), float(e["lon"]), float(e["lat"]))
        if d <= RADIUS_KM:
            near.append((d, e))
    near.sort(key=lambda t: (t[0], t[1].get("id", "")))
    in_fp = sum(1 for _d, e in near if geom.contains(Point(float(e["lon"]), float(e["lat"]))))
    candidates, skipped_person, skipped_site, seen_hosts, seen_names = [], 0, 0, set(), []
    for d, e in near:
        if e.get("entry_type") != "community":
            continue
        name = clean_name(e.get("name", ""))
        if not name:
            continue
        if looks_like_person(name):
            skipped_person += 1
            continue
        site = own_site(e.get("url"))
        if not site:
            skipped_site += 1
            continue
        host = (urlparse(site).hostname or "").lower().removeprefix("www.")
        norm = re.sub(r"[^a-z0-9]+", "", name.lower())
        # one organisation can hold several Atlas entries (same website host, or one name containing the other)
        if host in seen_hosts or any(norm.startswith(n) or n.startswith(norm) for n in seen_names):
            continue
        seen_hosts.add(host)
        seen_names.append(norm)
        inside = bool(geom.contains(Point(float(e["lon"]), float(e["lat"]))))
        candidates.append({"name": name, "url": site, "distance_km": round(d, 1), "inside_footprint": inside,
                           "atlasId": e.get("id"), "verification_status": e.get("verification_status")})
    # anchors inside the footprint come first (the label says "in-region"), then the nearest within the radius
    candidates.sort(key=lambda a: (not a["inside_footprint"], a["distance_km"], a["name"]))
    anchors = candidates[:MAX_ANCHORS]
    return {
        "value": len(near),
        "n_in_footprint": in_fp,
        "n_community_type": sum(1 for _d, e in near if e.get("entry_type") == "community"),
        "n_adjacent": sum(1 for _d, e in near if e.get("is_adjacent")),
        "n_recovered_cohousing": sum(1 for _d, e in near if e.get("verification_status") == "recovered-cohousing"),
        "anchors": anchors,
        "anchorsNote": ("Up to three named public organisations from the counted entries, those inside the footprint first, "
                        "then the nearest within the radius (an anchor with inside_footprint false is within 100 km of the "
                        "marker but outside the footprint, and must not be described as in-region). Listed by distance, "
                        "not by quality."),
        "anchors_skipped_person_like": skipped_person, "anchors_skipped_no_own_site": skipped_site,
    }


def build_doc(rid: str, geom, res: dict | None, info: dict | None, error: str | None, gold_pinned: int | None) -> dict:
    doc = {
        "stage": STAGE, "region": rid, "status": "failed", "error": error, "generated": now_iso(),
        "retrieved": _dt.date.today().isoformat(),
        "footprint": _solar.footprint_block(rid, geom),
        "method": "count-within-radius-of-marker",
        "metric": "Web-verifiable intentional communities and regenerative projects within 100 km of the marker "
                  "(Living Atlas wave-1 baseline; a floor, not a census)",
        "unit": "sites", "radius_km": RADIUS_KM, "floor": True,
        "vintage": "Living Atlas Baseline Census, wave 1 (verification vintage June 2026, frozen 2026-07-24)",
        "source": "Living Atlas Baseline Census, wave 1 (Regen Community Tools)", "sourceUrl": ATLAS_URL,
        "sourceId": "living-atlas-wave1",
        "license": "the suite's own dataset; reuse terms set by the working group (state exactly that)",
        "floorNote": ("A FLOOR of web-verifiable activity among directory-listed communities, not a census. Unlisted "
                      "communities are outside the frame, and where the practice is not directory-listed (comunalidad, "
                      "repoblacion, indigenous land-based living) the count under-represents exactly where the "
                      "reciprocity framing matters most. Coverage is richest in Western Europe."),
        "value": None,
        "baseline": info,
        "gold_set": {"filter": "verification_status in " + json.dumps(list(GOLD)),
                     "reference": "WAVE-1-BASELINE.md (wave-1 gold set: verified-active + recovered-cohousing)",
                     "pin_rule": "numeric lat/lon, geo_status 'pinned', geocode_precision not 'country'",
                     "distance": "haversine from the footprint marker"},
    }
    if res is None:
        return doc
    doc["status"], doc["error"] = "ok", None
    doc.update({k: res[k] for k in res})
    doc["gold_set"]["entries_total"] = info.get("entries_total") if info else None
    doc["gold_set"]["pinned_gold_entries_worldwide"] = gold_pinned
    doc["trajectory"] = {"status": "not_available", "direction": None,
                         "basis": "single wave; wave 2 is planned for June 2027 and will give the first measured change"}
    return doc


def run(region_ids: list[str], out_dir: Path) -> dict[str, dict]:
    geoms = {rid: load_footprint(rid) for rid in region_ids}
    docs = {}
    try:
        entries, info = load_baseline()
        err = None
    except Exception as exc:  # noqa: BLE001
        entries, info, err = [], {"path": BASELINE_DISPLAY, "frozen_sha256": FROZEN_SHA, "matches": False}, \
            f"{type(exc).__name__}: {str(exc)[:300]}"
        if BASELINE.is_file():
            info["sha256"] = common.sha256_file(BASELINE)
    gold_pinned = sum(1 for e in entries if is_gold(e) and has_pin(e)) if entries else None
    for rid in region_ids:
        g = geoms[rid]
        if err:
            doc = build_doc(rid, g, None, info, err, None)
        else:
            try:
                res = compute_region(rid, g, entries, info)
                doc = build_doc(rid, g, res, info, None, gold_pinned)
            except Exception as exc:  # noqa: BLE001
                doc = build_doc(rid, g, None, info, f"{type(exc).__name__}: {str(exc)[:400]}", gold_pinned)
        write_json(out_dir / rid / "regen.json", doc)
        log(f"[regen] {rid:<26} {doc['status']:<7} within {int(RADIUS_KM)} km: "
            f"{'-' if doc['value'] is None else doc['value']}"
            f"{'  anchors: ' + ', '.join(a['name'] for a in doc.get('anchors', [])) if doc.get('anchors') else ''}"
            f"{'  ' + doc['error'] if doc['error'] else ''}")
    return docs or {}


# --------------------------------------------------------------------------- verify / cli


def verify_outputs(out_dir: Path, region_ids: list[str]) -> list[str]:
    problems = []
    for rid in region_ids:
        p = out_dir / rid / "regen.json"
        d = read_json(p)
        if d is None:
            problems.append(f"{rid}: {p} missing or unreadable")
            continue
        st = d.get("status")
        if st not in STATUSES:
            problems.append(f"{rid}: bad status {st!r}")
            continue
        if st != "ok" and not d.get("error"):
            problems.append(f"{rid}: status {st} without an error text")
        if st == "failed" and d.get("value") is not None:
            problems.append(f"{rid}: failed status carries a value")
        b = d.get("baseline") or {}
        if not b.get("sha256") or not b.get("frozen_sha256"):
            problems.append(f"{rid}: baseline SHA-256 or frozen value not recorded")
        elif b["frozen_sha256"] != FROZEN_SHA:
            problems.append(f"{rid}: recorded frozen SHA-256 is not the frozen value")
        if st == "ok":
            if b.get("matches") is not True or b.get("sha256") != FROZEN_SHA:
                problems.append(f"{rid}: ok status without a baseline SHA-256 match")
            v = d.get("value")
            if not isinstance(v, int) or isinstance(v, bool) or v < 0 or v > 2000:
                problems.append(f"{rid}: implausible count {v!r}")
            if d.get("floor") is not True or not d.get("floorNote"):
                problems.append(f"{rid}: not documented as a floor")
            if d.get("unit") != "sites" or d.get("radius_km") != RADIUS_KM:
                problems.append(f"{rid}: unit or radius wrong")
            if "verified-active" not in json.dumps((d.get("gold_set") or {}).get("filter", "")):
                problems.append(f"{rid}: gold-set filter not recorded")
            an = d.get("anchors", [])
            if len(an) > MAX_ANCHORS:
                problems.append(f"{rid}: {len(an)} anchors (max {MAX_ANCHORS})")
            if len(an) > (v or 0):
                problems.append(f"{rid}: more anchors than counted entries")
            for a in an:
                if looks_like_person(a.get("name", "")) or not a.get("url") or not own_site(a["url"]):
                    problems.append(f"{rid}: anchor {a.get('name')!r} is not a public organisation with its own site")
                if "@" in json.dumps(a):
                    problems.append(f"{rid}: anchor carries an address-like string")
    return problems


def anchor_check(out_dir: Path, region_ids: list[str]) -> list[str]:
    problems = []
    for rid in region_ids:
        want = CALIBRATION.get(rid)
        d = read_json(out_dir / rid / "regen.json")
        if want is None or not d or d.get("status") != "ok":
            continue
        if d.get("value") != want:
            problems.append(f"{rid}: count {d.get('value')} differs from the calibration value {want} "
                            "(track document: the Atlas gold set within 100 km)")
    return problems


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--regions", default=None, help="comma-separated region ids, or 'all' (required unless --verify DIR)")
    ap.add_argument("--out", default=None, help="evidence-out directory")
    ap.add_argument("--verify", nargs="?", const="", default=None, metavar="DIR",
                    help="DIR: verify-only on that evidence-out directory; bare flag: run, then verify")
    ap.add_argument("--refresh", action="store_true", help="accepted for CLI symmetry (this stage has no cache)")
    ap.add_argument("--workers", type=int, default=1, help="accepted for CLI symmetry")
    a = ap.parse_args(argv)

    if a.verify:
        out = Path(a.verify)
        if not out.is_dir():
            raise SystemExit(f"--verify needs an existing evidence-out directory (got {str(out)!r})")
        ids = resolve_regions(a.regions or "all")
        problems = verify_outputs(out, ids) + anchor_check(out, ids)
        _solar.write_report_b(out)
        for p in problems:
            log(f"[regen] PROBLEM: {p}")
        tot = {s: sum(1 for rid in ids if (read_json(out / rid / "regen.json") or {}).get("status") == s) for s in STATUSES}
        print(json.dumps({"stage": STAGE, "verify": str(out), "regions": len(ids), "totals": tot, "problems": problems}))
        return 1 if problems else 0

    if not a.regions or not a.out:
        raise SystemExit("--regions and --out are required when running the stage")
    ids = resolve_regions(a.regions)
    out = Path(a.out)
    run(ids, out)
    problems = verify_outputs(out, ids) if a.verify is not None else []
    problems += anchor_check(out, ids)
    _solar.write_report_b(out)
    for p in problems:
        log(f"[regen] PROBLEM: {p}")
    docs = {rid: read_json(out / rid / "regen.json") or {} for rid in ids}
    tot = {s: sum(1 for d in docs.values() if d.get("status") == s) for s in STATUSES}
    print(json.dumps({"stage": STAGE, "totals": tot, "problems": problems}))
    # a baseline that is missing or no longer matches the frozen hash is an integrity failure
    return 1 if (problems or tot["failed"]) else 0


if __name__ == "__main__":
    sys.exit(main())
