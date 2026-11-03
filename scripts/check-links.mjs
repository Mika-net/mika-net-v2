#!/usr/bin/env node
// PIPE-06 — internal link check over dist/ with no external dependency.
// Every href/src in every built HTML page that points into the site must resolve to a built file
// (a path, a path + index.html, or a path + .html). External links are listed but not fetched here
// (they are checked, warn-only, by a later job). Exit 1 on any broken internal link.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';

const dist = resolve(process.argv[2] ?? 'dist');

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

const attr = /\b(href|src|srcset)\s*=\s*["']([^"']+)["']/gi;
// Paths produced by a later pipeline step (the résumé PDF); absent locally unless REQUIRE_GENERATED=1.
const GENERATED = new Set(['/resume.pdf']);
const requireGenerated = process.env.REQUIRE_GENERATED === '1';
const skipped = [];
const broken = [];
const external = new Set();
let checked = 0;

function resolves(target) {
  const clean = decodeURIComponent(target.split('#')[0].split('?')[0]);
  if (!clean) return true;
  const abs = clean.startsWith('/') ? join(dist, clean) : null;
  if (!abs) return true;
  if (!abs.startsWith(dist + sep) && abs !== dist) return false;
  if (existsSync(abs)) {
    if (statSync(abs).isDirectory()) return existsSync(join(abs, 'index.html'));
    return true;
  }
  return existsSync(abs + '.html') || existsSync(join(abs, 'index.html'));
}

for (const file of walk(dist)) {
  if (!file.endsWith('.html')) continue;
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(attr)) {
    const candidates = m[1].toLowerCase() === 'srcset' ? m[2].split(',') : [m[2]];
    for (const raw of candidates) {
      const url = raw.trim().split(/\s+/)[0];
      if (GENERATED.has(url) && !requireGenerated && !existsSync(join(dist, url))) { skipped.push(url); continue; }
      if (!url || url.startsWith('#') || url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) continue;
      if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
        // absolute URL: external unless it is our own site, in which case check the path
        try {
          const u = new URL(url);
          if (/(^|\.)mika-net\.io$/.test(u.hostname) && u.pathname !== '/') {
            checked++;
            if (!resolves(u.pathname)) broken.push({ file, url });
          } else if (!/mika-net\.io$/.test(u.hostname)) external.add(u.origin);
        } catch { /* not a URL (e.g. meta content text) */ }
        continue;
      }
      if (!url.startsWith('/')) {
        // relative: resolve against the page's directory
        const rel = '/' + join(dirname(file), url).slice(dist.length).replace(/\\/g, '/').replace(/^\/+/, '');
        checked++;
        if (!resolves(rel)) broken.push({ file, url });
        continue;
      }
      checked++;
      if (!resolves(url)) broken.push({ file, url });
    }
  }
}

console.log(`checked ${checked} internal references; ${external.size} external origins seen${skipped.length ? `; skipped ${new Set(skipped).size} generated-later path(s): ${[...new Set(skipped)].join(', ')}` : ''}`);
if (broken.length) {
  for (const b of broken) console.error(`broken: ${b.url}  in ${b.file.slice(dist.length + 1)}`);
  process.exit(1);
}
