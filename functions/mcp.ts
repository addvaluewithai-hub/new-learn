import { handleConnector } from '../apps/platform/server/connector';
import type { Env } from '../apps/platform/server/env';
// The MCP connector endpoint for Claude and ChatGPT (docs/connector.md).
export const onRequest = ({ request, env }: { request: Request; env: Env }) =>
  handleConnector(request, env);
