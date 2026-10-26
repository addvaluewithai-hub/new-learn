import { neon } from '@neondatabase/serverless';
import { BOARD_HEADERS, TYPES } from '../../headers.mjs';

// Teacher boards uploaded through the connector, served from the database by content hash
// with the same headers as every other board (docs/boards.md). DATABASE_URL here is a role
// that can read learn_app.author_boards (hash, files) and nothing else.
type Env = { DATABASE_URL?: string };
const notFound = () => new Response('Not found', { status: 404, headers: BOARD_HEADERS });

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const match = /^\/u\/([a-f0-9]{64})\/([A-Za-z0-9_./-]{1,200})$/.exec(
    new URL(request.url).pathname,
  );
  if (!match || match[2].includes('..') || !env.DATABASE_URL) return notFound();
  const [hash, path] = [match[1], match[2]];
  const rows = (await neon(env.DATABASE_URL)`
    select files from learn_app.author_boards where hash = ${hash} limit 1`) as Array<{
    files: Record<string, string>;
  }>;
  const body = rows[0]?.files?.[path];
  const type = TYPES[path.split('.').pop() as keyof typeof TYPES];
  if (typeof body !== 'string' || !type) return notFound();
  return new Response(body, {
    headers: {
      ...BOARD_HEADERS,
      'Content-Type': type,
      // A hash names exactly one set of files, forever.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
