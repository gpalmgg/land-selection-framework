#!/usr/bin/env python3
"""Live probe for the map-layer registry (data/layer-sources.js).

  node scripts/dump_layer_sources.mjs > layers.json
  prototype/.venv/bin/python scripts/probe_layers.py layers.json --out upgrade-2026-10/verify/layers-probe.json

What it does, per registry entry:
  * tile layers with status active|fragile: requests 6 tiles (3 Europe + 3 North America, or the 'coastal'
    set for coastal-only layers) at every zoom in probeZooms, through scripts/tilecheck.py (HTTP 200, image
    body, CORS for the live origin, non-empty tile, and NOT the CARTO placeholder signature: one identical
    2,049-byte body for every tile);
  * geojson layers: the continent files exist, parse, and hold features (a file whose producing WP has not
    landed yet is reported 'pending'; pass --require-data to make that a failure);
  * retired entries are not probed, except a retired basemap with a placeholderSignature, which is
    re-checked and reported (so the "dead basemap" finding stays reproducible).

Verdict per layer: ok | slow | partial | broken | pending | retired
  ok       every probed zoom passed (or passed >= probeMinPass of the tiles)
  slow     passed, but a tile took longer than --slow-sec (default 8 s)
  partial  some tiles passed, some did not (at some zoom)
  broken   no tile passed at some zoom (or the placeholder signature was returned)
Gate per layer: 'fail' when an ACTIVE, non-slow layer is partial or broken (or the registry itself is invalid);
'warn' for the same outcome on a fragile or slow layer (a failed zoom of those gets one retry first);
'pass' otherwise.

Exit code: 1 when any gate is 'fail' (EV-GATE trusts this), 0 otherwise, 2 on usage errors.
Writes the full result as JSON to --out.
"""
import sys, os, re, json, time, argparse, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import tilecheck  # noqa: E402  (copy of the evidence-track tool, extended)

DEFAULT_ROOT = os.path.dirname(HERE)  # prototype/
CONTINENTS = ('europe', 'north-america')
VERDICT_ORDER = {'ok': 0, 'slow': 1, 'pending': 1, 'retired': 0, 'partial': 2, 'broken': 3}

# Source ids of EV-SRC's seed table (evidence.md 6.2). Registry sourceId values must be one of these.
SEED_SOURCE_IDS = {
    'worldclim-cmip6', 'worldclim-hist', 'aqueduct-40', 'aqueduct-floods', 'beck-koppen-2023',
    'esa-worldcover-2021', 'hansen-gfc', 'ucdp-ged', 'soilgrids-2', 'gsa-pvout', 'ghsl-pop-r2023a',
    'living-atlas-wave1', 'osm-odbl', 'gpw-v4', 'gem-seismic-2023', 'viirs-black-marble',
    'openlandmap-precip', 'isric-wms', 'malaria-atlas-travel', 'esri-sentinel2-lc', 'gfw-umd-loss',
    'esri-hillshade', 'eox-s2cloudless', 'opentopomap',
}
REQUIRED = ('id', 'label', 'group', 'kind', 'attribution', 'licenseText', 'status', 'verified')
KINDS = ('xyz', 'wms', 'wmts-kvp', 'arcgis-export', 'geojson')
STATUSES = ('active', 'fragile', 'retired')


def load_registry(path):
    with open(path, encoding='utf-8') as f:
        d = json.load(f)
    if isinstance(d, dict):
        d = d.get('layers')
    if not isinstance(d, list):
        raise ValueError('registry JSON must be an array of layers or {layers: [...]}')
    return d


def validate_registry(layers, check_source_ids=True):
    """Structural problems that make the registry untrustworthy. Returned as a list of strings."""
    problems = []
    seen = set()
    for i, l in enumerate(layers):
        lid = l.get('id', f'#{i}')
        if lid in seen:
            problems.append(f'{lid}: duplicate id')
        seen.add(lid)
        for k in REQUIRED:
            if not l.get(k):
                problems.append(f'{lid}: missing {k}')
        if l.get('kind') not in KINDS:
            problems.append(f"{lid}: kind {l.get('kind')!r} not one of {KINDS}")
        if l.get('status') not in STATUSES:
            problems.append(f"{lid}: status {l.get('status')!r} not one of {STATUSES}")
        if l.get('verified') and not re.fullmatch(r'\d{4}-\d{2}-\d{2}', str(l['verified'])):
            problems.append(f"{lid}: verified {l['verified']!r} is not YYYY-MM-DD")
        st = l.get('status')
        if st == 'retired':
            if not l.get('retiredReason'):
                problems.append(f'{lid}: retired without retiredReason')
            continue
        if check_source_ids and l.get('sourceId') not in SEED_SOURCE_IDS:
            problems.append(f"{lid}: sourceId {l.get('sourceId')!r} is not an EV-SRC seed id")
        if not l.get('vintage'):
            problems.append(f'{lid}: missing vintage')
        if l.get('kind') == 'geojson':
            urls = l.get('urls') or {}
            for c in CONTINENTS:
                if not urls.get(c):
                    problems.append(f'{lid}: geojson layer without urls[{c}]')
        else:
            if not l.get('url'):
                problems.append(f'{lid}: tile layer without url')
            if not l.get('probeZooms'):
                problems.append(f'{lid}: active tile layer without probeZooms')
            if l.get('maxzoom') is None or l.get('minzoom') is None or l['minzoom'] > l['maxzoom']:
                problems.append(f'{lid}: bad minzoom/maxzoom')
            for z in l.get('probeZooms') or []:
                if l.get('maxzoom') is not None and z > l['maxzoom']:
                    problems.append(f"{lid}: probeZoom {z} above maxzoom {l['maxzoom']}")
                if l.get('minzoom') is not None and z < l['minzoom']:
                    problems.append(f"{lid}: probeZoom {z} below minzoom {l['minzoom']}")
    return problems


def zoom_verdict(res, min_pass, slow_sec):
    passed, total = res['passed'], res['total']
    need = min(min_pass if min_pass else total, total)
    if res['placeholder_detected']:
        return 'broken'
    if passed == 0:
        return 'broken'
    if passed < need:
        return 'partial'
    if max((t['sec'] for t in res['tiles']), default=0) > slow_sec:
        return 'slow'
    return 'ok'


def probe_tile_layer(layer, slow_sec):
    points = layer.get('probePoints', 'default')
    min_fill = layer.get('probeMinFill', 0.005)
    min_pass = layer.get('probeMinPass')
    timeout = 70 if layer.get('slow') else 40
    zooms_out, worst = [], 'ok'
    for z in layer['probeZooms']:
        attempts = 0
        while True:
            attempts += 1
            res = tilecheck.check(layer['url'], layer['id'], z, points=points, timeout=timeout, min_fill=min_fill)
            v = zoom_verdict(res, min_pass, slow_sec)
            # one retry for flagged-slow and fragile layers (latency and third-party paths are noisy)
            if v in ('partial', 'broken') and attempts < 2 and (layer.get('slow') or layer.get('fragile')
                                                                or layer.get('status') == 'fragile'):
                time.sleep(2)
                continue
            break
        zooms_out.append({
            'z': z, 'verdict': v, 'passed': res['passed'], 'total': res['total'], 'attempts': attempts,
            'max_sec': max((t['sec'] for t in res['tiles']), default=None),
            'placeholder_detected': res['placeholder_detected'], 'points': res['points'],
            'tiles': [{k: t.get(k) for k in ('point', 'x', 'y', 'status', 'ctype', 'acao', 'bytes', 'nonempty_frac',
                                              'sec', 'pass', 'placeholder', 'err')} for t in res['tiles']],
        })
        if VERDICT_ORDER[v] > VERDICT_ORDER[worst]:
            worst = v
    return worst, zooms_out


def probe_geojson(layer, root, require_data):
    files, worst, notes = [], 'ok', []
    for c in CONTINENTS:
        rel = (layer.get('urls') or {}).get(c)
        path = os.path.join(root, rel) if rel else None
        f = {'continent': c, 'path': rel}
        if not path or not os.path.exists(path):
            f['exists'] = False
            if layer.get('dataFrom') and not require_data:
                f['state'] = 'pending'
                notes.append(f"{c}: {rel} not written yet (produced by {layer['dataFrom']})")
                if VERDICT_ORDER['pending'] > VERDICT_ORDER[worst]:
                    worst = 'pending'
            else:
                f['state'] = 'missing'
                worst = 'broken'
                notes.append(f'{c}: {rel} is missing')
        else:
            f['exists'] = True
            f['bytes'] = os.path.getsize(path)
            try:
                with open(path, encoding='utf-8') as fh:
                    gj = json.load(fh)
                feats = gj.get('features') if isinstance(gj, dict) else None
                f['features'] = len(feats) if isinstance(feats, list) else None
                if not feats:
                    f['state'] = 'empty'
                    worst = 'broken'
                    notes.append(f'{c}: {rel} holds no features')
                else:
                    f['state'] = 'ok'
            except Exception as e:  # noqa: BLE001
                f['state'] = 'invalid'
                f['error'] = str(e)[:120]
                worst = 'broken'
                notes.append(f'{c}: {rel} is not valid JSON ({f["error"]})')
        files.append(f)
    return worst, files, notes


def gate_for(layer, verdict):
    if verdict in ('partial', 'broken'):
        if layer.get('status') == 'active' and not layer.get('slow'):
            return 'fail'
        return 'warn'
    return 'pass'


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('registry', help='JSON from scripts/dump_layer_sources.mjs')
    ap.add_argument('--out', help='write the full result JSON here')
    ap.add_argument('--root', default=DEFAULT_ROOT, help='site root for geojson paths (default: prototype/)')
    ap.add_argument('--only', help='comma-separated layer ids to probe')
    ap.add_argument('--slow-sec', type=float, default=8.0)
    ap.add_argument('--require-data', action='store_true', help='geojson files that are not written yet fail instead of "pending"')
    ap.add_argument('--no-source-check', action='store_true', help='do not require sourceId to be an EV-SRC seed id')
    a = ap.parse_args(argv)
    try:
        layers = load_registry(a.registry)
    except Exception as e:  # noqa: BLE001
        print(f'probe_layers: cannot read registry: {e}', file=sys.stderr)
        return 2
    only = set(a.only.split(',')) if a.only else None
    problems = validate_registry(layers, check_source_ids=not a.no_source_check)

    results = []
    for layer in layers:
        lid = layer.get('id')
        if only and lid not in only:
            continue
        r = {'id': lid, 'kind': layer.get('kind'), 'status': layer.get('status'), 'slow': bool(layer.get('slow')),
             'fragile': bool(layer.get('fragile')), 'registry_verified': layer.get('verified')}
        t0 = time.time()
        try:
            if layer.get('status') == 'retired':
                sig = layer.get('placeholderSignature')
                if sig and layer.get('url') and layer.get('probeZooms'):
                    verdict, zooms = probe_tile_layer(layer, a.slow_sec)
                    r['zooms'] = zooms
                    r['placeholder_confirmed'] = any(z['placeholder_detected'] for z in zooms)
                    r['notes'] = ['retired; probed only to re-confirm the placeholder signature: '
                                  + ('CONFIRMED' if r['placeholder_confirmed'] else 'NOT seen (re-check the basemap)')]
                else:
                    r['notes'] = ['retired: ' + (layer.get('retiredReason') or '')[:160]]
                r['verdict'] = 'retired'
            elif layer.get('kind') == 'geojson':
                verdict, files, notes = probe_geojson(layer, a.root, a.require_data)
                r['verdict'], r['files'], r['notes'] = verdict, files, notes
            elif layer.get('url') and layer.get('probeZooms'):
                verdict, zooms = probe_tile_layer(layer, a.slow_sec)
                r['verdict'], r['zooms'] = verdict, zooms
            else:
                r['verdict'] = 'broken'
                r['notes'] = ['nothing to probe: no url or probeZooms']
        except Exception as e:  # noqa: BLE001
            r['verdict'] = 'broken'
            r['notes'] = [f'probe error: {e}'[:200]]
        r['gate'] = 'pass' if r['verdict'] in ('retired', 'pending') else gate_for(layer, r['verdict'])
        r['seconds'] = round(time.time() - t0, 1)
        results.append(r)

        zsum = ' '.join(f"z{z['z']}:{z['passed']}/{z['total']}{'' if z['verdict'] == 'ok' else '(' + z['verdict'] + ')'}"
                        for z in r.get('zooms', []))
        tag = {'fail': 'FAIL', 'warn': 'WARN', 'pass': 'ok  '}[r['gate']]
        if tag == 'ok  ' and (r['verdict'] == 'slow' or (r['fragile'] and r['status'] != 'retired')):
            tag = 'WARN'  # passing, but flagged fragile or slow: informational
        print(f"[{tag}] {lid:26s} {r['status']:8s} {r['verdict']:8s} {zsum} {'; '.join(r.get('notes', []))[:140]}")
        sys.stdout.flush()

    failing = [r['id'] for r in results if r['gate'] == 'fail']
    warns = [r['id'] for r in results if r['gate'] == 'warn' or r['verdict'] == 'slow'
             or (r['fragile'] and r['status'] != 'retired')]
    counts = {}
    for r in results:
        counts[r['verdict']] = counts.get(r['verdict'], 0) + 1
    gate = 'fail' if failing or problems else 'pass'
    out = {
        'generated': datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'tool': 'prototype/scripts/probe_layers.py',
        'origin': tilecheck.ORIGIN,
        'registry': os.path.abspath(a.registry),
        'gate': gate,
        'summary': {'layers': len(results), 'verdicts': counts, 'failing': failing, 'warnings': warns,
                    'registry_problems': problems},
        'layers': results,
    }
    if a.out:
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        with open(a.out, 'w', encoding='utf-8') as f:
            json.dump(out, f, indent=1, ensure_ascii=False)
            f.write('\n')
    print(f"\nlayers={len(results)} verdicts={counts} gate={gate}")
    for p in problems:
        print('REGISTRY PROBLEM:', p)
    for w in warns:
        print('WARN:', w)
    for f in failing:
        print('FAIL:', f)
    return 1 if gate == 'fail' else 0


if __name__ == '__main__':
    sys.exit(main())
