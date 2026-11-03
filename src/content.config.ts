// CNT-01 .. CNT-07 — see docs/requirements/01-content.md
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { basename, dirname } from 'node:path';

export const PILLARS = ['production', 'architecture', 'judgement', 'ai-engineering'] as const;

const posts = defineCollection({
  loader: glob({
    pattern: '**/index.{md,mdx}',
    base: './src/content/posts',
    // CNT-04: entry id = the post's directory name, verbatim (case preserved).
    generateId: ({ entry }) => basename(dirname(entry)),
  }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(3).max(80),
        description: z.string().min(50).max(160),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        pillar: z.enum(PILLARS),
        tags: z.array(z.string().regex(/^[a-z0-9-]+$/)).default([]),
        series: z.string().optional(),
        heroImage: image().optional(),
        heroAlt: z.string().optional(),
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
        canonicalURL: z.string().url().optional(),
        note2026: z.string().max(280).optional(),
      })
      .refine((p) => !p.heroImage || !!p.heroAlt, {
        message: 'heroAlt is required when heroImage is set',
      }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().max(80),
    summary: z.string().min(50).max(200),
    period: z.object({ start: z.coerce.date(), end: z.coerce.date().optional() }),
    role: z.string().max(60),
    stack: z.array(z.string()).min(1),
    links: z
      .object({
        repo: z.string().url().optional(),
        live: z.string().url().optional(),
        post: z.string().optional(),
      })
      .default({}),
    status: z.enum(['active', 'shipped', 'retired', 'experiment']).default('shipped'),
    featured: z.boolean().default(false),
  }),
});

const now = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/now' }),
  schema: z.object({ updated: z.coerce.date() }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string(), updatedDate: z.coerce.date().optional() }),
});

export const collections = { posts, projects, now, pages };
