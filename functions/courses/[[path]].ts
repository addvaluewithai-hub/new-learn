import { handlePublic } from '../../apps/platform/server/market/public';
import type { Env } from '../../apps/platform/server/env';
// The marketplace's public pages, readable without an account (docs/marketplace.md).
export const onRequest = ({ request, env }: { request: Request; env: Env }) =>
  handlePublic(request, env);
