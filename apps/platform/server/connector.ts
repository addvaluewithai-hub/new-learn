import { database, type Db } from './db/connection';
import type { Env } from './env';
import { handleMcp } from './mcp/protocol';
import {
  CORS,
  authorizationServer,
  authorizeRedirect,
  protectedResource,
  register,
  token,
} from './oauth/server';
import { bearerUser } from './oauth/tokens';
import { ipOf, rateLimit } from './ops/limits';
import { countUsage, logError } from './ops/record';
import { HttpError } from './http';

// The connector's public edge: OAuth metadata and endpoints, and the MCP endpoint itself.
// Claude and ChatGPT call these from their servers; no cookies are read here.

const json = (value: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(value, { status, headers: { ...CORS, ...headers } });

export async function handleConnector(
  request: Request,
  env: Env,
  deps: { db?: Db } = {},
): Promise<Response> {
  const path = new URL(request.url).pathname;
  // The address the client used: production, or a preview deployment being tested.
  const origin = new URL(request.url).origin;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  try {
    if (path.startsWith('/.well-known/oauth-protected-resource'))
      return json(protectedResource(origin));
    if (
      path.startsWith('/.well-known/oauth-authorization-server') ||
      path.startsWith('/.well-known/openid-configuration')
    )
      return json(authorizationServer(origin));
    const db = deps.db ?? database(env);
    if (path === '/oauth/register' && request.method === 'POST') {
      await rateLimit(db, 'oauth.register', ipOf(request) || 'unknown');
      return await register(db, request);
    }
    if (path === '/oauth/authorize' && request.method === 'GET')
      return await authorizeRedirect(db, request, origin);
    if (path === '/oauth/token' && request.method === 'POST') return await token(db, request);
    if (path === '/mcp') {
      const user = await bearerUser(db, request);
      if (!user)
        return json({ error: 'invalid_token' }, 401, {
          'www-authenticate': `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
        });
      await rateLimit(db, 'mcp', user.id);
      await countUsage(db, 'mcp.call');
      const response = await handleMcp(request, { db, user, origin });
      for (const [key, value] of Object.entries(CORS)) response.headers.set(key, value);
      return response;
    }
    return json({ error: 'not_found' }, 404);
  } catch (error) {
    if (error instanceof HttpError && error.status === 429)
      return json({ error: 'rate_limited' }, 429, { 'retry-after': '600' });
    console.error('connector', error);
    if (env.DATABASE_URL)
      await logError(deps.db ?? database(env), {
        source: 'server',
        place: `${request.method} ${path}`,
        status: 500,
        message: error instanceof Error ? error.message : String(error),
        detail: { stack: error instanceof Error ? error.stack : '' },
      });
    return json({ error: 'server_error' }, 500);
  }
}
