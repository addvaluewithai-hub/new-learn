import type { MediaStore } from '../env';

// Recorded clips for the player: `/media/audio/<hash>.wav` straight from R2. A hash names
// one immutable file, so the browser may keep it for a year. Ranges pass through, so an
// audio element can seek.

const KEY = /^\/media\/(audio\/[0-9a-f]{64}\.wav)$/;

export async function serveMedia(request: Request, media: MediaStore | undefined) {
  const m = KEY.exec(new URL(request.url).pathname);
  if (!m || (request.method !== 'GET' && request.method !== 'HEAD'))
    return new Response('Not found.', { status: 404 });
  if (!media) return new Response('No media store.', { status: 503 });
  const object = await media.get(m[1], { range: request.headers });
  if (!object) return new Response('Not found.', { status: 404 });
  const headers = new Headers({
    'content-type': 'audio/wav',
    'cache-control': 'public, max-age=31536000, immutable',
    'accept-ranges': 'bytes',
  });
  const range = object.range;
  if (range && 'offset' in range && range.length !== undefined) {
    headers.set(
      'content-range',
      `bytes ${range.offset}-${range.offset + range.length - 1}/${object.size}`,
    );
    headers.set('content-length', String(range.length));
  } else headers.set('content-length', String(object.size));
  return new Response(request.method === 'HEAD' ? null : object.body, {
    status: range ? 206 : 200,
    headers,
  });
}
