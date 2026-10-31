import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import type { Env } from '../env';
import { HttpError } from '../http';
/** Any Drizzle Postgres database: Neon over HTTP in production, PGlite in tests. */
export type Db = PgDatabase<PgQueryResultHKT>;
export function database(env: Env): Db {
  if (!env.DATABASE_URL) throw new HttpError(503, 'content.unavailable');
  return drizzle(neon(env.DATABASE_URL)) as unknown as Db;
}
