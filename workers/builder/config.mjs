// The builder's settings, from its environment file (docs/builder-server.md, step 2).
export function loadConfig(env = process.env) {
  const need = (name) => {
    const value = env[name];
    if (!value) throw new Error(`Missing ${name} in the environment.`);
    return value;
  };
  const origin = new URL(need('NEW_LEARN_ORIGIN')).origin;
  const token = need('BUILDER_TOKEN');
  if (token.length < 32) throw new Error('BUILDER_TOKEN must be at least 32 characters.');
  return {
    origin,
    token,
    /** Which agent writes the course: Claude Code (default) or Codex. */
    engine: env.BUILDER_ENGINE === 'codex' ? 'codex' : 'claude',
    claudeBin: env.CLAUDE_BIN || 'claude',
    claudeModel: env.CLAUDE_MODEL || '',
    claudeMaxTurns: Number(env.CLAUDE_MAX_TURNS) || 300,
    claudeBudgetUsd: Number(env.CLAUDE_BUDGET_USD) || 0,
    codexBin: env.CODEX_BIN || 'codex',
    codexModel: env.CODEX_MODEL || '',
    workRoot: env.WORK_ROOT || '/srv/new-learn-builder/jobs',
    pollMs: Number(env.POLL_MS) || 5000,
    timeoutMs: Number(env.BUILD_TIMEOUT_MS || env.CODEX_TIMEOUT_MS) || 40 * 60 * 1000,
  };
}
