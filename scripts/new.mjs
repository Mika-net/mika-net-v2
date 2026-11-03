#!/usr/bin/env node
// `pnpm new post "Title"` — scaffolds src/content/posts/<slug>/index.md as a draft (DESIGN.md §11).
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [kind, ...rest] = process.argv.slice(2);
const title = rest.join(' ').trim();
if (kind !== 'post' || !title) {
  console.error('usage: pnpm new post "Title of the post"');
  process.exit(1);
}
const slug = title
  .toLowerCase()
  .replace(/['’"]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const dir = join('src/content/posts', slug);
if (existsSync(dir)) {
  console.error(`${dir} already exists`);
  process.exit(1);
}
mkdirSync(dir, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
writeFileSync(
  join(dir, 'index.md'),
  `---
title: ${JSON.stringify(title)}
description: "TODO(michael): one sentence, 50-160 characters, that states the lesson."
pubDate: ${today}
pillar: judgement
tags: []
draft: true
---

State the lesson in the first paragraph.
`,
);
console.log(`created ${dir}/index.md (draft: true)`);
