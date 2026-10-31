import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { failedStep, labelFor, step } from './events.mjs';

// Runs Claude Code for one job: `claude -p` with JSON events on stdout, the job folder as its
// working directory with read-only file tools, and New Learn's /mcp as its only MCP server,
// reached with the teacher's one-hour token from the environment (never the command line).
// It signs in as the owner's Claude account (`claude setup-token`, or a login kept in the
// builder user's home) until we have an API key; `--bare` is API-key only, so with the
// account we load the builder user's settings and nothing from the job folder instead.

const TRANSIENT =
  /ECONNRESET|ETIMEDOUT|fetch failed|socket hang up|stream (closed|disconnected)|overloaded|529|connection (reset|closed)/i;
const SERVER = 'newlearn';

export function claudeArgs({ job, config, sessionId, resume, prompt }) {
  const mcp = {
    mcpServers: {
      [SERVER]: {
        type: 'http',
        url: job.mcpUrl,
        // Expanded by Claude Code from the child's environment.
        headers: { Authorization: 'Bearer ${NEW_LEARN_MCP_TOKEN}' },
      },
    },
  };
  const tools = ['Read', 'Glob', 'Grep', ...(job.webSearch ? ['WebSearch', 'WebFetch'] : [])];
  return [
    '-p',
    prompt,
    '--output-format',
    'stream-json',
    '--verbose',
    // With a key: no hooks, project settings, CLAUDE.md or stored logins, only this job's
    // flags. With the account login: only the builder user's own settings, never the job's.
    ...(config.claudeAuth === 'key' ? ['--bare'] : ['--setting-sources', 'user']),
    // The session id is ours, so a dropped stream can still be resumed.
    ...(resume ? ['--resume', sessionId] : ['--session-id', sessionId]),
    ...(config.claudeModel ? ['--model', config.claudeModel] : []),
    '--max-turns',
    String(config.claudeMaxTurns),
    ...(config.claudeBudgetUsd ? ['--max-budget-usd', String(config.claudeBudgetUsd)] : []),
    '--strict-mcp-config',
    '--mcp-config',
    JSON.stringify(mcp),
    '--tools',
    tools.join(','),
    '--allowedTools',
    [`mcp__${SERVER}__*`, ...tools].join(','),
    '--permission-mode',
    'dontAsk',
    '--permission-prompts',
    'none',
  ];
}

/** A tool name as the teacher's line expects it: New Learn's tools without their prefix. */
const toolName = (name) =>
  name.startsWith(`mcp__${SERVER}__`) ? name.slice(`mcp__${SERVER}__`.length) : name;

/** Reads one JSON event into the run's state, calling onStep for each new visible line. */
export function consumeClaude(event, state, onStep) {
  if (event.type === 'system' && event.subtype === 'init' && event.session_id)
    state.sessionId = event.session_id;
  const blocks = Array.isArray(event.message?.content) ? event.message.content : [];
  if (event.type === 'assistant')
    for (const block of blocks) {
      if (block.type !== 'tool_use') continue;
      const name = toolName(block.name);
      state.calls.set(block.id, name);
      const line = labelFor(name, block.input);
      if (line && line !== state.lastStep) {
        state.lastStep = line;
        onStep(line);
      }
    }
  if (event.type === 'user')
    for (const block of blocks) {
      if (block.type !== 'tool_result' || !block.is_error) continue;
      const name = state.calls.get(block.tool_use_id);
      if (name) onStep(failedStep(name));
    }
  if (event.type === 'result') {
    if (event.is_error || event.subtype !== 'success')
      state.failure = `Claude Code ${event.subtype}: ${String(
        event.result ?? event.error?.message ?? '',
      ).slice(0, 300)}`;
    else state.finalText = typeof event.result === 'string' ? event.result : '';
  }
}

async function attempt(input, onStep) {
  const { job, dir, config } = input;
  const state = {
    sessionId: input.sessionId,
    finalText: '',
    failure: '',
    lastStep: '',
    calls: new Map(),
  };
  const child = spawn(config.claudeBin, claudeArgs(input), {
    cwd: dir,
    env: {
      ...process.env,
      NEW_LEARN_MCP_TOKEN: job.mcpToken,
      DISABLE_AUTOUPDATER: '1',
      DISABLE_UPDATES: '1',
      CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill('SIGTERM');
  }, config.timeoutMs);
  child.stderr.on('data', (chunk) => (stderr = `${stderr}${chunk}`.slice(-4000)));
  readline.createInterface({ input: child.stdout }).on('line', (line) => {
    try {
      consumeClaude(JSON.parse(line), state, onStep);
    } catch {
      // not a JSON event
    }
  });
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  clearTimeout(timer);
  if (code !== 0 || state.failure || !state.finalText) {
    const error = new Error(
      state.failure ||
        (timedOut ? 'Claude Code timed out' : stderr.trim() || `Claude Code exited ${code}`),
    );
    error.sessionId = state.sessionId;
    error.started = state.calls.size > 0 || Boolean(state.lastStep);
    error.timedOut = timedOut;
    throw error;
  }
  return state;
}

/** Runs the job; one resume of the same session after a dropped connection. */
export async function runClaude(input, onStep) {
  const sessionId = input.sessionId ?? crypto.randomUUID();
  try {
    return await attempt({ ...input, sessionId }, onStep);
  } catch (error) {
    if (error.timedOut || !error.started || !TRANSIENT.test(error.message)) throw error;
    onStep(step('resume'));
    return attempt(
      {
        ...input,
        sessionId,
        resume: true,
        prompt:
          'The connection dropped. Check what is already in New Learn (list_my_courses) before writing, do not make a second course, finish the missing work, and reply as asked before.',
      },
      onStep,
    );
  }
}
