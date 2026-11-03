#!/usr/bin/env node
// RES-08 / PIPE-08 — render the built /resume/ page to dist/resume.pdf with headless Chromium.
// Usage: pnpm build && pnpm resume:pdf   (serves dist/ on a local port, prints, checks page count ≤ 2)
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const dist = 'dist';
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json' };

const server = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[extname(p)] ?? 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(`http://localhost:${port}/resume/`, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print' });
await page.evaluate(() => document.fonts.ready);
const out = join(dist, 'resume.pdf');
await page.pdf({ path: out, format: 'Letter', printBackground: true, preferCSSPageSize: true });
await browser.close();
server.close();

const pages = (readFileSync(out, 'latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
console.log(`wrote ${out} (${pages} page${pages === 1 ? '' : 's'})`);
if (pages > 2) { console.error('error: resume.pdf exceeds 2 pages (RES-08)'); process.exit(1); }
