// Checks every language file against the Arabic source and writes the server's messages
// (docs/i18n.md). `node tools/i18n.mjs` writes; `--check` only reports, for tests and CI.
import { readdir, readFile, writeFile } from 'node:fs/promises';

const dir = new URL('../apps/platform/src/i18n/locales/', import.meta.url);
const serverFile = new URL('../apps/platform/server/i18n/messages.generated.json', import.meta.url);
const SOURCE = 'ar';
const CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);
const CODE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isPlural = (v) =>
  isObject(v) && typeof v.other === 'string' && Object.keys(v).every((k) => CATEGORIES.has(k));
const vars = (text) => new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]));
const pluralVars = (p) => new Set(Object.values(p).flatMap((s) => [...vars(s)]));
const same = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));

/** Problems in `target` compared with `source`, as readable lines with their key paths. */
export function compare(source, target, path = '') {
  const out = [];
  const at = (key) => (path ? `${path}.${key}` : key);
  if (typeof source === 'string') {
    if (typeof target !== 'string') return [`${path}: should be text`];
    if (source.trim() && !target.trim()) out.push(`${path}: empty`);
    if (!same(vars(source), vars(target)))
      out.push(`${path}: placeholders ${[...vars(target)]} should be ${[...vars(source)]}`);
    return out;
  }
  if (isPlural(source)) {
    if (!isPlural(target)) return [`${path}: should be a plural with "other"`];
    if (!same(pluralVars(source), pluralVars(target)))
      out.push(`${path}: placeholders should be ${[...pluralVars(source)]}`);
    return out;
  }
  if (Array.isArray(source)) {
    if (!Array.isArray(target) || target.length !== source.length)
      return [`${path}: should be a list of ${source.length}`];
    source.forEach((item, i) => out.push(...compare(item, target[i], `${path}[${i}]`)));
    return out;
  }
  if (!isObject(target)) return [`${path || '(root)'}: should be a group`];
  for (const key of Object.keys(source)) {
    if (!(key in target)) out.push(`${at(key)}: missing`);
    else out.push(...compare(source[key], target[key], at(key)));
  }
  for (const key of Object.keys(target))
    if (!(key in source)) out.push(`${at(key)}: not in ar.json`);
  return out;
}

/** Every language file, parsed, the source first. */
export async function readLocales() {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  const locales = {};
  for (const file of [`${SOURCE}.json`, ...files.filter((f) => f !== `${SOURCE}.json`)]) {
    const code = file.slice(0, -5);
    if (!CODE.test(code)) throw new Error(`${file}: the name must be a language code (fr, pt-BR)`);
    locales[code] = JSON.parse(await readFile(new URL(file, dir), 'utf8'));
  }
  return locales;
}

/** The server only needs its own messages: `server` from every language. */
export const serverMessages = (locales) =>
  Object.fromEntries(Object.entries(locales).map(([code, m]) => [code, m.server ?? {}]));

export async function check() {
  const locales = await readLocales();
  const problems = Object.entries(locales)
    .filter(([code]) => code !== SOURCE)
    .flatMap(([code, messages]) =>
      compare(locales[SOURCE], messages).map((p) => `${code}.json ${p}`),
    );
  return { locales, problems };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { locales, problems } = await check();
  const text = `${JSON.stringify(serverMessages(locales), null, 1)}\n`;
  const current = await readFile(serverFile, 'utf8').catch(() => '');
  if (process.argv.includes('--check')) {
    if (current !== text) problems.push('server catalogue is stale: run npm run i18n');
  } else if (current !== text) await writeFile(serverFile, text);
  for (const p of problems) console.error(p);
  console.log(
    `${Object.keys(locales).length} languages (${Object.keys(locales).join(', ')}), ${problems.length} problems.`,
  );
  process.exit(problems.length ? 1 : 0);
}
