// RES-03, RES-05, RES-07, RES-10 — the only module that reads resume.json. Pages import from here.
import raw from '@/data/resume.json';
import { resumeSchema, type Highlight, type Resume, type Work } from './resume.schema';

export const resume: Resume = resumeSchema.parse(raw);

export function highlightText(h: Highlight): string {
  return typeof h === 'string' ? h : h.text;
}

export function highlightLenses(h: Highlight): string[] {
  return typeof h === 'string' ? [] : (h.lenses ?? []);
}

export function highlightEvidence(h: Highlight): string | undefined {
  return typeof h === 'string' ? undefined : h.evidence;
}

/** RES-05: strict JSON Resume — object highlights flattened, extensions removed. */
export function flattenedResume(): Record<string, unknown> {
  const { meta, ...rest } = resume;
  return {
    ...rest,
    meta: meta ? { version: meta.version, lastModified: meta.lastModified } : undefined,
    work: resume.work.map(({ meta: _m, ...w }) => ({ ...w, highlights: w.highlights.map(highlightText) })),
  };
}

export function parseDate(s: string): Date {
  return new Date(s.length === 7 ? `${s}-01T00:00:00Z` : `${s}T00:00:00Z`);
}

export function workStart(w: Work): Date {
  return parseDate(w.startDate);
}

export function workEnd(w: Work, today = new Date()): Date {
  return w.endDate ? parseDate(w.endDate) : today;
}

/** RES-07: floor of years since the earliest work start date, as of the build. */
export function yearsOfExperience(today = new Date()): number {
  const earliest = resume.work.map(workStart).reduce((a, b) => (a < b ? a : b));
  let years = today.getUTCFullYear() - earliest.getUTCFullYear();
  const beforeAnniversary =
    today.getUTCMonth() < earliest.getUTCMonth() ||
    (today.getUTCMonth() === earliest.getUTCMonth() && today.getUTCDate() < earliest.getUTCDate());
  if (beforeAnniversary) years -= 1;
  return years;
}

export function currentRole(): Work | undefined {
  return resume.work.find((w) => !w.endDate) ?? resume.work[0];
}

export function roleAnchor(w: Work): string {
  return w.name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** RES-10: schema.org Person derived from basics. */
export function personJsonLd(siteUrl: string): Record<string, unknown> {
  const b = resume.basics;
  const role = currentRole();
  const sameAs = b.profiles.map((p) => p.url).filter((u) => /^https?:\/\//.test(u));
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${siteUrl}/#person`,
    name: b.name,
    jobTitle: b.label,
    email: `mailto:${b.email}`,
    url: siteUrl,
    ...(sameAs.length ? { sameAs } : {}),
    ...(role ? { worksFor: { '@type': 'Organization', name: role.name } } : {}),
    ...(b.location?.city
      ? { address: { '@type': 'PostalAddress', addressLocality: b.location.city, addressRegion: b.location.region } }
      : {}),
    knowsAbout: resume.skills.flatMap((s) => s.keywords),
  };
}

/**
 * FE-40: proof points for the home page. Each one is verified against the résumé at build time
 * so the home page cannot claim a number the résumé does not.
 */
export function verifiedProofPoints(
  points: readonly { label: string; role: string; match: RegExp }[],
): { label: string; href: string }[] {
  return points.map((p) => {
    const role = resume.work.find((w) => w.name === p.role);
    if (!role) throw new Error(`proof point "${p.label}": no work entry named "${p.role}" in resume.json`);
    const backed = role.highlights.some((h) => p.match.test(highlightText(h)));
    if (!backed) throw new Error(`proof point "${p.label}": no highlight of "${p.role}" matches ${p.match}`);
    return { label: p.label, href: `/resume/#${roleAnchor(role)}` };
  });
}
