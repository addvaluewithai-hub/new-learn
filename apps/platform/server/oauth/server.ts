import type { Db } from '../db/connection';
import { oauthClients } from '../db/oauth';
import { ACCESS_SECONDS, client, issueTokens, randomToken, redeemCode, refresh } from './tokens';

// OAuth 2.1 authorization server for the MCP connector: metadata (RFC 8414, RFC 9728),
// dynamic client registration (RFC 7591), the authorization redirect and the token endpoint.
// Public clients only, PKCE S256 required. The teacher approves in the app (consent.ts).

export const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers':
    'authorization, content-type, mcp-protocol-version, mcp-session-id',
  'access-control-expose-headers': 'www-authenticate, mcp-session-id',
};
const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { ...CORS, 'cache-control': 'no-store' } });
const oauthError = (error: string, description: string, status = 400) =>
  json({ error, error_description: description }, status);

export const protectedResource = (origin: string) => ({
  resource: `${origin}/mcp`,
  authorization_servers: [origin],
  bearer_methods_supported: ['header'],
  resource_name: 'New Learn',
});
export const authorizationServer = (origin: string) => ({
  issuer: origin,
  authorization_endpoint: `${origin}/oauth/authorize`,
  token_endpoint: `${origin}/oauth/token`,
  registration_endpoint: `${origin}/oauth/register`,
  response_types_supported: ['code'],
  grant_types_supported: ['authorization_code', 'refresh_token'],
  code_challenge_methods_supported: ['S256'],
  token_endpoint_auth_methods_supported: ['none'],
  scopes_supported: ['lessons'],
});

/** Redirect URIs a client may register: https anywhere, http only on this machine. */
export function allowedRedirect(uri: unknown): uri is string {
  if (typeof uri !== 'string' || uri.length > 500) return false;
  try {
    const url = new URL(uri);
    if (url.hash) return false;
    if (url.protocol === 'https:') return true;
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch {
    return false;
  }
}

export async function register(db: Db, request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return oauthError('invalid_client_metadata', 'JSON body required');
  }
  const uris = body.redirect_uris;
  if (!Array.isArray(uris) || !uris.length || uris.length > 5 || !uris.every(allowedRedirect))
    return oauthError('invalid_redirect_uri', 'redirect_uris: 1-5 https (or localhost) URLs');
  const name = typeof body.client_name === 'string' ? body.client_name.slice(0, 100) : 'MCP client';
  const id = randomToken().slice(0, 32);
  await db.insert(oauthClients).values({ id, name, redirectUris: uris as string[] });
  return json(
    {
      client_id: id,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: name,
      redirect_uris: uris,
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    },
    201,
  );
}

/** Check an authorization request; the teacher then approves it in the app. */
export async function authorizeRedirect(db: Db, request: Request, origin: string) {
  const q = new URL(request.url).searchParams;
  const found = await client(db, q.get('client_id') ?? '');
  const redirectUri = q.get('redirect_uri') ?? '';
  // Never redirect to a URI the client did not register.
  if (!found || !found.redirectUris.includes(redirectUri))
    return new Response('Unknown client or redirect URI.', { status: 400 });
  const back = (error: string) => {
    const url = new URL(redirectUri);
    url.searchParams.set('error', error);
    if (q.get('state')) url.searchParams.set('state', q.get('state')!);
    return Response.redirect(url.toString(), 302);
  };
  if (q.get('response_type') !== 'code') return back('unsupported_response_type');
  if (
    q.get('code_challenge_method') !== 'S256' ||
    !/^[A-Za-z0-9_-]{43}$/.test(q.get('code_challenge') ?? '')
  )
    return back('invalid_request');
  const consent = new URL('/', origin);
  consent.searchParams.set('oauth', 'consent');
  for (const key of ['client_id', 'redirect_uri', 'code_challenge', 'state'])
    if (q.get(key)) consent.searchParams.set(key, q.get(key)!);
  return Response.redirect(consent.toString(), 302);
}

export async function token(db: Db, request: Request) {
  const type = request.headers.get('content-type') ?? '';
  let form: URLSearchParams;
  try {
    form = type.includes('application/json')
      ? new URLSearchParams((await request.json()) as Record<string, string>)
      : new URLSearchParams(await request.text());
  } catch {
    return oauthError('invalid_request', 'form body required');
  }
  const clientId = form.get('client_id') ?? '';
  if (!(await client(db, clientId))) return oauthError('invalid_client', 'unknown client', 401);
  let tokens: { access: string; refresh: string } | null = null;
  if (form.get('grant_type') === 'authorization_code') {
    const grant = await redeemCode(db, form.get('code') ?? '', {
      clientId,
      redirectUri: form.get('redirect_uri') ?? '',
      verifier: form.get('code_verifier') ?? '',
    });
    if (!grant) return oauthError('invalid_grant', 'code is invalid, used, expired or unverified');
    tokens = await issueTokens(db, grant);
  } else if (form.get('grant_type') === 'refresh_token') {
    tokens = await refresh(db, form.get('refresh_token') ?? '', clientId);
    if (!tokens) return oauthError('invalid_grant', 'refresh token is invalid or expired');
  } else return oauthError('unsupported_grant_type', 'authorization_code or refresh_token');
  return json({
    access_token: tokens.access,
    token_type: 'Bearer',
    expires_in: ACCESS_SECONDS,
    refresh_token: tokens.refresh,
    scope: 'lessons',
  });
}
