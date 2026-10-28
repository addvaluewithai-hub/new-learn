import { and, eq, gt, isNull } from 'drizzle-orm';
import type { Db } from '../db/connection';
import { oauthClients, oauthCodes, oauthTokens } from '../db/oauth';

// Codes and tokens are random 32-byte values handed out once; only their SHA-256 is stored.

export const ACCESS_SECONDS = 60 * 60;
const REFRESH_SECONDS = 30 * 24 * 60 * 60;
const CODE_SECONDS = 10 * 60;

const bytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
export const randomToken = () => hex(bytes(32));
export const tokenHash = async (token: string) =>
  hex(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))));
/** PKCE S256: BASE64URL(SHA256(verifier)). */
export async function pkceChallenge(verifier: string) {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)),
  );
  return btoa(String.fromCharCode(...digest))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
const later = (seconds: number) => new Date(Date.now() + seconds * 1000);

export type Grant = { clientId: string; userId: string; userName: string };

export async function client(db: Db, id: string) {
  if (!/^[a-f0-9]{32}$/.test(id)) return null;
  const [row] = await db.select().from(oauthClients).where(eq(oauthClients.id, id));
  return row ?? null;
}

export async function issueCode(db: Db, grant: Grant & { redirectUri: string; challenge: string }) {
  const code = randomToken();
  await db.insert(oauthCodes).values({
    hash: await tokenHash(code),
    ...grant,
    expiresAt: later(CODE_SECONDS),
  });
  return code;
}

/** Use a code once: it must be unexpired and match the client, redirect and verifier. */
export async function redeemCode(
  db: Db,
  code: string,
  input: { clientId: string; redirectUri: string; verifier: string },
) {
  const [row] = await db
    .update(oauthCodes)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(oauthCodes.hash, await tokenHash(code)),
        isNull(oauthCodes.usedAt),
        gt(oauthCodes.expiresAt, new Date()),
      ),
    )
    .returning();
  if (!row || row.clientId !== input.clientId || row.redirectUri !== input.redirectUri) return null;
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(input.verifier)) return null;
  if ((await pkceChallenge(input.verifier)) !== row.challenge) return null;
  return { clientId: row.clientId, userId: row.userId, userName: row.userName };
}

export async function issueTokens(db: Db, grant: Grant) {
  const access = randomToken();
  const refresh = randomToken();
  await db.insert(oauthTokens).values([
    { hash: await tokenHash(access), kind: 'access', ...grant, expiresAt: later(ACCESS_SECONDS) },
    {
      hash: await tokenHash(refresh),
      kind: 'refresh',
      ...grant,
      expiresAt: later(REFRESH_SECONDS),
    },
  ]);
  return { access, refresh };
}

/** One short-lived access token and no refresh token (our builder acting for a teacher). */
export async function issueAccess(db: Db, grant: Grant) {
  const access = randomToken();
  await db.insert(oauthTokens).values({
    hash: await tokenHash(access),
    kind: 'access',
    ...grant,
    expiresAt: later(ACCESS_SECONDS),
  });
  return access;
}

/** Rotate a refresh token: the old one stops working, a new pair is issued. */
export async function refresh(db: Db, token: string, clientId: string) {
  const [row] = await db
    .update(oauthTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(oauthTokens.hash, await tokenHash(token)),
        eq(oauthTokens.kind, 'refresh'),
        isNull(oauthTokens.revokedAt),
        gt(oauthTokens.expiresAt, new Date()),
      ),
    )
    .returning();
  if (!row || row.clientId !== clientId) return null;
  return issueTokens(db, { clientId, userId: row.userId, userName: row.userName });
}

/** The user an access token belongs to, or null for an unknown, expired or revoked token. */
export async function bearerUser(db: Db, request: Request) {
  const match = /^Bearer\s+([a-f0-9]{64})$/i.exec(request.headers.get('authorization') ?? '');
  if (!match) return null;
  const [row] = await db
    .select({ id: oauthTokens.userId, name: oauthTokens.userName })
    .from(oauthTokens)
    .where(
      and(
        eq(oauthTokens.hash, await tokenHash(match[1].toLowerCase())),
        eq(oauthTokens.kind, 'access'),
        isNull(oauthTokens.revokedAt),
        gt(oauthTokens.expiresAt, new Date()),
      ),
    );
  return row ?? null;
}
