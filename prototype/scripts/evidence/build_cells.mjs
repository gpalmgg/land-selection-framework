#!/usr/bin/env node
// Assemble the candidate value cells of every region under plan policy P-CELL and write the cross-check report.
//
//   node scripts/evidence/build_cells.mjs [--regions a,b] [--out DIR] [--packages DIR] [--retrieved YYYY-MM-DD]
//        [--accept-current <region>:<criterion>,...] [--stage-map FILE.json] [--no-crosscheck] [--dry-run] [--root DIR]
//   --stage-map: { "<criterion>": ["dotted.path", ...] } paths tried BEFORE the built-in ones, for a stage output whose number lives
//   somewhere unexpected (the criterion's nullReason names the paths that were tried).
//
// Per (region, criterion) the cell value is chosen in this order (P-CELL):
//   1. the canonical pipeline value (EV-PIPE-*: evidence-out/<id>/<stage>.json) when its stage succeeded (status ok) AND
//      recorded a footprint, a method and its inputs;
//   2. otherwise the re-verification HIGH/MEDIUM evidence-backed corrected value (evidence-out/patches.json, numeric
//      `values.<id>.<criterion>.value` items) or, for a new region, the verified package value (regions/<id>/data.json), with
//      its method recorded in `method` and `audit`;
//   3. otherwise `value: null` with a `nullReason` saying what was not reproduced and why.
// A number whose only provenance is an unreproduced dossier midpoint or hand estimate is NEVER chosen: the current
// regions.js value is only a cross-check column, unless the integration WP names it with --accept-current after reading the
// evidence (then it is chosen as `current-verified`). Low-confidence reverify items are never used.
//
// Output evidence-out/<id>/cells.json:
//   { regionId, generatedAt, cells: { <criterion>: cell v2 }, context: { koppen, water }, footprint,
//     provenance: { <criterion>: { chosen, field, ... } }, flags: { <criterion>: [strings] }, nulls: [criterion] }
// `flags` and `provenance` live OUTSIDE the cells so a cell can be copied into data/regions.js unchanged. A flag such as
// `label-needed` or `trajectory-missing` is work the integration WP must finish; this tool never invents a label.
// evidence-out/crosscheck.json|md: pipeline vs current vs reverify vs package with the track tolerances. Idempotent: a
// second run leaves every file unchanged (generatedAt is kept when nothing else changed).
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  parseArgs, resolveRoots, readJson, exists, writeIfChanged, stringify, printLine, isMain,
} from './merge/common.mjs';
import { loadRegionPackage, loadAllPackages } from './merge/load_region_package.mjs';

export const METHODS = ['footprint-zonal', 'point-3x3', 'named-count', 'official-statistic', 'hand-estimate'];
const STAGE_FILE = { climate: 'climate', water_stress: 'aqueduct', soil_carbon: 'soil', forest_change: 'hansen', solar_pv: 'solar', conflict: 'conflict', population: 'ghsl', regen_network: 'regen' };

// Per criterion: where the canonical value lives in the stage output, how it is rounded, the track-4 tolerance, and the
// defaults used for fields a stage does not state itself.
export const SPEC = {
  climate: { paths: ['value'], dec: 1, tol: (r) => 0.5, unit: '°C', vintage: '2041–2060, SSP2-4.5', scenario: 'SSP2-4.5', source: 'WorldClim 2.1 CMIP6 downscaled ensemble', sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html', sourceId: 'worldclim-cmip6', method: 'footprint-zonal' },
  water_stress: { paths: ['bau2050.raw', 'value'], dec: 3, tol: (r) => Math.max(0.05, 0.25 * Math.abs(r)), unit: 'ratio', vintage: '2050 business-as-usual', source: 'WRI Aqueduct 4.0 (bau50_ws_x_r)', sourceUrl: 'https://www.wri.org/aqueduct', sourceId: 'aqueduct-40', method: 'footprint-zonal' },
  soil_carbon: { paths: ['value', 'dw_mean_gkg'], dec: 1, tol: (r) => 0.15 * Math.abs(r), unit: 'g/kg', vintage: 'SoilGrids 2.0 (2020 release), 0–30 cm depth-weighted', source: 'SoilGrids 2.0 (ISRIC)', sourceUrl: 'https://soilgrids.org', sourceId: 'soilgrids-2', method: 'footprint-zonal' },
  forest_change: { paths: ['value', 'net_pct_per_decade'], dec: 1, tol: (r) => 1.0, unit: '%/decade', vintage: '2001–2023', source: 'Hansen Global Forest Change v1.11', sourceUrl: 'https://storage.googleapis.com/earthenginepartners-hansen/GFC-2023-v1.11/download.html', sourceId: 'hansen-gfc', method: 'footprint-zonal' },
  solar_pv: { paths: ['value', 'pvout.mean', 'mean'], dec: 0, tol: (r) => 0.05 * Math.abs(r), unit: 'kWh/kWp/yr', vintage: 'long-term average (Global Solar Atlas)', source: 'Global Solar Atlas (World Bank / ESMAP / Solargis)', sourceUrl: 'https://globalsolaratlas.info', sourceId: 'gsa-pvout', method: 'footprint-zonal' },
  conflict: { paths: ['periods.2019_2024.events'], dec: 0, tol: () => 0, unit: 'events', vintage: '2019–2024', source: 'UCDP GED v25.1', sourceUrl: 'https://ucdp.uu.se/downloads/', sourceId: 'ucdp-ged', method: 'named-count', footprint: 'disc-200km' },
  population: { paths: ['value', 'density_2020', 'density'], dec: null, tol: (r) => 0.15 * Math.abs(r), unit: 'p/km²', vintage: 'GHS-POP R2023A, epoch 2020', trajVintage: 'epoch 2020 to the GHSL 2030 projection', source: 'JRC GHSL GHS-POP R2023A', sourceUrl: 'https://human-settlement.emergency.copernicus.eu/', sourceId: 'ghsl-pop-r2023a', method: 'footprint-zonal' },
  regen_network: { paths: ['value', 'count', 'n'], dec: 0, tol: () => 0, unit: 'sites', vintage: 'Living Atlas wave-1 baseline (frozen 2026-07-24)', source: 'Living Atlas baseline census, wave 1', sourceUrl: 'https://atlas.regencommunity.tools', sourceId: 'living-atlas-wave1', method: 'named-count', footprint: 'disc-100km' },
};
export const CRITERIA = Object.keys(SPEC);

// Stage files from Python may carry bare NaN / Infinity (not valid JSON): read them as null.
export function parseJsonLoose(text) {
  try { return JSON.parse(text); } catch { /* fall through */ }
  return JSON.parse(text.replace(/(?<=[:[,]\s*)(-?Infinity|NaN)(?=\s*[,\]}])/g, 'null'));
}
const getPath = (o, p) => p.split('.').reduce((a, k) => (a === null || a === undefined ? undefined : a[k]), o);
const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

function round(crit, v) {
  const d = SPEC[crit].dec;
  const dec = d === null ? (Math.abs(v) < 10 ? 1 : 0) : d;
  return Number(v.toFixed(dec));
}

export function readStage(outDir, id, stage) {
  const f = path.join(outDir, id, `${stage}.json`);
  if (!exists(f)) return { file: f, json: null, error: 'no output file' };
  try { return { file: f, json: parseJsonLoose(fs.readFileSync(f, 'utf8')), error: null }; } catch (e) { return { file: f, json: null, error: `unreadable: ${e.message}` }; }
}

// The canonical pipeline candidate for one criterion: { ok, value, field, why, method, footprint, retrieved, meta }
export function pipelineCandidate(crit, stage, extraPaths = []) {
  const spec = SPEC[crit];
  if (!stage.json) return { ok: false, why: `${STAGE_FILE[crit]} stage: ${stage.error}` };
  const j = stage.json;
  const why = (t) => `${STAGE_FILE[crit]} stage ${t}${j.error ? `: ${String(j.error).slice(0, 160)}` : ''}`;
  if (j.status !== 'ok' && j.status !== 'fallback') return { ok: false, why: why(`status ${JSON.stringify(j.status)}`) };
  let value = null;
  let field = null;
  const paths = [...extraPaths, ...spec.paths];
  for (const p of paths) { const v = getPath(j, p); if (isNum(v)) { value = v; field = p; break; } }
  // status 'fallback' with a number means the value stands and only a companion (the trajectory) fell back; without a number it is unusable
  if (value === null) return { ok: false, why: why(j.status === 'ok' ? `has status ok but no number at ${paths.join(' | ')}` : `status "fallback" and no value`) };
  const fp = typeof j.footprint === 'string' ? j.footprint : (j.footprint && j.footprint.id);
  const methodName = typeof j.method === 'string' ? j.method : (spec.method);
  const inputs = (Array.isArray(j.inputs) && j.inputs.length) || j.per_model || j.models_ok || (Array.isArray(j.tiles_used) && j.tiles_used.length)
    || (Array.isArray(j.input_files) && j.input_files.length) || (j.baseline && typeof j.baseline === 'object' && j.baseline.sha256) || (isNum(j.n_points) && j.n_points > 0)
    || (isNum(j.grid_points) && j.grid_points > 0) || j.gsa_data_version || (Array.isArray(j.tiles) && j.tiles.length) || (Array.isArray(j.layers) && j.layers.length);
  const missing = [];
  if (!fp) missing.push('footprint');
  if (!j.method) missing.push('method');
  if (!inputs) missing.push('inputs');
  if (missing.length) return { ok: false, why: `${STAGE_FILE[crit]} stage did not record ${missing.join(', ')}: not used (P-CELL)` };
  const method = methodName && METHODS.includes(methodName) ? methodName
    : /count/i.test(methodName || '') ? 'named-count' : /3\s?x\s?3/i.test(methodName || '') ? 'point-3x3'
      : /official|statistic/i.test(methodName || '') ? 'official-statistic' : spec.method;
  return {
    ok: true, value, field, method, footprint: spec.footprint || fp,
    retrieved: String(j.computedAt || j.generated || j.retrieved || '').slice(0, 10) || null,
    fallbackNote: j.status === 'fallback' ? `stage status fallback: ${String(j.error || 'no detail').slice(0, 200)}` : null,
    meta: j,
  };
}

// Trajectory for a pipeline cell: the stage's own when it states one, else derived where the stage holds both ends.
export function trajectoryFor(crit, j, spec) {
  if (j.trajectory && typeof j.trajectory === 'object' && j.trajectory.status) {
    const t = { ...j.trajectory };
    let completed = false;
    const DIR = { stable: 'steady', unchanged: 'steady', increasing: 'rising', up: 'rising', decreasing: 'falling', down: 'falling' };
    if (typeof t.direction === 'string' && DIR[t.direction.toLowerCase()]) { t.direction = DIR[t.direction.toLowerCase()]; completed = true; } // the schema words are rising | falling | steady | mixed
    if (t.status === 'not_available') { t.direction ??= null; if (!t.basis) t.basis = NO_TRAJ[crit] || `no trajectory in the ${STAGE_FILE[crit]} stage output`; }
    else {
      // a stage may state only the direction and a change figure: complete delta, unit and the trajectory source from the criterion defaults
      if (t.delta === undefined) { const k = Object.keys(t).find((x) => /^change_pct/.test(x) && isNum(t[x])); if (k) { t.delta = t[k]; t.unit ??= '%'; completed = true; } }
      for (const [k, v] of [['source', spec.source], ['sourceUrl', spec.sourceUrl], ['sourceId', spec.sourceId], ['vintage', spec.trajVintage || spec.vintage]]) if (t[k] === undefined) { t[k] = v; completed = true; }
      t.direction ??= null;
    }
    return { trajectory: t, derived: false, completed };
  }
  if (crit === 'water_stress' && j.baseline?.bws && isNum(j.baseline.bws.raw) && j.bau2050 && isNum(j.bau2050.raw)) {
    const delta = Number((j.bau2050.raw - j.baseline.bws.raw).toFixed(3));
    return {
      trajectory: {
        status: 'projected', direction: Math.abs(delta) < 0.02 ? 'steady' : delta > 0 ? 'rising' : 'falling', delta, unit: 'ratio',
        basis: 'Aqueduct 4.0 2050 business-as-usual ratio minus the Aqueduct baseline ratio (bws_raw) over the same footprint basins',
        source: spec.source, sourceUrl: j.source?.url || spec.sourceUrl, sourceId: spec.sourceId, vintage: 'baseline 1979-2019 to 2050 business-as-usual',
      },
      derived: true,
    };
  }
  if (crit === 'conflict' && j.periods?.['2013_2018'] && j.periods?.['2019_2024']) {
    const a = j.periods['2013_2018'].events;
    const b = j.periods['2019_2024'].events;
    if (isNum(a) && isNum(b)) {
      return {
        trajectory: {
          status: 'measured', direction: a === b ? 'steady' : b > a ? 'rising' : 'falling', delta: b - a, unit: 'events',
          basis: `events within 200 km of the marker, 2019-2024 (${b}) versus 2013-2018 (${a})`,
          source: spec.source, sourceUrl: spec.sourceUrl, sourceId: spec.sourceId, vintage: '2013–2018 vs 2019–2024',
        },
        derived: true,
      };
    }
  }
  return { trajectory: null, derived: false };
}

const NO_TRAJ = {
  soil_carbon: 'no open regional trend dataset: SoilGrids 2.0 is a single 2020 release',
  solar_pv: 'the resource is a long-term average and no regional projection is in the open record used here',
  regen_network: 'single baseline wave (frozen 2026-07-24); wave 2 is planned',
};

// Classify the method a re-verification correction used, from its own reason text. Unclassifiable = hand-estimate, flagged.
export function methodFromReason(reason) {
  const r = String(reason || '');
  if (/3\s?x\s?3|point/i.test(r)) return { method: 'point-3x3', sure: true };
  if (/zonal|footprint|area-weighted|window|NUTS|county|state of|statewide|polygon|basin/i.test(r)) return { method: 'footprint-zonal', sure: true };
  if (/census|statistic|official|INE\b|Eurostat|StatCan|Statistics|INEGI|\bIGE\b|ISTAT|ASTAT|Destatis/i.test(r)) return { method: 'official-statistic', sure: true };
  if (/count|within \d+ ?km|directory|Atlas|sites/i.test(r)) return { method: 'named-count', sure: true };
  return { method: 'hand-estimate', sure: false };
}

export function exceeds(crit, ref, other) {
  if (!isNum(ref) || !isNum(other)) return false;
  return Math.abs(ref - other) > SPEC[crit].tol(ref) + 1e-9;
}

async function loadRegionsModule(ROOT) {
  const f = path.join(ROOT, 'data/regions.js');
  if (!exists(f)) return null;
  const dir = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'lsf-bc-'));
  try {
    const t = path.join(dir, 'regions.mjs');
    fs.writeFileSync(t, fs.readFileSync(f, 'utf8'));
    return await import(`${pathToFileURL(t).href}?t=${Date.now()}`);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
async function loadRegistryIds(ROOT) {
  const f = path.join(ROOT, 'data/sources.js');
  if (!exists(f)) return null;
  try { const m = await import(`${pathToFileURL(f).href}?t=${Date.now()}`); return new Set(Object.keys(m.sources || {})); } catch { return null; }
}

function contextFrom(stages) {
  const ctx = {};
  const k = stages.koppen?.json;
  if (k && k.status === 'ok' && k.periods) {
    const NAMES = { '1961_1990': '1961–1990', '1991_2020': '1991–2020', '2041_2070_ssp245': '2041–2070 SSP2-4.5', '2071_2099_ssp245': '2071–2099 SSP2-4.5' };
    const periods = {};
    for (const [key, v] of Object.entries(k.periods)) periods[NAMES[key] || key] = { dominant: v.dominant?.code ?? null, shares: v.shares || {} };
    ctx.koppen = { source: { id: k.source?.id || 'beck-koppen-2023', url: k.source?.url, licence: k.source?.licence }, footprint: k.footprint?.id || null, periods, note: 'Shares are the fraction of the footprint land area in each class at 1 km.' };
  }
  const a = stages.aqueduct?.json;
  if (a && a.status === 'ok' && a.baseline) {
    ctx.water = {
      source: { id: a.source?.id || 'aqueduct-40', url: a.source?.url, licence: a.source?.licence }, footprint: a.footprint?.id || null,
      baselineStress: { ratio: a.baseline.bws?.raw ?? null, class: a.baseline.bws?.label ?? null },
      stress2050Bau: { ratio: a.bau2050?.raw ?? null, class: a.bau2050?.label ?? null, scenario: a.scenario?.code ?? null },
      droughtRisk: a.baseline.drr?.label ?? null, interannualVariability: a.baseline.iav?.label ?? null, seasonalVariability: a.baseline.sev?.label ?? null,
      groundwaterTrend: a.baseline.gtd?.label ?? null, riverineFloodRisk: a.baseline.rfr?.label ?? null,
      scenarioNote: a.scenarioNote || null,
      note: "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
    };
  }
  return ctx;
}

// One region. `inputs` = { OUT, current (cell map or null), patches (numeric reverify patches for this region), pkg, registry, today, accept:Set }
export function buildRegion(id, inputs) {
  const { OUT, current, patches, pkg, registry, today, accept } = inputs;
  const stages = {};
  for (const s of new Set(Object.values(STAGE_FILE))) stages[s] = readStage(OUT, id, s);
  stages.koppen = readStage(OUT, id, 'koppen');
  const cells = {};
  const provenance = {};
  const flags = {};
  const rows = [];
  const flag = (c, f) => (flags[c] ||= []).push(f);
  for (const crit of CRITERIA) {
    const spec = SPEC[crit];
    const stage = stages[STAGE_FILE[crit]];
    const cand = pipelineCandidate(crit, stage, (inputs.stageMap && inputs.stageMap[crit]) || []);
    const cur = current?.[crit] || null;
    const rv = patches.find((p) => p.parts[2] === crit);
    const rvValue = rv && Number.isFinite(Number(rv.new)) ? Number(rv.new) : null;
    const pk = pkg?.cells?.[crit] && isNum(pkg.cells[crit].value) ? pkg.cells[crit] : null;
    const pipelineValue = cand.ok ? round(crit, cand.value) : null;
    const row = { region: id, criterion: crit, pipeline: pipelineValue, current: cur && isNum(cur.value) ? cur.value : null, reverify: rvValue, package: pk ? pk.value : null, chosen: null, source: null, exceeds: [] };
    if (pipelineValue !== null) {
      for (const [k, v] of [['current', row.current], ['reverify', rvValue], ['package', row.package]]) if (v !== null && exceeds(crit, pipelineValue, v)) row.exceeds.push(k);
    } else if (row.current !== null && rvValue !== null && exceeds(crit, rvValue, row.current)) row.exceeds.push('current-vs-reverify');
    // sourceId: the stage's id when the registry knows it, else the canonical one
    const sid = (stage.json && typeof stage.json.sourceId === 'string' && registry && registry.has(stage.json.sourceId)) ? stage.json.sourceId : spec.sourceId;

    if (cand.ok) {
      const j = cand.meta;
      const { trajectory, derived, completed } = trajectoryFor(crit, j, spec);
      if (completed) flag(crit, 'trajectory-completed: source and unit filled from the criterion defaults');
      if (cand.fallbackNote) flag(crit, cand.fallbackNote);
      const keep = cur && isNum(cur.value) && !exceeds(crit, pipelineValue, cur.value) ? cur.label : null;
      const cell = {
        value: pipelineValue, unit: spec.unit, vintage: j.vintage || spec.vintage, label: keep ?? null,
        source: typeof j.source === 'string' ? j.source : spec.source, sourceUrl: j.sourceUrl || spec.sourceUrl, sourceId: sid,
        method: cand.method, footprint: cand.footprint, retrieved: cand.retrieved || today,
      };
      if (j.scenario && typeof j.scenario === 'string') cell.scenario = j.scenario; else if (spec.scenario) cell.scenario = spec.scenario;
      if (crit === 'water_stress' && j.scenario && j.scenario.code) cell.scenario = `business-as-usual (${j.scenario.code})`;
      if (trajectory) cell.trajectory = trajectory;
      else { cell.trajectory = { status: 'not_available', direction: null, basis: NO_TRAJ[crit] || `no trajectory in the ${STAGE_FILE[crit]} stage output` }; if (!NO_TRAJ[crit]) flag(crit, 'trajectory-missing'); }
      cell.audit = `pipeline ${cand.method} ${STAGE_FILE[crit]}.${cand.field}: ${row.current ?? 'none'} -> ${pipelineValue}${rvValue !== null ? `; reverify ${rvValue}` : ''}${pk ? `; package ${pk.value}` : ''}`;
      if (keep === null) flag(crit, 'label-needed');
      if (derived) provenance[crit] = { chosen: 'pipeline', field: cand.field, trajectory: 'derived from stage values' };
      else provenance[crit] = { chosen: 'pipeline', field: cand.field };
      if (crit === 'conflict' && j.periods?.['2019_2024'] && j.periods['2019_2024'].layerEquivalentEvents !== undefined && j.periods['2019_2024'].layerEquivalentEvents !== j.periods['2019_2024'].events) flag(crit, `layer-mismatch: all events ${j.periods['2019_2024'].events}, deployed-layer basis ${j.periods['2019_2024'].layerEquivalentEvents}; nearest event ${j.periods['2019_2024'].nearestEventKm} km`);
      if (crit === 'water_stress' && j.coverage?.future && j.coverage.future.fraction < 0.95) flag(crit, `coverage ${j.coverage.future.fraction} of the footprint (land only)`);
      cells[crit] = cell;
      row.chosen = pipelineValue; row.source = 'pipeline';
    } else if (rvValue !== null) {
      const mm = methodFromReason(rv.reason);
      const base = cur ? { ...cur } : {};
      const cell = {
        value: rvValue, unit: spec.unit, vintage: base.vintage || spec.vintage, label: base.label ?? null,
        source: base.source || spec.source, sourceUrl: base.sourceUrl || spec.sourceUrl, sourceId: sid, method: mm.method,
        footprint: spec.footprint || (mm.method === 'point-3x3' ? 'marker-3x3' : id), retrieved: today,
        trajectory: base.trajectory || { status: 'not_available', direction: null, basis: `no trajectory computed: the ${STAGE_FILE[crit]} pipeline stage did not succeed` },
        audit: `2026-10 reverify ${rv.ref}: ${rv.old} -> ${rv.new} (${String(rv.reason).replace(/\s+/g, ' ').slice(0, 160)}); pipeline: ${cand.why}`,
      };
      if (spec.scenario) cell.scenario = spec.scenario;
      if (base.label) flag(crit, 'label-follows-old-value: re-express the label for the corrected value');
      else flag(crit, 'label-needed');
      if (!mm.sure) flag(crit, 'method-unclassified: reverify method text did not name zonal, 3x3, official statistic or count');
      flag(crit, 'footprint-assumed');
      cells[crit] = cell;
      provenance[crit] = { chosen: 'reverify', ref: rv.ref, evidence_url: rv.evidence_url, confidence: rv.confidence, pipelineWhy: cand.why };
      row.chosen = rvValue; row.source = 'reverify';
    } else if (pk) {
      const cell = { ...pk, sourceId: pk.sourceId || sid, method: pk.method || spec.method, footprint: pk.footprint || spec.footprint || id, retrieved: pk.retrieved || today };
      if (!cell.trajectory) cell.trajectory = { status: 'not_available', direction: null, basis: NO_TRAJ[crit] || 'package value; no trajectory in the package' };
      cell.audit = `package ${id} verified value ${pk.value}; pipeline: ${cand.why}`;
      flag(crit, 'method-assumed-from-criterion');
      cells[crit] = cell;
      provenance[crit] = { chosen: 'package', pipelineWhy: cand.why };
      row.chosen = pk.value; row.source = 'package';
    } else if (accept.has(`${id}:${crit}`) && cur && isNum(cur.value)) {
      cells[crit] = { ...cur, audit: `${cur.audit ? `${cur.audit}; ` : ''}kept: named by the integration WP as verified by the re-verification (accept-current)` };
      provenance[crit] = { chosen: 'current-verified', pipelineWhy: cand.why };
      flag(crit, 'accepted-current: provenance rests on the re-verification note, not a reproduced run');
      row.chosen = cur.value; row.source = 'current-verified';
    } else {
      cells[crit] = { value: null, unit: spec.unit, nullReason: `not reproduced: ${cand.why}; no HIGH/MEDIUM evidence-backed re-verification value and no verified package value; the earlier midpoint is not shipped (P-CELL)` };
      provenance[crit] = { chosen: 'null', pipelineWhy: cand.why };
      row.source = 'null';
    }
    rows.push(row);
  }
  const fpStage = stages.climate?.json?.footprint || stages.aqueduct?.json?.footprint || stages.soil?.json?.footprint || null;
  return {
    regionId: id, cells, context: contextFrom(stages), footprint: fpStage && typeof fpStage === 'object' ? { id: fpStage.id, kind: fpStage.kind, areaKm2: fpStage.areaKm2 } : null,
    provenance, flags, nulls: CRITERIA.filter((c) => cells[c].value === null), rows,
  };
}

export function renderCrosscheck(rows) {
  const lines = ['# Cross-check: pipeline vs current vs re-verification vs package', '', 'Tolerances (evidence track, section 4): climate 0.5 C; water stress max(0.05, 25 percent); soil 15 percent; forest 1.0 %/decade; solar 5 percent; conflict exact; population 15 percent; regen exact.', ''];
  const over = rows.filter((r) => r.exceeds.length);
  const by = {};
  for (const r of rows) by[r.source] = (by[r.source] || 0) + 1;
  lines.push(`${rows.length} (region, criterion) rows; chosen from: ${Object.entries(by).sort().map(([k, v]) => `${k} ${v}`).join(', ')}; ${over.length} row(s) differ beyond tolerance.`, '');
  lines.push('| region | criterion | pipeline | current | reverify | package | chosen | differs beyond tolerance |', '|---|---|---|---|---|---|---|---|');
  for (const r of over) lines.push(`| ${r.region} | ${r.criterion} | ${r.pipeline ?? ''} | ${r.current ?? ''} | ${r.reverify ?? ''} | ${r.package ?? ''} | ${r.chosen ?? 'null'} (${r.source}) | ${r.exceeds.join(', ')} |`);
  return `${lines.join('\n')}\n`;
}

export async function run(argv) {
  const args = parseArgs(argv, { boolFlags: ['dry-run', 'no-crosscheck'] });
  const roots = resolveRoots(args);
  const OUT = roots.OUT;
  const today = args.retrieved && args.retrieved !== true ? args.retrieved : new Date().toISOString().slice(0, 10);
  const stageMap = args.stageMap && args.stageMap !== true ? readJson(path.resolve(args.stageMap)) : null;
  const accept = new Set(String(args.acceptCurrent && args.acceptCurrent !== true ? args.acceptCurrent : '').split(',').filter(Boolean));
  const mod = await loadRegionsModule(roots.ROOT);
  const registry = await loadRegistryIds(roots.ROOT);
  const pkgDir = path.resolve(args.packages && args.packages !== true ? args.packages : path.join(roots.UPG, 'regions'));
  const pkgs = new Map((await loadAllPackages(pkgDir, { ROOT: roots.ROOT })).filter((p) => !p.skipped && p.ok).map((p) => [p.id, p]));
  const patchesFile = path.join(OUT, 'patches.json');
  const patches = exists(patchesFile) ? readJson(patchesFile).filter((p) => p.numeric && (p.confidence === 'high' || p.confidence === 'medium')) : [];
  let ids = [...new Set([...(mod ? mod.regions.map((r) => r.id) : []), ...pkgs.keys()])];
  const dropped = path.join(roots.UPG, 'verify/dropped-regions.json');
  if (exists(dropped)) { try { const d = readJson(dropped); const list = (Array.isArray(d) ? d : (d.dropped || d.regions || d.ids || [])).map((x) => (typeof x === 'string' ? x : x.id || x.regionId)); ids = ids.filter((i) => !list.includes(i)); } catch { /* unreadable list: keep all */ } }
  if (args.regions && args.regions !== true) { const want = String(args.regions).split(','); ids = ids.filter((i) => want.includes(i)); }

  const allRows = [];
  const summary = [];
  for (const id of ids.sort()) {
    const r = buildRegion(id, { OUT, current: mod ? mod.values[id] || null : null, patches: patches.filter((p) => p.parts[1] === id), pkg: pkgs.get(id) || null, registry, today, accept, stageMap });
    allRows.push(...r.rows);
    const file = path.join(OUT, id, 'cells.json');
    const { rows, ...body } = r;
    let generatedAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    if (exists(file)) { try { const prev = readJson(file); const { generatedAt: pg, ...rest } = prev; if (stringify(rest) === stringify(body)) generatedAt = pg; } catch { /* rewrite */ } }
    const full = { regionId: body.regionId, generatedAt, ...Object.fromEntries(Object.entries(body).filter(([k]) => k !== 'regionId')) };
    const w = writeIfChanged(file, stringify(full), { dryRun: !!args.dryRun });
    summary.push({ id, w, nulls: r.nulls.length, sources: CRITERIA.map((c) => ({ pipeline: 'p', reverify: 'r', package: 'k', 'current-verified': 'c', null: 'n' })[r.provenance[c].chosen]).join('') });
  }
  for (const s of summary) printLine(`${s.id.padEnd(26)} ${s.sources}  nulls ${s.nulls}${s.nulls > 3 ? '  (above the cap of 3: report a NULL-DECISION line)' : ''}  cells.json ${s.w}`);
  printLine('  source letters per criterion in order: climate water_stress soil_carbon forest_change solar_pv conflict population regen_network; p pipeline, r reverify, k package, c current-verified, n null');
  if (!args.noCrosscheck) {
    const wj = writeIfChanged(path.join(OUT, 'crosscheck.json'), stringify({ tolerances: { climate: 'abs 0.5 C', water_stress: 'max(0.05, 25 percent)', soil_carbon: '15 percent', forest_change: 'abs 1.0 %/decade', solar_pv: '5 percent', conflict: 'exact', population: '15 percent', regen_network: 'exact' }, rows: allRows }), { dryRun: !!args.dryRun });
    const wm = writeIfChanged(path.join(OUT, 'crosscheck.md'), renderCrosscheck(allRows), { dryRun: !!args.dryRun });
    printLine(`crosscheck.json: ${wj}; crosscheck.md: ${wm}`);
  }
  return 0;
}

export { loadRegionPackage };
if (isMain(import.meta.url)) run(process.argv.slice(2)).then((c) => process.exit(c), (e) => { process.stderr.write(`build_cells: ${e.stack || e}\n`); process.exit(1); });
