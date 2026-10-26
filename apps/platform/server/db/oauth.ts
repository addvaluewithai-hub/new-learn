import { text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { appSchema } from './content';

// OAuth 2.1 for the MCP connector (Claude, ChatGPT): registered clients, one-time codes and
// tokens. Codes and tokens are stored only as SHA-256 hashes; the user id comes from the
// signed-in session that approved the client.

export const oauthClients = appSchema.table('oauth_clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  redirectUris: jsonb('redirect_uris').$type<string[]>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const oauthCodes = appSchema.table('oauth_codes', {
  hash: text('hash').primaryKey(),
  clientId: text('client_id')
    .notNull()
    .references(() => oauthClients.id),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  redirectUri: text('redirect_uri').notNull(),
  challenge: text('challenge').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
});

export const oauthTokens = appSchema.table(
  'oauth_tokens',
  {
    hash: text('hash').primaryKey(),
    kind: text('kind').$type<'access' | 'refresh'>().notNull(),
    clientId: text('client_id')
      .notNull()
      .references(() => oauthClients.id),
    userId: text('user_id').notNull(),
    userName: text('user_name').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('oauth_tokens_user').on(t.userId)],
);
