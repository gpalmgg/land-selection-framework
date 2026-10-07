"""The region set the bioregion pipeline runs over.

Existing regions are regex-parsed from prototype/data/regions.js (that file is regex-parsed
elsewhere too, so it is never reformatted). Regions that are not in regions.js yet (the new
slate lands there in wave 2, EV-INT-REGIONS) are read from
upgrade-2026-10/regions/<id>/data.json -> region.coords, which EV-INT-REGIONS copies verbatim.
Once regions.js carries all of them the data.json fallback is never used. No region marker may
move afterwards, and BIO-2 re-checks refPoint equality.
"""
import bio_env, json, re, os
REPO = bio_env.REPO
REGIONS_JS = os.path.join(REPO, 'prototype', 'data', 'regions.js')
SELECTION = os.path.join(REPO, 'upgrade-2026-10', 'regions', 'selection.json')

def _parse_regions_js():
    s = open(REGIONS_JS, encoding='utf-8').read()
    out = []
    for m in re.finditer(r"id:\s*'([^']+)',\s*continent:\s*'([^']+)',\s*name:\s*'([^']+)'.*?coords:\s*\[([^\]]+)\]", s, re.S):
        lon, lat = [float(x) for x in m.group(4).split(',')]
        out.append(dict(id=m.group(1), continent=m.group(2), name=m.group(3), lon=lon, lat=lat, status='live'))
    return out

def _from_dossier(rid):
    d = json.load(open(os.path.join(REPO, 'upgrade-2026-10', 'regions', rid, 'data.json'), encoding='utf-8'))['region']
    return dict(id=rid, continent=d['continent'], name=d['name'], lon=float(d['coords'][0]), lat=float(d['coords'][1]), status='new')

R = _parse_regions_js()
_have = {r['id'] for r in R}
for _r in json.load(open(SELECTION, encoding='utf-8')):
    if _r['id'] not in _have:
        R.append(_from_dossier(_r['id']))
        _have.add(_r['id'])

if __name__ == '__main__':
    print(len(R))
    for r in R:
        print(r['id'], r['continent'], r['lon'], r['lat'], r['status'])
