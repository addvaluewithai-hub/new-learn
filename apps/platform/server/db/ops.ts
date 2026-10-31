import {
  text,
  uuid,
  timestamp,
  integer,
  jsonb,
  date,
  primaryKey,
  index,
} from 'drizzle-orm/pg-core';
import { appSchema } from './content';

// Running the platform (docs/operations.md): request limits shared by every server instance,
// errors from the server and from browsers, and a daily count of what costs us money.

/** Requests per key per time window (a user, an IP), counted in the database. */
export const rateHits = appSchema.table(
  'rate_hits',
  {
    key: text('key').notNull(),
    windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
    count: integer('count').notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.key, t.windowStart] }),
    index('rate_hits_window').on(t.windowStart),
  ],
);

export const errorLog = appSchema.table(
  'error_log',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    at: timestamp('at', { withTimezone: true }).defaultNow().notNull(),
    /** `server` or `browser`. */
    source: text('source').notNull(),
    /** The route or page. */
    place: text('place').notNull().default(''),
    status: integer('status').notNull().default(0),
    message: text('message').notNull(),
    detail: jsonb('detail').$type<Record<string, unknown>>().notNull().default({}),
    userId: text('user_id').notNull().default(''),
  },
  (t) => [index('error_log_at').on(t.at)],
);

/** How many of each costly thing happened on a day (Nova chats, voice sessions, builds…). */
export const usageDaily = appSchema.table(
  'usage_daily',
  {
    day: date('day').notNull(),
    kind: text('kind').notNull(),
    count: integer('count').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.kind] })],
);
