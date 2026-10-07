// The ordered list of drawer blocks, in reading order. Owner: MC-DRAWER (nobody else edits this file).
//
// Block contract (default export of each blocks/<id>.js):
//   { id, render(ctx) }   render returns an HTMLElement, a DocumentFragment, or null to skip the block.
//   ctx = { id, region, values, criteria, data, state, el, esc, bus, helpers }
//     id        the region id
//     region    the region record (regions.js)
//     values    this region's cells, keyed by criterion id (data.values[id])
//     criteria  the criteria list
//     data      the src/data.js bundle plus { legalPathway, context } (loaded when the drawer first opens)
//     state     the live view state (shortlist, thresholds, ...)
//     el, esc   the DOM helper and an HTML escaper
//     bus       { on, off, emit }
//     helpers   { fmtVal, normalize, rampColor, textSafeColor }
// A block that throws is caught by the drawer and skipped (an error must never blank the drawer).
//
// Reading order (design 8.10): the Salutation, name and country; the blurb; Land standing (whose land it is, before the
// weather); the refusal band; what living here asks of you (asks before offers); the place strip; the way in; the climate
// and water context (it carries numbers, so it sits just before the ledger); the eight criteria with their sources.
// Owners: head, blurb, asks, refusal MC-DRAWER; land-standing, place BIO-4; way, context, criteria MC-LEDGER.

import head from './head.js';
import blurb from './blurb.js';
import landStanding from './land-standing.js';
import refusal from './refusal.js';
import asks from './asks.js';
import place from './place.js';
import way from './way.js';
import context from './context.js';
import criteria from './criteria.js';
import { ensureStylesheet } from './criteria.js';

// reciprocity.css holds the visual rules for BIO-4's class hooks (.drawer-land-standing, .ls-*, .braid) and the place strip.
// The page links it when the build stamps it in; until then the manifest loads it once, at import, so it has arrived before
// the first drawer opens. Idempotent (a link that already ends in /styles/reciprocity.css is left alone).
ensureStylesheet('reciprocity.css', import.meta.url);

export const blocks = [head, blurb, landStanding, refusal, asks, place, way, context, criteria];
