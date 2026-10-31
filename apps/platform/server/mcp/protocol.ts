import { errorText, HttpError, MACHINE_LOCALE } from '../http';
import { BoardProblems } from '../authoring/boardFiles';
import { LessonProblems } from '../authoring/format';
import { TOOLS, type ToolContext } from './tools';

// Model Context Protocol over Streamable HTTP, stateless: every POST carries one JSON-RPC
// message and gets one JSON answer. No sessions and no server-sent events are needed for
// tools that answer at once.

const MAX_BODY = 3 * 1024 * 1024;
export const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const INSTRUCTIONS =
  'New Learn turns lessons into interactive, voice-tutored reading lessons. Call ' +
  'get_authoring_guide once before writing lessons or boards; it explains the lesson format, ' +
  'the board contract and how to read the teacher’s notes. Before a new course, ask the ' +
  'teacher the short round of choices in its "Ask first" section and agree on an outline.';

type Message = { jsonrpc?: string; id?: string | number | null; method?: string; params?: any };
const reply = (id: Message['id'], result: unknown) => ({ jsonrpc: '2.0', id, result });
const failure = (id: Message['id'], code: number, message: string) => ({
  jsonrpc: '2.0',
  id: id ?? null,
  error: { code, message },
});

/** Errors a model can act on become a tool result it reads; anything else is a server error. */
function toolError(error: unknown) {
  const problems =
    error instanceof LessonProblems || error instanceof BoardProblems
      ? error.problems
      : error instanceof HttpError && error.status < 500
        ? [errorText(error, MACHINE_LOCALE)]
        : null;
  if (!problems) throw error;
  const result = { ok: false, problems };
  return {
    content: [{ type: 'text', text: `Not saved. Fix and try again:\n- ${problems.join('\n- ')}` }],
    structuredContent: result,
    isError: true,
  };
}

async function call(message: Message, context: ToolContext) {
  const { id, method, params } = message;
  if (method === 'initialize') {
    const asked = String(params?.protocolVersion ?? '');
    return reply(id, {
      protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'new-learn', title: 'New Learn', version: '1.0.0' },
      instructions: INSTRUCTIONS,
    });
  }
  if (method === 'ping') return reply(id, {});
  if (method === 'tools/list')
    return reply(id, {
      tools: TOOLS.map(({ name, title, description, inputSchema, annotations }) => ({
        name,
        title,
        description,
        inputSchema,
        annotations: { title, ...annotations },
      })),
    });
  if (method === 'tools/call') {
    const tool = TOOLS.find((t) => t.name === params?.name);
    if (!tool) return failure(id, -32602, `Unknown tool ${String(params?.name)}`);
    try {
      const result = await tool.run(params?.arguments ?? {}, context);
      return reply(id, {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
          },
        ],
        // MCP structured content is an object, never a list or text.
        ...(result && typeof result === 'object' && !Array.isArray(result)
          ? { structuredContent: result }
          : {}),
      });
    } catch (error) {
      return reply(id, toolError(error));
    }
  }
  return failure(id, -32601, `Method not found: ${String(method)}`);
}

export async function handleMcp(request: Request, context: ToolContext): Promise<Response> {
  if (request.method !== 'POST')
    return new Response('Use POST', { status: 405, headers: { allow: 'POST' } });
  let body: Message | Message[];
  try {
    // A 2 MB board escaped into JSON fits; anything larger is not a request we serve.
    const raw = await request.text();
    if (raw.length > MAX_BODY)
      return Response.json(failure(null, -32600, 'Request too large'), { status: 413 });
    body = JSON.parse(raw) as Message | Message[];
  } catch {
    return Response.json(failure(null, -32700, 'Parse error'), { status: 400 });
  }
  const messages = Array.isArray(body) ? body : [body];
  const answers = [];
  for (const message of messages) {
    if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
      answers.push(failure(message?.id, -32600, 'Invalid request'));
      continue;
    }
    // Notifications (no id) are acknowledged without a body.
    if (message.id === undefined || message.id === null) continue;
    answers.push(await call(message, context));
  }
  if (!answers.length) return new Response(null, { status: 202 });
  return Response.json(Array.isArray(body) ? answers : answers[0]);
}
