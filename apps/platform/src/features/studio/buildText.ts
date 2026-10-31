import { t, type TextKey } from '../../i18n';

/**
 * A builder text as the page shows it. New jobs send `step:<id>`, or `step:<id>:<title>` for a
 * line that names a lesson: a key under `build.steps` (docs/i18n.md) with `{title}` filled.
 * Jobs from before that still hold their Arabic text, shown as written. Call it while
 * rendering.
 */
export function buildText(text: string): string {
  const step = /^step:(\w+)(?::([\s\S]*))?$/.exec(text);
  if (!step) return text;
  return t(
    `build.steps.${step[1]}` as TextKey,
    step[2] === undefined ? undefined : { title: step[2] },
  );
}
