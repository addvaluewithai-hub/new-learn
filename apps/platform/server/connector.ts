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
  const origin = env.APP_ORIGIN;
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
    if (path === '/oauth/register' && request.method === 'POST') return await register(db, request);
    if (path === '/oauth/authorize' && request.method === 'GET')
      return await authorizeRedirect(db, request, origin);
    if (path === '/oauth/token' && request.method === 'POST') return await token(db, request);
    if (path === '/mcp') {
      const user = await bearerUser(db, request);
      if (!user)
        return json({ error: 'invalid_token' }, 401, {
          'www-authenticate': `Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource"`,
        });
      const response = await handleMcp(request, { db, user, origin });
      for (const [key, value] of Object.entries(CORS)) response.headers.set(key, value);
      return response;
    }
    return json({ error: 'not_found' }, 404);
  } catch (error) {
    console.error('connector', error);
    return json({ error: 'server_error' }, 500);
  }
}
