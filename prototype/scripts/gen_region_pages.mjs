// Build-time generator for per-region indexable pages (Phase C).
// Reads the same data the app uses and emits one static, crawlable HTML page per
// region under region/<id>.html, plus sitemap.xml. No runtime — pure static.
//
// Re-run after changing data/regions.js or data/region-depth.js:
//   node scripts/gen_region_pages.mjs
//
// Each page: full meta (canonical + OG via /api/og?region=<id>), the region
// blurb, "what living here asks of you", all eight criterion values WITH source +
// vintage + license (native units, never scored), a link into the comparison tool
// pre-pinned to this region (/?pin=<id>), and internal links to every other
// region for crawl discovery.

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { regions, values, criteria } from '../data/regions.js';
import { regionDepth } from '../data/region-depth.js';
import { landStanding } from '../data/land-standing.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'region');
const SITE = 'https://land.regencommunity.tools';

// V1 per-jurisdiction layers (the r4 round's data). Each is a JSON array keyed
// by region_id. Loaded once into a single lookup so each page just looks up
// `v1[layer][region.id]`. Missing layer files are silently skipped (the page
// just won't render that section), so the generator stays robust to data churn.
const V1_LAYERS = {
  legal_ownership:        'data/processed/legal-ownership.json',
  land_cost:              'data/processed/land-cost.json',
  hospital_proximity:     'data/processed/hospital-proximity.geojson',  // GeoJSON: features[].properties
  demographic_trajectory: 'data/processed/demographic-trajectory.json',
  soil_contamination:     'data/processed/soil-contamination.json',
  water_source_control:   'data/processed/water-source-control.json',
  climate_buffering:      'data/processed/climate-buffering.json',
};

function loadV1Layers() {
  const out = {};
  for (const [layer, rel] of Object.entries(V1_LAYERS)) {
    const path = join(ROOT, rel);
    if (!existsSync(path)) { out[layer] = {}; continue; }
    const raw = JSON.parse(readFileSync(path, 'utf8'));
    const records = Array.isArray(raw)
      ? raw
      : (raw.features || []).map((f) => f.properties || {});
    const byId = {};
    for (const rec of records) {
      if (rec && rec.region_id) byId[rec.region_id] = rec;
    }
    out[layer] = byId;
  }
  return out;
}
const v1 = loadV1Layers();

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fmtVal = (v) =>
  typeof v !== 'number' ? String(v) : Number.isInteger(v) ? v.toLocaleString('en-US') : v.toFixed(Math.abs(v) < 10 ? 1 : 0);

const truncate = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');

function criteriaRows(r) {
  return criteria
    .map((c) => {
      const v = values[r.id] && values[r.id][c.id];
      if (!v) return '';
      const src = v.sourceUrl
        ? `<a href="${esc(v.sourceUrl)}" target="_blank" rel="noopener">${esc(v.source)}</a>`
        : esc(v.source || '');
      return `
        <tr>
          <th scope="row">${esc(c.name)}<span class="metric">${esc(c.metric)}</span></th>
          <td class="val mono">${esc(fmtVal(v.value))} ${esc(v.unit)}</td>
          <td class="lab">${esc(v.label || '')}</td>
          <td class="src">${src}${v.vintage ? ` · ${esc(v.vintage)}` : ''}${c.license ? ` · ${esc(c.license)}` : ''}</td>
        </tr>`;
    })
    .join('');
}

function asksBlock(r) {
  const depth = regionDepth[r.id];
  if (!depth) return '';
  if (depth.caseStudy) {
    return `
      <section class="asks">
        <div class="wrap">
          <h2>What living here asks of you</h2>
          <p>This region has a full case study in the deeper material.</p>
          <p><a href="/deeper.html${esc(depth.caseStudy)}">Read the full case study &rarr;</a></p>
        </div>
      </section>`;
  }
  if (depth.asks) {
    const src = depth.source
      ? `<p class="asks-src">Source: ${depth.sourceUrl ? `<a href="${esc(depth.sourceUrl)}" target="_blank" rel="noopener">${esc(depth.source)}</a>` : esc(depth.source)}</p>`
      : '';
    return `
      <section class="asks">
        <div class="wrap">
          <h2>What living here asks of you</h2>
          <p>${esc(depth.asks)}</p>
          ${src}
        </div>
      </section>`;
  }
  return '';
}

// "Land standing" — qualitative reciprocity dimension (whose land, tenure, how to
// enter in good faith, what it asks). Never scored. Nothing renders without an entry.
function landStandingBlock(r) {
  const s = landStanding[r.id];
  if (!s) return '';
  const row = (label, val) => (val ? `<div><dt>${esc(label)}</dt><dd>${esc(val)}</dd></div>` : '');
  const src = s.source
    ? `<p class="ls-src">Source: ${s.sourceUrl ? `<a href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${esc(s.source)}</a>` : esc(s.source)}</p>`
    : '';
  return `
      <section class="land-standing">
        <div class="wrap">
          <h2>Land standing</h2>
          <dl class="ls-dl">
            ${row('Whose land', s.territory)}
            ${row('Tenure', s.tenure)}
            ${row('Arriving in good faith', s.entry)}
            ${row('What it asks', s.obligation)}
          </dl>
          ${src}
        </div>
      </section>`;
}

// Small badge for `data_confidence`/`regulatory_direction`/etc. enum-ish fields.
function badge(text, kind = 'neutral') {
  if (!text) return '';
  return `<span class="badge badge-${esc(kind)}">${esc(String(text))}</span>`;
}

function sourceLine(rec) {
  if (!rec || !rec.source) return '';
  const src = rec.source_url
    ? `<a href="${esc(rec.source_url)}" target="_blank" rel="noopener">${esc(rec.source)}</a>`
    : esc(rec.source);
  const conf = rec.data_confidence ? ` · confidence: <strong>${esc(rec.data_confidence)}</strong>` : '';
  return `<p class="v1-src">Source: ${src}${conf}</p>`;
}

// Section 1 — the "first gate" pair: legal_ownership + land_cost.
// These are the r4 reality-check's headline finding: legal feasibility and
// affordability decide whether a project happens before any other criterion matters.
function firstGateBlock(r) {
  const legal = v1.legal_ownership[r.id];
  const cost = v1.land_cost[r.id];
  if (!legal && !cost) return '';

  const legalRow = !legal ? '' : `
    <div class="v1-card">
      <div class="v1-card-h">Legal &amp; ownership</div>
      <dl class="v1-kv">
        ${legal.foreign_ownership ? `<div><dt>Foreign ownership</dt><dd>${badge(legal.foreign_ownership.allowed, legal.foreign_ownership.allowed)} <span class="v1-note">${esc(legal.foreign_ownership.notes || '')}</span></dd></div>` : ''}
        ${legal.collective_ownership_path ? `<div><dt>Collective ownership path</dt><dd>${esc(legal.collective_ownership_path)}</dd></div>` : ''}
        ${legal.multi_household_residence_as_of_right ? `<div><dt>Multi-household residence as-of-right</dt><dd>${badge(legal.multi_household_residence_as_of_right, legal.multi_household_residence_as_of_right)}</dd></div>` : ''}
        ${legal.planning_gate_for_living ? `<div><dt>Planning gate for living</dt><dd>${esc(legal.planning_gate_for_living)}</dd></div>` : ''}
        ${legal.preemption_or_first_claim_holders && legal.preemption_or_first_claim_holders.length ? `<div><dt>Pre-emption / first-claim holders</dt><dd>${legal.preemption_or_first_claim_holders.map(esc).join('; ')}</dd></div>` : ''}
        ${legal.key_legal_restriction ? `<div><dt>Key restriction</dt><dd><em>${esc(legal.key_legal_restriction)}</em></dd></div>` : ''}
        ${legal.regulatory_direction ? `<div><dt>Regulatory direction</dt><dd>${badge(legal.regulatory_direction, legal.regulatory_direction)} <span class="v1-note">${esc(legal.regulatory_notes || '')}</span></dd></div>` : ''}
      </dl>
      ${sourceLine(legal)}
    </div>`;

  const costRow = !cost ? '' : `
    <div class="v1-card">
      <div class="v1-card-h">Land cost</div>
      <dl class="v1-kv">
        ${cost.price_per_ha_low != null && cost.price_per_ha_high != null ? `<div><dt>Price per ha</dt><dd class="mono"><strong>${esc(fmtVal(cost.price_per_ha_low))}–${esc(fmtVal(cost.price_per_ha_high))} ${esc(cost.price_currency || '')}</strong>${cost.price_vintage ? ` <span class="v1-note">(${esc(cost.price_vintage)})</span>` : ''}</dd></div>` : ''}
        ${cost.affordability_band ? `<div><dt>Affordability band</dt><dd>${badge(cost.affordability_band, cost.affordability_band)}</dd></div>` : ''}
        ${cost.appreciation_trajectory ? `<div><dt>Appreciation trajectory</dt><dd>${badge(cost.appreciation_trajectory, cost.appreciation_trajectory)} <span class="v1-note">${esc(cost.appreciation_notes || '')}</span></dd></div>` : ''}
        ${cost.price_notes ? `<div><dt>Detail</dt><dd>${esc(cost.price_notes)}</dd></div>` : ''}
      </dl>
      ${sourceLine(cost)}
    </div>`;

  return `
    <section class="v1-section">
      <div class="wrap">
        <h2>The first gate, legal and cost</h2>
        <p class="v1-lead">Across the slate the data shows these two as the decisive constraints, more often than soil, climate or water. They sit before everything else.</p>
        <div class="v1-grid">${legalRow}${costRow}</div>
      </div>
    </section>`;
}

// Section 2 — practical fit: hospital proximity + demographic trajectory.
function practicalFitBlock(r) {
  const hosp = v1.hospital_proximity[r.id];
  const demo = v1.demographic_trajectory[r.id];
  if (!hosp && !demo) return '';

  const hospRow = !hosp ? '' : `
    <div class="v1-card">
      <div class="v1-card-h">Hospital access</div>
      <dl class="v1-kv">
        <div><dt>Nearest hospital</dt><dd class="mono"><strong>${esc(fmtVal(hosp.nearest_hospital_km))} km</strong> <span class="v1-note">geodesic, see caveat</span></dd></div>
        <div><dt>Hospitals within 50 km</dt><dd class="mono">${hosp.hospitals_within_50km}</dd></div>
        <div><dt>Hospitals within 100 km</dt><dd class="mono">${hosp.hospitals_within_100km}</dd></div>
        <div><dt>60-minute proxy</dt><dd>${badge(hosp.red_line_60min_proxy_passes ? 'passes' : 'fails', hosp.red_line_60min_proxy_passes ? 'yes' : 'no')}</dd></div>
      </dl>
      <p class="v1-src"><em>${esc(hosp.proxy_caveat || '')}</em></p>
    </div>`;

  const demoRow = !demo ? '' : `
    <div class="v1-card">
      <div class="v1-card-h">Demographics</div>
      <dl class="v1-kv">
        ${demo.population_trend ? `<div><dt>Population trend</dt><dd>${badge(demo.population_trend, demo.population_trend)} <span class="v1-note">${esc(demo.population_trend_notes || '')}</span></dd></div>` : ''}
        ${demo.median_age_band ? `<div><dt>Median age band</dt><dd>${badge(demo.median_age_band, demo.median_age_band)} <span class="v1-note">${esc(demo.median_age_notes || '')}</span></dd></div>` : ''}
        ${demo.migration_dynamic ? `<div><dt>Migration dynamic</dt><dd>${badge(demo.migration_dynamic, demo.migration_dynamic)} <span class="v1-note">${esc(demo.migration_notes || '')}</span></dd></div>` : ''}
        ${demo.rural_density_signal ? `<div><dt>Rural density</dt><dd>${badge(demo.rural_density_signal, demo.rural_density_signal)} <span class="v1-note">${esc(demo.rural_density_notes || '')}</span></dd></div>` : ''}
      </dl>
      ${sourceLine(demo)}
    </div>`;

  return `
    <section class="v1-section">
      <div class="wrap">
        <h2>Practical fit</h2>
        <div class="v1-grid">${hospRow}${demoRow}</div>
      </div>
    </section>`;
}

// Section 3 — field reality: water source control + soil contamination.
// Honest about sparsity where the dossiers didn't speak.
function fieldRealityBlock(r) {
  const water = v1.water_source_control[r.id];
  const soil = v1.soil_contamination[r.id];
  if (!water && !soil) return '';

  const waterRow = !water ? '' : `
    <div class="v1-card">
      <div class="v1-card-h">Water source control</div>
      <dl class="v1-kv">
        ${water.water_rights_regime ? `<div><dt>Rights regime</dt><dd>${esc(water.water_rights_regime)}</dd></div>` : ''}
        ${water.water_rights_holder_type ? `<div><dt>Holder type</dt><dd>${badge(water.water_rights_holder_type, water.water_rights_holder_type)}</dd></div>` : ''}
        ${water.single_entity_control_risk ? `<div><dt>Single-entity control risk</dt><dd>${badge(water.single_entity_control_risk, water.single_entity_control_risk)} <span class="v1-note">${esc(water.control_risk_notes || '')}</span></dd></div>` : ''}
        ${water.drought_priority_mechanism ? `<div><dt>Drought-priority mechanism</dt><dd>${esc(water.drought_priority_mechanism)}</dd></div>` : ''}
      </dl>
      ${sourceLine(water)}
    </div>`;

  const soilRow = !soil ? '' : `
    <div class="v1-card">
      <div class="v1-card-h">Soil contamination</div>
      <dl class="v1-kv">
        ${soil.known_contamination_signal ? `<div><dt>Known signal</dt><dd>${badge(soil.known_contamination_signal, soil.known_contamination_signal)} <span class="v1-note">${esc(soil.known_contamination_notes || '')}</span></dd></div>` : ''}
        ${soil.due_diligence_burden ? `<div><dt>Due-diligence burden</dt><dd>${badge(soil.due_diligence_burden, soil.due_diligence_burden)}</dd></div>` : ''}
        ${soil.contamination_regulatory_regime && soil.contamination_regulatory_regime !== 'unknown' ? `<div><dt>Regulatory regime</dt><dd>${esc(soil.contamination_regulatory_regime)}</dd></div>` : ''}
        ${soil.gaps ? `<div><dt>Known data gaps</dt><dd><em>${esc(soil.gaps)}</em></dd></div>` : ''}
      </dl>
      ${sourceLine(soil)}
    </div>`;

  return `
    <section class="v1-section">
      <div class="wrap">
        <h2>Field reality, water and soil</h2>
        <div class="v1-grid">${waterRow}${soilRow}</div>
      </div>
    </section>`;
}

// Section 4 — climate buffering (state + trajectory).
// Surfaces the structural microclimate features and their dynamic erosion under
// warming, paired as state-and-trajectory (the Spec's two-axis framing for every
// criterion, applied here explicitly).
function climateBufferingBlock(r) {
  const cb = v1.climate_buffering[r.id];
  if (!cb) return '';

  const featureChips = (cb.primary_buffering_features || [])
    .map((f) => `<span class="badge">${esc(f.replace(/_/g, ' '))}</span>`)
    .join(' ');

  const stateCard = `
    <div class="v1-card">
      <div class="v1-card-h">Buffering features (state)</div>
      <dl class="v1-kv">
        ${featureChips ? `<div><dt>Primary features</dt><dd>${featureChips}</dd></div>` : ''}
        ${cb.altitude_range_m ? `<div><dt>Altitude range</dt><dd class="mono">${esc(cb.altitude_range_m)}</dd></div>` : ''}
        ${cb.buffering_strength ? `<div><dt>Buffering strength</dt><dd>${badge(cb.buffering_strength)}</dd></div>` : ''}
        ${cb.buffering_notes ? `<div><dt>Detail</dt><dd>${esc(cb.buffering_notes)}</dd></div>` : ''}
      </dl>
    </div>`;

  const trajCard = `
    <div class="v1-card">
      <div class="v1-card-h">Trajectory under warming</div>
      <dl class="v1-kv">
        ${cb.trajectory_under_warming ? `<div><dt>Direction</dt><dd>${badge(cb.trajectory_under_warming, cb.trajectory_under_warming)} <span class="v1-note">${esc(cb.trajectory_notes || '')}</span></dd></div>` : ''}
        ${cb.primary_vulnerability_signal ? `<div><dt>Primary vulnerability</dt><dd><em>${esc(cb.primary_vulnerability_signal)}</em></dd></div>` : ''}
      </dl>
      ${sourceLine(cb)}
    </div>`;

  return `
    <section class="v1-section">
      <div class="wrap">
        <h2>Climate buffering</h2>
        <p class="v1-lead">Structural microclimate features that hold the place steady, paired with how fast warming is eroding them. State plus trajectory, per the framework.</p>
        <div class="v1-grid">${stateCard}${trajCard}</div>
      </div>
    </section>`;
}

function otherRegionsNav(current) {
  const items = regions
    .filter((r) => r.id !== current.id)
    .map((r) => `<li><a href="/region/${r.id}.html">${esc(r.name)}<span>${esc(r.country)}</span></a></li>`)
    .join('');
  return `<ul class="region-nav">${items}</ul>`;
}

function page(r) {
  const title = `${r.name}, ${r.country} — Land Selection Framework`;
  const description = truncate(
    `${r.blurb} Eight criteria — climate, water, soil, solar, conflict, regenerative networks, forest cover, population — read with sources, for a community seeking to belong to and regenerate this place.`,
    200,
  );
  const canonical = `${SITE}/region/${r.id}.html`;
  const ogImage = `${SITE}/api/og?region=${r.id}`;

  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: r.name,
    description: r.blurb,
    address: { '@type': 'PostalAddress', addressCountry: r.country },
    url: canonical,
    isPartOf: { '@type': 'CreativeWork', name: 'Land Selection Framework', url: SITE },
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(canonical)}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(ogImage)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(ogImage)}" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<!-- Bokverk fonts via Google Fonts (Literata / Archivo / IBM Plex Mono). Self-hosting the fonts is a later optimization. -->
<link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..700&family=Archivo:wght@400..900&family=Archivo+Narrow:wght@500..700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<script type="application/ld+json">${jsonld}</script>
<style>
  :root{--paper:#FFFFFF;--paper-2:#FFFFFF;--ink:#111111;--ink-2:#333333;--ink-3:#555555;--ink-4:#6b6b6b;--rule:#111111;--rule-soft:#DDDDDD;--accent:#111111;--serif:"Literata",Georgia,serif;--sans:"Archivo",system-ui,sans-serif;--mono:"IBM Plex Mono",ui-monospace,monospace;}
  *{box-sizing:border-box;} html,body{margin:0;padding:0;background:var(--paper);color:var(--ink);font-family:Archivo,system-ui,sans-serif;font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased;}
  .mono{font-variant-numeric:tabular-nums;} a{color:inherit;}
  .wrap{max-width:880px;margin:0 auto;padding:0 28px;}
  .top{border-bottom:1px solid var(--rule);padding:18px 0;font-size:12px;letter-spacing:.04em;}
  .top a{color:var(--ink-3);text-decoration:none;} .top a:hover{color:var(--accent);}
  header.hero{padding:56px 0 32px;border-bottom:1px solid var(--rule);}
  .eyebrow{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;}
  h1{font-family:Literata,Georgia,serif;font-weight:400;font-size:clamp(40px,7vw,68px);line-height:1.02;letter-spacing:-.02em;margin:0 0 10px;}
  .country{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);margin-bottom:24px;}
  .blurb{font-family:Literata,Georgia,serif;font-size:19px;line-height:1.55;color:var(--ink-2);max-width:60ch;}
  .accent-bar{width:84px;height:4px;background:var(--accent);margin-bottom:26px;}
  section{padding:40px 0;border-bottom:1px solid var(--rule);}
  section h2{font-family:Literata,Georgia,serif;font-weight:500;font-size:24px;margin:0 0 18px;}
  .asks p{font-family:Literata,Georgia,serif;font-size:16px;color:var(--ink-2);max-width:62ch;}
  .asks-src{font-size:12px;color:var(--ink-3);} .asks-src a,.src a{color:var(--ink-2);text-decoration:underline dotted;text-underline-offset:2px;}
  .land-standing{border-left:3px solid #111111;}
  .ls-dl{margin:0;}
  .ls-dl > div{display:grid;grid-template-columns:210px 1fr;gap:16px;padding:11px 0;border-top:1px solid var(--rule);}
  .ls-dl > div:first-child{border-top:none;}
  .ls-dl dt{font-family:Literata,serif;font-weight:500;font-size:14px;color:var(--ink);letter-spacing:.01em;}
  .ls-dl dd{margin:0;font-size:14.5px;line-height:1.55;color:var(--ink-2);}
  .ls-src{font-size:12px;color:var(--ink-3);margin-top:14px;} .ls-src a{color:var(--ink-2);text-decoration:underline dotted;text-underline-offset:2px;}
  @media(max-width:600px){.ls-dl > div{grid-template-columns:1fr;gap:3px;}}
  table{width:100%;border-collapse:collapse;font-size:13.5px;}
  th[scope=row]{text-align:left;font-family:Literata,serif;font-weight:500;font-size:15px;color:var(--ink);padding:14px 14px 14px 0;vertical-align:top;width:30%;}
  th .metric{display:block;font-family:Archivo,sans-serif;font-weight:400;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-3);margin-top:3px;}
  td{padding:14px 12px;border-top:1px solid var(--rule);vertical-align:top;}
  td.val{font-weight:600;white-space:nowrap;} td.lab{color:var(--ink-2);} td.src{color:var(--ink-3);font-size:11.5px;}
  .cta{display:inline-flex;align-items:center;gap:10px;margin-top:6px;padding:14px 22px;background:var(--ink);color:var(--paper);text-decoration:none;font-family:Literata,serif;font-style:italic;font-size:16px;}
  .cta:hover{background:var(--accent);}
  .region-nav{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);}
  .region-nav a{display:block;background:var(--paper);padding:12px 14px;text-decoration:none;font-family:Literata,serif;font-size:15px;}
  .region-nav a:hover{background:var(--paper-2);} .region-nav span{display:block;font-family:Archivo,sans-serif;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin-top:2px;}
  footer{padding:40px 0 70px;} footer p{font-size:11.5px;color:var(--ink-3);max-width:70ch;line-height:1.6;}
  .region-bridge{font-family:Literata,Georgia,serif;font-style:italic;font-size:14px;color:var(--ink-3);max-width:64ch;line-height:1.6;margin:0 0 20px;padding-bottom:20px;border-bottom:1px solid var(--rule);}
  .region-bridge a{color:var(--accent);font-style:normal;text-decoration:underline;text-underline-offset:2px;}
  .region-bridge a:focus-visible{outline:3px solid var(--accent);outline-offset:2px;}
  .suite-note{font-size:11px;color:var(--ink-4);margin:0 0 14px;} .suite-note a{color:var(--ink-3);text-decoration:underline dotted;text-underline-offset:2px;}
  @media(max-width:600px){ th[scope=row]{width:auto;display:block;} td{display:block;border-top:none;padding:2px 0;} tr{display:block;border-top:1px solid var(--rule);padding:12px 0;} }

  /* V1 layer sections (the r4 round's per-jurisdiction data) */
  .v1-lead{font-family:Literata,serif;font-style:italic;font-size:15px;color:var(--ink-3);max-width:62ch;margin:0 0 22px;}
  .v1-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--rule);border:1px solid var(--rule);}
  .v1-card{background:var(--paper);padding:20px 22px 18px;}
  .v1-card-h{font-family:Archivo,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin-bottom:14px;}
  .v1-kv{margin:0;padding:0;font-size:13.5px;}
  .v1-kv > div{padding:7px 0;border-bottom:1px dotted var(--rule);display:flex;flex-direction:column;gap:3px;}
  .v1-kv > div:last-child{border-bottom:none;}
  .v1-kv dt{font-family:Archivo,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin:0;}
  .v1-kv dd{font-family:Literata,serif;font-size:14px;color:var(--ink);margin:0;line-height:1.45;}
  .v1-kv dd em{color:var(--ink-2);font-style:italic;}
  .v1-note{font-size:12px;color:var(--ink-3);font-family:Literata,serif;font-style:italic;}
  .v1-src{font-size:11.5px;color:var(--ink-3);margin:14px 0 0;font-family:Archivo,sans-serif;}
  .v1-src a{color:var(--ink-2);text-decoration:underline dotted;text-underline-offset:2px;}
  .badge{display:inline-block;font-family:Archivo,sans-serif;font-size:10.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:2px 8px;background:var(--paper-2);color:var(--ink-2);border:1px solid var(--rule);margin-right:6px;}
  /* Bokverk B&W: badges carry meaning by their TEXT, never by hue. All semantic
     variants render in one neutral ink-on-paper style (the label is the signal). */
  @media(max-width:760px){.v1-grid{grid-template-columns:1fr;}}

  /* ═══ Bokverk v2 — the press comes alive (rail · night · ambient · motion · reticle) ═══ */
  :root{--rail:216px;--ink-faint:#888888;--petrol:#0E5F5F;}
  html.night{--paper:#111111;--paper-2:#111111;--ink:#FFFFFF;--ink-2:#DDDDDD;--ink-3:#BBBBBB;--ink-4:#999999;--rule:#FFFFFF;--rule-soft:#333333;--accent:#FFFFFF;--petrol:#3FA9A0;}
  html.night img{filter:invert(1);}
  /* Petrol — the one accent, used sparingly (focus rings, current marker). */
  :focus-visible{outline-color:var(--petrol)!important;}
  #ambient{position:fixed;inset:0;pointer-events:none;z-index:0;}
  #ambient .geo{position:absolute;border:1px solid var(--ink);opacity:.05;}
  #ambient .geo.c{border-radius:50%;}
  #rail{position:fixed;top:0;left:0;bottom:0;width:var(--rail);z-index:60;border-right:1px solid var(--rule);background:var(--paper);display:flex;flex-direction:column;padding:20px 0 16px;font-family:var(--sans);}
  #rail .wordmark{font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;padding:0 18px 16px;border-bottom:1px solid var(--rule);margin-bottom:6px;}
  #rail nav{flex:1;display:flex;flex-direction:column;}
  #rail nav a{display:block;text-decoration:none;color:var(--ink);padding:13px 18px;border-bottom:1px solid var(--rule-soft);position:relative;overflow:hidden;}
  #rail nav a .num{font-family:var(--mono);font-size:11px;color:var(--ink-3);display:block;letter-spacing:.05em;}
  #rail nav a .nm{font-weight:700;font-size:13px;letter-spacing:.03em;text-transform:uppercase;display:block;margin-top:2px;}
  #rail nav a .sq{position:absolute;right:14px;top:50%;transform:translateY(-50%);width:7px;height:7px;background:var(--ink);opacity:0;transition:opacity 120ms;}
  #rail nav a::before{content:"";position:absolute;inset:0;background:var(--ink);transform:translateX(-101%);transition:transform 130ms ease-out;z-index:-1;}
  #rail nav a:hover::before,#rail nav a:focus-visible::before{transform:translateX(0);}
  #rail nav a:hover,#rail nav a:focus-visible{color:var(--paper);}
  #rail nav a:hover .num,#rail nav a:focus-visible .num{color:var(--paper);}
  #rail nav a:hover .sq{opacity:1;background:var(--paper);}
  #rail nav a.current .sq{opacity:1;background:var(--petrol);}
  #rail .railfoot{padding:12px 18px 0;border-top:1px solid var(--rule);}
  #rail .railfoot .st{font-family:var(--mono);font-size:10px;line-height:1.6;letter-spacing:.04em;color:var(--ink-3);text-transform:uppercase;}
  #masthead{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:6px 24px;padding:12px clamp(28px,4vw,72px);border-bottom:3px double var(--rule);background:var(--paper);font-family:var(--mono);font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);position:relative;z-index:2;}
  #masthead button{background:none;border:1px solid var(--ink);color:var(--ink);font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;cursor:pointer;}
  #masthead button:hover{background:var(--ink);color:var(--paper);}
  #runhead{display:none;}
  @media(min-width:1100px) and (pointer:fine){#runhead{display:block;position:fixed;right:9px;top:50%;transform:translateY(-50%) rotate(180deg);writing-mode:vertical-rl;font-family:var(--mono);font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink-faint);z-index:2;pointer-events:none;}}
  header.hero,section{position:relative;border-bottom:none;}
  header.hero::after,section::after{content:"";position:absolute;left:0;right:0;bottom:0;height:0;border-top:1px solid var(--rule);transform:scaleX(1);transform-origin:left;}
  header.hero.bk-arm::after,section.bk-arm::after{transform:scaleX(0);}
  header.hero.bk-entered::after,section.bk-entered::after{transition:transform 500ms ease-out;transform:scaleX(1);}
  #hintbar{display:none;}
  @media(min-width:900px) and (pointer:fine){#hintbar{display:flex;justify-content:space-between;position:fixed;left:var(--rail);right:0;bottom:0;z-index:60;border-top:1px solid var(--rule);background:var(--paper);padding:7px clamp(28px,4vw,72px);font-family:var(--mono);font-size:11px;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-3);}#hintbar kbd{border:1px solid var(--ink-3);padding:0 5px;font-family:var(--mono);}body{padding-bottom:34px;}}
  @media(pointer:fine){html.bk-reticle,html.bk-reticle a,html.bk-reticle button{cursor:none;}#reticle{position:fixed;z-index:9000;top:0;left:0;width:20px;height:20px;margin:-10px 0 0 -10px;pointer-events:none;}#reticle::before,#reticle::after{content:"";position:absolute;background:var(--ink);}#reticle::before{left:9px;top:0;width:1px;height:20px;}#reticle::after{top:9px;left:0;height:1px;width:20px;}#reticle i{position:absolute;left:7px;top:7px;width:6px;height:6px;border:1px solid var(--ink);}#reticle.onlink i{left:3px;top:3px;width:14px;height:14px;border-radius:50%;}}
  /* NieR: ink-block hover slide on the region navigation grid */
  .region-nav a{position:relative;overflow:hidden;z-index:0;}
  .region-nav a::before{content:"";position:absolute;inset:0;background:var(--ink);transform:translateX(-101%);transition:transform 140ms ease-out;z-index:-1;}
  .region-nav a:hover::before,.region-nav a:focus-visible::before{transform:translateX(0);}
  .region-nav a:hover,.region-nav a:focus-visible{color:var(--paper);}
  .region-nav a:hover span,.region-nav a:focus-visible span{color:var(--paper);}
  /* full-width: use the whole viewport; reading columns keep their measure */
  .wrap{max-width:none;margin:0;padding-left:clamp(28px,4vw,72px);padding-right:clamp(28px,4vw,72px);}
  @media(min-width:768px){body>.top,body>header,body>section,body>footer,body>#masthead{margin-left:var(--rail);}}
  @media(prefers-reduced-motion:reduce){header.hero::after,section::after{transform:scaleX(1)!important;transition:none!important;}#reticle{display:none;}html.bk-reticle,html.bk-reticle a,html.bk-reticle button{cursor:auto;}}
  @media(max-width:767px){#rail{position:static;width:100%;border-right:none;border-bottom:1px solid var(--rule);}#rail nav{flex-direction:row;flex-wrap:wrap;}#rail nav a{flex:1 1 40%;border-right:1px solid var(--rule-soft);}#rail .railfoot{display:none;}#hintbar,#runhead{display:none!important;}body>.top,body>header,body>section,body>footer,body>#masthead{margin-left:0;}}
  @media print{#rail,#ambient,#masthead,#hintbar,#runhead,#reticle{display:none!important;}body>.top,body>header,body>section,body>footer{margin-left:0!important;}.wrap{padding-left:0;padding-right:0;}header.hero::after,section::after{transform:scaleX(1)!important;}}

table tbody tr{position:relative}
table tbody tr:hover th[scope="row"]::before{content:"";position:absolute;inset:0;background:var(--ink);opacity:.06;pointer-events:none}
</style>
<script defer src="/_vercel/insights/script.js"></script>
</head>
<body>
  <div id="ambient" aria-hidden="true">
    <div class="geo c" style="width:52vw;height:52vw;right:-16vw;top:-18vw"></div>
    <div class="geo c" style="width:28vw;height:28vw;left:10vw;bottom:-12vw"></div>
    <div class="geo" style="width:1px;height:100vh;left:62vw;top:0"></div>
    <div class="geo" style="width:16vw;height:16vw;right:22vw;bottom:8vh"></div>
  </div>

  <aside id="rail" aria-label="Regen Community Tools — the suite">
    <div class="wordmark">Regen Community<br>Tools</div>
    <nav aria-label="The tools">
      <a href="https://compass.regencommunity.tools"><span class="num">01 · PEOPLE</span><span class="nm">Community Compass</span><span class="sq"></span></a>
      <a href="https://atlas.regencommunity.tools"><span class="num">02 · THE FIELD</span><span class="nm">The Living Atlas</span><span class="sq"></span></a>
      <a href="https://land.regencommunity.tools" class="current" aria-current="page"><span class="num">03 · THE GROUND</span><span class="nm">Land Selection</span><span class="sq"></span></a>
      <a href="https://commons.regencommunity.tools"><span class="num">00 · THE OTHER BEGINNING</span><span class="nm">Community Commons</span><span class="sq"></span></a>
    </nav>
    <div class="railfoot">
      <div class="st">8 criteria · 20 regions<br>every value sourced<br>no hidden scores</div>
    </div>
  </aside>

  <div id="masthead">
    <span id="edition">EDITION OF —</span>
    <span class="status">REGION DOSSIER · WITH SOURCES · NO ERROR</span>
    <button id="editionToggle" type="button" aria-pressed="false">NIGHT EDITION</button>
  </div>

  <div id="runhead" aria-hidden="true">03 · THE GROUND</div>

  <div class="top"><div class="wrap"><a href="/">← Land Selection Framework</a></div></div>

  <header class="hero">
    <div class="wrap">
      <div class="accent-bar"></div>
      <div class="eyebrow">A place, read closely</div>
      <h1>${esc(r.name)}</h1>
      <div class="country">${esc(r.country)}</div>
      <p class="blurb">${esc(r.blurb)}</p>
    </div>
  </header>

  ${asksBlock(r)}

  ${landStandingBlock(r)}

  ${firstGateBlock(r)}

  ${practicalFitBlock(r)}

  ${fieldRealityBlock(r)}

  ${climateBufferingBlock(r)}

  <section>
    <div class="wrap">
      <h2>The eight criteria, with sources</h2>
      <table>
        <tbody>
          ${criteriaRows(r)}
        </tbody>
      </table>
      <p style="margin-top:18px;font-size:12px;color:var(--ink-3);">Native units throughout. Values are best-available midpoints from the cited public sources. Nothing here is composite, weighted, or scored across criteria.</p>
    </div>
  </section>

  <section>
    <div class="wrap">
      <h2>See it in context</h2>
      <p style="font-family:Literata,serif;font-size:16px;color:var(--ink-2);max-width:58ch;margin-bottom:18px;">Open the comparison tool with ${esc(r.name)} already pinned to your shortlist, then set your own thresholds across all twenty regions. The framework filters; it never scores.</p>
      <a class="cta" href="/?pin=${r.id}">Explore ${esc(r.name)} in the tool &rarr;</a>
    </div>
  </section>

  <section>
    <div class="wrap">
      <h2>Other regions</h2>
      ${otherRegionsNav(r)}
    </div>
  </section>

  <footer>
    <div class="wrap">
      <p class="region-bridge">People before land. Choosing a place before you have the people you'd settle with? <a href="https://compass.regencommunity.tools">Start by finding your community &rarr;</a></p>
      <p class="suite-note">Part of <a href="https://regencommunity.tools">Regen Community Tools</a> — honest tools for forming community.</p>
      <p>Sources: WorldClim CMIP6, WRI Aqueduct 4.0, SoilGrids 2.0, Hansen Global Forest Change, Global Solar Atlas, UCDP GED, GEN/OSM, JRC GHSL. A project of The Collective. <a href="/deeper.html" style="color:var(--ink-2);">Methodology &amp; ethics →</a></p>
    </div>
  </footer>

  <div id="hintbar" aria-hidden="true">
    <span><kbd>i</kbd> INVERT EDITION · <kbd>P</kbd> PRINT SUMMARY</span>
    <span>SET IN LITERATA · ARCHIVO · PLEX MONO</span>
  </div>

  <script>
  (function () {
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fine = matchMedia('(pointer: fine)').matches;
    var root = document.documentElement;
    var months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
    var d = new Date(), ed = document.getElementById('edition');
    if (ed) ed.textContent = 'EDITION OF ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    var btn = document.getElementById('editionToggle');
    function setEdition(night) {
      root.classList.toggle('night', night);
      if (btn) { btn.textContent = night ? 'DAY EDITION' : 'NIGHT EDITION'; btn.setAttribute('aria-pressed', String(night)); }
      try { localStorage.setItem('bokverk-edition', night ? 'night' : 'day'); } catch (e) {}
    }
    try { if (localStorage.getItem('bokverk-edition') === 'night') setEdition(true); } catch (e) {}
    if (btn) btn.addEventListener('click', function () { setEdition(!root.classList.contains('night')); });
    function typingInto(el) { return el && /INPUT|TEXTAREA|SELECT/.test(el.tagName); }
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey || typingInto(document.activeElement)) return;
      if (e.key === 'i' || e.key === 'I') setEdition(!root.classList.contains('night'));
      else if (e.key === 'p' || e.key === 'P') { e.preventDefault(); window.print(); }
    });
    var rules = document.querySelectorAll('header.hero, section');
    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.remove('bk-arm'); en.target.classList.add('bk-entered'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      rules.forEach(function (r) {
        if (r.getBoundingClientRect().top < window.innerHeight) return;
        r.classList.add('bk-arm'); io.observe(r);
      });
    }
    var runhead = document.getElementById('runhead');
    if (runhead && 'IntersectionObserver' in window) {
      var secObs = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          var h = en.target.querySelector('h1, h2');
          var t = h ? h.textContent.trim().toUpperCase() : 'DOSSIER';
          if (t.length > 26) t = t.slice(0, 25) + '…';
          runhead.textContent = '03 · ' + t;
        });
      }, { threshold: 0.4 });
      document.querySelectorAll('header.hero, body > section').forEach(function (s) { secObs.observe(s); });
    }
    if (fine && !reduce) {
      root.classList.add('bk-reticle');
      var ret = document.createElement('div'); ret.id = 'reticle';
      ret.appendChild(document.createElement('i'));
      document.body.appendChild(ret);
      document.addEventListener('mousemove', function (e) {
        ret.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
        ret.classList.toggle('onlink', !!(e.target.closest && e.target.closest('a,button,summary')));
      }, { passive: true });
      document.addEventListener('mouseleave', function () { ret.style.opacity = '0'; });
      document.addEventListener('mouseenter', function () { ret.style.opacity = '1'; });
    }
  })();
  </script>
</body>
</html>`;
}

// --- generate ---
mkdirSync(OUT_DIR, { recursive: true });
let count = 0;
for (const r of regions) {
  writeFileSync(join(OUT_DIR, `${r.id}.html`), page(r), 'utf8');
  count++;
}

// sitemap.xml at the site root (covers home, deeper, and every region page)
const urls = [
  `${SITE}/`,
  `${SITE}/deeper.html`,
  ...regions.map((r) => `${SITE}/region/${r.id}.html`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

// v1-lookup.js — a small ESM module the main app imports for per-jurisdiction
// filter dropdowns. Single source of truth: the same JSONs the region-page
// generator + edge OG card use. Rebuild whenever a layer changes by re-running
// this script. Keeps every consumer in lockstep without runtime fetches.
const lookupJs =
  `// AUTO-GENERATED by scripts/gen_region_pages.mjs. Do not edit by hand.\n` +
  `// Re-run that script after any data/processed/*.json change.\n` +
  `export const v1Lookup = ${JSON.stringify(v1, null, 2)};\n`;
writeFileSync(join(ROOT, 'data', 'v1-lookup.js'), lookupJs, 'utf8');

console.log(`Generated ${count} region pages in region/ + sitemap.xml (${urls.length} urls) + data/v1-lookup.js`);
