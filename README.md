# Land Selection Framework

A working-group project building a geospatial framework for finding land for regenerative community settlements on a 50–100 year horizon.

**Live demonstration sketch:** https://land-selection-framework.vercel.app

## Working group

| Person | Role | Round |
|---|---|---|
| Adam McKent | GIS architect | r1 |
| Askja | Originator, regenerative practitioner | r2 |
| Deca | Synthesizer | r3 |
| Gustaf | Practitioner reality-check | r4 (in progress) |
| Monty | Regenerative academic research | future |
| Alaska | Data engineering | future |

## What's in this folder

### Source documents
The three working-group documents at `source-docs/` are the source of truth:
- `Land Project v1 r3 Overview.md` — framing decisions and reasoning
- `Land Project v1 r3 Specifications.md` — what V1 produces
- `Land Project v1 r3 Implementation Strategy.md` — the 11-step plan

Read them in that order for the full picture.

### Invitation
`invitation.md` (and `Land Selection Framework.pdf`) — the document for inviting new contributors. Explains the collaboration protocol, working-group context, available roles, and how to plug in.

### Prototype
`prototype/` — a designed dashboard sketch deployed to Vercel. Demonstrates what V1 will produce: four European candidate regions (Alentejo PT, Galicia ES, Transylvania RO, West Cork IE) compared across eight criteria from the framework, with threshold sliders and a small geographic map.

**This is not the V1 build.** It's a communicative artifact — hand-curated values from public sources, no live ingestion pipeline.

## V1 / V2 / V3 trajectory

- **V1** (in progress) — raw-layer data ingestion in native units, exportable to Jupyter and QGIS. No query layer, no scoring.
- **V2** — query and weighting layer with red-line filtering. Resolves deferred design questions on composite scores and weighting authority.
- **V3** — parcel-level integration (soil kits, sensors, walking observations), cosmolocal data governance.

## Working locally on the prototype

```bash
cd prototype
python3 -m http.server 8765
# open http://127.0.0.1:8765/
```

Or, if you want to re-process the data layers:

```bash
cd prototype
source .venv/bin/activate
python scripts/process_vectors.py
python scripts/process_aqueduct.py
```

## Redeploying

```bash
cd prototype
vercel deploy --prod --yes
```

## Repository

Not a git repository yet. Consider initializing one once the documents are stable enough that the diff between rounds becomes legible.
