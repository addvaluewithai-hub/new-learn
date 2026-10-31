import { Fragment, type ReactNode } from 'react';
import { useI18n, type TextKey } from './index';

/**
 * A message with parts that are elements, not text: `{email}` in the message becomes the
 * `email` node. Translators move the placeholder; the link stays a link.
 */
export function Rich({ k, parts }: { k: TextKey; parts: Record<string, ReactNode> }) {
  const { t } = useI18n();
  const text = t(k);
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(/\{(\w+)\}/g)) {
    const node = parts[match[1]];
    if (node === undefined) continue;
    out.push(text.slice(last, match.index), <Fragment key={match.index}>{node}</Fragment>);
    last = match.index! + match[0].length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}
