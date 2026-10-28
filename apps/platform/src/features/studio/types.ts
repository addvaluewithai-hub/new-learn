export type BuildJob = {
  id: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  topic: string;
  choices: Record<string, string>;
  steps: Array<{ at: string; title: string }>;
  result: { courseId?: string; lessonId?: string; message?: string };
  error: string;
  createdAt: string;
  finishedAt: string | null;
};

/** Moves within the app without a reload; App reads the address on popstate. */
export function go(search: string) {
  history.pushState(null, '', `/${search}`);
  dispatchEvent(new PopStateEvent('popstate'));
}
