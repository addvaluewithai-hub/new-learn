import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import type { Env } from '../env';
import { HttpError } from '../http';
export function database(env: Env) {
  if (!env.DATABASE_URL) throw new HttpError(503, 'تعذر تحميل المناهج حاليًا. جرّب تاني بعد شوية.');
  return drizzle(neon(env.DATABASE_URL));
}
