import { test } from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error plain JavaScript worker (workers/builder), run by Node on our server
import { consume, stepFor } from '../../../workers/builder/events.mjs';
// @ts-expect-error plain JavaScript worker
import { codexArgs } from '../../../workers/builder/runner.mjs';
// @ts-expect-error plain JavaScript worker
import { builderApi } from '../../../workers/builder/api.mjs';
// @ts-expect-error plain JavaScript worker
import { loadConfig } from '../../../workers/builder/config.mjs';
import { shown } from './steps';

const job = {
  id: 'j1',
  mcpUrl: 'https://new-learn.pages.dev/mcp',
  mcpToken: 'secret-token',
  webSearch: true,
};
const config = { codexModel: '', origin: 'https://new-learn.pages.dev', token: 't'.repeat(40) };

test('Codex runs with New Learn as its only MCP server; the token stays in the environment', () => {
  const args: string[] = codexArgs({
    job,
    dir: '/w/j1',
    images: ['/w/j1/a.png'],
    config,
    prompt: 'P',
  });
  assert.deepEqual(args.slice(0, 2), ['--search', 'exec']);
  assert.ok(args.includes('mcp_servers.newlearn.url="https://new-learn.pages.dev/mcp"'));
  assert.ok(args.includes('mcp_servers.newlearn.bearer_token_env_var="NEW_LEARN_MCP_TOKEN"'));
  assert.ok(!args.join(' ').includes('secret-token'), 'never on the command line');
  assert.deepEqual(args.slice(-4), ['workspace-write', '-C', '/w/j1', 'P']);
  assert.ok(args.includes('-i') && args.includes('/w/j1/a.png'));
  const resumed: string[] = codexArgs({
    job: { ...job, webSearch: false },
    dir: '/w',
    images: [],
    config,
    threadId: 'th',
    prompt: 'R',
  });
  assert.deepEqual([resumed[0], resumed[1], ...resumed.slice(-2)], ['exec', 'resume', 'th', 'R']);
});

test('the teacher sees one line per tool, lesson titles included, no repeats', () => {
  const state: Record<string, string> = {};
  const lines: string[] = [];
  const event = (tool: string, args?: unknown) => ({
    type: 'item.started',
    item: { type: 'mcp_tool_call', tool, arguments: args },
  });
  for (const e of [
    { type: 'thread.started', thread_id: 'th1' },
    event('get_authoring_guide'),
    event('get_authoring_guide'),
    { type: 'item.started', item: { type: 'web_search' } },
    event('add_lesson', { lesson: { title: 'Time helps' } }),
    {
      type: 'item.completed',
      item: { type: 'mcp_tool_call', tool: 'add_lesson', status: 'failed' },
    },
    { type: 'item.completed', item: { type: 'agent_message', text: 'Made 1 lesson.' } },
  ])
    consume(e, state, (line: string) => lines.push(line));
  assert.deepEqual(lines, [
    'step:readGuide',
    'step:webSearch',
    'step:writeLessonNamed:Time helps',
    'step:fixLesson',
  ]);
  assert.deepEqual(
    lines.map((l) => shown(l)),
    ['بقرا دليل الكتابة', 'بدوّر على النت', 'بكتب درس: Time helps', 'بصلّح مشاكل في الدرس'],
  );
  assert.equal(state.threadId, 'th1');
  assert.equal(state.finalText, 'Made 1 lesson.');
  assert.equal(stepFor({ type: 'reasoning' }), null);
});

test('the worker talks to /builder with its token and needs a long one', async () => {
  const calls: Array<[string, RequestInit]> = [];
  const fetcher = async (url: string, init: RequestInit) => {
    calls.push([url, init]);
    return Response.json({ job: null });
  };
  assert.equal(await builderApi(config, fetcher).claim(), null);
  assert.equal(calls[0][0], 'https://new-learn.pages.dev/builder/claim');
  assert.equal(
    (calls[0][1].headers as Record<string, string>).authorization,
    `Bearer ${config.token}`,
  );
  assert.throws(() => loadConfig({ NEW_LEARN_ORIGIN: 'https://x.dev', BUILDER_TOKEN: 'short' }));
  assert.equal(
    loadConfig({ NEW_LEARN_ORIGIN: 'https://x.dev/a', BUILDER_TOKEN: 'k'.repeat(32) }).origin,
    'https://x.dev',
  );
});

test('a scheduled run works through the queue once; a server polls forever', () => {
  const base = { NEW_LEARN_ORIGIN: 'https://new-learn.pages.dev', BUILDER_TOKEN: 't'.repeat(40) };
  assert.equal(loadConfig(base).mode, 'forever');
  const once = loadConfig({ ...base, BUILDER_MODE: 'once', MAX_RUN_MS: '600000' });
  assert.equal(once.mode, 'once');
  assert.equal(once.maxRunMs, 600000);
  assert.equal(loadConfig({ ...base, BUILDER_MODE: 'once' }).maxRunMs, 50 * 60 * 1000);
});
