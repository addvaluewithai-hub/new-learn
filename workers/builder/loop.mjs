// The queue loop both workers share (the builder and the media worker): claim a job, work it,
// repeat. As a server (`forever`) it polls until stopped; as a Cloud Run job (`once`) it works
// through the queue, keeps polling for `lingerMs` after its last job, and exits.
export async function runQueue({ claim, work, config, log, wait, isStopping }) {
  const started = Date.now();
  let done = 0;
  let lastJob = Date.now();
  while (!isStopping()) {
    try {
      const job = await claim();
      if (job) {
        await work(job);
        done++;
        lastJob = Date.now();
      } else if (config.mode === 'once' && Date.now() - lastJob >= config.lingerMs) break;
      else await wait(config.pollMs);
    } catch (error) {
      log('poll failed:', error.message);
      if (config.mode === 'once') {
        process.exitCode = 1;
        break;
      }
      await wait(config.pollMs * 3);
    }
    if (config.mode === 'once' && Date.now() - started > config.maxRunMs) break;
  }
  log(config.mode === 'once' ? `done: ${done} job(s)` : 'stopped');
  return done;
}
