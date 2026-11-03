// CNT-04, CNT-19, RES-01, RES-05 — content and résumé invariants that do not need the Astro runtime.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { resumeSchema } from '../src/lib/resume.schema';

const postsDir = new URL('../src/content/posts/', import.meta.url).pathname;

describe('posts', () => {
  it('keeps the four legacy ids, case preserved (CNT-04)', () => {
    for (const id of ['shipping', 'SMTP', 'ai-plugins', 'ai-plugins-chatgpt']) {
      expect(existsSync(join(postsDir, id, 'index.md')), id).toBe(true);
    }
  });

  it('every post has the required frontmatter and no placeholder outside drafts (CNT-02, CNT-19)', () => {
    for (const dir of readdirSync(postsDir)) {
      const file = join(postsDir, dir, 'index.md');
      if (!existsSync(file)) continue;
      const { data, content } = matter(readFileSync(file, 'utf8'));
      expect(data.title, `${dir} title`).toBeTruthy();
      expect(String(data.description).length, `${dir} description length`).toBeGreaterThanOrEqual(50);
      expect(String(data.description).length, `${dir} description length`).toBeLessThanOrEqual(160);
      expect(['production', 'architecture', 'judgement', 'ai-engineering'], `${dir} pillar`).toContain(data.pillar);
      if (data.heroImage) expect(data.heroAlt, `${dir} heroAlt`).toBeTruthy();
      if (!data.draft) expect(content.includes('TODO(michael)'), `${dir} placeholder`).toBe(false);
    }
  });
});

describe('resume.json', () => {
  const raw = JSON.parse(readFileSync(new URL('../src/data/resume.json', import.meta.url), 'utf8'));

  it('validates against the superset schema (RES-01)', () => {
    expect(() => resumeSchema.parse(raw)).not.toThrow();
  });

  it('never carries a phone number (RES-04)', () => {
    expect(JSON.stringify(raw)).not.toMatch(/\(?\d{3}\)?[ -]\d{3}-\d{4}/);
    expect(raw.basics.phone).toBeUndefined();
  });

  it('rejects an endDate before startDate (RES-02)', () => {
    const bad = structuredClone(raw);
    bad.work[1].endDate = '2000-01-01';
    expect(() => resumeSchema.parse(bad)).toThrow();
  });

  it('rejects overlapping roles without meta.overlap (RES-02)', () => {
    const bad = structuredClone(raw);
    bad.work[1].endDate = '2026-01-01';
    expect(() => resumeSchema.parse(bad)).toThrow(/overlap/);
  });
});
