import { test } from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error plain JavaScript worker (workers/builder), run by Node on our server
import { claudeArgs, consumeClaude } from '../../../workers/builder/claude.mjs';

const job = {
  id: 'j1',
  mcpUrl: 'https://new-learn.pages.dev/mcp',
  mcpToken: 'secret-token',
  webSearch: true,
};
const config = { claudeModel: 'sonnet', claudeMaxTurns: 300, claudeBudgetUsd: 8 };

test('Claude Code runs bare, with New Learn as its only MCP server and the token in the environment', () => {
  const args: string[] = claudeArgs({ job, config, sessionId: 's-1', prompt: 'P' });
  assert.deepEqual(args.slice(0, 2), ['-p', 'P']);
  assert.ok(args.includes('--bare') && args.includes('--strict-mcp-config'));
  const mcp = JSON.parse(args[args.indexOf('--mcp-config') + 1]);
  assert.equal(mcp.mcpServers.newlearn.url, job.mcpUrl);
  assert.equal(mcp.mcpServers.newlearn.type, 'http');
  assert.equal(mcp.mcpServers.newlearn.headers.Authorization, 'Bearer ${NEW_LEARN_MCP_TOKEN}');
  assert.ok(!args.join(' ').includes('secret-token'), 'never on the command line');
  assert.deepEqual(args.slice(args.indexOf('--session-id'), args.indexOf('--session-id') + 2), [
    '--session-id',
    's-1',
  ]);
  assert.equal(args[args.indexOf('--tools') + 1], 'Read,Glob,Grep,WebSearch,WebFetch');
  assert.equal(
    args[args.indexOf('--allowedTools') + 1],
    'mcp__newlearn__*,Read,Glob,Grep,WebSearch,WebFetch',
  );
  assert.deepEqual(
    args.slice(args.indexOf('--permission-mode'), args.indexOf('--permission-mode') + 4),
    ['--permission-mode', 'dontAsk', '--permission-prompts', 'none'],
  );
  assert.deepEqual(args.slice(args.indexOf('--model'), args.indexOf('--model') + 2), [
    '--model',
    'sonnet',
  ]);
  assert.ok(args.includes('--max-budget-usd') && args.includes('8'));
  const quiet: string[] = claudeArgs({
    job: { ...job, webSearch: false },
    config: { ...config, claudeBudgetUsd: 0, claudeModel: '' },
    sessionId: 's-1',
    resume: true,
    prompt: 'R',
  });
  assert.equal(quiet[quiet.indexOf('--tools') + 1], 'Read,Glob,Grep', 'no web without the switch');
  assert.ok(quiet.includes('--resume') && !quiet.includes('--session-id'));
  assert.ok(!quiet.includes('--model') && !quiet.includes('--max-budget-usd'));
});

test('the teacher sees one line per tool from the stream; a failed add_lesson and the result are read', () => {
  const state = { sessionId: '', finalText: '', failure: '', lastStep: '', calls: new Map() };
  const lines: string[] = [];
  const call = (id: string, name: string, input?: unknown) => ({
    type: 'assistant',
    message: { content: [{ type: 'tool_use', id, name, input }] },
  });
  for (const e of [
    { type: 'system', subtype: 'init', session_id: 'sess-9' },
    call('t1', 'mcp__newlearn__get_authoring_guide', {}),
    call('t2', 'mcp__newlearn__get_authoring_guide', {}),
    call('t3', 'WebSearch', { query: 'x' }),
    call('t4', 'Read', { file_path: '/w/notes.txt' }),
    call('t5', 'mcp__newlearn__add_lesson', { lesson: { title: 'Time helps' } }),
    {
      type: 'user',
      message: {
        content: [{ type: 'tool_result', tool_use_id: 't5', is_error: true, content: 'scenes' }],
      },
    },
    {
      type: 'user',
      message: { content: [{ type: 'tool_result', tool_use_id: 't4', content: 'ok' }] },
    },
    { type: 'assistant', message: { content: [{ type: 'text', text: 'Made 1 lesson.' }] } },
    {
      type: 'result',
      subtype: 'success',
      is_error: false,
      result: 'Made 1 lesson.',
      session_id: 'sess-9',
    },
  ])
    consumeClaude(e, state, (line: string) => lines.push(line));
  assert.deepEqual(lines, [
    'بقرا دليل الكتابة',
    'بدوّر على النت',
    'بقرا ملفاتك',
    'بكتب درس: Time helps',
    'بصلّح مشاكل في الدرس',
  ]);
  assert.equal(state.sessionId, 'sess-9');
  assert.equal(state.finalText, 'Made 1 lesson.');
  assert.equal(state.failure, '');
  // A run that ran out of turns, or an API error reported as a "successful" result, is a failure.
  const out = { ...state, finalText: '', failure: '' };
  consumeClaude(
    { type: 'result', subtype: 'error_max_turns', is_error: true, result: '' },
    out,
    () => {},
  );
  assert.match(out.failure, /error_max_turns/);
  const auth = { ...state, finalText: '', failure: '' };
  consumeClaude(
    { type: 'result', subtype: 'success', is_error: true, result: 'Authentication error' },
    auth,
    () => {},
  );
  assert.match(auth.failure, /Authentication error/);
  assert.equal(auth.finalText, '');
});
