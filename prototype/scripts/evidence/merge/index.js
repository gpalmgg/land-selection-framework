'use strict';
// Entry for `node --test scripts/evidence/merge/`: node runs a directory argument as a CommonJS entry (index.js), and this
// file loads every *.test.mjs beside it so that command runs the whole suite. Running the test files directly
// (`node --test scripts/evidence/merge/*.test.mjs`) works too and does not load this file.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.test.mjs')).sort();
(async () => {
  for (const f of files) await import(pathToFileURL(path.join(__dirname, f)).href);
})().catch((e) => { console.error(e); process.exitCode = 1; });
