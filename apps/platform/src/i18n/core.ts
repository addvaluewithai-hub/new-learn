// The translation core (docs/i18n.md): plain functions over one language's messages, used by
// the app, the server and the checks. No React, no DOM, no Vite.

export type Messages = { [key: string]: Message };
export type Message = string | Plural | Message[] | Messages;
/** A plural message: Intl.PluralRules categories; `other` is required. */
export type Plural = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
export type Vars = Record<string, string | number>;

/** The source language: every other file is checked against it and falls back to it. */
export const SOURCE = 'ar';

const RTL = new Set([
  'ar',
  'arc',
  'ckb',
  'dv',
  'fa',
  'he',
  'ku',
  'ps',
  'sd',
  'syr',
  'ug',
  'ur',
  'yi',
]);

/** Text direction of a language code (`ar`, `fr`, `zh-Hant`…). */
export function dirOf(code: string): 'rtl' | 'ltr' {
  return RTL.has(code.split('-')[0].toLowerCase()) ? 'rtl' : 'ltr';
}

/** A language's own name in that language (`français`, `中文`), from the platform. */
export function nativeName(code: string): string {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code) ?? code;
    return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
  } catch {
    return code;
  }
}

export const isPlural = (value: unknown): value is Plural =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  typeof (value as Plural).other === 'string' &&
  Object.keys(value).every((k) => ['zero', 'one', 'two', 'few', 'many', 'other'].includes(k));

/** The value at a dotted path (`site.nav.teachers`), or undefined. */
export function lookup(messages: Messages | undefined, key: string): Message | undefined {
  let node: Message | undefined = messages;
  for (const part of key.split('.')) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) return undefined;
    node = (node as Messages)[part];
  }
  return node;
}

/** `{name}` placeholders filled from `vars`; unknown ones stay as written. */
export function interpolate(text: string, vars?: Vars, locale = SOURCE): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = vars[name];
    if (value === undefined) return whole;
    // Western digits everywhere, as the app has always written numbers; grouping follows the
    // language (1,000 / 1.000 / 1 000).
    return typeof value === 'number'
      ? new Intl.NumberFormat(locale, { numberingSystem: 'latn' }).format(value)
      : value;
  });
}

/** One message as text: the plural form for `vars.count`, then its placeholders. */
export function format(message: Message | undefined, locale: string, vars?: Vars): string | null {
  if (typeof message === 'string') return interpolate(message, vars, locale);
  if (isPlural(message)) {
    const count = Number(vars?.count ?? 0);
    const rule = new Intl.PluralRules(locale).select(count);
    const form = (count === 0 && message.zero) || message[rule] || message.other;
    return interpolate(form, vars, locale);
  }
  return null;
}

/**
 * A translator for one language with the source as fallback: a key missing from a newer file
 * shows the Arabic text rather than a raw key, and a key missing everywhere shows itself.
 */
export function translator(locale: string, messages: Messages, source: Messages) {
  return (key: string, vars?: Vars): string =>
    format(lookup(messages, key), locale, vars) ?? format(lookup(source, key), SOURCE, vars) ?? key;
}

/** The best supported language for a list of preferences (`en-GB` matches `en`). */
export function pick(wanted: readonly string[], supported: readonly string[]): string | null {
  for (const raw of wanted) {
    const code = raw.trim().toLowerCase();
    const exact = supported.find((s) => s.toLowerCase() === code);
    if (exact) return exact;
    const base = supported.find((s) => s.toLowerCase() === code.split('-')[0]);
    if (base) return base;
  }
  return null;
}

/** Languages from an Accept-Language header, best first. */
export function acceptLanguages(header: string | null): string[] {
  return (header ?? '')
    .split(',')
    .map((part) => {
      const [code, ...params] = part.trim().split(';');
      const q = Number(params.find((p) => p.trim().startsWith('q='))?.split('=')[1] ?? 1);
      return { code: code.trim(), q: Number.isFinite(q) ? q : 0 };
    })
    .filter((x) => x.code && x.code !== '*')
    .sort((a, b) => b.q - a.q)
    .map((x) => x.code);
}
