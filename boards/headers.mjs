// The board origin's security headers (docs/boards.md), shared by the static build
// (_headers), the local server, and the function that serves teacher boards from the database.

/** Origins allowed to frame boards: the app, its preview deployments and local hosts. */
export const FRAME_ANCESTORS =
  'https://new-learn.pages.dev https://*.new-learn.pages.dev http://127.0.0.1:* http://localhost:*';

export const CSP = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self'",
  "connect-src 'none'",
  "frame-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  `frame-ancestors ${FRAME_ANCESTORS}`,
].join('; ');

/** Headers on every board file. */
export const BOARD_HEADERS = {
  'Content-Security-Policy': CSP,
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export const TYPES = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  json: 'application/json',
  svg: 'image/svg+xml',
};
