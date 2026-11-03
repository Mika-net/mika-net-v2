#!/usr/bin/env node
// CNT-19 / RES-11 — post-build checks over dist/.
//   * no "TODO(michael)" in any rendered page on a production build (STRICT_PLACEHOLDERS=1 or SITE_URL=https://mika-net.io)
//   * dist/resume.json parses and has no object-form highlights
//   * every site-relative `evidence` URL in resume.json resolves to a built page
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const strict =
  process.env.STRICT_PLACEHOLDERS === '1' ||
  (process.env.STRICT_PLACEHOLDERS !== '0' && process.env.SITE_URL === 'https://mika-net.io');
const errors = [];
const warnings = [];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

let placeholderPages = [];
for (const file of walk(dist)) {
  if (!file.endsWith('.html')) continue;
  if (readFileSync(file, 'utf8').includes('TODO(michael)')) placeholderPages.push(file);
}
if (placeholderPages.length) {
  const msg = `TODO(michael) placeholders in ${placeholderPages.length} page(s): ${placeholderPages.slice(0, 5).join(', ')}`;
  (strict ? errors : warnings).push(msg);
}

const resumePath = join(dist, 'resume.json');
if (!existsSync(resumePath)) errors.push('dist/resume.json is missing');
else {
  const r = JSON.parse(readFileSync(resumePath, 'utf8'));
  for (const w of r.work ?? []) {
    for (const h of w.highlights ?? []) if (typeof h !== 'string') errors.push(`object-form highlight leaked into resume.json (${w.name})`);
  }
}

const source = JSON.parse(readFileSync('src/data/resume.json', 'utf8'));
for (const w of source.work ?? []) {
  for (const h of w.highlights ?? []) {
    const ev = typeof h === 'object' ? h.evidence : undefined;
    if (ev && ev.startsWith('/')) {
      const clean = ev.split('#')[0].replace(/\/$/, '');
      if (!existsSync(join(dist, clean, 'index.html')) && !existsSync(join(dist, clean))) errors.push(`evidence URL not built: ${ev}`);
    }
  }
}

for (const w of warnings) console.warn(`warning: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`error: ${e}`);
  process.exit(1);
}
console.log(`post-build checks passed${warnings.length ? ` (${warnings.length} warning(s); strict mode off)` : ''}`);
