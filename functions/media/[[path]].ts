import { serveMedia } from '../../apps/platform/server/media/serve';
import type { Env } from '../../apps/platform/server/env';
// Recorded narration from R2 (docs/voice-agent.md); public, immutable, named by hash.
export const onRequest = ({ request, env }: { request: Request; env: Env }) =>
  serveMedia(request, env.MEDIA);
