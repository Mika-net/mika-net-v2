// RES-01, RES-02 — a Zod superset of JSON Resume v1.0.0 with two optional extensions:
//   work[].highlights[] may be { text, lenses?, evidence? } instead of a string
//   meta.lenses maps lens id -> { name, description }
import { z } from 'zod';

export const LENSES = ['leadership', 'architecture', 'consulting'] as const;
export type Lens = (typeof LENSES)[number];

const isoDate = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, 'YYYY-MM or YYYY-MM-DD');

export const highlightSchema = z.union([
  z.string().min(1),
  z.object({
    text: z.string().min(1),
    lenses: z.array(z.enum(LENSES)).optional(),
    evidence: z.string().optional(),
  }),
]);

export const workSchema = z
  .object({
    name: z.string(),
    position: z.string(),
    url: z.string().url().optional(),
    location: z.string().optional(),
    startDate: isoDate,
    endDate: isoDate.optional(),
    summary: z.string().optional(),
    highlights: z.array(highlightSchema).default([]),
    meta: z.object({ overlap: z.boolean().optional() }).optional(),
  })
  .refine((w) => !w.endDate || w.endDate >= w.startDate, {
    message: 'endDate precedes startDate',
  });

export const resumeSchema = z
  .object({
    $schema: z.string().optional(),
    meta: z
      .object({
        version: z.string().optional(),
        lastModified: z.string().optional(),
        lenses: z.record(z.string(), z.object({ name: z.string(), description: z.string() })).optional(),
      })
      .optional(),
    basics: z.object({
      name: z.string(),
      label: z.string(),
      email: z.string().email(),
      url: z.string().url(),
      summary: z.string(),
      location: z
        .object({ city: z.string().optional(), region: z.string().optional(), countryCode: z.string().optional() })
        .optional(),
      profiles: z.array(z.object({ network: z.string(), username: z.string(), url: z.string() })).default([]),
    }),
    work: z.array(workSchema),
    skills: z.array(z.object({ name: z.string(), keywords: z.array(z.string()) })).default([]),
    education: z
      .array(
        z.object({
          institution: z.string(),
          area: z.string().optional(),
          studyType: z.string().optional(),
          startDate: isoDate.optional(),
          endDate: isoDate.optional(),
        }),
      )
      .default([]),
    projects: z.array(z.any()).default([]),
  })
  .superRefine((r, ctx) => {
    // RES-02: overlapping work entries need meta.overlap on one of them
    const spans = r.work.map((w) => ({
      w,
      s: Date.parse(w.startDate.length === 7 ? `${w.startDate}-01` : w.startDate),
      e: w.endDate ? Date.parse(w.endDate.length === 7 ? `${w.endDate}-01` : w.endDate) : Date.now(),
    }));
    for (let i = 0; i < spans.length; i++) {
      for (let j = i + 1; j < spans.length; j++) {
        const a = spans[i]!;
        const b = spans[j]!;
        const overlap = a.s < b.e && b.s < a.e;
        if (overlap && !a.w.meta?.overlap && !b.w.meta?.overlap) {
          ctx.addIssue({
            code: 'custom',
            message: `work entries "${a.w.name}" and "${b.w.name}" overlap; set meta.overlap on one`,
          });
        }
      }
    }
  });

export type Resume = z.infer<typeof resumeSchema>;
export type Work = z.infer<typeof workSchema>;
export type Highlight = z.infer<typeof highlightSchema>;
