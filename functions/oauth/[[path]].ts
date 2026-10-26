import { handleConnector } from '../../apps/platform/server/connector';
import type { Env } from '../../apps/platform/server/env';
// OAuth endpoints of the MCP connector: register, authorize, token.
export const onRequest = ({ request, env }: { request: Request; env: Env }) =>
  handleConnector(request, env);
