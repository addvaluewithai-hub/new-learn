import type { Vars } from '../src/i18n/core';
import { serverText } from './i18n';

/**
 * An error a client reads (docs/i18n.md): `key` is a path under `server` in the language
 * files, translated at the boundary into the request's language. `HttpError.plain` is for
 * developers and AI clients (the MCP tools, the builder API): English text, shown as written.
 */
export class HttpError extends Error {
  text?: string;
  constructor(
    public status: number,
    public key: string,
    public vars?: Vars,
  ) {
    super(key);
  }
  static plain(status: number, text: string) {
    const error = new HttpError(status, '');
    error.text = text;
    error.message = text;
    return error;
  }
}
/** The error's text for a reader of `locale`: a key translated, plain text as written. */
export const errorText = (error: HttpError, locale: string) =>
  error.text ?? serverText(locale, error.key, error.vars);
/** Machines (AI clients, the builder) read English when the server has it, else the source. */
export const MACHINE_LOCALE = 'en';
export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { 'cache-control': 'no-store' } });
}
export async function body(request: Request, limit = 16384) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new HttpError(415, 'http.notJson');
  const raw = await request.text();
  if (raw.length > limit) throw new HttpError(413, 'http.tooLarge');
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new HttpError(400, 'http.badBody');
  }
}
export function checkOrigin(request: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
  if (request.headers.get('origin') !== new URL(request.url).origin)
    throw new HttpError(403, 'http.badOrigin');
}
