import { database, type Db } from '../db/connection';
import { oauthClients } from '../db/oauth';
import type { Env } from '../env';
import { errorText, HttpError, MACHINE_LOCALE } from '../http';
import { issueAccess } from '../oauth/tokens';
import { addStep, claimJob, finishJob, jobFile, WORKER_KINDS } from './jobs';
import type { JobKind } from '../db/builds';
import { clipInput, saveClip, voiceLines } from '../media/clips';
import { buildPrompt } from './request';
import { refinePrompt } from './refine';

// The builder worker's side (docs/builder-server.md): it calls in from our server with its
// own token, claims jobs and reports back. No cookies; nothing here is reachable without
// BUILDER_TOKEN. Each job gets a one-hour MCP token for its teacher, so Codex can only touch
// that teacher's drafts.

/** The OAuth client the builder's MCP tokens belong to. */
export const BUILDER_CLIENT = 'b111de4000000000000000000000c0de';

const reply = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { 'cache-control': 'no-store' } });

async function same(a: string, b: string) {
  const digest = async (s: string) =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const [x, y] = await Promise.all([digest(a), digest(b)]);
  return x.every((v, i) => v === y[i]);
}

async function input(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > 16384)
    throw HttpError.plain(413, 'Too large.');
  const value = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!value || typeof value !== 'object') throw HttpError.plain(400, 'Bad JSON.');
  return value;
}

/** The kinds a worker asks for; without any, it is the builder. */
function kindsOf(value: Record<string, unknown>): JobKind[] {
  const asked = Array.isArray(value.kinds) ? value.kinds.map(String) : [];
  const known = new Set<string>([...WORKER_KINDS.builder, ...WORKER_KINDS.media]);
  const kinds = asked.filter((k): k is JobKind => known.has(k));
  if (asked.length && !kinds.length) throw HttpError.plain(400, 'kinds: build, refine, voice.');
  return kinds.length ? kinds : WORKER_KINDS.builder;
}

async function claim(db: Db, origin: string, kinds: JobKind[]) {
  const claimed = await claimJob(db, kinds);
  if (!claimed) return { job: null };
  const { job, files } = claimed;
  // A recording needs no agent: the media worker asks for the lines next.
  if (job.request.voice) return { job: { id: job.id, kind: 'voice' as const } };
  await db
    .insert(oauthClients)
    .values({ id: BUILDER_CLIENT, name: 'New Learn builder', redirectUris: [] })
    .onConflictDoNothing();
  const mcpToken = await issueAccess(db, {
    clientId: BUILDER_CLIENT,
    userId: job.ownerId,
    userName: job.ownerName,
  });
  return {
    job: {
      id: job.id,
      prompt: job.request.refine
        ? refinePrompt({ ...job.request, refine: job.request.refine })
        : buildPrompt(job.request, files),
      webSearch: job.request.webSearch,
      files,
      mcpUrl: `${origin}/mcp`,
      mcpToken,
    },
  };
}

export async function handleBuilder(
  request: Request,
  env: Env & { BUILDER_TOKEN?: string },
  deps: { db?: Db } = {},
): Promise<Response> {
  try {
    const secret = env.BUILDER_TOKEN ?? '';
    const given = /^Bearer\s+(\S+)$/.exec(request.headers.get('authorization') ?? '')?.[1] ?? '';
    if (secret.length < 32 || !(await same(given, secret)))
      throw HttpError.plain(401, 'Unauthorized.');
    const db = deps.db ?? database(env);
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === '/builder/claim' && request.method === 'POST') {
      // The builder posts `{}` or nothing; the media worker names its kinds.
      const raw = await request.text();
      const value = raw.trim() ? (JSON.parse(raw) as Record<string, unknown>) : {};
      return reply(await claim(db, url.origin, kindsOf(value)));
    }
    let m = /^\/builder\/jobs\/([0-9a-f-]{36})\/lines$/.exec(path);
    if (m && request.method === 'GET') return reply(await voiceLines(db, m[1]));
    m = /^\/builder\/jobs\/([0-9a-f-]{36})\/clips$/.exec(path);
    if (m && request.method === 'POST') {
      if (Number(request.headers.get('content-length') ?? 0) > 12_000_000)
        throw HttpError.plain(413, 'Too large.');
      const value = (await request.json().catch(() => null)) as Record<string, unknown> | null;
      if (!value || typeof value !== 'object') throw HttpError.plain(400, 'Bad JSON.');
      return reply(await saveClip(db, env.MEDIA, m[1], clipInput(value)));
    }
    m = /^\/builder\/jobs\/([0-9a-f-]{36})\/files\/([0-9a-f-]{36})$/.exec(path);
    if (m && request.method === 'GET') {
      const file = await jobFile(db, m[1], m[2]);
      const bytes = Uint8Array.from(atob(file.data), (c) => c.charCodeAt(0));
      return new Response(bytes, { headers: { 'content-type': file.mime } });
    }
    m = /^\/builder\/jobs\/([0-9a-f-]{36})\/(steps|finish)$/.exec(path);
    if (m && request.method === 'POST') {
      const value = await input(request);
      if (m[2] === 'steps') {
        await addStep(db, m[1], String(value.title ?? ''));
        return reply({ ok: true });
      }
      return reply(
        await finishJob(db, m[1], { ok: value.ok === true, message: String(value.message ?? '') }),
      );
    }
    throw HttpError.plain(404, 'Not found.');
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    return reply(
      {
        error: error instanceof HttpError ? errorText(error, MACHINE_LOCALE) : 'Builder API error.',
      },
      status,
    );
  }
}
