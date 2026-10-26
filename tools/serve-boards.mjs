// Local board origin for development and browser tests: serves boards/dist on its own port
// (a different origin from the app) with the same headers as production (_headers).
import { resolve } from 'node:path';
import { serveOrigin } from './boards/serve.mjs';

const dir = resolve(new URL('../boards/dist', import.meta.url).pathname);
// With DATABASE_URL (as in .dev.vars), teacher boards are read from the database too.
const database = process.env.DATABASE_URL;
const teacher = database
  ? async (hash, path) => {
      const { neon } = await import('@neondatabase/serverless');
      const rows = await neon(database)`
        select files from learn_app.author_boards where hash = ${hash} limit 1`;
      return rows[0]?.files?.[path] ?? null;
    }
  : undefined;
const { url } = await serveOrigin(dir, Number(process.env.BOARD_PORT ?? 5174), { teacher });
console.log(`Board origin on ${url}`);
