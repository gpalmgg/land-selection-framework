#!/usr/bin/env node
// Print the map-layer registry (data/layer-sources.js) as JSON on stdout, for scripts/probe_layers.py
// and for tests that cannot import an ES module (Python, shell).
//
//   node scripts/dump_layer_sources.mjs > layers.json
//   node scripts/dump_layer_sources.mjs --ids      # one id per line
//
// The output shape is { registry, verified, count, layers: [...] }; probe_layers.py also accepts a bare array.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// The data module is a typeless-package ES module; importing it from a data: URL avoids Node's
// MODULE_TYPELESS_PACKAGE_JSON warning on stderr (the registry has no relative imports).
const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(here, '..', 'data', 'layer-sources.js'), 'utf8');
const mod = await import('data:text/javascript;base64,' + Buffer.from(src, 'utf8').toString('base64'));

if (!Array.isArray(mod.layerSources)) {
  console.error('data/layer-sources.js does not export a layerSources array');
  process.exit(1);
}
if (process.argv.includes('--ids')) {
  for (const l of mod.layerSources) console.log(l.id);
} else {
  process.stdout.write(JSON.stringify({
    registry: 'prototype/data/layer-sources.js',
    verified: mod.LAYER_SOURCES_VERIFIED || null,
    count: mod.layerSources.length,
    layers: mod.layerSources,
  }, null, 2) + '\n');
}
