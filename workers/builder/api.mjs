// New Learn's builder API (apps/platform/server/builds/worker.ts), with the builder's token.
export function builderApi(config, fetcher = fetch) {
  const call = async (path, init = {}) => {
    const response = await fetcher(`${config.origin}/builder${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${config.token}`,
        ...(init.body ? { 'content-type': 'application/json' } : {}),
      },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`New Learn ${path}: ${response.status} ${text.slice(0, 200)}`);
    }
    return response;
  };
  const post = async (path, body) =>
    (await call(path, { method: 'POST', body: JSON.stringify(body ?? {}) })).json();
  return {
    /** The next job, or null when there is none. */
    claim: async () => (await post('/claim')).job,
    file: async (jobId, fileId) =>
      new Uint8Array(await (await call(`/jobs/${jobId}/files/${fileId}`)).arrayBuffer()),
    step: (jobId, title) => post(`/jobs/${jobId}/steps`, { title }),
    finish: (jobId, ok, message) => post(`/jobs/${jobId}/finish`, { ok, message }),
  };
}
