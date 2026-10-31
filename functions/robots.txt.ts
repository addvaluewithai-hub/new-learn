import { handlePublic } from '../apps/platform/server/market/public';
import type { Env } from '../apps/platform/server/env';
// Made from the listed courses (docs/marketplace.md).
export const onRequest = ({ request, env }: { request: Request; env: Env }) =>
  handlePublic(request, env);
