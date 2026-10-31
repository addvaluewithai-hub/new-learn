import { useSyncExternalStore } from 'react';
import source from './locales/ar.json';
import {
  SOURCE,
  dirOf,
  lookup,
  nativeName,
  pick,
  translator,
  type Message,
  type Messages,
  type Vars,
} from './core';

// The app's languages (docs/i18n.md). Every `locales/<code>.json` is a language: the list,
// the names and the directions come from the files themselves, so adding a language is
// adding its file. Arabic ships with the app; the others load when chosen.

type Source = typeof source;
type Join<P extends string, K extends string> = P extends '' ? K : `${P}.${K}`;
/** Every key whose message is text or a plural, as a dotted path. */
type TextKeys<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? Join<P, K>
    : T[K] extends readonly unknown[]
      ? never
      : T[K] extends { other: string }
        ? Join<P, K>
        : TextKeys<T[K], Join<P, K>>;
}[keyof T & string];
/** Every key whose message is a list (sections, questions). */
type ListKeys<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends readonly unknown[]
    ? Join<P, K>
    : T[K] extends string | { other: string }
      ? never
      : ListKeys<T[K], Join<P, K>>;
}[keyof T & string];
type At<T, K extends string> = K extends `${infer H}.${infer R}`
  ? H extends keyof T
    ? At<T[H], R>
    : never
  : K extends keyof T
    ? T[K]
    : never;

export type TextKey = TextKeys<Source>;
export type ListKey = ListKeys<Source>;

const loaders = import.meta.glob<{ default: Messages }>(['./locales/*.json', '!./locales/ar.json']);
const codeOf = (path: string) => /\/([\w-]+)\.json$/.exec(path)![1];

/** Every language there is a file for, the source first. */
export const LOCALES: readonly string[] = [SOURCE, ...Object.keys(loaders).map(codeOf).sort()];
export const languageName = nativeName;
export { dirOf, SOURCE };

const STORAGE = 'learn.lang';
const cache: Record<string, Messages> = { [SOURCE]: source as unknown as Messages };
let state = { locale: SOURCE, translate: translator(SOURCE, cache[SOURCE], cache[SOURCE]) };
const listeners = new Set<() => void>();

async function load(code: string) {
  if (cache[code]) return cache[code];
  const path = Object.keys(loaders).find((p) => codeOf(p) === code);
  if (!path) throw new Error(`No language file for ${code}`);
  cache[code] = (await loaders[path]()).default;
  return cache[code];
}

function apply(code: string) {
  state = { locale: code, translate: translator(code, cache[code], cache[SOURCE]) };
  document.documentElement.lang = code;
  document.documentElement.dir = dirOf(code);
  listeners.forEach((listener) => listener());
}

/** The language to start in: `?lang=`, then the saved choice, then the browser's, then Arabic. */
export function detect(): string {
  const asked = new URLSearchParams(location.search).get('lang');
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(STORAGE);
  } catch {
    // storage blocked: the browser's language still applies
  }
  return (
    pick([asked ?? '', saved ?? '', ...(navigator.languages ?? [navigator.language])], LOCALES) ??
    SOURCE
  );
}

/** Loads the starting language before the first render, so the page never flashes Arabic. */
export async function startI18n() {
  const code = detect();
  try {
    await load(code);
    apply(code);
  } catch {
    apply(SOURCE);
  }
}

/** Switches the whole app, remembers the choice on this device. */
export async function setLocale(code: string) {
  if (!LOCALES.includes(code)) return;
  await load(code);
  try {
    localStorage.setItem(STORAGE, code);
  } catch {
    // the choice lasts for this visit
  }
  apply(code);
}

/** The current language, for code outside React (request headers, formatting). */
export const currentLocale = () => state.locale;

/** Text for a key in the current language. Call it while rendering, not at import time. */
export const t = (key: TextKey, vars?: Vars) => state.translate(key, vars);

/** A list message (FAQ, legal sections) in the current language, falling back to Arabic. */
export function list<K extends ListKey>(key: K): At<Source, K> {
  return (lookup(cache[state.locale], key) ?? lookup(cache[SOURCE], key)) as At<Source, K>;
}

/** Re-renders the component when the language changes; returns what it needs. */
export function useI18n() {
  const current = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );
  return {
    locale: current.locale,
    dir: dirOf(current.locale),
    t: current.translate as (key: TextKey, vars?: Vars) => string,
    list,
    setLocale,
  };
}

/** For checks: the raw source messages. */
export const sourceMessages = cache[SOURCE];
export type { Message, Messages, Vars };
