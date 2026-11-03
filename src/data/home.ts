// FE-40 — home page copy lives in this one file so Michael's edit is a one-file change.
// Placeholders are the author's guess at the positioning; see docs/HUMAN-TASKS.md 1.7.

export const hero = {
  name: 'Michael Johnson',
  // Rendered after the ❯ prompt, before the blinking cursor.
  line: 'Lead engineer. Cloud-first, event-driven systems on AWS and .NET; teams that ship daily without outages.',
};

// Each proof point must be backed by a résumé highlight: `match` is tested against the
// highlights of the named role at build time, and the build fails if nothing matches (FE-40).
export const proofPoints = [
  { label: '9 engineers led', role: 'Alight', match: /team of nine/i },
  { label: 'millions of users served', role: 'Alight', match: /millions of users/i },
  { label: 'incidents −87.3%', role: 'Alight', match: /87\.3%/ },
] as const;

export const actions = [
  { label: 'Résumé', href: '/resume/', primary: true },
  { label: 'Writing', href: '/posts/', primary: false },
  { label: 'Contact', href: '/about/#contact', primary: false },
] as const;
