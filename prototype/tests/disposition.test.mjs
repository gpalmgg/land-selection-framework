import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, GATE, REQUIRE_V2 } from './helpers.mjs';

// Wraps the EV-MERGE-TOOLS disposition checker (wave 1). Skips with a printed reason until that script exists.
const script = path.join(ROOT, 'scripts/evidence/merge/disposition.mjs');
function run(args) {
  try { return { code: 0, out: execFileSync('node', [script, ...args], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NODE_NO_WARNINGS: '1' } }) }; }
  catch (e) { return { code: e.status ?? 1, out: `${e.stdout || ''}${e.stderr || ''}` }; }
}
function guard(t) {
  if (!existsSync(script)) { if (REQUIRE_V2) assert.fail('scripts/evidence/merge/disposition.mjs missing'); t.skip('scripts/evidence/merge/disposition.mjs not present yet (EV-MERGE-TOOLS, wave 1)'); return false; }
  return true;
}

test('disposition: every unverifiable item, newer-vintage note and correction has exactly one disposition row (disposition.mjs --check)', (t) => {
  if (!guard(t)) return;
  const r = run(GATE ? ['--check', '--strict'] : ['--check']);
  assert.equal(r.code, 0, `disposition.mjs --check failed:\n${r.out.slice(-1500)}`);
});

test('disposition: every region above the null cap has a NULL-DECISION line (disposition.mjs --check-null-decisions)', (t) => {
  if (!guard(t)) return;
  const r = run(['--check-null-decisions']);
  assert.equal(r.code, 0, `disposition.mjs --check-null-decisions failed:\n${r.out.slice(-1500)}`);
});
