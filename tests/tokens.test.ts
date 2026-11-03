// FE-12 — contrast ratios for both themes, read from tokens.css so a value change cannot silently fail.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector);
  const open = css.indexOf('{', start);
  const close = css.indexOf('}', open);
  const body = css.slice(open + 1, close);
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)) out[m[1]!] = m[2]!.toLowerCase();
  return out;
}

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
}

function contrast(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

const themes = {
  dark: block("[data-theme='dark']"),
  light: block("[data-theme='light']"),
};

describe.each(Object.entries(themes))('%s theme', (_name, t) => {
  it('has every colour token', () => {
    for (const k of ['bg', 'bg-elev', 'bg-inset', 'fg', 'fg-muted', 'fg-faint', 'accent', 'accent-dim', 'amber', 'danger', 'line', 'line-strong'])
      expect(t[k], k).toMatch(/^#[0-9a-f]{6}$/);
  });
  it('body text on background ≥ 7:1', () => expect(contrast(t['fg']!, t['bg']!)).toBeGreaterThanOrEqual(7));
  it('muted text on background ≥ 4.5:1', () => expect(contrast(t['fg-muted']!, t['bg']!)).toBeGreaterThanOrEqual(4.5));
  it('accent on background ≥ 4.5:1', () => expect(contrast(t['accent']!, t['bg']!)).toBeGreaterThanOrEqual(4.5));
  it('amber on background ≥ 4.5:1', () => expect(contrast(t['amber']!, t['bg']!)).toBeGreaterThanOrEqual(4.5));
  it('body text on elevated and inset surfaces ≥ 7:1', () => {
    expect(contrast(t['fg']!, t['bg-elev']!)).toBeGreaterThanOrEqual(7);
    expect(contrast(t['fg']!, t['bg-inset']!)).toBeGreaterThanOrEqual(7);
  });
  it('primary button text (bg colour on accent) ≥ 4.5:1', () => expect(contrast(t['bg']!, t['accent']!)).toBeGreaterThanOrEqual(4.5));
});
