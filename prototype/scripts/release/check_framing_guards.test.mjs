import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from './check_framing_guards.mjs';
import { tmpdir, write, regionPage } from './test-helpers.mjs';

const LS = (o) => `export const landStanding = ${JSON.stringify(o)};\n`;
const RC = (o) => `export const reciprocity = ${JSON.stringify(o)};\n`;

function site({ vermont = {}, fl = {}, nm = {}, vermontPage = 'A calm page.', flPage = 'A calm page.', nmPage = {}, llms = '- [NE Missouri](https://example.test/region/ne-missouri-se-iowa.html): seven border counties and their rural economy\n', recip = {} } = {}) {
  const d = tmpdir();
  write(d, 'data/land-standing.js', LS({
    vermont: { territory: 'Abenaki homeland, unceded', tenure: 'Fee simple.', entry: 'Act 250.', obligation: 'Ask first.', sourceUrl: 'https://example.test/contested', ...vermont },
    'finger-lakes': { territory: 'Cayuga and Seneca homelands', tenure: 'Fee simple.', entry: 'Cayuga Nation Council website.', obligation: 'Ask first and listen.', ...fl },
    'ne-missouri-se-iowa': { territory: 'Sauk and Meskwaki homelands', tenure: 'Fee simple.', entry: 'Open.', obligation: 'Do not arrive for the land alone.', ...nm },
  }));
  write(d, 'data/reciprocity.js', RC({ vermont: { contested: null, territoryShort: 'Ndakina, Wabanaki homeland', ...(recip.vermont || {}) }, 'finger-lakes': { flag: 'dispute under human review', obligation: 'Ask first.', ...(recip.fl || {}) }, 'ne-missouri-se-iowa': { notThere: 'Not there for the cheap land alone.' && 'Not there if you come for the land alone.' } }));
  write(d, 'region/vermont.html', regionPage('vermont', { extra: `<p>${vermontPage}</p>` }));
  write(d, 'region/finger-lakes.html', regionPage('finger-lakes', { extra: `<p>${flPage}</p>` }));
  write(d, 'region/ne-missouri-se-iowa.html', regionPage('ne-missouri-se-iowa', nmPage.html === undefined ? {} : {}).replace(/<title>[^<]*<\/title>/, `<title>${nmPage.title || 'NE Missouri and SE Iowa'}</title>`)
    .replace('</head>', `<meta name="description" content="${nmPage.desc || 'Seven border counties.'}" /></head>`).replace('<p>First paragraph about ne-missouri-se-iowa.</p>', `<p>${nmPage.p || 'Seven border counties on the Mississippi.'}</p>`));
  write(d, 'llms.txt', llms);
  return d;
}
const lines = async (d, extra = []) => (await run(['--root', d, ...extra])).lines();

test('passing fixture: all three guards pass', async () => {
  const d = site(); const og = tmpdir(); write(og, 'MC-GATE-og-ne-missouri-se-iowa.json', JSON.stringify({ lines: ['NE Missouri and SE Iowa', 'Land standing: Sauk and Meskwaki homelands'] }));
  const r = await run(['--root', d, '--og-dir', og]);
  assert.ok(r.ok, r.lines().join('\n'));
});

test('failing fixture: a Vermont string containing "contested" (and identity wording on the page)', async () => {
  const d = site({ vermont: { territory: 'Abenaki homeland, unceded, with a contested identity' } });
  const l = await lines(d, ['--only', 'vermont']);
  assert.ok(l.some((l2) => /^FAIL vermont land-standing\.js: forbidden wording "contested"/.test(l2)), l.join('\n'));
  const d2 = site({ vermontPage: 'This genealogy is a dispute.' });
  assert.ok((await lines(d2, ['--only', 'vermont'])).some((l2) => /^FAIL vermont region\/vermont\.html/.test(l2)));
});

test('failing fixture: Vermont losing the word unceded; reciprocity strings are checked too, keys and URLs are not', async () => {
  const l = await lines(site({ vermont: { territory: 'Abenaki homeland' } }), ['--only', 'vermont']);
  assert.ok(l.some((l2) => /^FAIL vermont territory-unceded/.test(l2)), l.join('\n'));
  const l2 = await lines(site({ recip: { vermont: { note: 'an illegitimate claim' } } }), ['--only', 'vermont']);
  assert.ok(l2.some((x) => /^FAIL vermont reciprocity\.js/.test(x)), l2.join('\n'));
});

test('failing fixture: Finger Lakes leadership wording or a repurchases clause', async () => {
  const a = await lines(site({ fl: { entry: 'Ask the leadership first.' } }), ['--only', 'finger-lakes']);
  assert.ok(a.some((x) => /^FAIL finger-lakes land-standing\.js: forbidden wording "leadership"/.test(x)), a.join('\n'));
  const b = await lines(site({ fl: { obligation: 'Let its repurchases come first.' } }), ['--only', 'finger-lakes']);
  assert.ok(b.some((x) => /^FAIL finger-lakes obligation-clause/.test(x)), b.join('\n'));
  const c = await lines(site({ fl: { obligation: 'Make no offer where it is buying.' } }), ['--only', 'finger-lakes']);
  assert.ok(c.some((x) => /^FAIL finger-lakes obligation-clause/.test(x)));
});

test('failing fixture: NE Missouri price wording in the page parts, the llms.txt entry or an OG dump', async () => {
  assert.ok((await lines(site({ nmPage: { title: 'Cheap land in NE Missouri' } }), ['--only', 'ne-missouri-se-iowa'])).some((x) => /^FAIL ne-missouri-se-iowa title/.test(x)));
  assert.ok((await lines(site({ nmPage: { desc: 'An affordable corner' } }), ['--only', 'ne-missouri-se-iowa'])).some((x) => /^FAIL ne-missouri-se-iowa meta description/.test(x)));
  assert.ok((await lines(site({ nmPage: { p: 'Land prices are low.' } }), ['--only', 'ne-missouri-se-iowa'])).some((x) => /^FAIL ne-missouri-se-iowa first paragraph/.test(x)));
  assert.ok((await lines(site({ llms: '- [NE Missouri](https://example.test/region/ne-missouri-se-iowa.html): a bargain\n' }), ['--only', 'ne-missouri-se-iowa'])).some((x) => /^FAIL ne-missouri-se-iowa llms\.txt/.test(x)));
  const d = site(); const og = tmpdir(); write(og, 'X-og-ne-missouri-se-iowa.json', JSON.stringify(['Lowest price in the slate']));
  assert.ok((await lines(d, ['--only', 'ne-missouri-se-iowa', '--og-dir', og])).some((x) => /^FAIL ne-missouri-se-iowa og-dump/.test(x)));
});

test('failing fixture: --og-dir without a dump for the region fails; a missing module fails', async () => {
  const og = tmpdir(); write(og, 'other.json', '{}');
  assert.ok((await lines(site(), ['--only', 'ne-missouri-se-iowa', '--og-dir', og])).some((x) => /^FAIL ne-missouri-se-iowa og-dumps/.test(x)));
  const d = tmpdir();
  assert.equal((await run(['--root', d, '--only', 'vermont'])).ok, false);
  assert.equal((await run(['--root', d, '--only', 'nonsense'])).ok, false);
});
