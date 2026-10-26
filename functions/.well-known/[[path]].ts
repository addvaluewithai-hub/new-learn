import { handleConnector } from '../../apps/platform/server/connector';
import type { Env } from '../../apps/platform/server/env';
// OAuth discovery for the MCP connector (RFC 8414, RFC 9728).
export const onRequest = ({ request, env }: { request: Request; env: Env }) =>
  handleConnector(request, env);
