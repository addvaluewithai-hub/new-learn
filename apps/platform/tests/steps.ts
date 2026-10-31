import ar from '../src/i18n/locales/ar.json';
import { translator } from '../src/i18n/core';

// How the studio shows a builder step line (`step:<id>` or `step:<id>:<title>`) in Arabic.
const t = translator('ar', ar as never, ar as never);
export function shown(line: string) {
  const m = /^step:(\w+)(?::([\s\S]*))?$/.exec(line);
  if (!m) return line;
  const key = `build.steps.${m[1]}`;
  const text = t(key, m[2] === undefined ? undefined : { title: m[2] });
  return text === key ? line : text;
}
