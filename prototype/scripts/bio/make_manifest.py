"""Writes out/final/MANIFEST.json (bytes + sha256 for every shipped or generated file) and prints the total
size of the files that ship (the six geojson files and the labels file; budget 1,500,000 bytes)."""
import bio_env, hashlib, json, os
GENERATED = '2026-10-04'  # fixed so a rerun on the same inputs is byte-identical
D = 'out/final'
SHIP = ['bioregions-europe.geojson', 'bioregions-na.geojson', 'bioregion-borders-europe.geojson',
        'bioregion-borders-na.geojson', 'rivers-europe.geojson', 'rivers-na.geojson', 'bioregion-labels.json']
files = {}
for fn in sorted(os.listdir(D)):
    if fn == 'MANIFEST.json': continue
    b = open(os.path.join(D, fn), 'rb').read()
    files[fn] = dict(bytes=len(b), sha256=hashlib.sha256(b).hexdigest())
man = dict(generated=GENERATED, tolerance_deg=0.03, window_km=150, frame_deg=4,
           ship=SHIP, ship_total_bytes=sum(files[f]['bytes'] for f in SHIP), files=files)
open(os.path.join(D, 'MANIFEST.json'), 'w').write(json.dumps(man, indent=1) + '\n')
print('ship total bytes', man['ship_total_bytes'])
