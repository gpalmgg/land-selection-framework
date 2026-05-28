# Land Selection Framework

## What we're building

A shared data infrastructure to help people find land for regenerative community settlements built to flourish over 50–100 years. The premise: choosing where to settle is too important to leave to gut-feel and real-estate listings. Climate trajectory, soil resilience, water security, geopolitical sovereignty, the density of existing regenerative networks — these decide whether a project survives its first generation. But they sit scattered across hundreds of public datasets, in incompatible formats, and are almost impossible to combine without serious effort.

The output is a transparent, open-source, open-data tool that surfaces these dimensions in one place, with full source / vintage / method transparency, and no hidden scoring that pretends one place is better than another. The user decides what matters; the tool shows the data honestly.

**V1** is data ingestion — clean, documented public datasets exportable to Jupyter and QGIS. No search interface, no scoring. **V2** adds a query and weighting layer, and red-line filtering for hard disqualifiers. **V3** extends to on-site data (soil kits, sensors, walking observations) and cosmolocal data governance. V1 is what's being worked on now.

## How collaboration works

The project is structured as a **passed-around document package**. Three markdown files — Overview, Specifications, Implementation Strategy — travel together as a single versioned plan. They are the source of truth. Everything else (this doc, chat threads, the original criteria sheet in Drive) is derivative.

**Two counters track state:**

- **vN — implementation version.** Currently v1. Increments when the scope of what we're building changes substantially.
- **rN — collaboration round.** Currently r3. Increments each time the documents are passed to a new contributor.

**Each round works like this:**

1. A contributor receives the package along with a **Handoff Request** — a short note describing what's being asked of them in this round.
2. They read the documents with an AI assistant guiding the session.
3. They contribute their perspective — revising sections, adding commentary, answering open questions, surfacing what their experience sees that isn't there.
4. Decisions already tagged `[COMMITTED]` are not overwritten — commentary is added below them, attributed.
5. They update the **Collaboration Log**: one row in the Contribution History table with their name, role, and what they added.
6. They prepare the next Handoff Request (open, or directed to a specific person).
7. The documents pass on.

**Why this shape.** It keeps the documents coherent (one editor at a time), preserves attribution, and makes the project's evolution legible. Anyone reading the Collaboration Log can see how each idea got there and who put it there.

**Parallel work is welcome.** The document protocol covers formal contributions to the docs themselves. Plenty of useful work happens off the rounds — practitioner interviews, framework reading, data-source scouting, dataset access checks — and folds into a future round. Nobody needs to wait their turn to start contributing.

**Sync points sit on top of the rounds.** The Implementation Strategy defines five moments where the whole group weighs in rather than a single contributor: locking the criteria list, locking the data-source priority list, locking V1 scope after the coverage report, declaring V1 shipped, and the V1 → V2 transition. These are group decisions, not individual ones.

**Where we are right now.** r3 was Deca's synthesis on 28 April. r4 is open. The next contributor has not yet been chosen.

## What's in the docs (rounds so far)

- **r1 — Adam** sketched the GIS architecture and named several non-negotiables that the project keeps: no hidden composite scores, every value carries source and vintage, the interface must never imply more precision than the underlying data has.
- **r2 — Askja** wrote the substantive land-selection framework — twelve metrics covering geopolitical resilience, climate, regenerative networks, water, ecology, energy autonomy, accessibility, biodiversity, economic and legal context. Named data sources for most of them, introduced the **state + trajectory** scoring model, and the **red lines** concept for absolute disqualifiers.
- **r3 — Deca** synthesised both into a coherent V1 plan with framing decisions and reasoning, a clean scope (V1 = data ingestion only; no querying or scoring), and an 11-step implementation sequence. Documented the V2/V3 design questions where Adam and Askja's framings disagree, so neither is lost.

The three documents that travel together are `Overview.md` (framing), `Specifications.md` (what V1 produces), and `Implementation Strategy.md` (sequencing).

## Working group

| Person | Role | Status |
|---|---|---|
| **Adam** | GIS architect | Contributed r1 |
| **Askja** | Originator, regenerative land practitioner | Contributed r2 |
| **Deca** | Synthesiser | Contributed r3 |
| **Gustaf** | Practitioner reality-check, embedded in eco-villages | Holding the r4 seat |
| **Monty** | Regenerative academic research | Named contributor, not yet engaged |
| **Alaska** | Data engineering | Named contributor, status to confirm |

The "named contributor" rows reflect the Expected Contributors table in the Overview — people the package is meant to reach but who haven't yet had their round.

## Possible roles to take

These are categories of contribution, not formal positions. Anyone can hold more than one, and the list is descriptive — propose a role that isn't here if it fits what you'd bring.

- **Practitioner.** You've done a land hunt yourself, or with others, and have field-tested knowledge of what actually mattered. Reality-checks on the framework, stories, friction points the docs don't see.
- **Researcher.** Depth in one of the dimensions — climate projection, soil resilience, civilizational stability, geopolitical risk, ecological recovery, agroecology. You keep the framework from being naive in your area.
- **Cartographer.** GIS, spatial data, the craft of making landscapes legible. Architecture, data formats, map design.
- **Scout.** Frameworks, datasets, sources others miss. Obscure papers, regional registries, maintained open-data portals.
- **Interviewer.** 30-minute conversations with land-seekers, capturing patterns. High-leverage: brings the field's lived experience into the framework without requiring practitioners to read markdown.
- **Storyteller.** Articulates the project in language that travels. Keeps the why intact as the work gets technical.
- **Bridge-builder.** Sits between this and other regenerative networks, funders, partners, allied projects. Locates the work in the wider field, finds collaborators.
- **Steward.** Holds rhythm and continuity. Keeps the group moving, the documents alive, contributions from getting lost between sessions.
- **Builder.** When V1 ingestion needs pipeline code written, you write it. Probably not the first hands needed.

## How to plug in

1. Read the three documents (`Overview.md`, `Specifications.md`, `Implementation Strategy.md` — ~45 min total).
2. Name the role(s) you'd take.
3. Coordinate with the current active contributor about taking a future round, or starting parallel work that feeds in.

The pace is async. Contributions can be single-round or sustained. Stepping back after one round is normal — the protocol is designed for asymmetric participation.

## Project state

Open-source, open-data, low-cost, non-commercial. Working group, not an organisation. The documents are the structure; everything else is conversation around them.
