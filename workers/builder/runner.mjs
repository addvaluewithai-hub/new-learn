import { spawn } from 'node:child_process';
import readline from 'node:readline';
import { consume, step } from './events.mjs';

// Runs Codex CLI for one job (ported from wp-slack-agent's src/codex/runner.js): JSON events
// on stdout, the job folder as its sandboxed workspace, and New Learn's /mcp as its only
// tool server, reached with the teacher's one-hour token from the environment.

const TRANSIENT =
  /stream disconnected|websocket closed|before response\.completed|connection reset/i;

export function codexArgs({ job, dir, images, config, threadId, prompt }) {
  const settings = [
    'approval_policy="never"',
    `mcp_servers.newlearn.url=${JSON.stringify(job.mcpUrl)}`,
    'mcp_servers.newlearn.bearer_token_env_var="NEW_LEARN_MCP_TOKEN"',
    'mcp_servers.newlearn.default_tools_approval_mode="approve"',
    'mcp_servers.newlearn.tool_timeout_sec=180',
  ].flatMap((value) => ['--config', value]);
  const shared = [
    ...(config.codexModel ? ['--model', config.codexModel] : []),
    ...settings,
    '--json',
    '--skip-git-repo-check',
    ...images.flatMap((path) => ['-i', path]),
  ];
  const command = [...(job.webSearch ? ['--search'] : []), 'exec'];
  if (threadId) return [...command, 'resume', ...shared, threadId, prompt];
  return [...command, ...shared, '--sandbox', 'workspace-write', '-C', dir, prompt];
}

async function attempt(input, onStep) {
  const { job, dir, config } = input;
  const state = { threadId: input.threadId, finalText: '', failure: '', lastStep: '' };
  const child = spawn(config.codexBin, codexArgs(input), {
    cwd: dir,
    env: { ...process.env, NEW_LEARN_MCP_TOKEN: job.mcpToken },
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
      consume(JSON.parse(line), state, onStep);
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
      state.failure || (timedOut ? 'Codex timed out' : stderr.trim() || `Codex exited ${code}`),
    );
    error.threadId = state.threadId;
    error.timedOut = timedOut;
    throw error;
  }
  return state;
}

/** Runs the job; one resume of the same Codex session after a dropped stream. */
export async function runCodex(input, onStep) {
  try {
    return await attempt(input, onStep);
  } catch (error) {
    if (error.timedOut || !error.threadId || !TRANSIENT.test(error.message)) throw error;
    onStep(step('resume'));
    return attempt(
      {
        ...input,
        threadId: error.threadId,
        prompt:
          'The connection dropped. Check what is already in New Learn (list_my_courses) before writing, do not make a second course, finish the missing work, and reply as asked before.',
      },
      onStep,
    );
  }
}
