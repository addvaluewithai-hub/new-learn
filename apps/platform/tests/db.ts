import { readdir, readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import type { Db } from '../server/db/connection';

const migrations = new URL('../../../database/migrations/', import.meta.url);

/** A real, empty Postgres in memory with every migration applied, for store tests. */
export async function testDb(): Promise<Db> {
  const client = new PGlite();
  const files = (await readdir(migrations)).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files)
    for (const statement of (await readFile(new URL(file, migrations), 'utf8')).split(
      '--> statement-breakpoint',
    ))
      if (statement.trim()) await client.exec(statement);
  return drizzle(client) as unknown as Db;
}
