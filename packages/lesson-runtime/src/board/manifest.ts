import { BOARD_API_VERSION } from './types';
import type { BoardAspect, BoardManifest, BoardValue, BoardValues, BoardVariable } from './types';

const ASPECTS: BoardAspect[] = ['16:9', '4:3', '1:1', '3:4', '9:16'];
const ID = /^[a-z0-9][a-z0-9-]{0,62}$/;
const NAME = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;
/** Element ids the lesson may point at: `#` and a plain id, nothing a selector could abuse. */
export const BOARD_TARGET = /^#[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const LIBRARY = /^[a-z0-9][a-z0-9.-]*@\d+\.\d+\.\d+$/;
const text = (v: unknown, max = 400): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function variable(name: string, v: BoardVariable, fail: (m: string) => never) {
  if (!v || typeof v !== 'object') fail(`variable ${name}`);
  if (v.label !== undefined && !text(v.label, 80)) fail(`variable ${name} label`);
  if (v.type === 'number') {
    if (!finite(v.min) || !finite(v.max) || v.min >= v.max) fail(`variable ${name} range`);
    if (v.step !== undefined && (!finite(v.step) || v.step <= 0)) fail(`variable ${name} step`);
    if (v.unit !== undefined && !text(v.unit, 16)) fail(`variable ${name} unit`);
    if (!finite(v.default) || v.default < v.min || v.default > v.max)
      fail(`variable ${name} default`);
    return;
  }
  if (v.type !== 'choice') fail(`variable ${name} type`);
  const options = v.options;
  if (!Array.isArray(options) || options.length < 2 || options.length > 20) fail(`${name} options`);
  if (!options.every((o) => text(o, 60)) || new Set(options).size !== options.length)
    fail(`variable ${name} options`);
  if (!options.includes(v.default)) fail(`variable ${name} default`);
}

/** Validate untrusted `board.json`. Structural validity is not a teaching approval. */
export function validateBoardManifest(value: unknown, allowed?: ReadonlySet<string>) {
  const m = value as BoardManifest;
  const fail = (message: string): never => {
    throw new Error(`Invalid board manifest: ${message}`);
  };
  if (!m || typeof m !== 'object' || m.apiVersion !== BOARD_API_VERSION) fail('apiVersion');
  if (typeof m.id !== 'string' || !ID.test(m.id)) fail('id');
  if (!text(m.title, 120) || !text(m.description, 600)) fail('title/description');
  if (!ASPECTS.includes(m.aspect)) fail('aspect');
  if (!Array.isArray(m.libraries) || !m.libraries.every((l) => LIBRARY.test(l))) fail('libraries');
  for (const library of m.libraries)
    if (allowed && !allowed.has(library)) fail(`library ${library} is not allowed`);
  if (!m.variables || typeof m.variables !== 'object' || Array.isArray(m.variables))
    fail('variables');
  const names = Object.keys(m.variables);
  if (names.length > 32) fail('too many variables');
  for (const name of names) {
    if (!NAME.test(name)) fail(`variable name ${name}`);
    variable(name, m.variables[name], fail);
  }
  if (!Array.isArray(m.targets) || m.targets.length > 64) fail('targets');
  if (!m.targets.every((t) => typeof t === 'string' && BOARD_TARGET.test(t))) fail('targets');
  return m;
}

/** One value forced into its variable: numbers clamped and stepped, choices from the list. */
export function clampValue(v: BoardVariable, value: unknown): BoardValue | undefined {
  if (v.type === 'choice')
    return typeof value === 'string' && v.options.includes(value) ? value : undefined;
  if (!finite(value)) return undefined;
  const bounded = Math.min(v.max, Math.max(v.min, value));
  if (!v.step) return bounded;
  const stepped = v.min + Math.round((bounded - v.min) / v.step) * v.step;
  return Number(Math.min(v.max, stepped).toFixed(10));
}

/** Keep only declared variables, each forced into range. Unknown keys are dropped. */
export function clampValues(manifest: BoardManifest, values: unknown): BoardValues {
  const out: BoardValues = {};
  if (!values || typeof values !== 'object' || Array.isArray(values)) return out;
  for (const [name, v] of Object.entries(manifest.variables)) {
    const next = clampValue(v, (values as Record<string, unknown>)[name]);
    if (next !== undefined) out[name] = next;
  }
  return out;
}

export function defaultValues(manifest: BoardManifest): BoardValues {
  return Object.fromEntries(Object.entries(manifest.variables).map(([n, v]) => [n, v.default]));
}

/** "Load = 300 N, Material = steel" for the learner's own answer. */
export function describeValues(manifest: BoardManifest, values: BoardValues) {
  return Object.entries(manifest.variables)
    .filter(([name]) => name in values)
    .map(([name, v]) => {
      const unit = v.type === 'number' && v.unit ? ` ${v.unit}` : '';
      return `${v.label ?? name} = ${values[name]}${unit}`;
    })
    .join('، ');
}
