import { handleBuilder } from '../../apps/platform/server/builds/worker';
import type { Env } from '../../apps/platform/server/env';
// The builder worker's API on our server (docs/builder-server.md); BUILDER_TOKEN only.
export const onRequest = ({ request, env }: { request: Request; env: Env }) =>
  handleBuilder(request, env);
