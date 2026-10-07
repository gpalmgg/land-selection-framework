#!/usr/bin/env python3
"""Verify a public raster tile/WMS endpoint for the map-layer registry.

Copied from upgrade-2026-10/tracks/evidence-tools/tilecheck.py (EV-LAYERS, 2026-10-05) and extended with:
  * named point sets (default 6 points: 3 Europe + 3 North America; 'coastal' for coastal-only layers),
  * parallel requests (one thread per point) and a per-request timeout,
  * the CARTO placeholder signature (identical 2,049-byte body, md5 502fc5f6...) so a "200 OK" that is
    really a watermark placeholder is never counted as a good tile,
  * a library entry point check(url, name, z, points=..., workers=...) used by probe_layers.py.

Usage:
  tilecheck.py '<url template>' [--zoom 6] [--name label] [--points default|coastal] [--json]
Template placeholders: {z} {x} {y} (write the template exactly as it should be handed to MapLibre) and
{bbox-epsg-3857} for WMS / ArcGIS exportImage.
Per point: HTTP 200, image body (PNG/JPEG magic; content-type may be application/octet-stream on ArcGIS),
Access-Control-Allow-Origin '*' or the live origin (request sent with that Origin), a non-empty tile
(more than --min-fill, default 0.5 percent, non-transparent non-white pixels) and not the placeholder signature.
Exit code 0 only when every tile passes.
"""
import sys, math, io, json, time, argparse, hashlib, urllib.request, urllib.error
from concurrent.futures import ThreadPoolExecutor

ORIGIN = 'https://land-selection-framework.regencommunity.tools'
POINT_SETS = {
    'default': {
        'eu-alentejo': (-7.9, 38.6), 'eu-transylvania': (24.9, 46.2), 'eu-estonia': (25.0, 58.6),
        'na-vermont': (-72.7, 44.0), 'na-cascadia': (-123.0, 44.9), 'na-nnm': (-105.6, 36.4),
    },
    # Coastal-only layers (coastal flood / sea-level rise) are legitimately blank inland: probe on the coast.
    'coastal': {
        'eu-lisbon-tagus': (-9.1, 38.7), 'eu-venice-lagoon': (12.3, 45.4), 'eu-rotterdam': (4.4, 51.9),
        'na-new-york': (-74.0, 40.65), 'na-houston-gulf': (-95.0, 29.6), 'na-seattle-sound': (-122.4, 47.6),
    },
}
POINTS = POINT_SETS['default']  # kept for callers of the original module

# CARTO's retired raster basemap answers HTTP 200 with the same 2,049-byte watermark PNG for every tile.
PLACEHOLDER_BYTES = 2049
PLACEHOLDER_MD5 = '502fc5f6793fad87dcf8ba3fa646c38f'


def tile_xy(lon, lat, z):
    n = 2 ** z
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2.0 * n)
    return x, y


def bbox3857(x, y, z):
    R = 20037508.342789244
    s = 2 * R / (2 ** z)
    return (-R + x * s, R - (y + 1) * s, -R + (x + 1) * s, R - y * s)


def build(url, x, y, z):
    if '{bbox-epsg-3857}' in url:
        b = bbox3857(x, y, z)
        url = url.replace('{bbox-epsg-3857}', ','.join('%.6f' % v for v in b))
    return url.replace('{z}', str(z)).replace('{x}', str(x)).replace('{y}', str(y))


def _one(url, pname, lon, lat, z, timeout):
    x, y = tile_xy(lon, lat, z)
    u = build(url, x, y, z)
    req = urllib.request.Request(u, headers={'Origin': ORIGIN, 'User-Agent': 'Mozilla/5.0 (tilecheck)'})
    t0 = time.time()
    r = {'point': pname, 'z': z, 'x': x, 'y': y}
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read()
            r['status'] = resp.status
            r['ctype'] = resp.headers.get('Content-Type', '')
            r['acao'] = resp.headers.get('Access-Control-Allow-Origin')
    except urllib.error.HTTPError as e:
        r['status'] = e.code
        r['ctype'] = e.headers.get('Content-Type', '')
        r['acao'] = e.headers.get('Access-Control-Allow-Origin')
        body = b''
    except Exception as e:
        r['status'] = None
        r['err'] = str(e)[:120]
        r['ctype'] = ''
        r['acao'] = None
        body = b''
    r['sec'] = round(time.time() - t0, 2)
    r['bytes'] = len(body)
    r['md5'] = hashlib.md5(body).hexdigest() if body else None
    r['nonempty_frac'] = None
    r['colors'] = None
    magic = body[:4]
    sniff = 'png' if magic[:4] == b'\x89PNG' else 'jpeg' if magic[:2] == b'\xff\xd8' else None
    r['sniff'] = sniff
    if body and (r.get('ctype', '').startswith('image') or sniff):
        try:
            from PIL import Image
            im = Image.open(io.BytesIO(body)).convert('RGBA')
            px = list(im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata())
            vis = sum(1 for p in px if p[3] > 8 and not (p[0] > 250 and p[1] > 250 and p[2] > 250))
            r['nonempty_frac'] = round(vis / len(px), 3)
            r['colors'] = len(set(px))
        except Exception as e:
            r['imgerr'] = str(e)[:80]
    r['placeholder_size'] = (len(body) == PLACEHOLDER_BYTES)
    return r


def check(url, name, z, points='default', workers=6, timeout=40, min_fill=0.005):
    pts = POINT_SETS[points] if isinstance(points, str) else points
    items = list(pts.items())
    with ThreadPoolExecutor(max_workers=max(1, min(workers, len(items)))) as ex:
        rows = list(ex.map(lambda kv: _one(url, kv[0], kv[1][0], kv[1][1], z, timeout), items))
    # placeholder: the known CARTO md5, or one 2,049-byte body repeated across several different tiles
    sizes = [r for r in rows if r['placeholder_size']]
    same = len({r['md5'] for r in sizes}) == 1 and len(sizes) >= 2
    for r in rows:
        r['placeholder'] = bool(r['md5'] == PLACEHOLDER_MD5 or (r['placeholder_size'] and same))
    ok_all = True
    for r in rows:
        cors = r.get('acao') in ('*', ORIGIN)
        ct = r.get('ctype', '')
        imagey = ct.startswith('image') or (ct.startswith('application/octet-stream') and r.get('sniff'))
        good = bool(r.get('status') == 200 and imagey and cors and (r['nonempty_frac'] or 0) > min_fill and not r['placeholder'])
        r['pass'] = good
        ok_all = ok_all and good
    return {'name': name, 'template': url, 'zoom': z, 'points': points if isinstance(points, str) else 'custom',
            'all_pass': ok_all, 'passed': sum(1 for r in rows if r['pass']), 'total': len(rows),
            'placeholder_detected': any(r['placeholder'] for r in rows), 'tiles': rows}


def print_result(res):
    print(f"== {res['name']} z{res['zoom']} ALL_PASS={res['all_pass']} ({res['passed']}/{res['total']})"
          + (' PLACEHOLDER' if res['placeholder_detected'] else ''))
    for t in res['tiles']:
        print(f"  {t['point']:16s} {t['z']}/{t['x']}/{t['y']} status={t.get('status')} ctype={t.get('ctype', '')[:22]:22s} "
              f"acao={t.get('acao')} bytes={t['bytes']} fill={t['nonempty_frac']} colors={t['colors']} {t['sec']}s "
              f"{'OK' if t['pass'] else 'FAIL'}{' PLACEHOLDER' if t['placeholder'] else ''} {t.get('err', '')}")


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('url')
    ap.add_argument('--zoom', type=int, default=6)
    ap.add_argument('--name', default='layer')
    ap.add_argument('--points', default='default', choices=sorted(POINT_SETS))
    ap.add_argument('--min-fill', type=float, default=0.005)
    ap.add_argument('--json', action='store_true')
    a = ap.parse_args()
    res = check(a.url, a.name, a.zoom, points=a.points, min_fill=a.min_fill)
    if a.json:
        print(json.dumps(res, indent=1))
    else:
        print_result(res)
    sys.exit(0 if res['all_pass'] else 1)
