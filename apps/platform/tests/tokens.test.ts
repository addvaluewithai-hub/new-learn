import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The design tokens (src/shared/tokens.css) keep text readable: every text-on-background pair
// the shared parts use meets WCAG AA (4.5:1) for normal text.
const css = readFileSync(new URL('../src/shared/tokens.css', import.meta.url), 'utf8');
const raw = Object.fromEntries(
  [...css.matchAll(/(--nl-[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
);
function colour(name: string): string {
  const value = raw[name];
  assert.ok(value, `${name} is defined`);
  const ref = value.match(/^var\((--nl-[\w-]+)\)$/);
  return ref ? colour(ref[1]) : value;
}
function luminance(hex: string) {
  const n = hex.replace('#', '');
  const full = n.length === 3 ? [...n].map((c) => c + c).join('') : n;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(colour(a)), luminance(colour(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('text on every token background is readable', () => {
  const pairs: Array<[string, string]> = [
    ['--nl-ink', '--nl-bg'],
    ['--nl-ink', '--nl-surface'],
    ['--nl-ink', '--nl-paper'],
    ['--nl-muted', '--nl-surface'],
    ['--nl-muted', '--nl-bg'],
    ['--nl-muted', '--nl-surface-soft'],
    ['--nl-on-primary', '--nl-primary'],
    ['--nl-on-primary', '--nl-primary-hover'],
    ['--nl-on-accent', '--nl-accent'],
    ['--nl-primary', '--nl-surface'],
    ['--nl-tutor', '--nl-surface'],
    ['--nl-tutor', '--nl-tutor-soft'],
    ['--nl-success', '--nl-success-soft'],
    ['--nl-danger-ink', '--nl-danger-soft'],
    ['--nl-warning', '--nl-warning-soft'],
  ];
  for (const [text, back] of pairs) {
    const ratio = contrast(text, back);
    assert.ok(ratio >= 4.5, `${text} on ${back} is ${ratio.toFixed(2)}:1`);
  }
});
