#!/usr/bin/env node
// CNT-13 / CNT-14 / CNT-15 — one-time migration of the four posts from the old Mika-net repository.
// Usage: node scripts/migrate-posts.mjs [path-to-old-repo]   (default ../Mika-net)
// Committed, run once, output committed. Not part of the build.
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, basename, resolve } from 'node:path';
import matter from 'gray-matter';
import sharp from 'sharp';

const src = resolve(process.argv[2] ?? '../Mika-net');
const postsDir = join(src, '_posts');
const publicDir = join(src, 'public');
const out = resolve('src/content/posts');

// CNT-13 table — per-slug metadata that the old frontmatter did not carry.
const META = {
  shipping: { pillar: 'judgement', tags: ['agile', 'shipping'], featured: true },
  SMTP: { pillar: 'architecture', tags: ['email', 'self-hosting', 'aws'], featured: false },
  'ai-plugins': { pillar: 'ai-engineering', tags: ['ai', 'tooling'], featured: false },
  'ai-plugins-chatgpt': { pillar: 'ai-engineering', tags: ['ai', 'chatgpt'], featured: false },
};

// CNT-15 — descriptions rewritten by hand; pending Michael's approval in the migration PR (HUMAN-TASKS 1.8).
const DESCRIPTIONS = {
  shipping:
    'The most important change in mindset I experienced as a developer: from gardener to shipper, delivering sooner and iterating on what is actually live.',
  SMTP: "When privacy concerns lead to exploring self-hosted email servers and encrypted email services. Tonight's cast include AWS, Gmail, and ProtonMail.",
  'ai-plugins':
    "How effective use of AI plugins can rapidly increase your productivity and code quality. Tonight's cast includes GitHub Copilot, Kite, Tabnine and SonarQube.",
  'ai-plugins-chatgpt':
    'A March 2023 experiment: this post, pun title included, was written by an AI language model. Seven tips on AI coding tools, as the model saw them.',
};

function firstSentence(text, max = 160) {
  const t = text.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.'));
  return (end > 50 ? cut.slice(0, end + 1) : cut).trim();
}

// CNT-14 — remove the duplicated "## Title" and "### Excerpt" the old template put at the top of the body.
function stripDuplicateHeadings(body) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  let removedTitle = false;
  const keep = [];
  for (; i < lines.length; i++) {
    const line = lines[i];
    const nonEmptySoFar = keep.filter((l) => l.trim()).length;
    if (!removedTitle && nonEmptySoFar <= 1 && /^## /.test(line)) {
      removedTitle = true;
      // drop a following "### subtitle" (skipping blank lines)
      let j = i + 1;
      while (j < lines.length && !lines[j].trim()) j++;
      if (j < lines.length && /^### /.test(lines[j])) i = j;
      continue;
    }
    keep.push(line);
  }
  return keep.join('\n').replace(/^\s+/, '').replace(/\s+$/, '') + '\n';
}

function fixTypos(body) {
  return body.replace(/Tonights/g, "Tonight's");
}

function yamlString(s) {
  return JSON.stringify(s);
}

mkdirSync(out, { recursive: true });

for (const file of readdirSync(postsDir).filter((f) => f.endsWith('.md'))) {
  const slug = basename(file, '.md');
  const meta = META[slug];
  if (!meta) throw new Error(`no META entry for ${slug}`);
  const { data, content } = matter(readFileSync(join(postsDir, file), 'utf8'));

  const dir = join(out, slug);
  mkdirSync(dir, { recursive: true });

  // images: copy beside the post as cover.jpg, downscaled to ≤1600px wide (sources were up to 2.5 MB)
  let heroImage;
  if (data.coverImage && existsSync(join(publicDir, data.coverImage))) {
    await sharp(join(publicDir, data.coverImage))
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(dir, 'cover.jpg'));
    heroImage = './cover.jpg';
  }

  const title = String(data.title).trim();
  const description = DESCRIPTIONS[slug] ?? firstSentence(String(data.excerpt));
  const pubDate = String(data.date).slice(0, 10);

  const fm = [
    '---',
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    `pubDate: ${pubDate}`,
    `pillar: ${meta.pillar}`,
    `tags: [${meta.tags.join(', ')}]`,
    ...(heroImage ? [`heroImage: ${heroImage}`, `heroAlt: ${yamlString(title)}`] : []),
    ...(meta.featured ? ['featured: true'] : []),
    '---',
    '',
  ].join('\n');

  const body = fixTypos(stripDuplicateHeadings(content));
  writeFileSync(join(dir, 'index.md'), fm + body);
  console.log(`migrated ${slug} (${description.length}-char description${heroImage ? ', cover' : ''})`);
}
