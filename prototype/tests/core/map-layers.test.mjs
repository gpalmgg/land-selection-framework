// src/config/map-layers.js (the registry merged from data/layer-sources.js), src/map/layers.js (the engine) and
// src/map/health.js (layer health), without a browser: the engine runs against a recording fake map, the files the
// layers load are read from disk, and health runs on injected timers.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { layerSources, panelLayerSources, layerSourceById, sources } from '../../src/data.js';
import * as cfg from '../../src/config/map-layers.js';
import * as L from '../../src/map/layers.js';
import * as H from '../../src/map/health.js';
import { state, runtime } from '../../src/state.js';

const ROOT = new URL('../../', import.meta.url);
const readJson = (rel) => JSON.parse(readFileSync(new URL(rel, ROOT), 'utf8'));
const byId = (id) => cfg.MAP_LAYERS.find((l) => l.id === id);
const tick = (ms = 15) => new Promise((r) => setTimeout(r, ms));

// ----------------------------------------------------------------------------------------------- the registry

// The engine tests leave an 8 s health clock running; stop it so the process can exit.
after(() => L.resetLayerEngineForTests());

test('registry: every EV panel entry has a presentation row and the reverse; ids are unique', () => {
  assert.deepEqual(cfg.REGISTRY_PROBLEMS, []);
  const ev = panelLayerSources().map((l) => l.id).sort();
  const ours = cfg.MAP_LAYERS.map((l) => l.id).sort();
  assert.deepEqual(ours, ev);
  assert.equal(new Set(ours).size, ours.length);
  assert.equal(cfg.LAYERS, cfg.MAP_LAYERS);
});

test('registry: retired candidates and the retired basemap never reach the panel', () => {
  const retired = layerSources.filter((l) => l.status === 'retired' || l.role === 'basemap').map((l) => l.id);
  assert.ok(retired.length > 0);
  for (const id of retired) assert.equal(byId(id), undefined, id);
});

test('registry: each entry carries what the panel, legend and engine read', () => {
  const groups = new Set(cfg.MAP_GROUPS.map((g) => g.key));
  for (const l of cfg.MAP_LAYERS) {
    assert.ok(l.label && typeof l.label === 'string', `${l.id} label`);
    assert.ok(groups.has(l.group), `${l.id} group ${l.group}`);
    assert.equal(typeof l.panel, 'number', `${l.id} panel`);
    assert.match(l.color, /^#[0-9a-f]{6}$/i, `${l.id} color`);
    assert.ok(['raster', 'wms', 'geojson', 'heatmap', 'circle'].includes(l.kind), `${l.id} kind ${l.kind}`);
    assert.ok(l.layers.length >= 1 && l.layers.every((d) => d.type && d.paint), `${l.id} style layers`);
    assert.ok(['data', 'imagery'].includes(l.role), `${l.id} role`);
    assert.ok(l.attribution, `${l.id} attribution`);
    assert.equal(l.source.attribution, l.attribution, `${l.id} the map credits the source`);
  }
  const panels = cfg.MAP_LAYERS.map((l) => `${l.group}:${l.panel}`);
  assert.equal(new Set(panels).size, panels.length, 'panel positions are unique inside a group');
});

test('registry: sourceLine { source, vintage, licenseText } is on every row; the vintage placeholder only where the registry lacks one', () => {
  for (const l of cfg.MAP_LAYERS) {
    const line = l.sourceLine;
    assert.ok(line && line.source && line.vintage && line.licenseText && line.text, `${l.id} sourceLine`);
    const ev = layerSourceById(l.id);
    const lacks = !String(ev.vintage || '').trim();
    assert.equal(line.vintage === 'vintage not yet recorded', lacks, `${l.id} vintage placeholder`);
    assert.equal(cfg.rowSourceText(l), line.text);
    assert.doesNotMatch(line.text, /\b(best|top|rank)/i, `${l.id} no ranking words`);
  }
});

test('registry: the licence is the canonical record\'s when that is confirmed, else the layer registry\'s own words', () => {
  for (const l of cfg.MAP_LAYERS) {
    const ev = layerSourceById(l.id);
    const rec = ev.sourceId ? sources[ev.sourceId] : null;
    const expected = rec && rec.licenseStatus === 'confirmed' && rec.license ? rec.license : ev.licenseText;
    assert.equal(l.sourceLine.licenseText, expected, l.id);
  }
});

test('live defects fixed through the registry', () => {
  const pop = byId('population');
  assert.ok(!pop.url.includes('2020-01-01'), 'the bogus date segment is gone');
  assert.ok(pop.source.tiles.every((t) => !t.includes('2020-01-01')));
  assert.equal(pop.source.maxzoom, 7);
  assert.equal(byId('seismic').source.maxzoom, 6);
  assert.equal(byId('coastal-flood').source.maxzoom, 9);
  assert.equal(byId('solar-pv').fragile, true);
  assert.equal(byId('solar-pv').status, 'fragile');
  for (const id of ['precipitation', 'soil-carbon', 'land-cover', 'travel-time']) assert.equal(byId(id).slow, true, `${id} slow flag`);
});

test('new layers: river flood x3, WorldCover with a zoom floor, two lazy Koppen layers', () => {
  for (const id of ['river-flood-current', 'river-flood-2050-rcp45', 'river-flood-2050-rcp85']) {
    const l = byId(id);
    assert.equal(l.group, 'hazards');
    assert.equal(l.source.type, 'raster');
    assert.ok(l.source.tiles[0].includes('River_Flooding'), id);
  }
  const wc = byId('worldcover');
  assert.equal(wc.sourceKind, 'wmts-kvp');
  assert.equal(wc.source.minzoom, 6);
  assert.ok(wc.zoomHint, 'zoom note source');
  assert.equal(H.noteText(wc, { on: false }).text, H.NOTE_ZOOM);
  for (const id of ['koppen-now', 'koppen-2041-2070']) {
    const l = byId(id);
    assert.equal(l.kind, 'geojson');
    assert.equal(l.lazy, true);
    assert.equal(l.group, 'climate');
    assert.ok(l.urls.europe && l.urls['north-america']);
    assert.equal(l.legend.kind, 'grouped');
    for (const url of Object.values(l.urls)) assert.ok(readJson(url).features.length > 0, url);
  }
});

test('z-order: imagery first, rasters before vectors, Koppen under the other vectors, the ecovillage points last', () => {
  const ids = cfg.MAP_LAYERS.map((l) => l.id);
  assert.deepEqual(ids.slice(0, 4), ['hillshade', 'topo', 'satellite', 'night-lights']);
  assert.equal(ids[ids.length - 1], 'regen-network');
  const firstVector = ids.findIndex((id) => ['geojson', 'heatmap', 'circle'].includes(byId(id).kind));
  const lastRaster = Math.max(...ids.map((id, i) => (['raster', 'wms'].includes(byId(id).kind) ? i : -1)));
  assert.ok(lastRaster < firstVector, 'every raster sits below every vector');
  assert.ok(ids.indexOf('koppen-now') < ids.indexOf('koppen-2041-2070'));
  assert.ok(ids.indexOf('koppen-2041-2070') < ids.indexOf('water-stress'));
});

test('default visibility: only the terrain relief and the ecovillage points', () => {
  assert.deepEqual(cfg.MAP_LAYERS.filter((l) => l.defaultOn).map((l) => l.id).sort(), ['hillshade', 'regen-network']);
  for (const l of cfg.MAP_LAYERS) assert.equal(state.mapLayers[l.id], !!l.defaultOn, l.id);
});

test('C7: the ecovillage row names OpenStreetMap, the licence and the retrieval date, and is not the Living Atlas count', () => {
  const eco = layerSourceById('ecovillages');
  assert.equal(eco.id, 'regen-network');
  const l = byId('regen-network');
  const line = cfg.rowSourceText(l);
  assert.match(line, /OpenStreetMap/);
  assert.match(line, /ODbL/);
  assert.match(line, /retrieved \d{4}-\d{2}-\d{2}/);
  assert.match(line, /not the Living Atlas count/);
  for (const d of Object.values(eco.retrieved)) assert.ok(line.includes(d), `the line carries ${d}`);
  // The parts say the same words, so a row composed from them cannot lose the clause.
  const composed = `${l.sourceLine.source} ${l.sourceLine.vintage} ${l.sourceLine.licenseText}`;
  assert.match(composed, /OpenStreetMap/);
  assert.match(composed, /not the Living Atlas count/);
  assert.match(composed, /retrieved \d{4}-\d{2}-\d{2}/);
  // A map dot count and a cell count are never presented as the same source.
  const cell = sources['living-atlas-wave1'];
  assert.ok(cell, 'the regen_network cell source exists');
  for (const wording of [cell.name, cell.short, cell.attribution]) {
    assert.notEqual(line, wording);
    assert.ok(!line.includes(wording), `row text does not reuse "${wording}"`);
  }
  assert.doesNotMatch(line, /Baseline Census|wave 1/i);
  assert.equal(l.lazy, false, 'the ecovillage points stay eager');
});

test('trajectoryPair: only the pairs the registry names, each pointing at real layers', () => {
  const pairs = cfg.trajectoryPairs();
  assert.deepEqual(
    pairs.map((p) => `${p.thenId}>${p.laterId}`).sort(),
    ['koppen-now>koppen-2041-2070', 'river-flood-current>river-flood-2050-rcp45', 'river-flood-current>river-flood-2050-rcp85'],
  );
  for (const p of pairs) {
    assert.ok(byId(p.thenId) && byId(p.laterId));
    assert.equal(byId(p.thenId).group, byId(p.laterId).group);
    assert.ok(p.thenLabel && p.laterLabel);
  }
  assert.equal(cfg.MAP_LAYERS.filter((l) => l.trajectoryPair).length, 2);
});

test('legends: label on every row; categorical layers carry discrete classes; ramps carry colours; Koppen is built at run time', () => {
  for (const l of cfg.MAP_LAYERS) {
    if (!l.legend) { assert.equal(l.role, 'imagery', `${l.id} has a legend`); continue; }
    assert.ok(l.legend.label, `${l.id} legend label`);
    if (l.legend.kind === 'ramp') assert.ok(l.legend.colors.length >= 2, l.id);
    if (['solid', 'dot'].includes(l.legend.kind)) assert.ok(l.legend.color, l.id);
  }
  assert.ok(byId('land-cover').legend.classes.length >= 8);
  assert.equal(byId('worldcover').legend.classes.length, 11);
  assert.equal(byId('seismic').legend.classes.length, 11);
  assert.match(byId('land-cover').legend.color, /^linear-gradient\(/, 'a banded swatch the current legend can paint');
  assert.equal(byId('river-flood-current').legend.unit, 'm');
  assert.equal(byId('koppen-now').legend.url, 'data/processed/koppen-legend.json');
  assert.equal(L.legendModel('koppen-now').pending, true, 'pending until the layer has loaded');
});

test('no scoring words anywhere in the registry text', () => {
  const words = /\b(score|scores|rank|ranking|best|top|weight|weighted|composite|livability)\b/i;
  for (const l of cfg.MAP_LAYERS) {
    for (const t of [l.label, l.sourceLine.text, l.coverageNote, l.fallbackNote, l.zoomHint, l.legend && l.legend.label, l.legend && l.legend.note]) {
      if (t) assert.doesNotMatch(t, words, `${l.id}: ${t}`);
    }
  }
});

// ------------------------------------------------------------------------------------------- the fake map

function fakeMap({ labels = false, zoom = 4 } = {}) {
  const srcs = new Map();
  const layers = [{ id: 'base', type: 'raster' }];
  if (labels) layers.push({ id: 'base-labels', type: 'symbol' });
  const handlers = {};
  const calls = [];
  const map = {
    calls, srcs, layers,
    getStyle: () => ({ layers }),
    getSource: (id) => srcs.get(id),
    addSource(id, spec) {
      const src = { spec, data: spec.data, setData(d) { src.data = d; calls.push(['setData', id, d]); } };
      srcs.set(id, src);
      calls.push(['addSource', id]);
    },
    getLayer: (id) => layers.find((l) => l.id === id),
    addLayer(layer, before) {
      const at = before ? layers.findIndex((l) => l.id === before) : -1;
      if (at >= 0) layers.splice(at, 0, layer); else layers.push(layer);
      calls.push(['addLayer', layer.id, before || null]);
    },
    setLayoutProperty(id, prop, val) { map.getLayer(id).layout[prop] = val; calls.push(['layout', id, val]); },
    setPaintProperty(id, prop, val) { map.getLayer(id).paint[prop] = val; calls.push(['paint', id, prop, val]); },
    getZoom: () => zoom,
    setZoom(z) { zoom = z; },
    isSourceLoaded: () => true,
    on(evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); },
    off(evt, fn) { handlers[evt] = (handlers[evt] || []).filter((f) => f !== fn); },
    emit(evt, payload) { (handlers[evt] || []).forEach((fn) => fn(payload)); },
    handlers,
  };
  return map;
}

// A fetch that serves the site's own files from disk and records what was asked for.
function stubFetch() {
  const asked = [];
  globalThis.fetch = async (url) => {
    asked.push(String(url));
    try {
      const body = readFileSync(new URL(String(url), ROOT), 'utf8');
      return { ok: true, status: 200, json: async () => JSON.parse(body) };
    } catch (err) {
      return { ok: false, status: 404, json: async () => ({}) };
    }
  };
  return asked;
}

function freshEngine(opts) {
  L.resetLayerEngineForTests();
  for (const l of cfg.MAP_LAYERS) state.mapLayers[l.id] = !!l.defaultOn;
  state.continent = 'europe';
  const map = fakeMap(opts);
  runtime.mapInstance = map;
  return map;
}

// --------------------------------------------------------------------------------------------- the engine

test('engine: a lazy geojson source starts empty, the eager ecovillage source starts with its file, a continent with no clip starts empty', () => {
  for (const l of cfg.MAP_LAYERS.filter((x) => x.urls)) {
    const spec = L.initialSourceSpec(l, 'europe');
    if (l.lazy) assert.deepEqual(spec.data, { type: 'FeatureCollection', features: [] }, l.id);
    else assert.equal(spec.data, l.urls.europe, l.id);
  }
  assert.equal(L.initialSourceSpec(byId('regen-network'), 'north-america').data, 'data/processed/ecovillages-na.geojson');
  const clipless = { ...byId('regen-network'), urls: { europe: 'x.geojson' } };
  assert.deepEqual(L.initialSourceSpec(clipless, 'north-america').data, { type: 'FeatureCollection', features: [] });
  const raster = L.initialSourceSpec(byId('worldcover'));
  assert.equal(raster.minzoom, 6);
  assert.equal('data' in raster, false);
});

test('engine: realise adds every source and layer once, in registry order, and is idempotent', () => {
  const map = freshEngine();
  L.realise(map);
  const added = map.calls.filter((c) => c[0] === 'addLayer').map((c) => c[1]);
  assert.deepEqual(added, cfg.MAP_LAYERS.map((l) => l.id));
  assert.equal(map.calls.filter((c) => c[0] === 'addSource').length, cfg.MAP_LAYERS.length);
  const n = map.calls.length;
  L.realise(map);
  L.realise(map);
  assert.equal(map.calls.length, n, 'a second realise adds nothing');
  assert.deepEqual(map.layers.map((l) => l.id), ['base', ...cfg.MAP_LAYERS.map((l) => l.id)]);
  for (const l of cfg.MAP_LAYERS) {
    assert.equal(map.getLayer(l.id).layout.visibility, l.defaultOn ? 'visible' : 'none', l.id);
  }
});

test('engine: the opacity cap still applies to stacked rasters', () => {
  const map = freshEngine();
  L.realise(map);
  assert.equal(map.getLayer('seismic').paint['raster-opacity'], Math.min(0.68, cfg.STACK_OPACITY_CAP));
  assert.equal(map.getLayer('hillshade').paint['raster-opacity'], 0.7, 'imagery is not capped');
});

test('engine: at load no GeoJSON is requested except the ecovillage points', () => {
  const map = freshEngine();
  const asked = stubFetch();
  L.realise(map);
  const withUrl = [...map.srcs].filter(([, s]) => typeof s.spec.data === 'string').map(([id, s]) => [id, s.spec.data]);
  assert.deepEqual(withUrl, [['regen-network', 'data/processed/ecovillages.geojson']]);
  assert.deepEqual(asked, [], 'no fetch of our own either');
  assert.equal(map.calls.filter((c) => c[0] === 'setData').length, 0);
});

test('engine: every raster, fill and heat layer goes in before the first label layer; the points stay above it', () => {
  const map = freshEngine({ labels: true });
  L.realise(map);
  const ids = map.layers.map((l) => l.id);
  const labels = ids.indexOf('base-labels');
  for (const l of cfg.MAP_LAYERS) {
    if (l.kind === 'circle') assert.ok(ids.indexOf(l.id) > labels, `${l.id} above the labels`);
    else assert.ok(ids.indexOf(l.id) < labels, `${l.id} below the labels`);
  }
  // Registry order is kept among the layers under the labels.
  const under = ids.slice(1, labels);
  assert.deepEqual(under, cfg.MAP_LAYERS.filter((l) => l.kind !== 'circle').map((l) => l.id));
  const n = map.calls.length;
  L.realise(map);
  assert.equal(map.calls.length, n);
});

test('engine: the first label layer is found by metadata flag, symbol type or name; none means on top', () => {
  const style = (layers) => ({ getStyle: () => ({ layers }) });
  assert.equal(L.firstLabelId(style([{ id: 'b', type: 'raster' }])), undefined);
  assert.equal(L.firstLabelId(style([{ id: 'b', type: 'raster' }, { id: 'x', type: 'symbol' }])), 'x');
  assert.equal(L.firstLabelId(style([{ id: 'b', type: 'raster' }, { id: 'base-labels', type: 'raster' }])), 'base-labels');
  assert.equal(L.firstLabelId(style([{ id: 'b', type: 'raster' }, { id: 'ref', type: 'raster', metadata: { 'lsf:labels': true } }, { id: 'y', type: 'symbol' }])), 'ref');
  assert.equal(L.firstLabelId({ getStyle() { throw new Error('no style'); } }), undefined);
});

test('engine: a lazy file is fetched on the layer\'s first toggle only', async () => {
  const map = freshEngine();
  const asked = stubFetch();
  L.realise(map);
  await L.healthReady();
  state.mapLayers.conflict = true;
  L.applyVisibility('conflict');
  await tick();
  assert.deepEqual(asked, ['data/processed/conflict.geojson']);
  assert.equal(map.srcs.get('conflict').data.type, 'FeatureCollection');
  assert.ok(map.srcs.get('conflict').data.features.length > 0, 'the file went into the source');
  assert.equal(map.getLayer('conflict').layout.visibility, 'visible');
  state.mapLayers.conflict = false;
  L.applyVisibility('conflict');
  state.mapLayers.conflict = true;
  L.applyVisibility('conflict');
  await tick();
  assert.equal(asked.length, 1, 'off and on again does not fetch twice');
  assert.equal(L.layerHealth('conflict').state, 'ok');
});

test('engine: on a continent switch only sources already added and shown are loaded; a clip-less layer is cleared', async () => {
  const map = freshEngine();
  const asked = stubFetch();
  L.realise(map);
  await L.healthReady();
  state.mapLayers['water-stress'] = true;
  L.applyVisibility('water-stress');
  await tick();
  asked.length = 0;
  map.calls.length = 0;
  state.continent = 'north-america';
  L.syncContinent(map, 'north-america');
  await tick();
  assert.deepEqual(asked.sort(), ['data/processed/water-stress-na.geojson']);
  const sets = map.calls.filter((c) => c[0] === 'setData').map((c) => c[1]).sort();
  assert.deepEqual(sets, ['regen-network', 'water-stress'], 'the eager points swap by URL, the shown lazy layer by its file');
  assert.equal(map.srcs.get('regen-network').data, 'data/processed/ecovillages-na.geojson');
  // The never-toggled layers did not move.
  for (const id of ['conflict', 'water-depletion', 'koppen-now', 'koppen-2041-2070']) {
    assert.deepEqual(map.srcs.get(id).data, { type: 'FeatureCollection', features: [] }, id);
  }
  // A hidden layer that had been loaded reloads when it is next shown, for the continent then active.
  state.continent = 'europe';
  state.mapLayers['water-stress'] = false;
  L.applyVisibility('water-stress');
  L.syncContinent(map, 'europe');
  asked.length = 0;
  state.mapLayers['water-stress'] = true;
  L.applyVisibility('water-stress');
  await tick();
  assert.deepEqual(asked, ['data/processed/water-stress.geojson']);
});

test('engine: a continent without a clip for a layer clears the source instead of leaving the other continent\'s data', async () => {
  const map = freshEngine();
  stubFetch();
  L.realise(map);
  await L.healthReady();
  state.mapLayers.conflict = true;
  L.applyVisibility('conflict');
  await tick();
  assert.ok(map.srcs.get('conflict').data.features.length > 0);
  const entry = byId('conflict');
  const saved = entry.urls['north-america'];
  delete entry.urls['north-america'];
  try {
    state.continent = 'north-america';
    L.syncContinent(map, 'north-america');
    assert.deepEqual(map.srcs.get('conflict').data, { type: 'FeatureCollection', features: [] });
    // And a layer that is hidden and has no clip is cleared too; toggling it on later fetches nothing.
    const asked = stubFetch();
    L.applyVisibility('conflict');
    await tick();
    assert.deepEqual(asked, []);
  } finally {
    entry.urls['north-america'] = saved;
    state.continent = 'europe';
  }
});

test('engine: the Koppen legend holds only the classes in the loaded file, grouped A to E; the fills take the legend file\'s colours', async () => {
  const map = freshEngine();
  stubFetch();
  L.realise(map);
  await L.healthReady();
  state.mapLayers['koppen-now'] = true;
  L.applyVisibility('koppen-now');
  await tick(40);
  const data = readJson('data/processed/koppen-1991-2020-eu.geojson');
  const present = new Set(L.koppenCodesIn(data));
  const model = L.legendModel('koppen-now');
  assert.equal(model.pending, undefined);
  assert.equal(model.classCount, present.size);
  assert.ok(model.classCount < 30, 'not the 30-row list');
  const shown = model.groups.flatMap((g) => g.classes.map((c) => c.code));
  assert.deepEqual(new Set(shown), present);
  assert.deepEqual(model.groups.map((g) => g.key), ['B', 'C', 'D', 'E'], 'Europe 1991-2020 has no tropical class');
  assert.ok(model.groups.every((g, i, a) => !i || g.key > a[i - 1].key), 'grouped in letter order');
  assert.ok(model.groups.every((g) => g.classes.every((c) => c.code[0] === g.key && /^#[0-9a-f]{6}$/i.test(c.color) && c.label)));
  const paint = map.calls.find((c) => c[0] === 'paint' && c[1] === 'koppen-now');
  assert.ok(paint, 'fill-color set from the legend file');
  assert.equal(paint[3][0], 'match');
  assert.ok(map.srcs.get('koppen-now').data.features.length === data.features.length);
  // The other period holds other classes.
  state.mapLayers['koppen-2041-2070'] = true;
  L.applyVisibility('koppen-2041-2070');
  await tick(40);
  const later = L.legendModel('koppen-2041-2070');
  assert.equal(later.classCount, new Set(L.koppenCodesIn(readJson('data/processed/koppen-2041-2070-ssp245-eu.geojson'))).size);
  assert.notDeepEqual(later.groups.flatMap((g) => g.classes.map((c) => c.code)), shown);
  // North America reaches the tropical group.
  state.continent = 'north-america';
  L.syncContinent(map, 'north-america');
  await tick(40);
  assert.deepEqual(L.legendModel('koppen-now').groups.map((g) => g.key), ['A', 'B', 'C', 'D', 'E']);
});

test('engine: a lazy file that fails to load marks the layer unavailable and keeps the map working', async () => {
  const map = freshEngine();
  globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
  L.realise(map);
  await L.healthReady();
  state.mapLayers.conflict = true;
  L.applyVisibility('conflict');
  await tick();
  assert.equal(L.layerHealth('conflict').state, 'unavailable');
  assert.equal(map.getLayer('conflict').layout.visibility, 'visible');
  // A later toggle tries again and recovers.
  stubFetch();
  state.mapLayers.conflict = false;
  L.applyVisibility('conflict');
  state.mapLayers.conflict = true;
  L.applyVisibility('conflict');
  await tick();
  assert.equal(L.layerHealth('conflict').state, 'ok');
});

test('engine: a style swap re-adds the layers and reloads the lazy layers that are on', async () => {
  const map = freshEngine();
  const asked = stubFetch();
  L.realise(map);
  await L.healthReady();
  state.mapLayers.conflict = true;
  L.applyVisibility('conflict');
  await tick();
  // setStyle replaced the style: nothing of ours is in it any more.
  map.srcs.clear();
  map.layers.length = 0;
  map.layers.push({ id: 'base', type: 'raster' });
  asked.length = 0;
  L.realise(map);
  await tick();
  assert.equal(map.layers.filter((l) => l.id !== 'base').length, cfg.MAP_LAYERS.length);
  assert.deepEqual(asked, ['data/processed/conflict.geojson'], 'the visible lazy layer reloads, no hidden one does');
  assert.ok(map.srcs.get('conflict').data.features.length > 0);
});

test('engine: toggling reports to listeners with the new state', () => {
  const map = freshEngine();
  L.realise(map);
  const heard = [];
  const off = L.onToggle((id, on) => heard.push([id, on]));
  state.mapLayers.topo = true;
  L.applyVisibility('topo');
  off();
  state.mapLayers.topo = false;
  L.applyVisibility('topo');
  assert.deepEqual(heard, [['topo', true]]);
});

test('engine: panel order reads group by group, then by position; extension layers merge in', () => {
  freshEngine();
  const order = L.panelLayers().map((l) => l.id);
  assert.deepEqual(order.slice(0, 5), ['precipitation', 'water-stress', 'water-depletion', 'koppen-now', 'koppen-2041-2070']);
  assert.equal(order[order.length - 1], 'night-lights');
  assert.equal(order.length, cfg.MAP_LAYERS.length);
  L.registerExtensions([{ id: 'x', groups: [{ key: 'place', label: 'Place', order: 0 }], layers: [{ id: 'x-ext', group: 'place', label: 'Ext', defaultOn: true }] }]);
  try {
    assert.equal(L.panelLayers()[0].id, 'x-ext');
    assert.equal(state.mapLayers['x-ext'], true);
    assert.equal(L.legendModel('x-ext'), null);
  } finally {
    L.registerExtensions([]);
    delete state.mapLayers['x-ext'];
  }
});

// -------------------------------------------------------------------------------------------- the health rules

function clock() {
  const timers = [];
  return {
    timers,
    setTimer: (fn, ms) => { const t = { fn, ms, live: true }; timers.push(t); return t; },
    clearTimer: (t) => { t.live = false; },
    fire() { timers.filter((t) => t.live).forEach((t) => { t.live = false; t.fn(); }); },
    pending: () => timers.filter((t) => t.live).length,
  };
}

function monitorWith(opts = {}) {
  const c = clock();
  const changes = [];
  const m = H.createMonitor({ setTimer: c.setTimer, clearTimer: c.clearTimer, onChange: (id, next, prev) => changes.push([id, prev, next]), ...opts });
  return { m, c, changes };
}

test('health: three errors and no success make a layer unavailable', () => {
  const { m, changes } = monitorWith();
  m.track('a');
  m.activate('a');
  m.error('a');
  m.error('a');
  assert.equal(m.status('a').state, 'loading');
  m.error('a');
  assert.equal(m.status('a').state, 'unavailable');
  assert.deepEqual(changes.map((c) => c[2]), ['loading', 'unavailable']);
});

test('health: errors alongside a success do not condemn the layer', () => {
  const { m } = monitorWith();
  m.track('a');
  m.activate('a');
  m.success('a');
  for (let i = 0; i < 5; i++) m.error('a');
  assert.equal(m.status('a').state, 'ok');
});

test('health: no tile within 8 s is slow; a later success recovers it; so does one after unavailable', () => {
  const { m, c } = monitorWith();
  m.track('a');
  m.activate('a');
  assert.equal(c.timers[0].ms, H.SLOW_AFTER_MS);
  assert.equal(H.SLOW_AFTER_MS, 8000);
  c.fire();
  assert.equal(m.status('a').state, 'slow');
  m.success('a');
  assert.equal(m.status('a').state, 'ok');
  m.track('b');
  m.activate('b');
  for (let i = 0; i < 3; i++) m.error('b');
  assert.equal(m.status('b').state, 'unavailable');
  m.success('b');
  assert.equal(m.status('b').state, 'ok');
});

test('health: a success before the 8 s cancels the clock; a cached layer is fine when the probe says it is loaded', () => {
  const { m, c } = monitorWith();
  m.track('a');
  m.activate('a');
  m.success('a');
  assert.equal(c.pending(), 0);
  m.track('cached', { probe: () => true });
  m.activate('cached');
  c.fire();
  assert.equal(m.status('cached').state, 'ok');
  m.track('stuck', { probe: () => false });
  m.activate('stuck');
  c.fire();
  assert.equal(m.status('stuck').state, 'slow');
});

test('health: switching a layer off clears its state and its clock; switching it on counts afresh', () => {
  const { m, c } = monitorWith();
  m.track('a');
  m.activate('a');
  for (let i = 0; i < 3; i++) m.error('a');
  m.deactivate('a');
  assert.deepEqual(m.status('a'), { state: 'idle', errors: 0, successes: 0, active: false });
  m.error('a');
  assert.equal(m.status('a').errors, 0, 'an inactive layer counts nothing');
  m.activate('a');
  assert.equal(m.status('a').state, 'loading');
  assert.equal(c.pending(), 1);
});

test('health: a layer below its zoom floor expects no tiles, so it is never slow; zooming in starts the clock', () => {
  let ok = false;
  const { m, c } = monitorWith();
  m.track('wc', { expects: () => ok });
  m.activate('wc');
  assert.equal(m.status('wc').state, 'idle');
  assert.equal(c.pending(), 0);
  m.error('wc');
  m.error('wc');
  m.error('wc');
  assert.equal(m.status('wc').state, 'idle', 'errors while nothing is expected are ignored');
  ok = true;
  m.recheck('wc');
  assert.equal(m.status('wc').state, 'loading');
  assert.equal(c.pending(), 1);
  c.fire();
  assert.equal(m.status('wc').state, 'slow');
  ok = false;
  m.recheck('wc');
  assert.equal(m.status('wc').state, 'idle', 'zooming back out withdraws the note');
});

test('health: a GeoJSON layer fails on one error; fail() condemns a layer at once and is ignored when it is off', () => {
  const { m } = monitorWith();
  m.track('g', { errorsToFail: 1 });
  m.activate('g');
  m.error('g');
  assert.equal(m.status('g').state, 'unavailable');
  m.track('f');
  m.fail('f');
  assert.equal(m.status('f').state, 'idle', 'off: nothing happens');
  m.activate('f');
  m.success('f');
  m.fail('f');
  assert.equal(m.status('f').state, 'unavailable');
});

test('health: the words. Service trouble first, then the zoom floor, then the registry flags; nothing for a healthy layer', () => {
  const wc = byId('worldcover');
  assert.equal(H.noteText(wc, { on: true, state: 'unavailable' }).text, 'This service is slow or unavailable right now. The map keeps working.');
  assert.equal(H.noteText(wc, { on: true, state: 'slow' }).kind, 'service');
  assert.equal(H.noteText(wc, { on: false }).text, 'Zoom in to see this layer.');
  assert.equal(H.noteText(wc, { on: true, belowMinZoom: true }).kind, 'zoom');
  assert.equal(H.noteText(wc, { on: true, belowMinZoom: false }).kind, 'slow-flag');
  const solar = byId('solar-pv');
  assert.equal(H.noteText(solar, { on: true }).kind, 'fragile');
  assert.equal(H.noteText(solar, { on: true }).text, solar.fallbackNote);
  assert.equal(H.noteText(solar, { on: false }), null, 'a layer that is off says nothing about its flags');
  assert.equal(H.noteText(byId('precipitation'), { on: true }).kind, 'slow-flag');
  assert.equal(H.noteText(byId('hillshade'), { on: true, state: 'ok' }), null);
  assert.equal(H.noteText(byId('hillshade'), { on: true, state: 'unavailable' }).kind, 'service');
  for (const t of [H.NOTE_UNAVAILABLE, H.NOTE_ZOOM, H.NOTE_SLOW_FLAG, H.NOTE_FRAGILE]) assert.ok(t.length > 10);
});

test('health: tiles are expected from floor(zoom + log2(512 / tileSize)), the way MapLibre asks for them', () => {
  const wc = byId('worldcover');
  assert.equal(H.expectsTiles(wc, 4), false);
  assert.equal(H.expectsTiles(wc, 4.9), false);
  assert.equal(H.expectsTiles(wc, 5), true, 'tile zoom 6 is asked for from map zoom 5 on 256 px tiles');
  assert.equal(H.expectsTiles(byId('hillshade'), 0), true);
  assert.equal(H.expectsTiles(byId('conflict'), 0), true);
});

test('health: wired to a map, tile errors and tile successes drive the layer; the basemap and other sources are ignored', () => {
  const map = fakeMap({ zoom: 4 });
  const c = clock();
  const on = new Set(['satellite']);
  const api = H.attachHealth(map, { entries: cfg.MAP_LAYERS, isOn: (id) => on.has(id), doc: null, setTimer: c.setTimer, clearTimer: c.clearTimer });
  assert.equal(api.status('satellite').state, 'loading', 'a layer that is already on is watched from the start');
  map.emit('error', { sourceId: 'carto-positron' });
  map.emit('error', { sourceId: 'satellite' });
  map.emit('error', { sourceId: 'satellite' });
  assert.equal(api.status('satellite').state, 'loading');
  map.emit('error', { sourceId: 'satellite' });
  assert.equal(api.status('satellite').state, 'unavailable');
  map.emit('sourcedata', { sourceId: 'satellite', isSourceLoaded: true });
  assert.equal(api.status('satellite').state, 'unavailable', 'a source-loaded event without a tile is not a success (an errored tile counts as loaded)');
  map.emit('sourcedata', { sourceId: 'satellite', tile: {} });
  assert.equal(api.status('satellite').state, 'ok');
  // Toggling another layer on and off.
  on.add('topo');
  api.layerChanged('topo', true);
  assert.equal(api.status('topo').state, 'loading');
  on.delete('topo');
  api.layerChanged('topo', false);
  assert.equal(api.status('topo').state, 'idle');
  // WorldCover on below its floor: nothing is expected, so the clock never runs and zooming in starts it.
  on.add('worldcover');
  api.layerChanged('worldcover', true);
  assert.equal(api.status('worldcover').state, 'idle');
  map.setZoom(6);
  map.emit('zoomend');
  assert.equal(api.status('worldcover').state, 'loading');
  api.dispose();
});

test('health: the panel note, the aria-describedby link and the live region (a minimal DOM stand-in)', () => {
  const nodes = new Map();
  const mk = (tag) => {
    const el = {
      tag, attrs: {}, style: {}, children: [], parent: null, textContent: '', id: '', className: '',
      setAttribute(k, v) { el.attrs[k] = String(v); }, getAttribute(k) { return k in el.attrs ? el.attrs[k] : null; },
      removeAttribute(k) { delete el.attrs[k]; },
      get previousElementSibling() { if (!el.parent) return null; const i = el.parent.children.indexOf(el); return i > 0 ? el.parent.children[i - 1] : null; },
      insertAdjacentElement(where, n) {
        n.parent = el.parent;
        const i = el.parent.children.indexOf(el);
        if (n.parent.children.includes(n)) n.parent.children.splice(n.parent.children.indexOf(n), 1);
        el.parent.children.splice(el.parent.children.indexOf(el) + 1, 0, n);
        if (n.id) nodes.set(n.id, n);
      },
      remove() { if (el.parent) el.parent.children.splice(el.parent.children.indexOf(el), 1); nodes.delete(el.id); },
      appendChild(n) { n.parent = el; el.children.push(n); if (n.id) nodes.set(n.id, n); return n; },
      querySelectorAll() { return el.children.filter((c) => c.tag === 'button'); },
    };
    return el;
  };
  const toggles = mk('div');
  const controls = mk('div');
  const sat = byId('satellite');
  const btn = mk('button');
  btn.attrs['aria-label'] = `${sat.label} map layer`;
  btn.attrs['aria-describedby'] = 'already-here';
  toggles.appendChild(btn);
  const wcBtn = mk('button');
  const wc = byId('worldcover');
  wcBtn.attrs['aria-label'] = `${wc.label} map layer`;
  toggles.appendChild(wcBtn);
  nodes.set('map-toggles', toggles);
  const doc = {
    getElementById: (id) => nodes.get(id) || null,
    querySelector: (sel) => (sel === '.map-controls' ? controls : null),
    createElement: mk,
    body: mk('body'),
  };
  const map = fakeMap({ zoom: 4 });
  const c = clock();
  const on = new Set(['satellite']);
  const api = H.attachHealth(map, { entries: cfg.MAP_LAYERS, isOn: (id) => on.has(id), doc, setTimer: c.setTimer, clearTimer: c.clearTimer });
  // WorldCover is off: its zoom note is there already, linked from the button.
  const zoomNote = nodes.get('map-layer-note-worldcover');
  assert.equal(zoomNote.textContent, H.NOTE_ZOOM);
  assert.equal(wcBtn.getAttribute('aria-describedby'), 'map-layer-note-worldcover');
  assert.equal(toggles.children[toggles.children.indexOf(wcBtn) + 1], zoomNote, 'right after its button');
  // Satellite becomes unavailable: the note appears, the old describedby token is kept, the live region speaks.
  for (let i = 0; i < 3; i++) map.emit('error', { sourceId: 'satellite' });
  const note = nodes.get('map-layer-note-satellite');
  assert.equal(note.textContent, H.NOTE_UNAVAILABLE);
  assert.equal(btn.getAttribute('aria-describedby'), 'already-here map-layer-note-satellite');
  const live = nodes.get('map-health-live');
  assert.equal(live.getAttribute('role'), 'status');
  assert.equal(live.getAttribute('aria-live'), 'polite');
  assert.equal(controls.children.includes(live), true, 'inside the panel');
  assert.match(live.textContent, /Recent satellite: This service is slow or unavailable right now/);
  // It recovers: the note goes, the token goes, the region says so.
  map.emit('sourcedata', { sourceId: 'satellite', tile: {} });
  assert.equal(nodes.get('map-layer-note-satellite'), undefined);
  assert.equal(btn.getAttribute('aria-describedby'), 'already-here');
  assert.match(live.textContent, /Recent satellite is loading again/);
  // Switching it off with trouble pending clears the note.
  api.layerChanged('satellite', false);
  assert.equal(nodes.get('map-layer-note-satellite'), undefined);
  api.dispose();
});
