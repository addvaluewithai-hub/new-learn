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
      headers: data === undefined ? undefined : { 'content-type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'الاتصال اتقطع. راجع الإنترنت وجرّب تاني.');
  }
  let value: { error?: string; message?: string; code?: string };
  try {
    value = await response.json();
  } catch {
    throw new ApiError(502, 'استجابة المنصة غير متوقعة. جرّب تاني.');
  }
  if (!response.ok)
    throw new ApiError(
      response.status,
      value.error ?? value.message ?? 'تعذر تنفيذ الطلب.',
      value.code,
    );
  return value as T;
}
