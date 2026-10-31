import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: [
    './apps/platform/server/db/content.ts',
    './apps/platform/server/db/learners.ts',
    './apps/platform/server/db/authoring.ts',
    './apps/platform/server/db/oauth.ts',
    './apps/platform/server/db/builds.ts',
    './apps/platform/server/db/publish.ts',
    './apps/platform/server/db/money.ts',
    './apps/platform/server/db/ops.ts',
    './apps/platform/server/db/media.ts',
  ],
  out: './database/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  schemaFilter: ['learn_app'],
  migrations: { schema: 'learn_migrations', table: '__drizzle_migrations' },
});
