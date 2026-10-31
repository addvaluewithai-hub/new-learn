import { currentLocale, t } from '../i18n';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, data?: unknown, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: data === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      // The server answers in the learner's language (docs/i18n.md).
      headers: {
        'x-nl-lang': currentLocale(),
        ...(data === undefined ? {} : { 'content-type': 'application/json' }),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(0, t('common.network.offline'));
  }
  let value: { error?: string; message?: string; code?: string };
  try {
    value = await response.json();
  } catch {
    throw new ApiError(502, t('common.network.unexpected'));
  }
  if (!response.ok)
    throw new ApiError(
      response.status,
      value.error ?? value.message ?? t('common.network.failed'),
      value.code,
    );
  return value as T;
}
