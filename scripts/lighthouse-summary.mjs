#!/usr/bin/env node
// PIPE-10 — turn .lighthouseci/manifest.json into a Markdown table for the GitHub job summary.
import { readFileSync, existsSync } from 'node:fs';

const manifestPath = '.lighthouseci/manifest.json';
if (!existsSync(manifestPath)) {
  console.log('### Lighthouse\n\nNo manifest found (the run failed before collecting).');
  process.exit(0);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const representative = manifest.filter((m) => m.isRepresentativeRun);
const pct = (v) => (v == null ? '—' : Math.round(v * 100));

console.log('### Lighthouse (mobile, median of 3 runs)\n');
console.log('| Page | Performance | Accessibility | Best practices | SEO | LCP | CLS |');
console.log('| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
for (const m of representative) {
  const s = m.summary;
  let lcp = '—', cls = '—';
  try {
    const lhr = JSON.parse(readFileSync(m.jsonPath, 'utf8'));
    lcp = `${(lhr.audits['largest-contentful-paint'].numericValue / 1000).toFixed(2)} s`;
    cls = lhr.audits['cumulative-layout-shift'].numericValue.toFixed(3);
  } catch {}
  const path = new URL(m.url).pathname;
  console.log(`| \`${path}\` | ${pct(s.performance)} | ${pct(s.accessibility)} | ${pct(s['best-practices'])} | ${pct(s.seo)} | ${lcp} | ${cls} |`);
}
console.log('\nBudgets: every category ≥ 95, LCP < 1.5 s, CLS < 0.1, scripts ≤ 4 KB, fonts ≤ 120 KB (`.lighthouserc.json`).');
