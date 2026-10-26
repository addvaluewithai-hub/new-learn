import type { Db } from '../db/connection';
import type { AuthUser } from '../env';
import { HttpError } from '../http';
import { client, issueCode } from './tokens';

// The app's consent screen: the signed-in teacher sees which app asks, then allows or denies.
// Every value is checked again here; the browser only carries it.

type Request = {
  client_id?: unknown;
  redirect_uri?: unknown;
  code_challenge?: unknown;
  state?: unknown;
};

async function checked(db: Db, input: Request) {
  const found = await client(db, String(input.client_id ?? ''));
  const redirectUri = String(input.redirect_uri ?? '');
  if (!found || !found.redirectUris.includes(redirectUri))
    throw new HttpError(400, 'طلب الربط غير صحيح.');
  const challenge = String(input.code_challenge ?? '');
  if (!/^[A-Za-z0-9_-]{43}$/.test(challenge)) throw new HttpError(400, 'طلب الربط غير صحيح.');
  const state = typeof input.state === 'string' ? input.state.slice(0, 500) : undefined;
  return { found, redirectUri, challenge, state };
}

const back = (redirectUri: string, params: Record<string, string | undefined>) => {
  const url = new URL(redirectUri);
  for (const [key, value] of Object.entries(params)) if (value) url.searchParams.set(key, value);
  return url.toString();
};

/** What the consent screen shows: the app's name and where it sends the teacher back. */
export async function consentInfo(db: Db, input: Request) {
  const { found, redirectUri } = await checked(db, input);
  return { name: found.name, redirectHost: new URL(redirectUri).host };
}

export async function approve(db: Db, user: AuthUser, input: Request, origin: string) {
  const { found, redirectUri, challenge, state } = await checked(db, input);
  const code = await issueCode(db, {
    clientId: found.id,
    userId: user.id,
    userName: user.name,
    redirectUri,
    challenge,
  });
  return { redirect: back(redirectUri, { code, state, iss: origin }) };
}

export async function deny(db: Db, input: Request) {
  const { redirectUri, state } = await checked(db, input);
  return { redirect: back(redirectUri, { error: 'access_denied', state }) };
}
