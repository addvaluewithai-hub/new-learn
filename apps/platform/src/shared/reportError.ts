import { ApiError } from './api';

// Errors in the page go to the platform's error log (docs/operations.md), so staff see what
// broke for learners. A few per page load at most, each once; failed requests the page already
// shows to the learner (ApiError) are not reported again.

const MAX = 5;
const sent = new Set<string>();

function send(message: string, stack = '') {
  const key = message.slice(0, 200);
  if (!message || sent.has(key) || sent.size >= MAX) return;
  sent.add(key);
  void fetch('/api/errors', {
    method: 'POST',
    credentials: 'same-origin',
    keepalive: true,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: message.slice(0, 1000),
      stack: stack.slice(0, 4000),
      url: location.pathname + location.search,
    }),
  }).catch(() => undefined);
}

export function reportError(error: unknown) {
  if (error instanceof ApiError) return;
  if (error instanceof Error) send(`${error.name}: ${error.message}`, error.stack);
  else send(String(error));
}

/** Listen for errors nothing caught. */
export function installErrorReports() {
  addEventListener('error', (e) => reportError(e.error ?? e.message));
  addEventListener('unhandledrejection', (e) => reportError(e.reason));
}
