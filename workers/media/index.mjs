// New Learn's media worker (docs/worker-cloud-run.md): records a lesson's narration with
// Gemini TTS on Vertex AI, line by line, in the course's voice, and hands the clips back to the
// platform, which keeps them for the learners. Runs as a Cloud Run job started every minute
// (`BUILDER_MODE=once`) or as a server. No keys: Google credentials come from the job's
// service account.
import { builderApi } from '../builder/api.mjs';
import { runQueue } from '../builder/loop.mjs';
import { loadMediaConfig } from './config.mjs';
import { accessToken } from './google.mjs';
import { recordLine } from './record.mjs';

const config = loadMediaConfig();
const api = builderApi(config);
let stopping = false;
process.on('SIGTERM', () => (stopping = true));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (...parts) => console.log(new Date().toISOString(), ...parts);

async function work(job) {
  log('job', job.id, 'started');
  try {
    const { voice, language, lines } = await api.lines(job.id);
    await api.step(job.id, `record:${lines.length}`);
    let flagged = 0;
    for (const [i, line] of lines.entries()) {
      const token = await accessToken();
      const clip = await recordLine({ line, voice, language, config }, { token });
      await api.clip(job.id, clip);
      if (clip.flagged) flagged++;
      if ((i + 1) % 10 === 0 && i + 1 < lines.length) await api.step(job.id, `recorded:${i + 1}`);
      if (stopping) throw new Error('stopped');
    }
    await api.finish(job.id, true, flagged ? `flagged:${flagged}` : '');
    log('job', job.id, 'done,', lines.length, 'lines,', flagged, 'flagged');
  } catch (error) {
    log('job', job.id, 'failed:', error.message);
    await api.finish(job.id, false, 'failed').catch(() => {});
  }
}

log('media worker waiting for voice jobs from', config.origin, 'mode', config.mode);
await runQueue({
  claim: () => api.claim(['voice']),
  work,
  config,
  log,
  wait,
  isStopping: () => stopping,
});
