# Accessibility — Highlands (north-west Scotland), UK

**Headline finding:** Hospital access is the hardest practical fact: the nearest hospital in the OpenStreetMap snapshot to the coordinates is a community hospital 46 km away in a straight line, and the nearest district general hospital (Raigmore, Inverness) is 65 km away in a straight line, which on single-track roads is well over an hour.

**Key data point (with vintage):** Geodesic distance from (-5.1, 57.8) to OpenStreetMap amenity=hospital points (the repository's Overpass snapshot, 2026-05 compile; script logic of scripts/process_hospital_proximity.py reproduced): nearest Migdale Hospital, Bonar Bridge, 45.94 km; Ross Memorial Hospital, Dingwall, 46.57 km; Invergordon County Community Hospital 57.42 km; New Craigs Hospital 61.60 km; Raigmore Hospital, Inverness 64.94 km; Lawson Memorial Hospital, Golspie 68.5 km; Doctor Mackinnon Memorial Hospital and Broadford Hospital, Skye, about 78.3 km. Hospitals within 50 km: 2; within 100 km: 14. The 50 km red-line proxy passes (nearest 45.9 km) but it is a distance proxy only.

**Supporting facts:**
- Belford Hospital, Fort William (NHS Highland) is absent from the snapshot; Fort William is about 111 km from the coordinates in a straight line, so it would not change the 100 km count.
- The coordinates sit inland in the Loch Broom and Strathcarron country, not on a hub town, which is why the nearest-hospital figure is not flattered by centroid placement.
- Strathpeffer is Inverness commuter belt and Caol is a Fort William suburb, so the footprint's western and northern settlements are much further from any hospital than the coordinates are.
- Roads and ferries, rail and travel-time layers were not opened: UNVERIFIED.

**Practitioner-relevant nuance:** The proxy tells you the straight-line number; the road number for Lochinver, Durness or Applecross is larger by a factor the data does not give, and Knoydart's own site describes arrival by ferry or on foot. A household with a serious condition should read this as a design constraint, not a footnote.

**Sources:**
1. OpenStreetMap hospitals via Overpass API, ODbL (prototype/data/raw/hospitals/hospitals-eu.geojson, 2026-05). https://overpass-api.de
2. Knoydart Foundation, About Knoydart ("arriving by ferry or by foot"). https://knoydart.org/about-knoydart/
