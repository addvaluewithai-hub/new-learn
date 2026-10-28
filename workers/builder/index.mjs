import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { builderApi } from './api.mjs';
import { loadConfig } from './config.mjs';
import { prepareFiles } from './files.mjs';
import { runCodex } from './runner.mjs';

// New Learn's course builder (docs/builder-server.md): asks New Learn for a job, runs Codex
// for it, reports each step and the result, and deletes the job's files. One job at a time.

const config = loadConfig();
const api = builderApi(config);
let stopping = false;
process.on('SIGTERM', () => (stopping = true));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (...parts) => console.log(new Date().toISOString(), ...parts);

async function work(job) {
  const dir = join(config.workRoot, job.id);
  log('job', job.id, 'started');
  // Steps go one after another, so they arrive in order.
  let steps = Promise.resolve();
  const onStep = (title) => {
    steps = steps.then(() => api.step(job.id, title)).catch((e) => log('step failed', e.message));
  };
  try {
    onStep('بجهّز ملفاتك');
    const images = await prepareFiles(api, job, dir);
    const result = await runCodex({ job, dir, images, config, prompt: job.prompt }, onStep);
    await steps;
    await api.finish(job.id, true, result.finalText);
    log('job', job.id, 'done');
  } catch (error) {
    await steps;
    log('job', job.id, 'failed:', error.message);
    await api.finish(job.id, false, 'البناء وقف قبل ما يخلص.').catch(() => {});
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

log('builder waiting for jobs from', config.origin);
while (!stopping) {
  try {
    const job = await api.claim();
    if (job) await work(job);
    else await wait(config.pollMs);
  } catch (error) {
    log('poll failed:', error.message);
    await wait(config.pollMs * 3);
  }
}
log('stopped');
