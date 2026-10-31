import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
// @ts-expect-error plain JavaScript tool (tools/i18n.mjs)
import { check, compare, serverMessages } from '../../../tools/i18n.mjs';
import { acceptLanguages, dirOf, format, pick, translator, type Messages } from '../src/i18n/core';
import { localeOf, serverText } from '../server/i18n';
import { RUNTIME_TEXT } from '../../../packages/lesson-runtime/src/text';

test('every language file has exactly the source keys, placeholders and list lengths', async () => {
  const { locales, problems } = await check();
  assert.deepEqual(problems, []);
  assert.ok(Object.keys(locales).length >= 1);
  const generated = JSON.parse(
    await readFile(new URL('../server/i18n/messages.generated.json', import.meta.url), 'utf8'),
  );
  assert.deepEqual(generated, serverMessages(locales), 'run npm run i18n');
});

test('the lesson player’s Arabic defaults are the runtime group of ar.json', async () => {
  const ar = JSON.parse(
    await readFile(new URL('../src/i18n/locales/ar.json', import.meta.url), 'utf8'),
  );
  assert.deepEqual(ar.runtime, RUNTIME_TEXT);
});

test('the checker names missing keys, placeholders, list lengths and extra keys', () => {
  const source = { a: 'نص {name}', list: ['x', 'y'], n: { one: 'واحد', other: '{count}' } };
  const target = { a: 'text', list: ['x'], n: 'many', extra: 'x' };
  assert.deepEqual(compare(source, target), [
    'a: placeholders  should be name',
    'list: should be a list of 2',
    'n: should be a plural with "other"',
    'extra: not in ar.json',
  ]);
});

test('plurals pick the language’s form; placeholders and fallbacks', () => {
  const ar: Messages = {
    q: {
      zero: 'مفيش أسئلة',
      one: 'سؤال واحد',
      two: 'سؤالين',
      few: '{count} أسئلة',
      other: '{count} سؤال',
    },
    only: 'بالعربي بس',
  };
  const en: Messages = { q: { one: 'one question', other: '{count} questions' } };
  const tAr = translator('ar', ar, ar);
  assert.equal(tAr('q', { count: 0 }), 'مفيش أسئلة');
  assert.equal(tAr('q', { count: 2 }), 'سؤالين');
  assert.equal(tAr('q', { count: 5 }), '5 أسئلة');
  const tEn = translator('en', en, ar);
  assert.equal(tEn('q', { count: 1 }), 'one question');
  assert.equal(tEn('q', { count: 12 }), '12 questions');
  assert.equal(tEn('only'), 'بالعربي بس', 'a missing key falls back to Arabic');
  assert.equal(tEn('nope.key'), 'nope.key');
  assert.equal(format('Hi {name}', 'en', {}), 'Hi {name}', 'an unknown placeholder stays visible');
});

test('language choice: direction, matching and the request header', () => {
  assert.equal(dirOf('ar'), 'rtl');
  assert.equal(dirOf('fa-IR'), 'rtl');
  assert.equal(dirOf('zh-Hans'), 'ltr');
  assert.equal(pick(['en-GB', 'ar'], ['ar', 'en']), 'en');
  assert.equal(pick(['xx'], ['ar', 'en']), null);
  assert.deepEqual(acceptLanguages('fr-CH, fr;q=0.9, en;q=0.8, *;q=0.5'), ['fr-CH', 'fr', 'en']);
  const request = (headers: Record<string, string>) => new Request('https://x.test/', { headers });
  assert.equal(localeOf(request({})), 'ar');
  assert.equal(localeOf(request({ 'x-nl-lang': 'ar' })), 'ar');
  assert.equal(typeof serverText('ar', 'http.notJson'), 'string');
});
